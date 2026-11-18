from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from ..db import Base

class FeatureSnapshot(Base):
    __tablename__ = "feature_snapshots"

    snapshot_id = Column(String(150), primary_key=True)
    enrollment_id = Column(String(150), ForeignKey("enrollments.enrollment_id"), nullable=False, index=True)
    checkpoint = Column(String(10), nullable=False, index=True) # "W2", "W4", "W6"
    cutoff_time_utc = Column(DateTime, nullable=False)
    features_json = Column(JSON, nullable=False)
    coverage_json = Column(JSON, nullable=False)
    has_sufficient_coverage = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ModelArtifact(Base):
    __tablename__ = "model_artifacts"

    version_id = Column(String(100), primary_key=True)
    checkpoint = Column(String(10), nullable=False, index=True) # "W2", "W4", "W6"
    algorithm_type = Column(String(50), default="KMeans+IsolationForest")
    artifact_path = Column(String(255), nullable=False)
    integrity_checksum = Column(String(128), nullable=False)
    training_window_terms = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=False)
    metrics_summary_json = Column(JSON, nullable=True)
    cluster_profiles_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ScoringRun(Base):
    __tablename__ = "scoring_runs"

    run_id = Column(String(100), primary_key=True)
    term_code = Column(String(50), nullable=False, index=True)
    checkpoint = Column(String(10), nullable=False, index=True)
    model_version_id = Column(String(100), ForeignKey("model_artifacts.version_id"), nullable=False)
    status = Column(String(50), default="completed") # "running", "completed", "failed"
    total_scored = Column(Integer, default=0)
    high_priority_count = Column(Integer, default=0)
    monitor_count = Column(Integer, default=0)
    routine_count = Column(Integer, default=0)
    insufficient_data_count = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PublishedAssessment(Base):
    __tablename__ = "published_assessments"

    assessment_record_id = Column(String(150), primary_key=True)
    enrollment_id = Column(String(150), ForeignKey("enrollments.enrollment_id"), nullable=False, index=True)
    run_id = Column(String(100), ForeignKey("scoring_runs.run_id"), nullable=False, index=True)
    checkpoint = Column(String(10), nullable=False, index=True)
    review_priority = Column(String(50), nullable=False, index=True) # "High", "Monitor", "Routine", "Insufficient data"
    cluster_id = Column(Integer, nullable=True)
    cluster_label = Column(String(100), nullable=True)
    anomaly_score = Column(Float, nullable=True)
    anomaly_percentile = Column(Float, nullable=True)
    policy_path_taken = Column(String(100), nullable=False)
    primary_triggers_json = Column(JSON, nullable=True)
    evidence_breakdown_json = Column(JSON, nullable=False)
    score_sensitivities_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    enrollment = relationship("Enrollment", back_populates="assessments_scored")

class JobRun(Base):
    __tablename__ = "job_runs"

    job_id = Column(String(100), primary_key=True)
    job_type = Column(String(50), nullable=False) # "train", "score", "import", "evaluate"
    payload_json = Column(JSON, nullable=True)
    status = Column(String(50), default="pending", index=True) # "pending", "claimed", "completed", "failed"
    progress_pct = Column(Float, default=0.0)
    worker_id = Column(String(100), nullable=True)
    lease_expires_at = Column(DateTime, nullable=True)
    result_summary = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
