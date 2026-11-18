"""
Feature Specifications and Coverage Contracts for Academic Risk Monitor.
Defines column metadata, units, direction of concern, denominators, and evidence families.
"""

from typing import Dict, Any, List

EVIDENCE_FAMILIES = {
    "attendance": [
        "attendance_rate",
        "attendance_sessions_attended",
        "attendance_sessions_eligible"
    ],
    "coursework": [
        "assessment_avg_score",
        "released_assessments_count",
        "overdue_submissions_count"
    ],
    "engagement": [
        "active_study_days",
        "total_clicks",
        "recent_activity_ratio"
    ],
    "academic_background": [
        "high_school_gpa",
        "prior_credits_earned",
        "entry_qualification_tier"
    ]
}

FEATURE_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    "attendance_rate": {
        "display_name": "Platform & Session Attendance Rate",
        "family": "attendance",
        "unit": "%",
        "direction_of_concern": "lower",
        "concerning_threshold": 70.0, # <70% attendance is concerning
        "denominator": "eligible sessions with recorded attendance",
        "time_window": "term start to checkpoint"
    },
    "attendance_sessions_attended": {
        "display_name": "Recorded Sessions Attended",
        "family": "attendance",
        "unit": "sessions",
        "direction_of_concern": "lower",
        "denominator": "attendance sessions",
        "time_window": "term start to checkpoint"
    },
    "assessment_avg_score": {
        "display_name": "Continuous Assessment Average",
        "family": "coursework",
        "unit": "%",
        "direction_of_concern": "lower",
        "concerning_threshold": 60.0, # <60% average score is concerning
        "denominator": "released assessments",
        "time_window": "term start to checkpoint"
    },
    "overdue_submissions_count": {
        "display_name": "Overdue / Missed Due Tasks",
        "family": "coursework",
        "unit": "tasks",
        "direction_of_concern": "higher",
        "concerning_threshold": 1.0, # >= 1 missed task is concerning
        "denominator": "assignments with past deadlines",
        "time_window": "term start to checkpoint"
    },
    "active_study_days": {
        "display_name": "Active LMS Study Days",
        "family": "engagement",
        "unit": "days",
        "direction_of_concern": "lower",
        "concerning_threshold": 4.0, # <4 active days by checkpoint is concerning
        "denominator": "calendar days",
        "time_window": "term start to checkpoint"
    },
    "total_clicks": {
        "display_name": "Cumulative Platform Clicks",
        "family": "engagement",
        "unit": "interactions",
        "direction_of_concern": "lower",
        "concerning_threshold": 40.0, # <40 interactions is concerning
        "denominator": "click events",
        "time_window": "term start to checkpoint"
    },
    "recent_activity_ratio": {
        "display_name": "Recent 7-Day Activity Trend",
        "family": "engagement",
        "unit": "ratio",
        "direction_of_concern": "lower",
        "concerning_threshold": 0.15, # <15% of total activity in recent 7 days implies drop-off
        "denominator": "recent clicks / total clicks",
        "time_window": "last 7 calendar days before checkpoint"
    },
    "high_school_gpa": {
        "display_name": "Prior Academic GPA",
        "family": "academic_background",
        "unit": "GPA",
        "direction_of_concern": "lower",
        "concerning_threshold": 2.50,
        "denominator": "4.0 scale",
        "time_window": "pre-matriculation"
    },
    "prior_credits_earned": {
        "display_name": "Prior Earned Credits",
        "family": "academic_background",
        "unit": "credits",
        "direction_of_concern": "lower",
        "denominator": "credit hours",
        "time_window": "pre-matriculation"
    }
}

# The ML feature vector used for clustering and anomaly detection
ML_FEATURE_COLUMNS: List[str] = [
    "attendance_rate",
    "assessment_avg_score",
    "overdue_submissions_count",
    "active_study_days",
    "total_clicks",
    "recent_activity_ratio",
    "high_school_gpa"
]
