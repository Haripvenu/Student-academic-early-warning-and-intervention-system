"""
Evidence-Based Review Priority Policy Engine.
Implements deterministic policy matrix combining observed evidence and unsupervised signals:
- Insufficient data (<2 covered families)
- Routine (no concerns, including high-performing outliers)
- Monitor (1 concerning family without model corroboration)
- High (2+ concerning families, OR 1 concerning family with model corroboration)
"""

from typing import Dict, Any, List, Tuple
from .feature_spec import FEATURE_DEFINITIONS

class ReviewPriorityEngine:
    def __init__(self, anomaly_corroboration_percentile: float = 90.0):
        self.anomaly_threshold = anomaly_corroboration_percentile

    def evaluate_priority(
        self,
        features: Dict[str, Any],
        coverage: Dict[str, Any],
        anomaly_percentile: float,
        score_sensitivities: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Determines the mentor review priority and records the exact policy path followed.
        """
        # Path 1: Check coverage
        if not coverage.get("has_sufficient_coverage", True):
            return {
                "priority": "Insufficient data",
                "policy_path": "Path A: Insufficient data coverage (<2 independent current evidence families)",
                "concerning_families": [],
                "concerning_families_count": 0,
                "primary_triggers": coverage.get("missing_feeds", ["Missing required data sources"]),
                "is_corroborated": False
            }

        # Path 2: Identify observed concerns across independent families
        concerning_families = []
        triggers = []

        # Family 1: Attendance
        att_rate = features.get("attendance_rate", 100.0)
        if att_rate < FEATURE_DEFINITIONS["attendance_rate"]["concerning_threshold"]:
            concerning_families.append("attendance")
            triggers.append(f"Low session attendance ({round(att_rate, 1)}% < 70% threshold)")

        # Family 2: Coursework
        score_avg = features.get("assessment_avg_score", 100.0)
        overdue = features.get("overdue_submissions_count", 0)
        coursework_concern = False
        if score_avg < FEATURE_DEFINITIONS["assessment_avg_score"]["concerning_threshold"]:
            coursework_concern = True
            triggers.append(f"Low assessment score average ({round(score_avg, 1)}% < 60% threshold)")
        if overdue >= FEATURE_DEFINITIONS["overdue_submissions_count"]["concerning_threshold"]:
            coursework_concern = True
            triggers.append(f"{overdue} overdue / unsubmitted required assignment(s)")
        if coursework_concern:
            concerning_families.append("coursework")

        # Family 3: Engagement
        active_days = features.get("active_study_days", 10)
        clicks = features.get("total_clicks", 100)
        recent_ratio = features.get("recent_activity_ratio", 0.5)
        eng_concern = False
        if active_days < FEATURE_DEFINITIONS["active_study_days"]["concerning_threshold"]:
            eng_concern = True
            triggers.append(f"Low active study days ({active_days} days < 4 days threshold)")
        if clicks < FEATURE_DEFINITIONS["total_clicks"]["concerning_threshold"]:
            eng_concern = True
            triggers.append(f"Low platform engagement ({clicks} total clicks < 40 threshold)")
        if eng_concern:
            concerning_families.append("engagement")

        num_concerns = len(set(concerning_families))

        # Check for model corroboration:
        # High anomaly percentile (>= 90%) AND at least one sensitivity supporting adverse signal in a concerning family
        has_high_anomaly = anomaly_percentile >= self.anomaly_threshold
        has_supporting_sensitivity = any(
            s.get("impact_direction") == "supports_adverse_signal" and s.get("score_delta", 0) < -0.05
            for s in score_sensitivities
        )
        is_corroborated = has_high_anomaly and has_supporting_sensitivity

        # Path 3: Decision matrix
        if num_concerns >= 2:
            priority = "High"
            policy_path = f"Path E: Multi-family concern ({num_concerns} independent families: {', '.join(concerning_families)})"
        elif num_concerns == 1:
            if is_corroborated:
                priority = "High"
                policy_path = f"Path D: Single concern ({concerning_families[0]}) elevated to High via model corroboration ({anomaly_percentile}% percentile)"
            else:
                priority = "Monitor"
                policy_path = f"Path C: Single concern ({concerning_families[0]}) under periodic monitoring"
        else:
            # 0 concerns
            priority = "Routine"
            if anomaly_percentile >= self.anomaly_threshold:
                policy_path = f"Path B2: High-performing unusual profile ({anomaly_percentile}% percentile) retained as Routine (no adverse academic evidence)"
            else:
                policy_path = "Path B1: Standard healthy engagement (no observed concerns)"

        return {
            "priority": priority,
            "policy_path": policy_path,
            "concerning_families": list(set(concerning_families)),
            "concerning_families_count": num_concerns,
            "primary_triggers": triggers if triggers else ["Standard academic performance on track"],
            "is_corroborated": is_corroborated
        }
