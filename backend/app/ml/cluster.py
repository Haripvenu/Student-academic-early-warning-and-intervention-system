"""
Unsupervised K-Means Clustering and Profile Discovery.
Fits K-means on scaled features and generates original-unit descriptive profiles.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from sklearn.cluster import KMeans
from .feature_spec import ML_FEATURE_COLUMNS

CLUSTER_DESCRIPTIONS = [
    {
        "id": 0,
        "name": "High Engagement & Consistent Mastery",
        "badge_color": "emerald",
        "description": "High attendance (>85%), excellent assessment scores (>85%), and active LMS study frequency."
    },
    {
        "id": 1,
        "name": "Steady Passing & Moderate Activity",
        "badge_color": "blue",
        "description": "Average attendance and assignment scores (70-80%), with regular but moderate login frequency."
    },
    {
        "id": 2,
        "name": "Irregular Attendance & Declining Submissions",
        "badge_color": "amber",
        "description": "Noticeable drop in session attendance or missed deadlines, with borderline continuous assessment scores."
    },
    {
        "id": 3,
        "name": "Severe Disengagement & Critical Deficit",
        "badge_color": "rose",
        "description": "Multiple missed assessments, attendance <50%, low total clicks, and substantial academic risk."
    }
]

class ClusterEngine:
    def __init__(self, n_clusters: int = 4, random_state: int = 42):
        self.n_clusters = n_clusters
        self.random_state = random_state
        self.model = KMeans(n_clusters=n_clusters, random_state=random_state, n_init=10)
        self.cluster_profiles: List[Dict[str, Any]] = []
        self.is_fitted = False

    def fit(self, X_scaled: np.ndarray, original_df: pd.DataFrame):
        self.model.fit(X_scaled)
        self.is_fitted = True
        labels = self.model.labels_

        # Calculate original-unit cluster profiles
        df_clustered = original_df[ML_FEATURE_COLUMNS].copy()
        df_clustered["cluster"] = labels

        profiles = []
        for c_id in range(self.n_clusters):
            c_data = df_clustered[df_clustered["cluster"] == c_id]
            desc = CLUSTER_DESCRIPTIONS[c_id % len(CLUSTER_DESCRIPTIONS)]
            
            means = c_data.mean().to_dict()
            profile = {
                "cluster_id": c_id,
                "label": desc["name"],
                "badge_color": desc["badge_color"],
                "description": desc["description"],
                "sample_count": int(len(c_data)),
                "sample_pct": round(len(c_data) / len(df_clustered) * 100, 1) if len(df_clustered) > 0 else 0,
                "original_means": {k: round(float(v), 2) for k, v in means.items() if k != "cluster"}
            }
            profiles.append(profile)

        # Sort profiles by assessment average descending so cluster 0 is always highest performing
        profiles.sort(key=lambda p: p["original_means"].get("assessment_avg_score", 0), reverse=True)
        # Re-index for consistent order
        for idx, p in enumerate(profiles):
            p["cluster_id"] = idx
            
        self.cluster_profiles = profiles
        return self

    def predict(self, X_scaled: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("ClusterEngine is not fitted yet.")
        return self.model.predict(X_scaled)

    def get_profile_by_id(self, cluster_id: int) -> Dict[str, Any]:
        for p in self.cluster_profiles:
            if p["cluster_id"] == cluster_id:
                return p
        return self.cluster_profiles[0] if self.cluster_profiles else {}
