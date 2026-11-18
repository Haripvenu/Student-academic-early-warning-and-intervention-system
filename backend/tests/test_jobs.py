import pytest
from datetime import datetime, timedelta, timezone
from .fixtures import db_session
from backend.app.services.jobs import JobQueueService
from backend.app.models import JobRun

def test_job_enqueue_and_claim(db_session):
    job = JobQueueService.enqueue_job(db_session, "score", {"term": "2025-F"})
    assert job.status == "pending"

    claimed = JobQueueService.claim_next_job(db_session, "worker-1")
    assert claimed is not None
    assert claimed.job_id == job.job_id
    assert claimed.status == "claimed"
    assert claimed.worker_id == "worker-1"

def test_job_heartbeat_and_completion(db_session):
    job = JobQueueService.enqueue_job(db_session, "train")
    claimed = JobQueueService.claim_next_job(db_session, "worker-1")

    # Heartbeat
    ok = JobQueueService.heartbeat(db_session, claimed.job_id, "worker-1", 50.0)
    assert ok is True

    # Complete
    done = JobQueueService.complete_job(db_session, claimed.job_id, "worker-1", "Done successfully")
    assert done is True

    db_session.refresh(claimed)
    assert claimed.status == "completed"
    assert claimed.progress_pct == 100.0

def test_abandoned_job_recovery(db_session):
    job = JobQueueService.enqueue_job(db_session, "train")
    claimed = JobQueueService.claim_next_job(db_session, "worker-dead")
    
    # Artificially expire lease in the past
    claimed.lease_expires_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=10)
    db_session.commit()

    # Next claim should recover abandoned job
    recovered = JobQueueService.claim_next_job(db_session, "worker-alive")
    assert recovered is not None
    assert recovered.job_id == job.job_id
    assert recovered.worker_id == "worker-alive"
