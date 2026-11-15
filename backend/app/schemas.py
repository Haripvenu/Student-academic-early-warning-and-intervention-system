from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class StudentFeatures(BaseModel):
    # Demographics / Prior
    highest_education: float = Field(default=2.0, description="0=No formal, 1=Lower Than A, 2=A Level, 3=HE, 4=Postgrad")
    imd_band: Optional[float] = Field(default=50.0, description="Index of Multiple Deprivation (0-100)")
    num_of_prev_attempts: int = Field(default=0, description="Number of previous attempts on module")
    studied_credits: int = Field(default=60, description="Total credits currently being studied")
    date_registration: Optional[float] = Field(default=-30.0, description="Days registered before course start (negative means early)")
    
    # VLE Engagement (Day 0 to 60)
    total_clicks: float = Field(default=350.0, description="Total clicks in first 60 days")
    active_days: int = Field(default=25, description="Number of distinct active days")
    distinct_resources: int = Field(default=45, description="Number of distinct VLE materials clicked")
    clicks_per_active_day: Optional[float] = Field(default=14.0, description="Average clicks per active day")
    clicks_last_2wk: float = Field(default=80.0, description="Clicks in days 46-60")
    recent_share: Optional[float] = Field(default=0.22, description="Share of clicks in last 2 weeks")
    
    # Assessments (Day 0 to 60)
    n_submitted: float = Field(default=2.0, description="Assessments submitted up to day 60")
    avg_score: Optional[float] = Field(default=72.0, description="Average score across submitted assignments")
    min_score: Optional[float] = Field(default=65.0, description="Minimum score achieved")
    avg_days_late: Optional[float] = Field(default=-1.0, description="Average days late (negative means submitted early)")
    late_submissions: float = Field(default=0.0, description="Number of late submissions")
    n_assessments_due: int = Field(default=2, description="Total assessments due by day 60")
    submission_rate: Optional[float] = Field(default=1.0, description="n_submitted / n_assessments_due")
    missed_assessments: float = Field(default=0.0, description="Number of missed due assessments")
    
    # Cohort Benchmarks
    clicks_vs_cohort: Optional[float] = Field(default=1.0, description="Ratio of student clicks vs cohort average")
    score_vs_cohort: Optional[float] = Field(default=0.0, description="Difference between student score and cohort average")

class FeatureImpact(BaseModel):
    feature: str
    feature_name_display: str
    student_value: Any
    shap_value: float
    direction: str  # "increases_risk" or "decreases_risk"
    interpretation: str

class PredictionResponse(BaseModel):
    risk_score: float  # 0.0 to 1.0 (probability)
    risk_percentage: float  # 0 to 100%
    risk_level: str  # "Low Risk", "Moderate Risk", "High Risk"
    urgency: Optional[str] = "Routine Tracking"
    predicted_class: int  # 0 or 1
    pillars: Optional[Dict[str, Any]] = None
    recommended_action: str
    prescribed_interventions: Optional[List[Dict[str, Any]]] = None
    top_factors: List[FeatureImpact]

class BatchStudentRow(BaseModel):
    id_student: Optional[str] = "STU_UNKNOWN"
    code_module: Optional[str] = "AAA"
    features: StudentFeatures

class BatchPredictionResponse(BaseModel):
    total_students: int
    high_risk_count: int
    moderate_risk_count: int
    low_risk_count: int
    students: List[Dict[str, Any]]

class WhatIfRequest(BaseModel):
    base_features: StudentFeatures
    modified_features: Dict[str, Any]

class WhatIfResponse(BaseModel):
    original_risk_score: float
    simulated_risk_score: float
    risk_score_delta: float
    original_level: str
    simulated_level: str
    impact_summary: str
