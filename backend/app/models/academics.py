from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship
from ..db import Base

def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

class Term(Base):
    __tablename__ = "terms"

    term_code = Column(String(50), primary_key=True)
    term_name = Column(String(100), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=_utc_now)

    offerings = relationship("CourseOffering", back_populates="term")

class CourseOffering(Base):
    __tablename__ = "course_offerings"

    offering_id = Column(String(100), primary_key=True)
    term_code = Column(String(50), ForeignKey("terms.term_code"), nullable=False, index=True)
    course_code = Column(String(50), nullable=False, index=True)
    course_name = Column(String(255), nullable=False)
    section = Column(String(20), default="01")
    credits = Column(Integer, default=3)
    faculty_user_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=_utc_now)

    term = relationship("Term", back_populates="offerings")
    enrollments = relationship("Enrollment", back_populates="offering")
    assessments = relationship("Assessment", back_populates="offering")

class Student(Base):
    __tablename__ = "students"

    student_id = Column(String(50), primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    cohort_year = Column(Integer, default=2025)
    created_at = Column(DateTime, default=_utc_now)

    enrollments = relationship("Enrollment", back_populates="student")
    prior_records = relationship("PriorAcademicRecord", back_populates="student")

class Enrollment(Base):
    __tablename__ = "enrollments"

    enrollment_id = Column(String(150), primary_key=True, index=True)
    student_id = Column(String(50), ForeignKey("students.student_id"), nullable=False, index=True)
    offering_id = Column(String(100), ForeignKey("course_offerings.offering_id"), nullable=False, index=True)
    enrolled_at_utc = Column(DateTime, nullable=False)
    status = Column(String(50), default="active")
    mentor_user_id = Column(String(50), nullable=True, index=True)
    created_at = Column(DateTime, default=_utc_now)

    student = relationship("Student", back_populates="enrollments")
    offering = relationship("CourseOffering", back_populates="enrollments")
    attendance_records = relationship("AttendanceRecord", back_populates="enrollment")
    submissions = relationship("Submission", back_populates="enrollment")
    engagement_events = relationship("EngagementEvent", back_populates="enrollment")
    assessments_scored = relationship("PublishedAssessment", back_populates="enrollment")
    intervention_cases = relationship("InterventionCase", back_populates="enrollment")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    attendance_id = Column(String(100), primary_key=True)
    enrollment_id = Column(String(150), ForeignKey("enrollments.enrollment_id"), nullable=False, index=True)
    session_date = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False) # "present", "absent", "excused", "unrecorded"
    event_timestamp_utc = Column(DateTime, nullable=False, index=True)
    available_at_utc = Column(DateTime, nullable=False, index=True)

    enrollment = relationship("Enrollment", back_populates="attendance_records")

class Assessment(Base):
    __tablename__ = "assessments"

    assessment_id = Column(String(100), primary_key=True)
    offering_id = Column(String(100), ForeignKey("course_offerings.offering_id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    week_due = Column(Integer, nullable=False)
    due_date_utc = Column(DateTime, nullable=False, index=True)
    weight_pct = Column(Float, default=10.0)
    max_score = Column(Float, default=100.0)

    offering = relationship("CourseOffering", back_populates="assessments")
    submissions = relationship("Submission", back_populates="assessment")

class Submission(Base):
    __tablename__ = "submissions"

    submission_id = Column(String(100), primary_key=True)
    assessment_id = Column(String(100), ForeignKey("assessments.assessment_id"), nullable=False, index=True)
    enrollment_id = Column(String(150), ForeignKey("enrollments.enrollment_id"), nullable=False, index=True)
    submitted_at_utc = Column(DateTime, nullable=True)
    score = Column(Float, nullable=True)
    is_released = Column(Boolean, default=False)
    available_at_utc = Column(DateTime, nullable=False, index=True)

    assessment = relationship("Assessment", back_populates="submissions")
    enrollment = relationship("Enrollment", back_populates="submissions")

class EngagementEvent(Base):
    __tablename__ = "engagement_events"

    event_id = Column(String(100), primary_key=True)
    enrollment_id = Column(String(150), ForeignKey("enrollments.enrollment_id"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    event_timestamp_utc = Column(DateTime, nullable=False, index=True)
    session_duration_minutes = Column(Float, default=0.0)
    clicks_count = Column(Integer, default=1)
    available_at_utc = Column(DateTime, nullable=False, index=True)

    enrollment = relationship("Enrollment", back_populates="engagement_events")

class PriorAcademicRecord(Base):
    __tablename__ = "prior_academic_records"

    record_id = Column(String(100), primary_key=True)
    student_id = Column(String(50), ForeignKey("students.student_id"), nullable=False, index=True)
    high_school_gpa = Column(Float, nullable=True)
    prior_credits_earned = Column(Integer, default=0)
    entry_qualification_tier = Column(Integer, default=1)
    available_at_utc = Column(DateTime, nullable=False)

    student = relationship("Student", back_populates="prior_records")

class FinalOutcome(Base):
    __tablename__ = "final_outcomes"

    outcome_id = Column(String(100), primary_key=True)
    enrollment_id = Column(String(150), ForeignKey("enrollments.enrollment_id"), unique=True, nullable=False, index=True)
    final_grade = Column(Float, nullable=True)
    letter_grade = Column(String(10), nullable=True)
    outcome_status = Column(String(50), nullable=False) # "Pass", "Fail", "Withdrawn"
    recorded_at_utc = Column(DateTime, nullable=False)
