# EduGuard – Explainable Machine Learning Early Warning System

### Predicting Student Dropout & Academic Failure Before It's Too Late

EduGuard is an end-to-end, explainable Machine Learning Early Warning System (EWS) designed to identify students at risk of academic failure or dropout using early academic and behavioral indicators.

Built using the **Open University Learning Analytics Dataset (OULAD)**, EduGuard applies a strict **Day-60 prediction horizon** to analyze student engagement, assessment behavior and learning activity during the first two months of a course.

Unlike conventional academic prediction systems that rely on end-of-semester outcomes, EduGuard aims to identify at-risk students early enough for meaningful intervention.

The system combines supervised machine learning, Explainable AI (XAI), and an interactive What-If Simulation Lab to transform predictions into actionable insights for academic advisors.

---

## Key Features

- **Early Risk Prediction:** Identifies students at risk of dropout or academic failure using information available within the first 60 days.
- **Four ML Models Benchmarked:** Logistic Regression, Random Forest, XGBoost and LightGBM.
- **Optimized Production Model:** LightGBM selected with a focus on improving at-risk student detection (Recall).
- **Explainable AI with TreeSHAP:** Generates individual-level explanations using SHAP waterfall and feature contribution bar charts.
- **Interactive What-If Simulation:** Allows advisors to modify student behavioral indicators and observe changes in predicted risk.
- **Student Cohort Analytics:** Provides an overview of student records, risk distribution and academic patterns.
- **Individual Student Diagnostics:** Searchable student roster with detailed risk assessments and contributing factors.
- **Batch Prediction Support:** Enables processing multiple student records through the backend API.
- **Viva Evaluation Metrics:** Presents model benchmarking and evaluation metrics through the dashboard.

---

## System Architecture

EduGuard follows an end-to-end machine learning architecture, connecting raw educational data to an interactive web application.

```text
              OULAD RAW DATABASE
              (7 CSV Tables)
                     |
                     v
          FEATURE ENGINEERING PIPELINE
             build_oulad_features.py
          (Day-60 Cutoff & Data Cleaning)
                     |
                     v
             oulad_features.csv
                (26,361 Rows)
                     |
                     v
             MODEL BENCHMARKING
                  ml/train.py
                     |
          +----------+----------+
          |          |          |
          v          v          v
       Logistic   Random     XGBoost
      Regression   Forest
          |          |          |
          +----------+----------+
                     |
                     v
                  LightGBM
              (Selected Model)
                     |
                     v
             TREE SHAP EXPLAINABILITY
             (Individual Predictions)
                     |
                     v
              SAVED ARTIFACTS
          best_model.joblib
             metrics.json
                     |
                     v
              FASTAPI BACKEND
        Prediction | SHAP | What-If
               | Batch API
                     |
                     v
             REACT 19 + VITE
              WEB DASHBOARD
                     |
          +----------+----------+
          |          |          |
          v          v          v
       Analytics  Student    What-If
       Dashboard  Diagnostics Simulation
```

---

## Machine Learning Methodology

### 1. Dataset – OULAD

EduGuard uses the Open University Learning Analytics Dataset (OULAD), a publicly available educational dataset containing student demographics, assessments, course registrations and Virtual Learning Environment (VLE) interactions.

The feature engineering pipeline processes seven raw CSV tables to construct a unified student-level dataset.

**Dataset characteristics:**
- 7 raw CSV tables.
- 10M+ learning interaction records.
- 26,361 engineered student records.
- Academic outcomes and historical learning activity.

### 2. Day-60 Feature Engineering

A major component of EduGuard is its temporal feature engineering pipeline.

Instead of using information from the entire academic period, the system restricts predictive features to information available within the first 60 days.

The pipeline analyzes:

- VLE engagement and interaction patterns.
- Student learning activity.
- Assessment submission behavior.
- Assignment deadlines and performance indicators.
- Relative engagement compared with cohort patterns.

This creates an early prediction environment while reducing the risk of temporal data leakage.

**Why Day 60?**

The first two months provide an opportunity to observe early engagement and assessment patterns while sufficient course time may remain for academic intervention.

### 3. Model Benchmarking

Four supervised machine learning algorithms are trained and evaluated to identify the most suitable predictive model.

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
|---|---:|---:|---:|---:|---:|
| Logistic Regression | 73.6% | 69.9% | 64.6% | 0.6711 | 0.8027 |
| Random Forest | 75.8% | 74.5% | 63.8% | 0.6876 | 0.8237 |
| XGBoost | 75.1% | 71.3% | 67.5% | 0.6933 | 0.8235 |
| **LightGBM** | **75.7%** | **72.3%** | **67.8%** | **0.6994** | **0.8236** |

### 4. Selected Production Model – LightGBM

LightGBM is selected as the production model because it achieves the highest recall among the four benchmarked models.

**Production Model Performance**

| Evaluation Metric | Result |
|---|---:|
| Accuracy | 75.7% |
| Precision | 72.3% |
| Recall | 67.8% |
| F1-Score | 0.6994 |
| ROC-AUC | 0.8236 |

**Why prioritize Recall?**

In an educational early-warning system, failing to identify a genuinely at-risk student (False Negative) can mean missing an opportunity for timely support.

Therefore, EduGuard prioritizes recall to improve the detection of students who may experience unsuccessful academic outcomes.

---

## Explainable AI – TreeSHAP

A prediction alone does not provide enough information for academic advisors to understand a student's situation.

EduGuard integrates TreeSHAP to provide transparent, individual-level explanations for model predictions.

**Key Explainability Features:**

- Local SHAP waterfall plots showing how individual features contribute to a prediction.
- SHAP feature contribution bar charts.
- Identification of positive and negative prediction drivers.
- Plain-English explanations to support interpretation by academic advisors.

For example, a student's low learning engagement or missed assessment activity may contribute positively towards the predicted risk, while stronger academic indicators may contribute negatively.

This helps transform the system from a black-box predictor into an explainable decision-support tool.

---

## Interactive What-If Simulation Lab

EduGuard includes an interactive simulation environment that allows academic advisors to explore hypothetical changes in student behavior.

**Example Scenario:**

An advisor wants to understand how a student's predicted risk might change if their learning engagement improves and missed assessments are reduced.

The advisor can modify the corresponding input parameters through interactive sliders.

The updated inputs are sent to the backend, where the model recalculates the prediction.

**Simulation Capabilities:**
- Modify VLE interaction counts.
- Simulate changes in assessment behavior.
- Recalculate predictions dynamically.
- Compare original and simulated risk outcomes.

This feature supports exploratory intervention planning without modifying the original student records or retraining the model.

*Note: Simulated prediction changes represent model-based scenarios, not guaranteed real-world intervention outcomes.*

---

## Technology Stack

| Category | Technologies |
|---|---|
| Programming Language | Python |
| Machine Learning | Scikit-learn, LightGBM, XGBoost |
| Explainable AI | SHAP / TreeSHAP |
| Data Processing | Pandas, NumPy |
| Backend | FastAPI |
| Frontend | React 19, Vite |
| Visualization | Dashboard charts, SHAP plots |
| Model Persistence | Joblib |
| Dataset | OULAD |

---

## Project Structure

```text
EduGuard/
│
├── backend/
│   └── run_server.py
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── ml/
│   └── train.py
│
├── build_oulad_features.py
│
├── best_model.joblib
├── metrics.json
├── oulad_features.csv
│
├── start_all.bat
└── README.md
```

*The structure above highlights the main project components; additional files and directories may be present in the repository.*

---

## Installation & Setup

### Prerequisites

Make sure the following are installed:

- Python 3.10+
- Node.js 18+
- npm
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd EduGuard
```

### 2. Set Up the Python Environment

```bash
python -m venv .venv
```

Activate the environment.

**Windows:**

```powershell
.venv\Scripts\activate
```

**Install backend dependencies:**

```bash
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Start the Application

**One-click startup (Windows):**

Double-click:

```text
start_all.bat
```

**Or start manually using two terminals.**

Terminal 1 – Backend:

```bash
python backend/run_server.py
```

Terminal 2 – Frontend:

```bash
cd frontend
npm run dev
```

### 5. Access EduGuard

| Component | Local URL |
|---|---|
| Frontend Dashboard | http://localhost:5173 |
| Backend API | http://127.0.0.1:8000 |
| FastAPI Documentation | http://127.0.0.1:8000/docs |

---

## Academic Significance & Ethical Considerations

EduGuard is designed as an academic decision-support system rather than an automated student evaluation mechanism.

### Ethical AI Considerations

- **Demographic Bias Mitigation:** Demographic attributes such as gender, region, disability and age band are intentionally excluded from model input features.
- **Explainability:** SHAP provides insight into the factors influencing individual predictions.
- **Early Intervention:** Predictions are intended to support proactive academic assistance.
- **Human Oversight:** Final intervention decisions should remain with qualified academic mentors.
- **Privacy:** Student information should be handled responsibly and in accordance with applicable data protection requirements.

---

## Future Scope

Potential improvements include:

- Integration with real university Learning Management Systems (LMS).
- Real-time academic data ingestion.
- Personalized intervention recommendations.
- Automated mentor alerts and notifications.
- Longitudinal student performance tracking.
- Model fairness auditing and continuous monitoring.
- Cloud deployment for wider institutional accessibility.

---

## Project Objective

EduGuard aims to bridge the gap between predictive machine learning and practical academic intervention.

By combining early student risk detection, explainable predictions and interactive scenario simulation, the system provides an analytical foundation for identifying students who may need support before academic difficulties become irreversible.

**Predict Early. Explain Clearly. Intervene Effectively.**

---

### Dataset & References

- Open University Learning Analytics Dataset (OULAD): https://analyse.kmi.open.ac.uk/open_dataset
- SHAP Documentation: https://shap.readthedocs.io/
- LightGBM Documentation: https://lightgbm.readthedocs.io/
- FastAPI Documentation: https://fastapi.tiangolo.com/
- React Documentation: https://react.dev/

---

**Developed as a B.Tech Major Project in Machine Learning & Educational Data Mining.**
