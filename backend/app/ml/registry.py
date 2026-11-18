"""
Model Registry Service.
Handles artifact loading, SHA-256 integrity checks, version activation, and rollback.
"""

import os
import hashlib
import joblib
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models import ModelArtifact

class ModelRegistry:
    @staticmethod
    def load_active_model(db: Session, checkpoint: str = "W4") -> Dict[str, Any]:
        artifact_record = db.query(ModelArtifact).filter(
            ModelArtifact.checkpoint == checkpoint,
            ModelArtifact.is_active == True
        ).first()

        if not artifact_record:
            raise FileNotFoundError(f"No active model artifact found for Checkpoint {checkpoint}.")

        # Verify integrity checksum
        path = artifact_record.artifact_path
        if not os.path.exists(path):
            raise FileNotFoundError(f"Artifact file missing at {path}")

        hasher = hashlib.sha256()
        with open(path, "rb") as f:
            while chunk := f.read(8192):
                hasher.update(chunk)
        calc_checksum = hasher.hexdigest()

        if calc_checksum != artifact_record.integrity_checksum:
            raise ValueError(f"Integrity check failed for model {artifact_record.version_id}. Checksum mismatch!")

        bundle = joblib.load(path)
        bundle["version_id"] = artifact_record.version_id
        bundle["model_record"] = artifact_record
        return bundle

    @staticmethod
    def activate_version(db: Session, version_id: str) -> ModelArtifact:
        target = db.query(ModelArtifact).filter(ModelArtifact.version_id == version_id).first()
        if not target:
            raise ValueError(f"Model version {version_id} not found.")

        # Deactivate current active models for that checkpoint
        db.query(ModelArtifact).filter(
            ModelArtifact.checkpoint == target.checkpoint
        ).update({"is_active": False})

        target.is_active = True
        db.commit()
        return target

    @staticmethod
    def rollback_checkpoint(db: Session, checkpoint: str) -> Optional[ModelArtifact]:
        # Find latest inactive version
        previous = db.query(ModelArtifact).filter(
            ModelArtifact.checkpoint == checkpoint,
            ModelArtifact.is_active == False
        ).order_by(ModelArtifact.created_at.desc()).first()

        if not previous:
            return None

        db.query(ModelArtifact).filter(
            ModelArtifact.checkpoint == checkpoint
        ).update({"is_active": False})

        previous.is_active = True
        db.commit()
        return previous
