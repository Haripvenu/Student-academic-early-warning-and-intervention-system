"""
Model Training and Registration Routine.
Fits Preprocessing, KMeans, and Isolation Forest on earlier terms (e.g. 2024-F),
computes SHA-256 artifact checksum, and registers candidate versions in Model Registry.
"""

import os
import hashlib
import joblib
import pandas as pd
from datetime import datetime
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from ..config import settings
from ..models import ModelArtifact, Enrollment, Term
from .build_features import build_enrollment_snapshot
from .preprocess import PreprocessingPipeline
from .cluster import ClusterEngine
from .anomaly import AnomalyEngine

def train_checkpoint_model(db: Session, checkpoint: str = "W4", training_terms: list = None) -> Dict[str, Any]:
    if training_terms is None:
        training_terms = ["2013J", "2013B", "2014B"]

    print(f"Training unsupervised models for Checkpoint {checkpoint} on terms: {training_terms}...")
    
    # 1. Fetch training enrollments
    enrollments = db.query(Enrollment).join(Enrollment.offering).filter(
        Enrollment.offering.has(term_code=training_terms[0])
    ).all()

    if not enrollments:
        # Fallback to all available if specific term not populated
        enrollments = db.query(Enrollment).all()

    if not enrollments:
        raise ValueError("No enrollments found to train models.")

    # 2. Build feature matrix
    records = []
    for enr in enrollments:
        snap = build_enrollment_snapshot(db, enr.enrollment_id, checkpoint)
        row = snap["features"].copy()
        row["enrollment_id"] = enr.enrollment_id
        records.append(row)

    df_train = pd.DataFrame(records)

    # 3. Fit Preprocessing
    preprocessor = PreprocessingPipeline()
    X_scaled = preprocessor.fit_transform(df_train)

    # 4. Fit K-Means
    clusterer = ClusterEngine(n_clusters=4)
    clusterer.fit(X_scaled, df_train)

    # 5. Fit Isolation Forest
    anomaly = AnomalyEngine(contamination=0.15)
    anomaly.fit(X_scaled)

    # 6. Package artifact
    artifact_bundle = {
        "checkpoint": checkpoint,
        "preprocessor": preprocessor,
        "clusterer": clusterer,
        "anomaly_engine": anomaly,
        "created_at": datetime.utcnow().isoformat(),
        "training_terms": training_terms,
        "sample_count": len(df_train)
    }

    os.makedirs(settings.ARTIFACTS_DIR, exist_ok=True)
    version_id = f"ARM-{checkpoint}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    artifact_filename = f"model_{version_id}.joblib"
    artifact_path = os.path.join(settings.ARTIFACTS_DIR, artifact_filename)

    joblib.dump(artifact_bundle, artifact_path)

    # 7. Compute SHA-256 checksum
    hasher = hashlib.sha256()
    with open(artifact_path, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    checksum = hasher.hexdigest()

    metrics_summary = {
        "sample_count": len(df_train),
        "n_clusters": 4,
        "features_used": preprocessor.feature_cols,
        "contamination": 0.15,
        "reference_score_range": [float(anomaly.reference_scores[0]), float(anomaly.reference_scores[-1])]
    }

    # 8. Deactivate older models for this checkpoint and record candidate
    db.query(ModelArtifact).filter(ModelArtifact.checkpoint == checkpoint).update({"is_active": False})

    artifact_record = ModelArtifact(
        version_id=version_id,
        checkpoint=checkpoint,
        algorithm_type="KMeans+IsolationForest",
        artifact_path=artifact_path,
        integrity_checksum=checksum,
        training_window_terms=",".join(training_terms),
        is_active=True,
        metrics_summary_json=metrics_summary,
        cluster_profiles_json=clusterer.cluster_profiles
    )
    db.add(artifact_record)
    db.commit()

    print(f"Model {version_id} successfully registered and activated!")
    return {
        "version_id": version_id,
        "checksum": checksum,
        "artifact_path": artifact_path,
        "sample_count": len(df_train),
        "cluster_profiles": clusterer.cluster_profiles
    }
