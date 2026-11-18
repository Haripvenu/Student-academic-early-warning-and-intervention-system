"""
Isolation Forest Anomaly Engine with Historical Reference Percentile Mapping.
Score is oriented so higher values represent greater unusualness.
"""

import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.ensemble import IsolationForest

class AnomalyEngine:
    def __init__(self, contamination: float = 0.15, random_state: int = 42):
        self.contamination = contamination
        self.random_state = random_state
        self.model = IsolationForest(
            contamination=contamination,
            random_state=random_state,
            n_estimators=100
        )
        self.reference_scores: np.ndarray = np.array([])
        self.is_fitted = False

    def fit(self, X_scaled: np.ndarray):
        self.model.fit(X_scaled)
        # raw decision_function: lower means more anomalous.
        # We invert it: anomaly_score = -decision_function, so higher = more unusual
        raw_scores = self.model.decision_function(X_scaled)
        self.reference_scores = np.sort(-raw_scores)
        self.is_fitted = True
        return self

    def score(self, X_scaled: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("AnomalyEngine is not fitted yet.")
        raw_scores = self.model.decision_function(X_scaled)
        return -raw_scores

    def score_to_percentile(self, oriented_score: float) -> float:
        """
        Maps an oriented anomaly score to a historical percentile (0.0 to 100.0).
        """
        if len(self.reference_scores) == 0:
            return 50.0
        # Calculate rank within reference_scores
        rank = np.searchsorted(self.reference_scores, oriented_score)
        pct = (rank / len(self.reference_scores)) * 100.0
        return round(float(np.clip(pct, 0.0, 100.0)), 1)
