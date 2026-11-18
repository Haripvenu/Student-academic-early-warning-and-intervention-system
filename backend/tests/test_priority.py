import pytest
from backend.app.ml.priority import ReviewPriorityEngine

def test_priority_insufficient_data():
    engine = ReviewPriorityEngine(anomaly_corroboration_percentile=90.0)
    features = {"attendance_rate": 85.0}
    coverage = {"has_sufficient_coverage": False, "missing_feeds": ["LMS activity feed", "Assignments"]}
    
    res = engine.evaluate_priority(features, coverage, anomaly_percentile=95.0, score_sensitivities=[])
    assert res["priority"] == "Insufficient data"
    assert "Path A" in res["policy_path"]

def test_priority_routine_normal():
    engine = ReviewPriorityEngine(anomaly_corroboration_percentile=90.0)
    features = {
        "attendance_rate": 90.0,
        "assessment_avg_score": 85.0,
        "overdue_submissions_count": 0,
        "active_study_days": 8,
        "total_clicks": 150,
        "recent_activity_ratio": 0.35
    }
    coverage = {"has_sufficient_coverage": True}
    res = engine.evaluate_priority(features, coverage, anomaly_percentile=40.0, score_sensitivities=[])
    assert res["priority"] == "Routine"
    assert "Path B1" in res["policy_path"]

def test_priority_routine_high_performing_anomaly():
    engine = ReviewPriorityEngine(anomaly_corroboration_percentile=90.0)
    features = {
        "attendance_rate": 98.0,
        "assessment_avg_score": 96.0,
        "overdue_submissions_count": 0,
        "active_study_days": 18,
        "total_clicks": 800, # Extreme high activity outlier!
        "recent_activity_ratio": 0.40
    }
    coverage = {"has_sufficient_coverage": True}
    # Anomaly percentile is 98%, but academic performance is stellar
    res = engine.evaluate_priority(features, coverage, anomaly_percentile=98.0, score_sensitivities=[])
    assert res["priority"] == "Routine"
    assert "Path B2" in res["policy_path"]

def test_priority_single_concern_monitor():
    engine = ReviewPriorityEngine(anomaly_corroboration_percentile=90.0)
    features = {
        "attendance_rate": 62.0, # <70% concern!
        "assessment_avg_score": 82.0,
        "overdue_submissions_count": 0,
        "active_study_days": 8,
        "total_clicks": 120,
        "recent_activity_ratio": 0.30
    }
    coverage = {"has_sufficient_coverage": True}
    # Anomaly percentile is moderate (65%), no corroboration
    res = engine.evaluate_priority(features, coverage, anomaly_percentile=65.0, score_sensitivities=[])
    assert res["priority"] == "Monitor"
    assert "Path C" in res["policy_path"]

def test_priority_single_concern_elevated_by_corroboration():
    engine = ReviewPriorityEngine(anomaly_corroboration_percentile=90.0)
    features = {
        "attendance_rate": 55.0, # Concern in attendance
        "assessment_avg_score": 75.0,
        "overdue_submissions_count": 0,
        "active_study_days": 6,
        "total_clicks": 80,
        "recent_activity_ratio": 0.25
    }
    coverage = {"has_sufficient_coverage": True}
    sensitivities = [{
        "feature_name": "attendance_rate",
        "impact_direction": "supports_adverse_signal",
        "score_delta": -0.08
    }]
    # High anomaly percentile (94%) + adverse sensitivity elevates to High!
    res = engine.evaluate_priority(features, coverage, anomaly_percentile=94.0, score_sensitivities=sensitivities)
    assert res["priority"] == "High"
    assert "Path D" in res["policy_path"]

def test_priority_multi_family_concern_high():
    engine = ReviewPriorityEngine(anomaly_corroboration_percentile=90.0)
    features = {
        "attendance_rate": 45.0,       # Attendance concern
        "assessment_avg_score": 52.0,  # Coursework concern
        "overdue_submissions_count": 2, # Coursework concern
        "active_study_days": 2,        # Engagement concern
        "total_clicks": 15
    }
    coverage = {"has_sufficient_coverage": True}
    res = engine.evaluate_priority(features, coverage, anomaly_percentile=70.0, score_sensitivities=[])
    assert res["priority"] == "High"
    assert "Path E" in res["policy_path"]
