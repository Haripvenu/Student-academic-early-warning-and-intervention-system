"""
Unsupervised Model Evaluation & Retrospective Outcome Auditing.
Evaluates cluster profile stability, alert volume shifts due to model corroboration,
and retrospective precision/recall against final course outcomes.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from ..models import Enrollment, FinalOutcome, PublishedAssessment

def evaluate_retrospective_performance(db: Session, checkpoint: str = "W4") -> Dict[str, Any]:
    # Query published assessments for this checkpoint
    assessments = db.query(PublishedAssessment).filter(
        PublishedAssessment.checkpoint == checkpoint
    ).all()

    if not assessments:
        return {
            "checkpoint": checkpoint,
            "status": "No published assessments found for evaluation",
            "sample_size": 0
        }

    # Retrieve associated final outcomes
    enr_ids = [a.enrollment_id for a in assessments]
    outcomes = db.query(FinalOutcome).filter(FinalOutcome.enrollment_id.in_(enr_ids)).all()
    outcome_map = {o.enrollment_id: o for o in outcomes}

    total_assessed = len(assessments)
    high_priority = [a for a in assessments if a.review_priority == "High"]
    monitor_priority = [a for a in assessments if a.review_priority == "Monitor"]
    routine_priority = [a for a in assessments if a.review_priority == "Routine"]
    insufficient_priority = [a for a in assessments if a.review_priority == "Insufficient data"]

    # Cases where model corroboration elevated a Monitor case to High
    corroborated_cases = [a for a in high_priority if "Path D" in a.policy_path_taken]

    # Retrospective evaluation metrics (True Positives = High priority flagged student actually Failed or Withdrew)
    tp = 0
    fp = 0
    fn = 0
    tn = 0

    for a in assessments:
        actual_outcome = outcome_map.get(a.enrollment_id)
        if not actual_outcome:
            continue
        is_actual_at_risk = actual_outcome.outcome_status in ["Fail", "Withdrawn"]
        is_predicted_high = a.review_priority == "High"

        if is_predicted_high and is_actual_at_risk:
            tp += 1
        elif is_predicted_high and not is_actual_at_risk:
            fp += 1
        elif not is_predicted_high and is_actual_at_risk:
            fn += 1
        else:
            tn += 1

    precision = round(tp / (tp + fp), 3) if (tp + fp) > 0 else 0.0
    recall = round(tp / (tp + fn), 3) if (tp + fn) > 0 else 0.0
    f1 = round(2 * (precision * recall) / (precision + recall), 3) if (precision + recall) > 0 else 0.0

    return {
        "checkpoint": checkpoint,
        "sample_size": total_assessed,
        "priority_distribution": {
            "high": len(high_priority),
            "monitor": len(monitor_priority),
            "routine": len(routine_priority),
            "insufficient_data": len(insufficient_priority)
        },
        "model_corroboration_impact": {
            "corroborated_cases_count": len(corroborated_cases),
            "description": "Cases elevated from Monitor to High Priority solely due to elevated anomaly percentile (>=90%) and adverse sensitivity."
        },
        "retrospective_metrics": {
            "evaluated_cohort_size": tp + fp + fn + tn,
            "true_positives": tp,
            "false_positives": fp,
            "false_negatives": fn,
            "true_negatives": tn,
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "target_definition": "Student final outcome recorded as 'Fail' or 'Withdrawn'"
        }
    }
