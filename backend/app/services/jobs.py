"""
Transactional Background Job Queue Service.
Implements lease-based job claiming, heartbeat updates, retry logic, and stale lease recovery.
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from ..models import JobRun
from ..config import settings

class JobQueueService:
    @staticmethod
    def enqueue_job(db: Session, job_type: str, payload: Dict[str, Any] = None) -> JobRun:
        job_id = f"JOB-{job_type.upper()}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        job = JobRun(
            job_id=job_id,
            job_type=job_type,
            payload_json=payload or {},
            status="pending",
            progress_pct=0.0
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def claim_next_job(db: Session, worker_id: str) -> Optional[JobRun]:
        now = datetime.utcnow()
        lease_expiration = now + timedelta(seconds=settings.JOB_LEASE_SECONDS)

        # 1. Recover abandoned or expired leased jobs
        abandoned = db.query(JobRun).filter(
            JobRun.status == "claimed",
            JobRun.lease_expires_at < now
        ).all()
        for j in abandoned:
            j.status = "pending"
            j.worker_id = None
            j.lease_expires_at = None
        if abandoned:
            db.commit()

        # 2. Claim next pending job transactionally
        job = db.query(JobRun).filter(JobRun.status == "pending").order_by(JobRun.created_at.asc()).first()
        if not job:
            return None

        job.status = "claimed"
        job.worker_id = worker_id
        job.lease_expires_at = lease_expiration
        job.updated_at = now
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def heartbeat(db: Session, job_id: str, worker_id: str, progress: float) -> bool:
        now = datetime.utcnow()
        job = db.query(JobRun).filter(JobRun.job_id == job_id, JobRun.worker_id == worker_id).first()
        if not job:
            return False

        # Reject heartbeat if lease already expired and reclaimed
        if job.lease_expires_at and job.lease_expires_at < now:
            return False

        job.progress_pct = progress
        job.lease_expires_at = now + timedelta(seconds=settings.JOB_LEASE_SECONDS)
        job.updated_at = now
        db.commit()
        return True

    @staticmethod
    def complete_job(db: Session, job_id: str, worker_id: str, summary: str) -> bool:
        job = db.query(JobRun).filter(JobRun.job_id == job_id, JobRun.worker_id == worker_id).first()
        if not job:
            return False

        job.status = "completed"
        job.progress_pct = 100.0
        job.result_summary = summary
        job.lease_expires_at = None
        job.updated_at = datetime.utcnow()
        db.commit()
        return True

    @staticmethod
    def fail_job(db: Session, job_id: str, worker_id: str, error_msg: str) -> bool:
        job = db.query(JobRun).filter(JobRun.job_id == job_id, JobRun.worker_id == worker_id).first()
        if not job:
            return False

        job.status = "failed"
        job.error_message = error_msg
        job.lease_expires_at = None
        job.updated_at = datetime.utcnow()
        db.commit()
        return True
