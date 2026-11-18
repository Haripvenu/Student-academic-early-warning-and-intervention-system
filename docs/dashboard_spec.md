# Academic Risk Monitor — Dashboard Specification & User Journey

## 1. User Journey

```
[Import Academic CSVs] ──> [Build Checkpoint Snapshots] ──> [Discover Profiles & Anomalies]
         │                                                            │
         ▼                                                            ▼
[Overdue Follow-up Audit] <── [Record Interventions] <── [Prioritize Mentor Review Queue]
```

---

## 2. Route Specifications

| Route | View Description | Key Interactions |
|---|---|---|
| `/login` | Authentication | Sign in with credentials or 1-click quick demo buttons for Mentor, Faculty, and Admin. |
| `/overview` | Executive Cohort Dashboard | Checkpoint/Term filters, 4 core KPI cards, priority-by-course stacked bar chart, checkpoint trajectory chart, and actionable review queue. |
| `/students` | Caseload Explorer | Server-paginated table, search by student name/ID/course, filter by review priority pills, and CSV export. |
| `/students/:id` | Diagnostic Profile | Academic evidence breakdown across 3 families, discovered profile badge, anomaly percentile gauge, local score sensitivity table, checkpoint history, and intervention audit trail. |
| `/patterns` | Discovered Profiles | K-Means cluster archetypes, original-unit feature means, sample sizes, and student drill-down. |
| `/interventions` | Case Management | Open, In-Progress, and Closed cases, due-date overdue tracking, status transitions, and progress notes. |
| `/admin/imports` | Data Ingest Pipeline | CSV file uploader, schema validation, downloadable row errors, and execution history. |
| `/admin/models` | ML Ops Console | Trigger training/scoring jobs, activate candidate models, rollback, and review retrospective validation metrics. |
