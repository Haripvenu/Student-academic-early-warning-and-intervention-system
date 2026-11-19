# EduGuard – Academic Risk Monitor (EWS)
### Enterprise Machine Learning Early Warning & Intervention System for Higher Education

EduGuard (Academic Risk Monitor) is an end-to-end Machine Learning Early Warning System (EWS) and advisor triage platform designed to detect at-risk students before census and final deadlines.

Built on the **Open University Learning Analytics Dataset (OULAD)**, the platform deploys state-of-the-art **Supervised Machine Learning classification models** (LightGBM, XGBoost, Random Forest, Logistic Regression) with TreeSHAP explainability, behavioral archetype stratification, and a deterministic review policy across **Week 2, Week 4, and Week 6** evaluation horizons.

---

## 🚀 Key Features & Capabilities

- **Multi-Horizon Checkpoint Prediction (W2, W4, W6):**
  - **Week 2:** Onboarding, early LMS logins, and initial registration verification.
  - **Week 4:** Continuous assessment (TMA01) submission latency and early assignment grades.
  - **Week 6:** Pre-census risk evaluation and midterm trajectory projection.
- **Explainable AI with TreeSHAP & Feature Sensitivity:**
  - Individual-level waterfall and feature contribution graphs explaining exact drivers (missed deadlines, study day deficits, assessment dips).
- **Interactive "What-If" Counterfactual Simulation:**
  - Advisors can adjust sliders (attendance, grades, active study days, clicks) to observe live risk reduction and commit agreed goals as an official **Academic Contract**.
- **1-Click Personalized Outreach Nudge Generator:**
  - Automated, tone-specific draft generation (Urgent Check-in, LMS Engagement Support, Commendation) with one-click clipboard copy and `mailto:` client launch.
- **Course Attrition Risk Matrix:**
  - 7-module heatmap matrix (`AAA` through `GGG`) comparing enrollment pressure, disengagement, and pass rate trends.
- **Semester Progression Horizon Player:**
  - Multi-horizon time scrubber with automated play/pause timeline progression.
- **Batch Caseload Explorer & Triage Dock:**
  - Row checkboxes with select-all capability, floating bulk actions, mentor re-assignment, and filtered CSV exports.
- **Institutional Light Theme:**
  - High-contrast, clean institutional light interface designed for academic advisor workflow.

---

## 🏛️ System Architecture

```text
                           ┌──────────────────────────────────────────────┐
                           │   Institutional Academic Records (CSVs)      │
                           │   Terms, Courses, Attendance, Grades, LMS    │
                           └──────────────────────┬───────────────────────┘
                                                  │
                                                  ▼
                           ┌──────────────────────────────────────────────┐
                           │     Point-in-Time Feature Extraction Engine  │
                           │   Strict Dual Timestamps: event & available  │
                           └──────────────────────┬───────────────────────┘
                                                  │
                                                  ▼
                           ┌──────────────────────────────────────────────┐
                           │     Machine Learning & Scoring Pipeline      │
                           │  • Supervised Benchmarks (LightGBM, XGBoost) │
                           │  • K-Means (4 Interpretable Behavioral Pkts) │
                           │  • Isolation Forest (Percentile Anomaly Rank)│
                           │  • Local Score Sensitivity Explainability    │
                           └──────────────────────┬───────────────────────┘
                                                  │
                                                  ▼
                           ┌──────────────────────────────────────────────┐
                           │   5-Path Deterministic Review Priority Engine│
                           │ Insufficient Data | Routine | Monitor | High │
                           └──────────────────────┬───────────────────────┘
                                                  │
                                                  ▼
                           ┌──────────────────────────────────────────────┐
                           │      FastAPI Backend REST Service (:8000)    │
                           │  RBAC, Session Auth, Job Queue, SQLite/PG    │
                           └──────────────────────┬───────────────────────┘
                                                  │
                                                  ▼
                           ┌──────────────────────────────────────────────┐
                           │      React 19 + TypeScript + Vite SPA        │
                           │  Tailwind CSS, Recharts, Accessible Tables   │
                           └──────────────────────────────────────────────┘
```

---

## 📊 Supervised Model Benchmarking

Four supervised algorithms were benchmarked on Day-60 OULAD features:

| Model | Accuracy | Precision | Recall (Catch Rate) | F1-Score | ROC-AUC | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 73.6% | 69.9% | 64.6% | 0.6711 | 0.8027 | Baseline |
| **Random Forest** | 75.8% | 74.5% | 63.8% | 0.6876 | 0.8237 | Ensemble |
| **XGBoost** | 75.1% | 71.3% | 67.5% | 0.6933 | 0.8235 | Gradient Boosted |
| **LightGBM** *(Best)* | **75.7%** | **72.3%** | **67.8%** | **0.6994** | **0.8236** | **Selected Production** |

*Note: In educational early warning systems, **Recall is prioritized** over raw accuracy to prevent fatal false negatives (missing a student who needs academic intervention).*

---

## ⚡ Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- Git

### 1-Click Launch (Windows)
Double-click `start_all.bat` in the repository root:
- **Frontend Web Dashboard**: [http://localhost:5173](http://localhost:5173)
- **FastAPI API & Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check Endpoint**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### Manual Setup (Two Terminals)

#### Terminal 1 – Backend:
```bash
# Set up Python virtual environment
python -m venv .venv
.venv\Scripts\activate   # On Windows
# source .venv/bin/activate # On macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run server
python server.py
```

#### Terminal 2 – Frontend:
```bash
# Navigate to frontend and install packages
cd frontend
npm install

# Start Vite development server
npm run dev
```

---

## 👥 Demo Evaluator Accounts

The application includes 3 institutional roles for demo and evaluation:

| Role | Evaluator Persona | Assigned Scope & Caseload |
| :--- | :--- | :--- |
| **Academic Mentor** | Dr. Sarah Chen | Assigned Caseload (Active student outreach, case notes, contracts) |
| **Course Faculty** | Prof. Alan Vance | Course Module Coordinator Scope (`AAA` - `GGG`) |
| **Administrator** | Elena Rostova | System Operations, ML Audits, Ingestion Pipelines |

*Switch perspectives instantly from the header role dropdown.*

---

## 📂 Repository Structure

```text
├── README.md                           # System overview & execution guide
├── .env.example                        # Configuration template
├── compose.yaml                        # Multi-container orchestration (DB, API, Worker, Web)
├── Makefile                            # Seed, train, score, test commands
├── server.py                           # FastAPI development entrypoint
├── requirements.txt                    # Root Python dependencies
├── start_all.bat                       # One-click Windows starter
├── start_backend.bat                   # Backend starter
├── start_frontend.bat                  # Frontend starter
├── backend/
│   ├── app/
│   │   ├── api/                        # Scoped REST endpoints (/auth, /dashboard, /enrollments, etc.)
│   │   ├── ml/                         # K-Means, Isolation Forest, Feature specs, Explainability
│   │   ├── models/                     # SQLAlchemy declarative models
│   │   ├── schemas/                    # Pydantic validation schemas
│   │   ├── services/                   # Business logic, scoring, CSV ingestion
│   │   ├── config.py                   # Typed Pydantic settings
│   │   ├── db.py                       # Connection pooling and session lifecycle
│   │   ├── security.py                 # PBKDF2 hashing & session management
│   │   ├── cli.py                      # Maintenance CLI (seed, train, score, evaluate)
│   │   └── worker.py                   # Background job queue worker
│   ├── migrations/                     # Alembic database migrations
│   └── tests/                          # 15 automated pytest suites
├── frontend/
│   ├── src/
│   │   ├── api/                        # Typed client and queries
│   │   ├── app/                        # App, Router, Session & Theme providers
│   │   ├── components/                 # AnimatedCounter, TimeScrubber, MetricCard, DataTable
│   │   ├── features/                   # CourseRiskMatrix, StudentRadarChart, WhatIfSimulator, NudgeGeneratorModal
│   │   ├── layout/                     # AppShell (Sidebar, header, dark toggle)
│   │   └── pages/                      # Overview, Students, Profile, Patterns, Interventions, Ops
│   └── package.json                    # Frontend dependencies
├── data/
│   ├── README.md                       # Data dictionary & CSV schemas
│   └── templates/                      # 10 Institutional CSV templates
├── scripts/
│   └── import_oulad_data.py            # OULAD dataset importer
└── docs/
    ├── architecture.md                 # System architecture specifications
    ├── database.md                     # Database ERD & index design
    ├── api.md                          # REST API specification & schemas
    ├── data_dictionary.md              # Feature definitions & units
    ├── model_card.md                   # Supervised ML model cards & classification metrics
    ├── dashboard_spec.md               # User interface specification
    ├── deployment.md                   # Deployment & rollback procedures
    └── demo_walkthrough.md             # Reproducible evaluation guide
```

---

## 🔒 Ethical AI & Privacy Considerations

- **Demographic Bias Mitigation:** Demographic attributes (`gender`, `region`, `disability`, `age_band`) are stripped from predictive models to ensure ethical, non-discriminatory evaluations.
- **Human-in-the-Loop:** Predictions and triage flags serve as advisory decision-support tools for human mentors, not automated punitive decisions.
- **Anonymized Student Privacy:** All student records adhere to institutional privacy guidelines, utilizing anonymous identifiers (`Student #<id>`).
- **FERPA Compliance:** Production deployments require VPC isolation, encrypted storage at rest, and auditable access logs.

---

### Dataset Citation & References
- **Open University Learning Analytics Dataset (OULAD):** [KMi Open University](https://analyse.kmi.open.ac.uk/open_dataset)
- **TreeSHAP:** Lundberg et al., *Nature Machine Intelligence* (2020)
- **FastAPI:** [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)
- **React & Vite:** [https://react.dev/](https://react.dev/)
