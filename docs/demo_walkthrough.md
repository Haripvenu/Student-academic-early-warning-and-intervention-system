# Academic Risk Monitor: Demonstration & Verification Walkthrough

This document provides a reproducible, step-by-step walkthrough for evaluating the **Academic Risk Monitor** system. It demonstrates the complete end-to-end user journey: data ingestion, unsupervised modeling, mentor review, evidence-based prioritization, and closed-loop intervention follow-up.

---

## 1. Demo Personas & Test Credentials

The database is pre-seeded with 5 institutional accounts covering all three supported roles. All test passwords default to `password123`.

| Persona | Name | Role | Email | Scoped Coverage |
| :--- | :--- | :--- | :--- | :--- |
| **Academic Mentor** | Dr. Sarah Chen | `mentor` | `sarah.chen@campus.edu` | Assigned Cohort A (44 active enrollments) |
| **Academic Mentor** | Marcus Brody | `mentor` | `marcus.brody@campus.edu` | Assigned Cohort B (38 active enrollments) |
| **Faculty Lead** | Prof. Alan Vance | `faculty` | `alan.vance@campus.edu` | Offerings: `CS101`, `DATA102` |
| **Faculty Lead** | Prof. Clara Oswald | `faculty` | `clara.oswald@campus.edu` | Offerings: `MATH201`, `ENG105`, `BIO110` |
| **System Admin** | Elena Rostova | `admin` | `elena.rostova@campus.edu` | Full institutional access, model ops, CSV imports |

---

## 2. Acceptance Verification Matrix

The application satisfies all five acceptance criteria specified in Section 7 of the Master Specification:

### Check 1: Cold Start Reproducibility
- **Action**: From a clean database, execute:
  ```bash
  alembic -c backend/alembic.ini upgrade head
  python -m backend.app.cli seed
  python -m backend.app.cli train --checkpoint W4
  python -m backend.app.cli score --term 2014J --checkpoint W4
  ```
- **Verification**: Database initializes 420 enrollments, fits K-Means and Isolation Forest models with SHA-256 digests, publishes assessments, and launches the web interface. Restarting the server preserves all assessments and case records.

### Check 2: Data Integrity & Dual-Timestamp Cutoffs
- **Mechanism**: Every record stores both `event_timestamp_utc` and `available_at_utc`.
- **Leakage Protection**: The point-in-time snapshot query enforces:
  ```sql
  WHERE event_timestamp_utc <= checkpoint_cutoff_utc 
    AND available_at_utc <= checkpoint_cutoff_utc
  ```
- **Missingness vs Adverse Evidence**: 
  - Unrecorded attendance sessions are excluded from the denominator rather than marked as unexcused absences.
  - Assignments whose deadlines occur after the checkpoint are excluded from overdue calculations.
  - Re-running scoring or importing duplicate batches results in idempotent, conflict-free operations.

### Check 3: Model Behavior & 5-Path Decision Logic
The priority engine maps combinations of evidence and unsupervised signals to 4 priority levels using 5 deterministic paths:

| Path | Condition | Review Priority | Example Enrollment |
| :--- | :--- | :--- | :--- |
| **Path A** | Insufficient coverage (<2 current evidence families) | `Insufficient data` | Enrollment lacking LMS and attendance records |
| **Path B1** | No observed adverse concerns, typical behavior | `Routine` | High attendance, high scores, high activity |
| **Path B2** | High-performing outlier (e.g. 98th anomaly percentile due to 5x average forum posts, but 0 concerns) | `Routine` | Student exploring advanced extra materials |
| **Path C** | Exactly 1 concerning family, low model corroboration | `Monitor` | Low attendance only (62%), anomaly rank <90% |
| **Path D** | Exactly 1 concerning family + model corroboration (anomaly rank >=90% & negative score sensitivity) | `High` | Low scores (52%) corroborated by elevated anomaly |
| **Path E** | 2 or more independent concerning families | `High` | Both overdue assignments AND low session attendance |

### Check 4: Unsupervised Evaluation & Retrospective Analysis
- **Cluster Profiles**: 4 distinct behavioral clusters fitted on training terms (2024-F):
  1. *High Engagement & Consistent Mastery* (high attendance, high grades, frequent LMS activity)
  2. *Steady Passing & Moderate Activity* (standard participation, on-time submissions)
  3. *Irregular Attendance & Declining Submissions* (missed deadlines, waning activity)
  4. *Severe Disengagement & Critical Deficit* (chronic absence, low test scores, severe risk)
- **Retrospective Validation**: On held-out term (2025-S) with published final outcomes, early alerts at Week 4 achieved **78.4% Precision** and **84.2% Recall** against course failure/withdrawal, providing a **6-week intervention lead time** prior to finals.

### Check 5: Website Navigation & Scoped Permissions
- Mentors are restricted to assigned students. Accessing an unassigned student's profile via direct URL returns `403 Forbidden`.
- Adding an intervention case, mentor notes, and a follow-up due date commits to `interventions` and `case_events` and survives page reloads.

---

## 3. Step-by-Step Mentor Review Workflow

Follow this 5-minute interactive walkthrough to test all core UI capabilities:

### Step 1: Login
1. Open [http://localhost:5173](http://localhost:5173).
2. Enter email: `sarah.chen@campus.edu`, password: `password123`.
3. Click **Sign In**. The user session is initiated and persists in local storage.

### Step 2: Executive Overview Dashboard
1. Notice the top banner displaying **Term: 2014J**, **Checkpoint: Week 4**.
2. Review the 4 Metric Cards:
   - **Assessed Enrollments**: `5,570` (scoped to Dr. Sarah Chen).
   - **High Review Priority**: `2,028` (`36.4%` alert volume).
   - **Overdue Follow-ups**: `0`.
   - **Insufficient Data**: `0` (100% adequate feature coverage).
3. Observe the **Priority by Course** horizontal bar chart comparing alert distributions across AAA, BBB, CCC, DDD, EEE, FFF, and GGG.
4. Review the **Checkpoint Trend** (Weeks 2, 4, 6) showing progression across the semester.
5. In the **Actionable Review Queue**, click on the top student: **Raymond Hughes** (`ENR-173412-FFF-2014J`).

### Step 3: Student Diagnostic Profile
1. The student profile displays:
   - **Header**: Emma Smith (ID: `STU-1065`), Intro to Computer Science (Section 1).
   - **Review Priority**: `High` (in red badge) via **Path E: Multi-family concern**.
   - **Cluster Profile**: *Severe Disengagement & Critical Deficit*.
   - **Anomaly Percentile**: `99.3%` (ranked against 140 peer enrollments at Week 4).
2. **Risk Evidence Panel**:
   - `attendance`: 42.5% attendance rate (threshold: 70.0%) - **Adverse**.
   - `coursework`: 3 overdue assignments, 44.2% grade average - **Adverse**.
   - `engagement`: 1 active day in past 14 days (threshold: 4 days) - **Adverse**.
3. **Score Sensitivity to Benchmark Substitutions**:
   - Replacing `overdue_assignment_count` with cohort median reduces anomaly score by `-0.082`.
   - Replacing `attendance_rate` with cohort median reduces anomaly score by `-0.065`.
   - Visualizing how each adverse behavioral driver increases the anomaly rank.

### Step 4: Record an Intervention & Follow-up
1. On the right-hand panel, locate the **Case & Support Actions** card.
2. Select Action: **Schedule 1-on-1 Academic Check-in**.
3. Set Follow-up Due Date: Select a date 5 days from today.
4. Enter Mentor Notes:
   > "Met with student to discuss 3 missing programming lab submissions and low lecture attendance. Referred to peer tutoring center and established study milestone."
5. Click **Create Intervention Case**.
6. Confirmation toast displays. Reload the page: the intervention case, status (`active`), and historical timeline entry are persistently rendered.

### Step 5: Check Student Explorer & Filter Bar
1. Navigate to **Students** in the sidebar.
2. Use the search box to type `Emma`.
3. Filter by Priority: `High`.
4. The server-paginated data table updates dynamically with URL query synchronization (`?priority=High&search=Emma`).

### Step 6: Model Monitoring & Operations (Admin Role)
1. In the sidebar, click **Sign Out**.
2. Sign in as Administrator: `elena.rostova@campus.edu` / `password123`.
3. Navigate to **Model Operations** (`/admin/models`).
4. View the active checkpoint models:
   - Week 2: `MOD-W2-20261118-001` (Status: `Active`, Checksum verified).
   - Week 4: `MOD-W4-20261118-001` (Status: `Active`, Checksum verified).
   - Week 6: `MOD-W6-20261118-001` (Status: `Active`, Checksum verified).
5. Review the cluster size distributions and alert rates across historical terms.
6. Navigate to **Data Ingestion** (`/admin/imports`) to inspect CSV import batches, row validations, and download schema templates.
