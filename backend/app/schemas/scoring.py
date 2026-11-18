from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class FeatureSensitivitySchema(BaseModel):
    feature_name: str
    feature_name_display: str
    observed_value: float
    benchmark_value: float
    unit: str
    score_delta: float
    impact_direction: str # "supports_adverse_signal", "protective_factor", "neutral"
    interpretation: str

class PublishedAssessmentSchema(BaseModel):
    assessment_record_id: str
    enrollment_id: str
    checkpoint: str
    review_priority: str
    cluster_id: Optional[int] = None
    cluster_label: Optional[str] = None
    anomaly_score: Optional[float] = None
    anomaly_percentile: Optional[float] = None
    policy_path_taken: str
    primary_triggers: Optional[List[str]] = None
    evidence_breakdown: Dict[str, Any]
    score_sensitivities: Optional[List[FeatureSensitivitySchema]] = None

    model_config = ConfigDict(from_attributes=True)

class ModelArtifactSchema(BaseModel):
    version_id: str
    checkpoint: str
    algorithm_type: str
    training_window_terms: str
    is_active: bool
    integrity_checksum: str
    metrics_summary_json: Optional[Dict[str, Any]] = None
    cluster_profiles_json: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class JobRunSchema(BaseModel):
    job_id: str
    job_type: str
    status: str
    progress_pct: float
    worker_id: Optional[str] = None
    result_summary: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TriggerJobRequest(BaseModel):
    job_type: str # "train", "score", "evaluate"
    term_code: Optional[str] = "2025-F"
    checkpoint: Optional[str] = "W4"
    model_version_id: Optional[str] = None
