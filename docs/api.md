# Academic Risk Monitor — REST API Documentation

All endpoints are versioned under `/api/v1` and return structured JSON with standard HTTP status codes.

---

## 1. Authentication & Session Lifecycle (`/api/v1/auth`)

* `POST /api/v1/auth/login`: Authenticate with email and password, returning session token.
* `POST /api/v1/auth/demo-switch/{role}`: 1-click role switcher for review committees (`mentor`, `faculty`, `admin`).
* `GET /api/v1/auth/me`: Retrieve current user profile and scoped permissions.
* `POST /api/v1/auth/logout`: Revoke active session token.

---

## 2. Dashboard Analytics (`/api/v1/dashboard`)

* `GET /api/v1/dashboard/filters`: Available academic terms, checkpoints (`W2`, `W4`, `W6`), and course offerings.
* `GET /api/v1/dashboard/summary?term_code=2014J&checkpoint=W4`:
  * Returns: 4 core KPI cards, priority by course distribution, checkpoint trend, and actionable review queue.

---

## 3. Student Caseload Explorer (`/api/v1/enrollments`)

* `GET /api/v1/enrollments`: Server-paginated student enrollment roster with search, course filter, and priority pills.
* `GET /api/v1/enrollments/{enrollment_id}?checkpoint=W4`:
  * Returns: Complete diagnostic profile, 3-family evidence breakdown, discovered cluster profile, anomaly percentile rank, score sensitivity waterfall to benchmark substitution, and checkpoint trajectory history.

---

## 4. Discovered Patterns (`/api/v1/patterns`)

* `GET /api/v1/patterns/clusters?checkpoint=W4`: Cluster summaries, original-unit feature means, sample sizes, and descriptive labels.
* `GET /api/v1/patterns/clusters/{cluster_id}/students`: Drill-down of active students assigned to a specific cluster profile.

---

## 5. Intervention Casework (`/api/v1/interventions`)

* `GET /api/v1/interventions?status=open`: Casework queue with overdue calculation.
* `GET /api/v1/interventions/{case_id}`: Detailed case file with immutable audit timeline.
* `POST /api/v1/interventions`: Open an intervention case with mentor confirmation, support action, and follow-up deadline.
* `PATCH /api/v1/interventions/{case_id}`: Update case status, assign mentor, or append progress notes.

---

## 6. Data Ingest & ML Ops (`/api/v1/imports`, `/api/v1/monitoring`)

* `POST /api/v1/imports/upload`: Multi-part CSV file upload with row-level validation.
* `GET /api/v1/monitoring/models`: Registered candidate and active models with SHA-256 checksums.
* `POST /api/v1/monitoring/models/{version_id}/activate`: Activate candidate model version.
* `POST /api/v1/monitoring/models/{checkpoint}/rollback`: Rollback to previous tested version.
* `POST /api/v1/monitoring/jobs/trigger`: Enqueue training or scoring jobs.
* `GET /api/v1/monitoring/evaluation-report`: Retrospective validation report against ground-truth student course outcomes.
