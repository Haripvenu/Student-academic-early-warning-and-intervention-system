"""
Point-in-Time Feature Snapshot Builder.
Extracts student-course checkpoint features adhering strictly to dual-timestamp cutoffs:
  event_time <= cutoff AND available_at <= cutoff.
Differentiates between unrecorded attendance, unreleased grades, and overdue submissions.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..models import (
    Enrollment, CourseOffering, AttendanceRecord,
    Assessment, Submission, EngagementEvent, PriorAcademicRecord
)
from .feature_spec import ML_FEATURE_COLUMNS

CHECKPOINT_WEEKS = {
    "W2": 2,
    "W4": 4,
    "W6": 6
}

def calculate_checkpoint_cutoff(term_start: datetime, checkpoint: str) -> datetime:
    weeks = CHECKPOINT_WEEKS.get(checkpoint, 4)
    # Checkpoint is at the end of the specified week (e.g., Day 14 for W2, Day 28 for W4, Day 42 for W6)
    return term_start + timedelta(days=weeks * 7)

def build_enrollment_snapshot(db: Session, enrollment_id: str, checkpoint: str) -> Dict[str, Any]:
    enr = db.query(Enrollment).filter(Enrollment.enrollment_id == enrollment_id).first()
    if not enr:
        raise ValueError(f"Enrollment {enrollment_id} not found")

    term_start = enr.offering.term.start_date
    cutoff = calculate_checkpoint_cutoff(term_start, checkpoint)
    seven_days_prior = cutoff - timedelta(days=7)

    # 1. Attendance Features (Point-in-time: event_timestamp_utc <= cutoff AND available_at_utc <= cutoff)
    att_records = db.query(AttendanceRecord).filter(
        AttendanceRecord.enrollment_id == enrollment_id,
        AttendanceRecord.event_timestamp_utc <= cutoff,
        AttendanceRecord.available_at_utc <= cutoff
    ).all()

    eligible_recorded = [a for a in att_records if a.status in ["present", "absent"]]
    attended = [a for a in eligible_recorded if a.status == "present"]
    unrecorded = [a for a in att_records if a.status == "unrecorded"]

    att_coverage = len(eligible_recorded) >= 2
    att_rate = (len(attended) / len(eligible_recorded) * 100.0) if len(eligible_recorded) > 0 else None

    # 2. Coursework / Assessments
    # Find all assessments belonging to this offering where due_date_utc <= cutoff
    due_asms = db.query(Assessment).filter(
        Assessment.offering_id == enr.offering_id,
        Assessment.due_date_utc <= cutoff
    ).all()

    due_asm_ids = [a.assessment_id for a in due_asms]

    # Submissions that became available on or before cutoff
    subs = db.query(Submission).filter(
        Submission.enrollment_id == enrollment_id,
        Submission.assessment_id.in_(due_asm_ids) if due_asm_ids else False,
        Submission.available_at_utc <= cutoff
    ).all()

    released_subs = [s for s in subs if s.is_released and s.score is not None]
    submitted_asm_ids = set([s.assessment_id for s in subs if s.submitted_at_utc is not None])

    # Count overdue: past deadline but not submitted by cutoff
    overdue_count = len([a_id for a_id in due_asm_ids if a_id not in submitted_asm_ids])

    coursework_coverage = len(due_asms) > 0 and len(released_subs) > 0
    avg_score = (sum(s.score for s in released_subs) / len(released_subs)) if released_subs else None

    # 3. Engagement Events (Point-in-time)
    events = db.query(EngagementEvent).filter(
        EngagementEvent.enrollment_id == enrollment_id,
        EngagementEvent.event_timestamp_utc <= cutoff,
        EngagementEvent.available_at_utc <= cutoff
    ).all()

    total_clicks = sum(e.clicks_count for e in events) if events else 0
    active_days_set = set(e.event_timestamp_utc.strftime("%Y-%m-%d") for e in events)
    active_days = len(active_days_set)

    recent_events = [e for e in events if e.event_timestamp_utc >= seven_days_prior]
    recent_clicks = sum(e.clicks_count for e in recent_events) if recent_events else 0
    recent_activity_ratio = (recent_clicks / total_clicks) if total_clicks > 0 else 0.0

    engagement_coverage = len(events) > 0

    # 4. Academic Background
    prior = db.query(PriorAcademicRecord).filter(
        PriorAcademicRecord.student_id == enr.student_id,
        PriorAcademicRecord.available_at_utc <= cutoff
    ).first()

    high_school_gpa = prior.high_school_gpa if prior else 3.0
    prior_credits = prior.prior_credits_earned if prior else 0
    entry_tier = prior.entry_qualification_tier if prior else 2

    # 5. Coverage Assessment
    covered_families = []
    if att_coverage:
        covered_families.append("attendance")
    if coursework_coverage:
        covered_families.append("coursework")
    if engagement_coverage:
        covered_families.append("engagement")

    has_sufficient_coverage = len(covered_families) >= 2

    missing_feeds = []
    if not att_coverage:
        missing_feeds.append("Attendance records (<2 recorded sessions)")
    if not coursework_coverage:
        missing_feeds.append("Released assignment grades")
    if not engagement_coverage:
        missing_feeds.append("LMS activity feed")

    features = {
        "attendance_rate": att_rate if att_rate is not None else 75.0, # fallback median if unrecorded
        "attendance_sessions_attended": len(attended),
        "attendance_sessions_eligible": len(eligible_recorded),
        "assessment_avg_score": avg_score if avg_score is not None else 65.0,
        "released_assessments_count": len(released_subs),
        "overdue_submissions_count": overdue_count,
        "active_study_days": active_days,
        "total_clicks": total_clicks,
        "recent_activity_ratio": round(recent_activity_ratio, 3),
        "high_school_gpa": high_school_gpa,
        "prior_credits_earned": prior_credits,
        "entry_qualification_tier": entry_tier
    }

    coverage_info = {
        "covered_families": covered_families,
        "covered_families_count": len(covered_families),
        "has_sufficient_coverage": has_sufficient_coverage,
        "missing_feeds": missing_feeds,
        "cutoff_time_utc": cutoff.isoformat()
    }

    return {
        "enrollment_id": enrollment_id,
        "checkpoint": checkpoint,
        "cutoff_time_utc": cutoff,
        "features": features,
        "coverage": coverage_info,
        "has_sufficient_coverage": has_sufficient_coverage
    }
