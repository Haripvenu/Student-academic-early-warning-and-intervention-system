"""
Batch & On-Demand Scoring Service.
Performs point-in-time feature extraction, model inference, evidence policy evaluation,
and atomic publication of results.
"""

from datetime import datetime
from typing import Dict, Any, List
import pandas as pd
from sqlalchemy.orm import Session
from ..models import (
    Enrollment, PublishedAssessment, ScoringRun, FeatureSnapshot
)
from ..ml.registry import ModelRegistry
from ..ml.build_features import build_enrollment_snapshot
from ..ml.priority import ReviewPriorityEngine
from ..ml.explain import SensitivityExplainer

class ScoringService:
    @staticmethod
    def run_scoring(db: Session, term_code: str = "2014J", checkpoint: str = "W4") -> ScoringRun:
        print(f"Executing scoring run for Term {term_code}, Checkpoint {checkpoint}...")

        # 1. Load active model
        model_bundle = ModelRegistry.load_active_model(db, checkpoint)
        preprocessor = model_bundle["preprocessor"]
        clusterer = model_bundle["clusterer"]
        anomaly_engine = model_bundle["anomaly_engine"]
        version_id = model_bundle["version_id"]

        priority_engine = ReviewPriorityEngine()
        explainer = SensitivityExplainer(preprocessor, anomaly_engine)

        # 2. Create scoring run record
        run_id = f"RUN-{term_code}-{checkpoint}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        scoring_run = ScoringRun(
            run_id=run_id,
            term_code=term_code,
            checkpoint=checkpoint,
            model_version_id=version_id,
            status="running"
        )
        db.add(scoring_run)
        db.commit()

        # 3. Retrieve target enrollments
        enrollments = db.query(Enrollment).join(Enrollment.offering).filter(
            Enrollment.offering.has(term_code=term_code)
        ).all()

        if not enrollments:
            scoring_run.status = "failed"
            db.commit()
            raise ValueError(f"No enrollments found for Term {term_code}")

        counts = {"High": 0, "Monitor": 0, "Routine": 0, "Insufficient data": 0}

        try:
            # Atomic publication: collect all published records first
            published_records = []
            
            for enr in enrollments:
                snap = build_enrollment_snapshot(db, enr.enrollment_id, checkpoint)
                features = snap["features"]
                coverage = snap["coverage"]

                # Save FeatureSnapshot
                fs_id = f"FS-{enr.enrollment_id}-{checkpoint}"
                db.merge(FeatureSnapshot(
                    snapshot_id=fs_id,
                    enrollment_id=enr.enrollment_id,
                    checkpoint=checkpoint,
                    cutoff_time_utc=snap["cutoff_time_utc"],
                    features_json=features,
                    coverage_json=coverage,
                    has_sufficient_coverage=snap["has_sufficient_coverage"]
                ))

                # Model inference if coverage exists
                if snap["has_sufficient_coverage"]:
                    feat_scaled = preprocessor.transform_single(features)
                    cluster_id = int(clusterer.predict(feat_scaled)[0])
                    cluster_label = clusterer.get_profile_by_id(cluster_id).get("label", "Profile")

                    anom_score = float(anomaly_engine.score(feat_scaled)[0])
                    anom_pct = float(anomaly_engine.score_to_percentile(anom_score))
                    sensitivities = explainer.explain_enrollment(features)
                else:
                    cluster_id = None
                    cluster_label = None
                    anom_score = None
                    anom_pct = None
                    sensitivities = []

                # Evaluate Review Priority
                eval_res = priority_engine.evaluate_priority(
                    features=features,
                    coverage=coverage,
                    anomaly_percentile=anom_pct if anom_pct is not None else 50.0,
                    score_sensitivities=sensitivities
                )

                priority = eval_res["priority"]
                counts[priority] = counts.get(priority, 0) + 1

                # Format evidence breakdown
                evidence_breakdown = {
                    "attendance": {
                        "value": f"{round(features.get('attendance_rate', 0), 1)}%",
                        "denominator": f"{features.get('attendance_sessions_attended', 0)} of {features.get('attendance_sessions_eligible', 0)} sessions",
                        "status": "Concerning" if features.get("attendance_rate", 100) < 70 else "Adequate"
                    },
                    "coursework": {
                        "value": f"{round(features.get('assessment_avg_score', 0), 1)}%",
                        "denominator": f"{features.get('released_assessments_count', 0)} released grades; {features.get('overdue_submissions_count', 0)} overdue",
                        "status": "Concerning" if features.get("assessment_avg_score", 100) < 60 or features.get("overdue_submissions_count", 0) > 0 else "Adequate"
                    },
                    "engagement": {
                        "value": f"{features.get('total_clicks', 0)} clicks",
                        "denominator": f"{features.get('active_study_days', 0)} active days (trend: {int(features.get('recent_activity_ratio', 0)*100)}% recent)",
                        "status": "Concerning" if features.get("active_study_days", 10) < 4 or features.get("total_clicks", 100) < 40 else "Adequate"
                    },
                    "coverage": coverage
                }

                rec_id = f"PUB-{enr.enrollment_id}-{checkpoint}"
                pub_record = PublishedAssessment(
                    assessment_record_id=rec_id,
                    enrollment_id=enr.enrollment_id,
                    run_id=run_id,
                    checkpoint=checkpoint,
                    review_priority=priority,
                    cluster_id=cluster_id,
                    cluster_label=cluster_label,
                    anomaly_score=anom_score,
                    anomaly_percentile=anom_pct,
                    policy_path_taken=eval_res["policy_path"],
                    primary_triggers_json=eval_res["primary_triggers"],
                    evidence_breakdown_json=evidence_breakdown,
                    score_sensitivities_json=sensitivities
                )
                published_records.append(pub_record)

            # Atomic publication: remove previous checkpoint assessments and add new ones in one transaction
            db.query(PublishedAssessment).filter(
                PublishedAssessment.checkpoint == checkpoint,
                PublishedAssessment.enrollment_id.in_([e.enrollment_id for e in enrollments])
            ).delete(synchronize_session=False)

            for pr in published_records:
                db.add(pr)

            scoring_run.status = "completed"
            scoring_run.total_scored = len(enrollments)
            scoring_run.high_priority_count = counts["High"]
            scoring_run.monitor_count = counts["Monitor"]
            scoring_run.routine_count = counts["Routine"]
            scoring_run.insufficient_data_count = counts["Insufficient data"]
            scoring_run.completed_at = datetime.utcnow()
            db.commit()

            print(f"Scoring completed atomically! Total: {len(enrollments)} (High: {counts['High']}, Monitor: {counts['Monitor']})")
            return scoring_run

        except Exception as e:
            db.rollback()
            scoring_run.status = "failed"
            db.commit()
            raise e
