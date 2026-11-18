"""
Background Worker Process for Academic Risk Monitor.
Continuously claims pending jobs (train, score, evaluate), renews lease heartbeats,
and executes long-running tasks in an isolated process.
"""

import time
import os
import sys
import uuid
from datetime import datetime
from .config import settings
from .db import SessionLocal
from .services.jobs import JobQueueService
from .services.scoring import ScoringService
from .ml.train import train_checkpoint_model
from .ml.evaluate import evaluate_retrospective_performance

WORKER_ID = f"worker-{os.getpid()}-{uuid.uuid4().hex[:6]}"

def run_worker():
    print(f"Starting Background Job Worker [{WORKER_ID}]...")
    while True:
        db = SessionLocal()
        try:
            job = JobQueueService.claim_next_job(db, WORKER_ID)
            if not job:
                time.sleep(settings.WORKER_POLL_INTERVAL)
                continue

            print(f"Claimed job {job.job_id} (Type: {job.job_type}). Executing...")
            JobQueueService.heartbeat(db, job.job_id, WORKER_ID, progress=10.0)

            payload = job.payload_json or {}
            job_type = job.job_type.lower()

            if job_type == "train":
                checkpoint = payload.get("checkpoint", "W4")
                JobQueueService.heartbeat(db, job.job_id, WORKER_ID, progress=30.0)
                res = train_checkpoint_model(db, checkpoint=checkpoint)
                JobQueueService.heartbeat(db, job.job_id, WORKER_ID, progress=90.0)
                summary = f"Trained & registered model {res['version_id']} for {checkpoint}. Samples: {res['sample_count']}."
                JobQueueService.complete_job(db, job.job_id, WORKER_ID, summary)

            elif job_type == "score":
                term = payload.get("term_code", settings.DEMO_TERM_CODE)
                checkpoint = payload.get("checkpoint", "W4")
                JobQueueService.heartbeat(db, job.job_id, WORKER_ID, progress=30.0)
                scoring_run = ScoringService.run_scoring(db, term_code=term, checkpoint=checkpoint)
                JobQueueService.heartbeat(db, job.job_id, WORKER_ID, progress=90.0)
                summary = f"Scored {scoring_run.total_scored} enrollments for Term {term} {checkpoint} (High: {scoring_run.high_priority_count})."
                JobQueueService.complete_job(db, job.job_id, WORKER_ID, summary)

            elif job_type == "evaluate":
                checkpoint = payload.get("checkpoint", "W4")
                report = evaluate_retrospective_performance(db, checkpoint=checkpoint)
                metrics = report.get("retrospective_metrics", {})
                summary = f"Evaluated {checkpoint}: Precision {metrics.get('precision', 0)}, Recall {metrics.get('recall', 0)}."
                JobQueueService.complete_job(db, job.job_id, WORKER_ID, summary)

            else:
                JobQueueService.fail_job(db, job.job_id, WORKER_ID, f"Unknown job type: {job.job_type}")

            print(f"Job {job.job_id} completed successfully.")

        except Exception as e:
            print(f"Error executing job: {e}")
            if 'job' in locals() and job:
                JobQueueService.fail_job(db, job.job_id, WORKER_ID, str(e))
        finally:
            db.close()

if __name__ == "__main__":
    run_worker()
