import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
POSSIBLE_ARTIFACTS_DIRS = [
    os.path.join(BASE_DIR, "..", "..", "ml", "artifacts"),
    os.path.join(BASE_DIR, "..", "ml", "artifacts"),
    os.path.join(BASE_DIR, "artifacts")
]

ARTIFACTS_DIR = None
for d in POSSIBLE_ARTIFACTS_DIRS:
    if os.path.exists(d):
        ARTIFACTS_DIR = os.path.abspath(d)
        break

FEATURE_NAMES_DISPLAY = {
    "total_clicks": "VLE Course Engagement (Clicks)",
    "active_days": "Platform Attendance (Active Days)",
    "distinct_resources": "Learning Resources Accessed",
    "clicks_per_active_day": "Engagement Intensity (Clicks/Day)",
    "clicks_last_2wk": "Recent 14-Day Activity",
    "recent_share": "Recent Engagement Ratio",
    "n_submitted": "Continuous Assessments Completed",
    "avg_score": "Continuous Assessment Average",
    "min_score": "Lowest Assessment Score",
    "avg_days_late": "Submission Delay (Days)",
    "late_submissions": "Late Submissions Count",
    "n_assessments_due": "Required Early Assessments",
    "submission_rate": "Assessment Submission Rate",
    "missed_assessments": "Missed Mandatory Assessments",
    "clicks_vs_cohort": "Engagement Relative to Class Average",
    "score_vs_cohort": "Academic Performance vs Class Average",
    "highest_education": "Previous Academic Qualification",
    "imd_band": "Socio-Economic Index (IMD)",
    "num_of_prev_attempts": "Prior Course Attempts",
    "studied_credits": "Currently Enrolled Credits",
    "date_registration": "Course Registration Timing"
}

class MLEngine:
    def __init__(self):
        self.model = None
        self.imputer = None
        self.explainer = None
        self.metrics = {}
        self.feature_cols = []
        self.feature_stats = {}
        self.is_loaded = False
        self._load_artifacts()

    def _load_artifacts(self):
        if not ARTIFACTS_DIR:
            return
        
        model_path = os.path.join(ARTIFACTS_DIR, "best_model.joblib")
        imputer_path = os.path.join(ARTIFACTS_DIR, "imputer.joblib")
        explainer_path = os.path.join(ARTIFACTS_DIR, "shap_explainer.joblib")
        metrics_path = os.path.join(ARTIFACTS_DIR, "metrics.json")

        if os.path.exists(model_path) and os.path.exists(metrics_path):
            try:
                self.model = joblib.load(model_path)
                self.imputer = joblib.load(imputer_path) if os.path.exists(imputer_path) else None
                self.explainer = joblib.load(explainer_path) if os.path.exists(explainer_path) else None
                with open(metrics_path, "r") as f:
                    self.metrics = json.load(f)
                self.feature_cols = self.metrics.get("feature_cols", [])
                self.feature_stats = self.metrics.get("feature_stats", {})
                self.is_loaded = True
                print("MLEngine: Successfully loaded model and artifacts.")
            except Exception as e:
                print(f"MLEngine loading warning: {e}")

    def prepare_input(self, features_dict: Dict[str, Any]) -> pd.DataFrame:
        row = {}
        for col in self.feature_cols:
            val = features_dict.get(col, None)
            row[col] = [val if val is not None else np.nan]
        
        df = pd.DataFrame(row)
        if self.imputer is not None:
            df_imp = pd.DataFrame(self.imputer.transform(df), columns=self.feature_cols)
            return df_imp
        return df

    def predict(self, features_dict: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_loaded:
            self._load_artifacts()
            if not self.is_loaded:
                return self._fallback_prediction(features_dict)

        df_input = self.prepare_input(features_dict)
        probabilities = self.model.predict_proba(df_input)[0]
        risk_score = float(probabilities[1])
        risk_percentage = round(risk_score * 100, 1)

        # Risk tiering
        if risk_score >= 0.60:
            risk_level = "High Risk"
            urgency = "Immediate Outreach Required (Within 48h)"
        elif risk_score >= 0.35:
            risk_level = "Moderate Risk"
            urgency = "Proactive Monitoring & Academic Nudge"
        else:
            risk_level = "Low Risk"
            urgency = "On Track (Routine Tracking)"

        # Compute SHAP explanation for this individual student
        top_factors = self.explain_student(df_input, features_dict)

        # Compute Pillar Diagnostics (0 to 100 Index)
        pillars = self._compute_academic_pillars(features_dict)

        # Generate Actionable Mentor Intervention Plan
        interventions = self._prescribe_interventions(features_dict, risk_score, top_factors)

        return {
            "risk_score": round(risk_score, 4),
            "risk_percentage": risk_percentage,
            "risk_level": risk_level,
            "urgency": urgency,
            "predicted_class": int(risk_score >= 0.40),
            "pillars": pillars,
            "recommended_action": interventions["summary"],
            "prescribed_interventions": interventions["action_items"],
            "top_factors": top_factors
        }

    def _compute_academic_pillars(self, features: Dict[str, Any]) -> Dict[str, Any]:
        active_days = features.get("active_days") or 0
        attendance_score = min(round((active_days / 40.0) * 100), 100)

        clicks = features.get("total_clicks") or 0
        engagement_score = min(round((clicks / 600.0) * 100), 100)

        avg_score = features.get("avg_score")
        assessment_score = round(avg_score, 1) if avg_score is not None and not pd.isna(avg_score) else 50.0

        prev_attempts = features.get("num_of_prev_attempts") or 0
        edu = features.get("highest_education") or 2
        background_score = max(min(round(50 + (edu * 10) - (prev_attempts * 20)), 100), 10)

        return {
            "attendance": {
                "score": attendance_score,
                "label": "Platform Attendance",
                "status": "Healthy" if attendance_score >= 60 else ("Needs Attention" if attendance_score >= 35 else "Critical Deficit"),
                "detail": f"{active_days} active days out of 60"
            },
            "course_engagement": {
                "score": engagement_score,
                "label": "Course Engagement",
                "status": "Healthy" if engagement_score >= 60 else ("Moderate" if engagement_score >= 30 else "Severe Disengagement"),
                "detail": f"{clicks} total interactions logged"
            },
            "assessment_performance": {
                "score": assessment_score,
                "label": "Continuous Assessment",
                "status": "Strong" if assessment_score >= 70 else ("Satisfactory" if assessment_score >= 50 else "Academic Underperformance"),
                "detail": f"{assessment_score}% early assessment average"
            },
            "academic_background": {
                "score": background_score,
                "label": "Previous Academic Record",
                "status": "Adequate" if background_score >= 60 else "High-Risk Background",
                "detail": f"Edu Tier: {edu}, Prior Attempts: {prev_attempts}"
            }
        }

    def _prescribe_interventions(self, features: Dict[str, Any], risk_score: float, top_factors: List[Dict[str, Any]]) -> Dict[str, Any]:
        action_items = []
        missed = features.get("missed_assessments") or 0
        avg_score = features.get("avg_score")
        recent_share = features.get("recent_share") or 0.15
        clicks = features.get("total_clicks") or 0

        if missed > 0:
            action_items.append({
                "type": "Remedial Deadline",
                "priority": "High",
                "title": f"Grant Make-Up Window for {int(missed)} Missed Assessment(s)",
                "action": "Mentor to schedule a 7-day grace extension for missed coursework with TA guidance."
            })

        if avg_score is not None and avg_score < 50:
            action_items.append({
                "type": "Academic Tutoring",
                "priority": "High",
                "title": "Mandatory Peer Tutoring & Concept Review",
                "action": "Assign student to 2 hours/week supplemental instruction for core module topics."
            })

        if recent_share < 0.10 or clicks < 100:
            action_items.append({
                "type": "Advisor Outreach",
                "priority": "Medium",
                "title": "Schedule 1-on-1 Mentorship Counseling",
                "action": "Faculty mentor to initiate phone/email check-in to identify external or personal study blockers."
            })

        if not action_items:
            action_items.append({
                "type": "Routine Monitoring",
                "priority": "Low",
                "title": "Maintain Regular Learning Cadence",
                "action": "Student progressing normally. Send automated positive reinforcement and syllabus reminders."
            })

        if risk_score >= 0.60:
            summary = "Immediate dual intervention advised: combine assignment make-up support with weekly mentor counseling."
        elif risk_score >= 0.35:
            summary = "Targeted academic nudge advised: monitor upcoming assignment submission and provide study resources."
        else:
            summary = "Student is academically sound. Continue routine milestone tracking."

        return {
            "summary": summary,
            "action_items": action_items
        }

    def explain_student(self, df_input: pd.DataFrame, raw_features: Dict[str, Any]) -> List[Dict[str, Any]]:
        top_factors = []
        if self.explainer is None:
            return top_factors

        try:
            shap_values = self.explainer.shap_values(df_input)
            if isinstance(shap_values, list):
                shap_risk = shap_values[1][0]
            elif len(shap_values.shape) == 2:
                shap_risk = shap_values[0]
            else:
                shap_risk = shap_values

            paired = []
            for col, val, shap_val in zip(self.feature_cols, df_input.iloc[0], shap_risk):
                display_name = FEATURE_NAMES_DISPLAY.get(col, col.replace("_", " ").title())
                raw_val = raw_features.get(col, val)
                paired.append({
                    "feature": col,
                    "feature_name_display": display_name,
                    "student_value": round(float(raw_val), 2) if isinstance(raw_val, (int, float)) else str(raw_val),
                    "shap_value": round(float(shap_val), 4),
                    "direction": "increases_risk" if shap_val > 0 else "decreases_risk",
                    "abs_shap": abs(float(shap_val))
                })

            paired.sort(key=lambda x: x["abs_shap"], reverse=True)
            for item in paired[:6]:
                interp = self._generate_interpretation(item["feature"], item["student_value"], item["direction"])
                top_factors.append({
                    "feature": item["feature"],
                    "feature_name_display": item["feature_name_display"],
                    "student_value": item["student_value"],
                    "shap_value": item["shap_value"],
                    "direction": item["direction"],
                    "interpretation": interp
                })
        except Exception as e:
            print(f"SHAP explanation error: {e}")

        return top_factors

    def _generate_interpretation(self, feature: str, val: Any, direction: str) -> str:
        inc = direction == "increases_risk"
        if feature == "recent_share":
            return f"Recent 2-week click share is {val}. {'Drastic decline in portal usage' if inc else 'Consistent active engagement'}."
        elif feature == "missed_assessments":
            return f"{val} missed assessment(s) by Day 60. {'Critical continuous assessment penalty' if inc else 'All early assessments submitted on time'}."
        elif feature == "avg_score":
            return f"Average continuous assessment score is {val}%. {'Below cohort passing baseline' if inc else 'Demonstrating subject mastery'}."
        elif feature == "total_clicks":
            return f"{val} total clicks. {'Significantly lower platform engagement' if inc else 'Strong platform engagement'}."
        elif feature == "active_days":
            return f"{val} active days out of 60. {'High absenteeism on course portal' if inc else 'Consistent weekly attendance'}."
        elif feature == "clicks_vs_cohort":
            return f"Activity is {val}x class average. {'Substantially lagging behind peers' if inc else 'Outperforming cohort pace'}."
        elif feature == "score_vs_cohort":
            return f"Scores are {val} points relative to class average. {'Academic performance trailing peers' if inc else 'Above cohort performance'}."
        else:
            return f"{feature.replace('_', ' ').title()} value of {val} {'increases dropout risk' if inc else 'promotes course retention'}."

    def _fallback_prediction(self, features: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "risk_score": 0.5,
            "risk_percentage": 50.0,
            "risk_level": "Moderate Risk",
            "urgency": "Monitoring",
            "predicted_class": 0,
            "pillars": {},
            "recommended_action": "Assessment underway.",
            "prescribed_interventions": [],
            "top_factors": []
        }

engine = MLEngine()
