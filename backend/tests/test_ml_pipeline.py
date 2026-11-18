import pytest
import numpy as np
import pandas as pd
from backend.app.ml.preprocess import PreprocessingPipeline
from backend.app.ml.cluster import ClusterEngine
from backend.app.ml.anomaly import AnomalyEngine
from backend.app.ml.explain import SensitivityExplainer

def test_ml_pipeline_fit_predict_and_explain():
    # Synthetic feature sample
    data = []
    for i in range(50):
        data.append({
            "attendance_rate": np.random.uniform(40, 100),
            "assessment_avg_score": np.random.uniform(40, 100),
            "overdue_submissions_count": np.random.choice([0, 1, 2]),
            "active_study_days": np.random.randint(1, 15),
            "total_clicks": np.random.randint(10, 400),
            "recent_activity_ratio": np.random.uniform(0.1, 0.6),
            "high_school_gpa": np.random.uniform(2.0, 4.0)
        })
    df = pd.DataFrame(data)

    # 1. Preprocessing
    preprocessor = PreprocessingPipeline()
    X_scaled = preprocessor.fit_transform(df)
    assert X_scaled.shape == (50, 7)
    assert len(preprocessor.feature_medians) == 7

    # 2. KMeans
    clusterer = ClusterEngine(n_clusters=4)
    clusterer.fit(X_scaled, df)
    labels = clusterer.predict(X_scaled)
    assert len(labels) == 50
    assert len(clusterer.cluster_profiles) == 4

    # 3. Isolation Forest
    anomaly = AnomalyEngine(contamination=0.15)
    anomaly.fit(X_scaled)
    scores = anomaly.score(X_scaled)
    assert len(scores) == 50
    # Percentile mapping
    sample_pct = anomaly.score_to_percentile(float(scores[0]))
    assert 0.0 <= sample_pct <= 100.0

    # 4. Explainability Sensitivity
    explainer = SensitivityExplainer(preprocessor, anomaly)
    sensitivities = explainer.explain_enrollment(data[0])
    assert len(sensitivities) == 7
    assert "score_delta" in sensitivities[0]
    assert "impact_direction" in sensitivities[0]
