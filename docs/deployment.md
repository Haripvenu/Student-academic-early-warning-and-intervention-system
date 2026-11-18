# Academic Risk Monitor: Deployment & Operations Guide

This guide documents the procedures for deploying, configuring, migrating, backing up, and operating the **Academic Risk Monitor** system in development, demonstration, and enterprise production environments.

---

## 1. System Requirements & Architecture

The Academic Risk Monitor comprises four runtime components:
1. **Frontend Web Server**: Single Page Application built with React 19, TypeScript, and Vite, served statically via Nginx or Vite dev server.
2. **FastAPI Application Server**: Asynchronous REST backend hosting the `/api/v1` specification, session authentication, and transactional queries.
3. **Background Worker**: Python service running transactional job claiming (`job_queue` table) with lease renewal and heartbeat to execute asynchronous model fitting and batch scoring.
4. **Relational Database**: PostgreSQL (Production) or SQLite (Development/Demo).

```
                           ┌─────────────────────────┐
                           │   Client / Browser      │
                           └────────────┬────────────┘
                                        │ HTTPS :443
                                        ▼
                           ┌─────────────────────────┐
                           │      Nginx Gateway      │
                           │  (Static SPA + Proxy)   │
                           └─────┬─────────────┬─────┘
                                 │             │
                Static Files     │             │ /api/v1/*
                                 ▼             ▼
                      ┌──────────────┐   ┌───────────────────────────┐
                      │ Frontend SPA │   │ FastAPI API Server (:8000)│
                      └──────────────┘   └─────────────┬─────────────┘
                                                       │
                      ┌────────────────────────────────┴──────────────────┐
                      ▼                                                   ▼
         ┌─────────────────────────┐                         ┌──────────────────────────┐
         │ PostgreSQL Database     │◄────────────────────────┤ Background Worker        │
         │ (Transactions & State)  │    Job Claims & Leases  │ (Training & Scoring Jobs)│
         └─────────────────────────┘                         └─────────────┬────────────┘
                                                                           │
                                                                           ▼
                                                             ┌──────────────────────────┐
                                                             │ Persistent Artifacts     │
                                                             │ (Model Registry + SHA256)│
                                                             └──────────────────────────┘
```

---

## 2. Environment Configuration

Configuration is managed via environment variables and typed using Pydantic Settings (`backend/app/config.py`). Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Essential Environment Variables

| Variable | Description | Demo Default | Production Recommendation |
| :--- | :--- | :--- | :--- |
| `APP_ENV` | Environment identifier | `development` | `production` |
| `SECRET_KEY` | Cryptographic secret for tokens | `demo-insecure-secret-key-change-in-prod` | 256-bit high-entropy secret |
| `DATABASE_URL` | SQLAlchemy connection URI | `sqlite:///./academic_risk.db` | `postgresql+psycopg2://user:pwd@db:5432/risk_db` |
| `MODEL_ARTIFACT_DIR` | Directory for trained models | `./backend/artifacts` | Mounted persistent volume (e.g., `/var/data/artifacts`) |
| `SESSION_EXPIRE_HOURS` | Session lifetime | `24` | `8` (with sliding idle timeout) |
| `ALLOWED_ORIGINS` | CORS allowed origins | `["http://localhost:5173", "http://127.0.0.1:8000"]` | Institutional domain only |
| `DATA_DIR` | Base directory for CSV imports | `./data` | Secure storage accessible to API & worker |

---

## 3. Local Zero-Dependency Quickstart

For local evaluation, demonstrations, or developer workflows:

### Step 1: Install Dependencies
```bash
# Backend dependencies
pip install -r requirements.txt

# Frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Initialize Database and Migrations
```bash
alembic -c backend/alembic.ini upgrade head
```

### Step 3: Seed Synthetic Demo Data
```bash
python -m backend.app.cli seed
```
*Generates 420 enrollments across 3 academic terms (2024-F, 2025-S, 2025-F) with realistic student archetypes and historical timestamp isolation.*

### Step 4: Fit Unsupervised Checkpoint Models
```bash
python -m backend.app.cli train --checkpoint W2
python -m backend.app.cli train --checkpoint W4
python -m backend.app.cli train --checkpoint W6
```

### Step 5: Score Active Demo Term
```bash
python -m backend.app.cli score --term 2014J --checkpoint W2
python -m backend.app.cli score --term 2014J --checkpoint W4
python -m backend.app.cli score --term 2014J --checkpoint W6
```

### Step 6: Start Services
Use the root batch script or separate terminals:
```bash
# Terminal 1: Backend
python server.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## 4. Multi-Container Docker Compose Deployment

For containerized deployment, `compose.yaml` declares all four services with network isolation and persistent volumes:

```bash
# 1. Build and start containers
docker compose up -d --build

# 2. Run database migrations
docker compose exec api alembic -c backend/alembic.ini upgrade head

# 3. Seed demo data (optional for demo instances)
docker compose exec api python -m backend.app.cli seed

# 4. Train and score initial checkpoints
docker compose exec api python -m backend.app.cli train --checkpoint W4
docker compose exec api python -m backend.app.cli score --term 2014J --checkpoint W4

# 5. Access application
# Frontend SPA & API Proxy: http://localhost:80
# Direct API Healthcheck: http://localhost:8000/health
```

---

## 5. Background Worker Operations

The background worker (`backend/app/worker.py`) polls the `job_queue` table with atomic transactional claiming.

### Claim & Heartbeat Mechanics
1. **Atomic Claim**: The worker issues `SELECT ... WHERE status = 'pending' LIMIT 1 FOR UPDATE SKIP LOCKED` (or transactional lock in SQLite) and sets `status = 'running'`, `worker_id = <hostname>`, and `lease_expires_at = now + 5 minutes`.
2. **Heartbeat**: Every 60 seconds while processing, the worker extends `lease_expires_at`.
3. **Stale Recovery**: If a worker process terminates unexpectedly, uncompleted jobs whose lease expired are automatically reset to `failed` or re-queued by the watchdog.
4. **Publish Atomic**: Results are staged in temporary tables/runs; once fully validated, the snapshot is committed atomically, ensuring old published assessments remain active if a job fails midway.

To start a dedicated worker instance:
```bash
python -m backend.app.worker
```

---

## 6. Model Artifact Lifecycle & Rollback

### Storage and Integrity Verification
- Model artifacts (fitted K-Means centroids, Isolation Forest trees, scalers, imputers, and reference distributions) are saved to `MODEL_ARTIFACT_DIR`.
- Each artifact file is hashed using **SHA-256** upon generation. The digest is stored in `model_artifacts.checksum_sha256`.
- At load time, `registry.py` recalculates the checksum. If the digest mismatches, the load is rejected immediately with an integrity violation error.

### Administrative Activation & Rollback
Models must be explicitly activated by an administrator.

```bash
# List trained model versions
python -m backend.app.cli list-models

# Roll back to a previous model version
python -m backend.app.cli activate-model --model-id MOD-W4-20261118-001
```

Via REST API:
`POST /api/v1/monitoring/models/{model_id}/activate` (Requires `admin` role).

---

## 7. Database Backup & Disaster Recovery

### PostgreSQL Production Backup
```bash
# Automated logical backup
pg_dump -h db -U risk_user -d risk_db -F c -b -v -f /backups/risk_db_$(date +%Y%m%d_%H%M%S).dump

# Logical restore
pg_restore -h db -U risk_user -d risk_db -v -c /backups/risk_db_20261118_120000.dump
```

### SQLite Demo Backup
```bash
# Safe hot backup using SQLite CLI
sqlite3 academic_risk.db ".backup 'backups/academic_risk_backup.db'"
```

---

## 8. Monitoring & Health Checks

- **Health Endpoint**: `GET /health`
  - Returns HTTP 200 with JSON payload:
    ```json
    {
      "status": "healthy",
      "app_env": "production",
      "database_connected": true,
      "active_models_count": 3,
      "total_published_assessments": 420
    }
    ```
- **Audit Logs**: Case creations, mentor notes, status changes, and follow-ups are immutably logged to `case_events` with actor ID, timestamp, and previous/new state.
- **Log Sanitation**: Sensitive student names, passwords, access tokens, and confidential counseling notes are excluded from standard application stdout logging.
