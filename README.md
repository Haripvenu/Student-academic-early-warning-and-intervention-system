# EduGuard: Explainable Machine Learning Early Warning System (EWS) for Student Dropout & Failure Prediction

> **A Complete B.Tech Major / Final Year Project in Machine Learning & Educational Data Mining**

---

## 📌 Executive Summary
Higher-education dropout and failure rates pose significant academic and financial challenges globally. Traditional predictive models analyze post-semester outcomes, rendering interventions obsolete. 

**EduGuard** implements an end-to-end Supervised Machine Learning Early Warning System trained on the **Open University Learning Analytics Dataset (OULAD)**. By applying a strict **Day-60 decision horizon** (the first ~2 months of classes), the system evaluates student Virtual Learning Environment (VLE) engagement, assignment deadlines, and relative cohort performance to predict at-risk students while sufficient time remains for proactive intervention.

Furthermore, EduGuard addresses the "black-box" dilemma by integrating **TreeSHAP (Shapley Additive exPlanations)**, delivering granular, plain-English root-cause diagnoses for every prediction.

---

## 🚀 Key Features

* **4 Supervised ML Models Benchmarked**: Logistic Regression, Random Forest, XGBoost, and LightGBM.
* **Production Model (LightGBM)**:
  * **ROC-AUC**: `0.8236`
  * **Recall (Detection Rate)**: `67.8%` (Tuned to minimize dangerous False Negatives)
  * **Accuracy**: `75.7%`
* **Explainable AI (XAI)**:
  * Real-time local SHAP waterfall & bar charts highlighting positive and negative behavioral drivers.
* **Interactive What-If Simulation Lab**:
  * Real-time sliders allowing advisors to simulate counseling outcomes (e.g. submitting missed tests, boosting platform clicks) and visualize risk reduction.
* **Modern Web Dashboard**:
  * Executive analytics, searchable student cohort roster, individual diagnostic inspector, and Viva evaluation metrics.

---

## 🏗️ System Architecture

```
                  ┌─────────────────────────────────────────┐
                  │          OULAD Raw Database             │
                  │   (7 CSV Tables, 10M+ Interactions)     │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │      build_oulad_features.py            │
                  │  (Day-60 Cutoff, Leakage Free Pipeline) │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                         oulad_features.csv (26,361 rows)
                                       │
                 ┌─────────────────────┴─────────────────────┐
                 ▼                                           ▼
      ┌──────────────────────┐                   ┌──────────────────────┐
      │   Model Training     │                   │   Explainability     │
      │  (ml/train.py)       │                   │   (TreeSHAP Engine)  │
      └──────────┬───────────┘                   └──────────┬───────────┘
                 │                                          │
                 └─────────────────────┬────────────────────┘
                                       ▼
                    Artifacts: best_model.joblib & metrics.json
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │           FastAPI REST Server           │
                  │     (Prediction, SHAP, Batch Upload)    │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │         React 19 + Vite Dashboard       │
                  │ (Charts, XAI Visuals, What-If Simulator)│
                  └─────────────────────────────────────────┘
```

---

## 📊 Supervised Machine Learning Benchmark Results

| Model Architecture | Accuracy | Precision | Recall (Catch Rate) | F1-Score | ROC-AUC | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 73.6% | 69.9% | 64.6% | 0.6711 | 0.8027 | Baseline |
| **Random Forest** | 75.8% | 74.5% | 63.8% | 0.6876 | 0.8237 | Ensemble |
| **XGBoost** | 75.1% | 71.3% | 67.5% | 0.6933 | 0.8235 | Gradient Boosted |
| **LightGBM** *(Best)* | **75.7%** | **72.3%** | **67.8%** | **0.6994** | **0.8236** | **Selected Production** |

---

## ⚡ Quick Start Guide

### 1. Prerequisites
* Python 3.10+ (Installed)
* Node.js v18+ (Installed)

### 2. Start Both Servers (One-Click)
Double-click `start_all.bat` in the project root:
* **Frontend Web Dashboard**: [http://localhost:5173](http://localhost:5173)
* **Backend API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Manual Start (Terminal)
**Backend:**
```bash
python backend/run_server.py
```

**Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🎓 Academic Defense & Viva Discussion Points

1. **Why Day 60?**
   * Detecting a dropout at the end of the semester is useless. Day 60 represents the critical juncture where early continuous assessments have occurred and engagement disengagement trends manifest.
2. **Why Prioritize Recall over Accuracy?**
   * In student retention systems, **False Negatives are fatal** (failing to identify a student who will drop out). A tuned recall threshold ensures the majority of at-risk cases are caught.
3. **Ethical AI & Bias Mitigation**:
   * Demographic features (`gender`, `region`, `disability`, `age_band`) were intentionally stripped from model features to avoid discriminatory bias.
