from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import ModelArtifact, PublishedAssessment, Enrollment, Student, CourseOffering
from ..ml.registry import ModelRegistry

router = APIRouter(prefix="/patterns", tags=["Patterns & Clustering"])

@router.get("/clusters")
def get_cluster_patterns(checkpoint: str = Query("W4"), db: Session = Depends(get_db)):
    artifact = db.query(ModelArtifact).filter(
        ModelArtifact.checkpoint == checkpoint,
        ModelArtifact.is_active == True
    ).first()

    profiles = artifact.cluster_profiles_json if artifact and artifact.cluster_profiles_json else []

    # Count real students assigned to each cluster
    assessments = db.query(PublishedAssessment).filter(
        PublishedAssessment.checkpoint == checkpoint,
        PublishedAssessment.cluster_id != None
    ).all()

    cluster_counts = {}
    for a in assessments:
        cluster_counts[a.cluster_id] = cluster_counts.get(a.cluster_id, 0) + 1

    total_clustered = len(assessments)
    enriched_profiles = []
    for p in profiles:
        cid = p["cluster_id"]
        c_count = cluster_counts.get(cid, 0)
        p_copy = p.copy()
        p_copy["actual_cohort_count"] = c_count
        p_copy["actual_cohort_pct"] = round(c_count / total_clustered * 100, 1) if total_clustered > 0 else 0
        enriched_profiles.append(p_copy)

    return {
        "checkpoint": checkpoint,
        "total_clustered_students": total_clustered,
        "cluster_profiles": enriched_profiles
    }

@router.get("/clusters/{cluster_id}/students")
def get_students_in_cluster(
    cluster_id: int,
    checkpoint: str = Query("W4"),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    assessments = db.query(PublishedAssessment).join(Enrollment).join(Student).join(CourseOffering).filter(
        PublishedAssessment.checkpoint == checkpoint,
        PublishedAssessment.cluster_id == cluster_id
    ).limit(limit).all()

    return [
        {
            "enrollment_id": a.enrollment_id,
            "student_id": a.enrollment.student.student_id,
            "student_name": f"{a.enrollment.student.first_name} {a.enrollment.student.last_name}",
            "course_code": a.enrollment.offering.course_code,
            "priority": a.review_priority,
            "anomaly_percentile": a.anomaly_percentile,
            "primary_warning": a.primary_triggers_json[0] if a.primary_triggers_json else "Normal"
        }
        for a in assessments
    ]
