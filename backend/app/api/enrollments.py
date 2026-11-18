from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..db import get_db
from ..models import (
    Enrollment, Student, CourseOffering, PublishedAssessment,
    InterventionCase, FeatureSnapshot, User
)
from ..schemas.academics import EnrollmentListItem, EnrollmentDetailResponse, StudentSummary, CourseOfferingResponse
from .dependencies import get_current_user

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])

@router.get("", response_model=dict)
def list_enrollments(
    term_code: str = Query("2025-F"),
    checkpoint: str = Query("W4"),
    course_code: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Enrollment).join(Student).join(CourseOffering).filter(
        CourseOffering.term_code == term_code
    )

    if current_user.role == "mentor":
        query = query.filter(Enrollment.mentor_user_id == current_user.user_id)
    elif current_user.role == "faculty":
        query = query.filter(CourseOffering.faculty_user_id == current_user.user_id)

    if course_code and course_code != "ALL":
        query = query.filter(CourseOffering.course_code == course_code)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.student_id.ilike(s),
                Student.first_name.ilike(s),
                Student.last_name.ilike(s),
                CourseOffering.course_code.ilike(s)
            )
        )

    # Filter by priority via join on PublishedAssessment
    if priority and priority != "ALL":
        query = query.join(PublishedAssessment).filter(
            PublishedAssessment.checkpoint == checkpoint,
            PublishedAssessment.review_priority == priority
        )

    total_count = query.count()
    enrollments = query.offset((page - 1) * page_size).limit(page_size).all()

    enr_ids = [e.enrollment_id for e in enrollments]
    assessments = db.query(PublishedAssessment).filter(
        PublishedAssessment.enrollment_id.in_(enr_ids),
        PublishedAssessment.checkpoint == checkpoint
    ).all()
    asm_map = {a.enrollment_id: a for a in assessments}

    cases = db.query(InterventionCase).filter(
        InterventionCase.enrollment_id.in_(enr_ids)
    ).all()
    case_map = {c.enrollment_id: c for c in cases}

    items = []
    for enr in enrollments:
        asm = asm_map.get(enr.enrollment_id)
        case = case_map.get(enr.enrollment_id)

        items.append({
            "enrollment_id": enr.enrollment_id,
            "student_id": enr.student.student_id,
            "student_name": f"{enr.student.first_name} {enr.student.last_name}",
            "student_email": enr.student.email,
            "offering_id": enr.offering_id,
            "course_code": enr.offering.course_code,
            "course_name": enr.offering.course_name,
            "term_code": enr.offering.term_code,
            "section": enr.offering.section,
            "mentor_user_id": enr.mentor_user_id,
            "review_priority": asm.review_priority if asm else "Insufficient data",
            "cluster_label": asm.cluster_label if asm else None,
            "anomaly_percentile": asm.anomaly_percentile if asm else None,
            "primary_warning": (asm.primary_triggers_json[0] if asm and asm.primary_triggers_json else "No alerts"),
            "has_active_case": case is not None and case.status in ["open", "in_progress", "pending_review"],
            "case_id": case.case_id if case else None,
            "case_status": case.status if case else None
        })

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size,
        "items": items
    }

@router.get("/{enrollment_id}")
def get_enrollment_detail(
    enrollment_id: str,
    checkpoint: str = Query("W4"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    enr = db.query(Enrollment).filter(Enrollment.enrollment_id == enrollment_id).first()
    if not enr:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    # Access control
    if current_user.role == "mentor" and enr.mentor_user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied: Student enrollment not in your assigned caseload.")

    # Get current published assessment
    asm = db.query(PublishedAssessment).filter(
        PublishedAssessment.enrollment_id == enrollment_id,
        PublishedAssessment.checkpoint == checkpoint
    ).first()

    # Get snapshot
    snap = db.query(FeatureSnapshot).filter(
        FeatureSnapshot.enrollment_id == enrollment_id,
        FeatureSnapshot.checkpoint == checkpoint
    ).first()

    # Get historical assessments for trajectory
    all_asms = db.query(PublishedAssessment).filter(
        PublishedAssessment.enrollment_id == enrollment_id
    ).order_by(PublishedAssessment.checkpoint.asc()).all()

    historical = [
        {
            "checkpoint": a.checkpoint,
            "priority": a.review_priority,
            "anomaly_percentile": a.anomaly_percentile,
            "cluster_label": a.cluster_label,
            "evidence": a.evidence_breakdown_json
        }
        for a in all_asms
    ]

    # Get cases
    cases = db.query(InterventionCase).filter(
        InterventionCase.enrollment_id == enrollment_id
    ).order_by(InterventionCase.created_at.desc()).all()

    cases_data = [
        {
            "case_id": c.case_id,
            "status": c.status,
            "support_action": c.support_action,
            "priority": c.priority,
            "due_date": c.due_date.isoformat(),
            "notes": c.notes,
            "created_at": c.created_at.isoformat(),
            "events": [
                {"id": ev.event_id, "type": ev.event_type, "desc": ev.description, "time": ev.created_at.isoformat()}
                for ev in c.events
            ]
        }
        for c in cases
    ]

    # Ensure local explainability sensitivities are available for the profile
    sensitivities = asm.score_sensitivities_json if (asm and asm.score_sensitivities_json) else []
    if not sensitivities and snap and snap.features_json:
        try:
            from ..ml.registry import ModelRegistry
            from ..ml.explain import SensitivityExplainer
            model_bundle = ModelRegistry.load_active_model(db, checkpoint)
            explainer = SensitivityExplainer(model_bundle["preprocessor"], model_bundle["anomaly_engine"])
            sensitivities = explainer.explain_enrollment(snap.features_json)
        except Exception:
            sensitivities = []

    return {
        "enrollment_id": enr.enrollment_id,
        "student": {
            "student_id": enr.student.student_id,
            "first_name": enr.student.first_name,
            "last_name": enr.student.last_name,
            "email": enr.student.email,
            "cohort_year": enr.student.cohort_year
        },
        "offering": {
            "offering_id": enr.offering.offering_id,
            "term_code": enr.offering.term_code,
            "course_code": enr.offering.course_code,
            "course_name": enr.offering.course_name,
            "section": enr.offering.section,
            "credits": enr.offering.credits,
            "faculty_user_id": enr.offering.faculty_user_id
        },
        "mentor_user_id": enr.mentor_user_id,
        "current_checkpoint": checkpoint,
        "assessment": {
            "priority": asm.review_priority if asm else "Insufficient data",
            "cluster_id": asm.cluster_id if asm else None,
            "cluster_label": asm.cluster_label if asm else "Insufficient evidence",
            "anomaly_score": asm.anomaly_score if asm else None,
            "anomaly_percentile": asm.anomaly_percentile if asm else None,
            "policy_path": asm.policy_path_taken if asm else "Missing checkpoint data",
            "primary_triggers": asm.primary_triggers_json if asm else []
        } if asm else None,
        "features": snap.features_json if snap else {},
        "evidence_breakdown": asm.evidence_breakdown_json if asm else {},
        "score_sensitivities": sensitivities,
        "historical_checkpoints": historical,
        "interventions": cases_data
    }
