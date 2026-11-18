from datetime import datetime, timezone

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

from .identity import User, UserSession, AccessScope
from .academics import (
    Term, CourseOffering, Student, Enrollment,
    AttendanceRecord, Assessment, Submission,
    EngagementEvent, PriorAcademicRecord, FinalOutcome
)
from .imports import ImportBatch, ImportRowError
from .scoring import FeatureSnapshot, ModelArtifact, ScoringRun, PublishedAssessment, JobRun
from .interventions import InterventionCase, InterventionEvent

__all__ = [
    "User", "UserSession", "AccessScope",
    "Term", "CourseOffering", "Student", "Enrollment",
    "AttendanceRecord", "Assessment", "Submission",
    "EngagementEvent", "PriorAcademicRecord", "FinalOutcome",
    "ImportBatch", "ImportRowError",
    "FeatureSnapshot", "ModelArtifact", "ScoringRun", "PublishedAssessment", "JobRun",
    "InterventionCase", "InterventionEvent"
]
