from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import ModelArtifact, JobRun, ScoringRun, User
from ..schemas.scoring import TriggerJobRequest
from ..services.jobs import JobQueueService
from ..ml.registry import ModelRegistry
from ..ml.evaluate import evaluate_retrospective_performance
from .dependencies import get_current_user, require_role

router = APIRouter(prefix="/monitoring", tags=["Model Monitoring & Operations"])

@router.get("/models")
def list_registered_models(checkpoint: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(ModelArtifact)
    if checkpoint:
        query = query.filter(ModelArtifact.checkpoint == checkpoint)
    models = query.order_by(ModelArtifact.created_at.desc()).all()
    
    return [
        {
            "version_id": m.version_id,
            "checkpoint": m.checkpoint,
            "algorithm_type": m.algorithm_type,
            "training_window_terms": m.training_window_terms,
            "is_active": m.is_active,
            "integrity_checksum": m.integrity_checksum,
            "metrics_summary": m.metrics_summary_json,
            "cluster_profiles": m.cluster_profiles_json,
            "created_at": m.created_at.isoformat()
        }
        for m in models
    ]

@router.post("/models/{version_id}/activate")
def activate_model_version(
    version_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    activated = ModelRegistry.activate_version(db, version_id)
    return {
        "message": f"Model version {version_id} activated successfully for Checkpoint {activated.checkpoint}."
    }

@router.post("/models/{checkpoint}/rollback")
def rollback_model_version(
    checkpoint: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    rolled_back = ModelRegistry.rollback_checkpoint(db, checkpoint)
    if not rolled_back:
        raise HTTPException(status_code=400, detail="No prior candidate model available for rollback.")
    return {
        "message": f"Rolled back to version {rolled_back.version_id} for Checkpoint {checkpoint}."
    }

@router.get("/jobs")
def list_jobs(limit: int = Query(20, ge=1, le=50), db: Session = Depends(get_db)):
    jobs = db.query(JobRun).order_by(JobRun.created_at.desc()).limit(limit).all()
    return [
        {
            "job_id": j.job_id,
            "job_type": j.job_type,
            "status": j.status,
            "progress_pct": j.progress_pct,
            "worker_id": j.worker_id,
            "result_summary": j.result_summary,
            "error_message": j.error_message,
            "created_at": j.created_at.isoformat(),
            "updated_at": j.updated_at.isoformat()
        }
        for j in jobs
    ]

@router.post("/jobs/trigger")
def trigger_job(
    req: TriggerJobRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    payload = {
        "term_code": req.term_code,
        "checkpoint": req.checkpoint,
        "model_version_id": req.model_version_id,
        "triggered_by": current_user.user_id
    }
    job = JobQueueService.enqueue_job(db, req.job_type, payload)
    return {"message": f"Job {job.job_id} enqueued successfully", "job_id": job.job_id}

@router.get("/evaluation-report")
def get_evaluation_report(checkpoint: str = Query("W4"), db: Session = Depends(get_db)):
    return evaluate_retrospective_performance(db, checkpoint)
