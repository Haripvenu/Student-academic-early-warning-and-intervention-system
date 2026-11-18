from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class TermResponse(BaseModel):
    term_code: str
    term_name: str
    start_date: datetime
    end_date: datetime

    class Config:
        from_attributes = True

class CourseOfferingResponse(BaseModel):
    offering_id: str
    term_code: str
    course_code: str
    course_name: str
    section: str
    credits: int
    faculty_user_id: Optional[str] = None

    class Config:
        from_attributes = True

class StudentSummary(BaseModel):
    student_id: str
    first_name: str
    last_name: str
    email: str
    cohort_year: int

    class Config:
        from_attributes = True

class EnrollmentListItem(BaseModel):
    enrollment_id: str
    student_id: str
    student_name: str
    student_email: str
    offering_id: str
    course_code: str
    course_name: str
    term_code: str
    section: str
    mentor_user_id: Optional[str] = None
    review_priority: str
    cluster_label: Optional[str] = None
    anomaly_percentile: Optional[float] = None
    primary_warning: Optional[str] = None
    has_active_case: bool = False
    case_status: Optional[str] = None

class EnrollmentDetailResponse(BaseModel):
    enrollment_id: str
    student: StudentSummary
    offering: CourseOfferingResponse
    mentor_user_id: Optional[str] = None
    current_checkpoint: str
    assessment: Optional[Dict[str, Any]] = None
    features: Optional[Dict[str, Any]] = None
    evidence_breakdown: Optional[Dict[str, Any]] = None
    score_sensitivities: Optional[List[Dict[str, Any]]] = None
    historical_checkpoints: Optional[List[Dict[str, Any]]] = None
    interventions: Optional[List[Dict[str, Any]]] = None
