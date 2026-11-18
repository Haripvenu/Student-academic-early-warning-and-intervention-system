from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..db import Base

class InterventionCase(Base):
    __tablename__ = "intervention_cases"

    case_id = Column(String(100), primary_key=True)
    enrollment_id = Column(String(150), ForeignKey("enrollments.enrollment_id"), nullable=False, index=True)
    assigned_mentor_id = Column(String(50), nullable=True, index=True)
    status = Column(String(50), default="open", index=True) # "open", "in_progress", "pending_review", "closed"
    support_action = Column(String(100), nullable=False) # "Academic Advising Check-in", "Study Planning", "Tutoring Referral", "Faculty Outreach"
    priority = Column(String(50), default="High")
    due_date = Column(DateTime, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_by_user_id = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    enrollment = relationship("Enrollment", back_populates="intervention_cases")
    events = relationship("InterventionEvent", back_populates="case", cascade="all, delete-orphan")

class InterventionEvent(Base):
    __tablename__ = "intervention_events"

    event_id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String(100), ForeignKey("intervention_cases.case_id"), nullable=False, index=True)
    author_user_id = Column(String(50), nullable=False)
    event_type = Column(String(50), nullable=False) # "case_created", "status_changed", "note_added", "due_date_updated", "support_action_confirmed"
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("InterventionCase", back_populates="events")
