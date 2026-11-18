"""
Dashboard Analytics & Review Queue Service.
Aggregates scoped summaries, course comparisons, checkpoint trends, and priority triage queues.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from ..models import (
    PublishedAssessment, Enrollment, CourseOffering,
    InterventionCase, Term, Student
)

class DashboardService:
    @staticmethod
    def get_overview_summary(
        db: Session,
        term_code: str = "2014J",
        checkpoint: str = "W4",
        offering_id: Optional[str] = None,
        mentor_user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        # Base query for assessments matching term & checkpoint
        query = db.query(PublishedAssessment).join(Enrollment).join(CourseOffering).filter(
            CourseOffering.term_code == term_code,
            PublishedAssessment.checkpoint == checkpoint
        )

        if offering_id and offering_id != "ALL":
            query = query.filter(CourseOffering.offering_id == offering_id)
        if mentor_user_id:
            query = query.filter(Enrollment.mentor_user_id == mentor_user_id)

        assessments = query.all()
        enr_ids = [a.enrollment_id for a in assessments]

        # 4 Core KPI Cards
        assessed_count = len(assessments)
        high_priority = [a for a in assessments if a.review_priority == "High"]
        monitor_priority = [a for a in assessments if a.review_priority == "Monitor"]
        routine_priority = [a for a in assessments if a.review_priority == "Routine"]
        insufficient_data = [a for a in assessments if a.review_priority == "Insufficient data"]

        # Overdue intervention cases
        cases = db.query(InterventionCase).filter(
            InterventionCase.enrollment_id.in_(enr_ids),
            InterventionCase.status.in_(["open", "in_progress", "pending_review"])
        ).all()
        now = datetime.utcnow()
        overdue_cases = [c for c in cases if c.due_date < now]

        # Priority by course chart data
        offerings = db.query(CourseOffering).filter(CourseOffering.term_code == term_code).all()
        course_chart_data = []
        for off in offerings:
            off_asms = [a for a in assessments if a.enrollment.offering_id == off.offering_id]
            if not off_asms:
                continue
            course_chart_data.append({
                "course_code": off.course_code,
                "course_name": off.course_name,
                "offering_id": off.offering_id,
                "High": len([a for a in off_asms if a.review_priority == "High"]),
                "Monitor": len([a for a in off_asms if a.review_priority == "Monitor"]),
                "Routine": len([a for a in off_asms if a.review_priority == "Routine"]),
                "Insufficient": len([a for a in off_asms if a.review_priority == "Insufficient data"]),
                "total": len(off_asms)
            })

        # Checkpoint trajectory trend (W2 -> W4 -> W6)
        checkpoints = ["W2", "W4", "W6"]
        trend_data = []
        for ck in checkpoints:
            ck_asms = db.query(PublishedAssessment).join(Enrollment).join(CourseOffering).filter(
                CourseOffering.term_code == term_code,
                PublishedAssessment.checkpoint == ck
            ).all()
            if ck_asms:
                trend_data.append({
                    "checkpoint": ck,
                    "High": len([a for a in ck_asms if a.review_priority == "High"]),
                    "Monitor": len([a for a in ck_asms if a.review_priority == "Monitor"]),
                    "Routine": len([a for a in ck_asms if a.review_priority == "Routine"]),
                    "total": len(ck_asms)
                })

        # Actionable Review Queue (High & Monitor priority sorted by evidence severity)
        review_queue = []
        priority_asms = [a for a in assessments if a.review_priority in ["High", "Monitor"]]
        
        # Sort: High before Monitor, then by anomaly percentile descending
        priority_asms.sort(
            key=lambda a: (0 if a.review_priority == "High" else 1, -(a.anomaly_percentile or 0))
        )

        for a in priority_asms[:15]:
            enr = a.enrollment
            stu = enr.student
            off = enr.offering
            existing_case = next((c for c in cases if c.enrollment_id == enr.enrollment_id), None)

            review_queue.append({
                "enrollment_id": enr.enrollment_id,
                "student_id": stu.student_id,
                "student_name": f"{stu.first_name} {stu.last_name}",
                "course_code": off.course_code,
                "course_name": off.course_name,
                "section": off.section,
                "priority": a.review_priority,
                "cluster_label": a.cluster_label,
                "anomaly_percentile": a.anomaly_percentile,
                "primary_warning": (a.primary_triggers_json[0] if a.primary_triggers_json else "Academic alert"),
                "policy_path": a.policy_path_taken,
                "has_active_case": existing_case is not None,
                "case_id": existing_case.case_id if existing_case else None,
                "case_status": existing_case.status if existing_case else None
            })

        return {
            "term_code": term_code,
            "checkpoint": checkpoint,
            "kpis": {
                "assessed_enrollments": assessed_count,
                "high_priority_count": len(high_priority),
                "high_priority_pct": round(len(high_priority) / assessed_count * 100, 1) if assessed_count > 0 else 0,
                "overdue_followups_count": len(overdue_cases),
                "insufficient_data_count": len(insufficient_data)
            },
            "priority_by_course": course_chart_data,
            "checkpoint_trend": trend_data,
            "review_queue": review_queue
        }
