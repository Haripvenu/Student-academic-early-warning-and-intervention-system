# Academic Risk Monitor — Data Contracts & Boundaries

This directory defines the institutional input schemas, data contracts, and synthetic fixtures for Academic Risk Monitor.

## 1. Input Tables & Schema

All files use standard CSV format, UTF-8 encoding, and ISO-8601 UTC timestamps (`YYYY-MM-DDTHH:MM:SSZ`).

| File | Primary Key | Description |
|---|---|---|
| `terms.csv` | `term_code` | Academic terms with start and end dates |
| `students.csv` | `student_id` | Student core roster (demographics excluded from ML) |
| `course_offerings.csv` | `offering_id` | Term-specific course sections and schedules |
| `enrollments.csv` | `enrollment_id` | Student-course enrollments (unit of analysis) |
| `attendance.csv` | `attendance_id` | Session presence, absences, and recording timestamps |
| `assessments.csv` | `assessment_id` | Continuous assessment metadata, weights, and deadlines |
| `submissions.csv` | `submission_id` | Assignment grades, submission times, and release status |
| `engagement_events.csv` | `event_id` | LMS interactions (clicks, resource views, active days) |
| `prior_academic_records.csv` | `record_id` | High-school GPA, prior credits, entry qualifications |
| `final_outcomes.csv` | `outcome_id` | Retrospective course outcomes (Pass/Fail/Withdrawn) |

## 2. Point-in-Time Data Boundaries

To prevent look-ahead bias and data leakage:
1. **Event Cutoff**: Only records where `event_timestamp <= checkpoint_cutoff_utc` are eligible.
2. **Intake / Availability Cutoff**: Only records where `available_at_utc <= checkpoint_cutoff_utc` are included.
3. **Outcome Isolation**: Final outcomes (`final_outcomes.csv`) are strictly segregated from feature engineering and training pipelines; they are consumed solely by retrospective audit routines.
