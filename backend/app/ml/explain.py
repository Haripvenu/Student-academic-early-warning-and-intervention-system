"""
Local Score Sensitivity to Benchmark Substitution (Explainability).
Substitutes one observed feature at a time with reference median,
rescores through fitted pipeline, and computes the signed sensitivity delta.
"""

from typing import Dict, Any, List
import pandas as pd
from .feature_spec import ML_FEATURE_COLUMNS, FEATURE_DEFINITIONS

class SensitivityExplainer:
    def __init__(self, preprocessor, anomaly_engine):
        self.preprocessor = preprocessor
        self.anomaly_engine = anomaly_engine

    def explain_enrollment(self, features: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Calculates local score sensitivity for each valid ML feature by substituting
        its value with the reference median.
        """
        base_df = pd.DataFrame([features]).astype(float)
        base_scaled = self.preprocessor.transform(base_df)
        base_score = float(self.anomaly_engine.score(base_scaled)[0])

        sensitivities = []
        medians = self.preprocessor.feature_medians

        for col in ML_FEATURE_COLUMNS:
            obs_val = float(features.get(col, medians.get(col, 0.0)))
            bench_val = float(medians.get(col, 0.0))
            def_meta = FEATURE_DEFINITIONS.get(col, {})
            unit = def_meta.get("unit", "")
            direction = def_meta.get("direction_of_concern", "lower")

            # Create substituted feature vector
            sub_df = base_df.copy()
            sub_df.at[0, col] = bench_val
            sub_scaled = self.preprocessor.transform(sub_df)
            sub_score = float(self.anomaly_engine.score(sub_scaled)[0])

            # delta = sub_score - base_score
            # If sub_score < base_score (delta < 0), replacing this feature with the normal median
            # reduced the anomaly score -> the observed value was driving the unusualness!
            delta = round(sub_score - base_score, 4)

            # Determine impact direction
            is_worse_than_benchmark = (obs_val < bench_val) if direction == "lower" else (obs_val > bench_val)
            
            if delta < -0.02 and is_worse_than_benchmark:
                impact = "supports_adverse_signal"
                interp = f"Replacing {def_meta.get('display_name', col)} with cohort median ({bench_val}{unit}) reduces anomaly score by {abs(delta):.3f}, confirming adverse signal."
            elif delta < -0.02 and not is_worse_than_benchmark:
                impact = "protective_factor"
                interp = f"Replacing with cohort median increases anomaly score relative to peers; observed value ({obs_val}{unit}) is an exceptionally strong protective factor."
            else:
                impact = "neutral"
                interp = f"Observed {def_meta.get('display_name', col)} ({obs_val}{unit}) is close to cohort benchmark ({bench_val}{unit})."

            sensitivities.append({
                "feature_name": col,
                "feature_name_display": def_meta.get("display_name", col),
                "observed_value": round(obs_val, 2),
                "benchmark_value": round(bench_val, 2),
                "unit": unit,
                "denominator": def_meta.get("denominator", ""),
                "score_delta": delta,
                "impact_direction": impact,
                "interpretation": interp
            })

        # Sort by most influential adverse sensitivities first
        sensitivities.sort(key=lambda s: s["score_delta"])
        return sensitivities
