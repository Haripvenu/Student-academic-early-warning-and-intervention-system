from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class InterventionEventSchema(BaseModel):
    event_id: int
    case_id: str
    author_user_id: str
    event_type: str
    description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InterventionCaseResponse(BaseModel):
    case_id: str
    enrollment_id: str
    student_name: Optional[str] = None
    course_code: Optional[str] = None
    assigned_mentor_id: Optional[str] = None
    status: str
    support_action: str
    priority: str
    due_date: datetime
    is_overdue: bool = False
    notes: Optional[str] = None
    created_by_user_id: str
    created_at: datetime
    updated_at: datetime
    events: Optional[List[InterventionEventSchema]] = None

    model_config = ConfigDict(from_attributes=True)

class InterventionCreateRequest(BaseModel):
    enrollment_id: str
    assigned_mentor_id: Optional[str] = None
    support_action: str # "Academic Advising Check-in", "Study Planning", "Tutoring Referral", "Faculty Outreach"
    priority: Optional[str] = "High"
    due_date: datetime
    notes: Optional[str] = None

class InterventionUpdateRequest(BaseModel):
    status: Optional[str] = None
    assigned_mentor_id: Optional[str] = None
    support_action: Optional[str] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    new_note: Optional[str] = None
