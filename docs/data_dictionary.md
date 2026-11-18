# Academic Risk Monitor — Data Dictionary & Feature Contracts

This document specifies the feature definitions, units, direction of concern, denominators, and missingness semantics for early checkpoints (Weeks 2, 4, 6).

---

## 1. Feature Specifications

| Feature Column | Evidence Family | Unit | Direction of Concern | Practical Concern Threshold | Denominator | Applicable Time Window |
|---|---|---|---|---|---|---|
| `attendance_rate` | Attendance | `%` | Lower | `< 70.0%` | Recorded eligible sessions | Term start to checkpoint |
| `attendance_sessions_attended` | Attendance | `sessions` | Lower | N/A | Recorded sessions | Term start to checkpoint |
| `assessment_avg_score` | Coursework | `%` | Lower | `< 60.0%` | Released assessments | Term start to checkpoint |
| `overdue_submissions_count` | Coursework | `tasks` | Higher | `>= 1` task | Past deadlines | Term start to checkpoint |
| `active_study_days` | Engagement | `days` | Lower | `< 4` days | Calendar days | Term start to checkpoint |
| `total_clicks` | Engagement | `clicks` | Lower | `< 40` clicks | Click interaction events | Term start to checkpoint |
| `recent_activity_ratio` | Engagement | `ratio` | Lower | `< 0.15` | Total clicks | Last 7 days before cutoff |
| `high_school_gpa` | Background | `GPA` | Lower | `< 2.50` | 4.0 scale | Pre-matriculation |
| `prior_credits_earned` | Background | `credits` | Lower | N/A | Credit hours | Pre-matriculation |

---

## 2. Missingness Semantics

The pipeline distinguishes between absent/negative events and unobserved or unavailable feeds:
* **Unrecorded Attendance**: Sessions that occurred but have no recorded attendance sheet are flagged as unrecorded and omitted from the attended/eligible denominator.
* **Unreleased Grades**: Assignments submitted by the student but still awaiting instructor evaluation are tracked as pending evaluation, preventing them from dragging down continuous assessment averages.
* **Open Deadlines**: Tasks whose due date falls after the checkpoint cutoff are strictly excluded from the overdue count.
* **Coverage Guarantee**: If an enrollment lacks adequate records across at least 2 independent families (attendance, coursework, engagement), the enrollment is assigned `Insufficient data` review priority and surfaced with the exact missing feeds.
