import pytest
from datetime import datetime, timedelta
from backend.app.models import (
    Term, CourseOffering, Student, Enrollment,
    AttendanceRecord, Assessment, Submission, EngagementEvent
)
from backend.app.ml.build_features import build_enrollment_snapshot, calculate_checkpoint_cutoff

def test_point_in_time_filtering(db_session):
    # Setup test hierarchy
    term_start = datetime(2025, 9, 1, 0, 0, 0)
    term = Term(term_code="2025-F", term_name="Fall 2025", start_date=term_start, end_date=term_start + timedelta(days=100))
    offering = CourseOffering(offering_id="OFF-TEST", term_code="2025-F", course_code="CS101", course_name="CS", section="01")
    student = Student(student_id="STU-TEST", first_name="John", last_name="Doe", email="john@test.edu")
    enr = Enrollment(enrollment_id="ENR-TEST", student_id="STU-TEST", offering_id="OFF-TEST", enrolled_at_utc=term_start)
    
    db_session.add_all([term, offering, student, enr])
    db_session.commit()

    cutoff_w4 = calculate_checkpoint_cutoff(term_start, "W4") # Day 28

    # Attendance: 1 before cutoff, 1 after cutoff (look-ahead)
    att_valid = AttendanceRecord(
        attendance_id="ATT-1", enrollment_id="ENR-TEST", session_date="2025-09-10",
        status="present", event_timestamp_utc=term_start + timedelta(days=10),
        available_at_utc=term_start + timedelta(days=10)
    )
    att_future = AttendanceRecord(
        attendance_id="ATT-2", enrollment_id="ENR-TEST", session_date="2025-10-15",
        status="present", event_timestamp_utc=term_start + timedelta(days=45), # > Day 28
        available_at_utc=term_start + timedelta(days=45)
    )
    db_session.add_all([att_valid, att_future])
    db_session.commit()

    snap = build_enrollment_snapshot(db_session, "ENR-TEST", "W4")
    # Only 1 session should be counted, not 2!
    assert snap["features"]["attendance_sessions_eligible"] == 1
    assert snap["features"]["attendance_sessions_attended"] == 1
