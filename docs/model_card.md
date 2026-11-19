# Academic Risk Monitor — Supervised Model Card

## 1. Model Overview

* **Supervised Classification Architecture**: Multi-model supervised benchmark pipeline comparing **LightGBM** (Production Champion), **Random Forest**, **XGBoost**, and **Logistic Regression**.
* **Target Definition**: Binary classification of student retention risk:
  $$\text{at\_risk} = \begin{cases} 1 & \text{if final result } \in \{\text{Fail}, \text{Withdrawn}\} \\ 0 & \text{if final result } \in \{\text{Pass}, \text{Distinction}\} \end{cases}$$
* **Objective**: Predict at-risk students during early evaluation horizons (Weeks 2, 4, and 6 / Day-60 decision horizon) to enable proactive advisor triage and targeted interventions before official drop deadlines and census.
* **Input Features**: 21 point-in-time behavioral and academic features across LMS engagement (total clicks, active days, distinct resources, clicks per active day, recent 2-week click share), continuous assessment performance (number submitted, average score, minimum score, submission rate, missed assessments, submission latency), and registration timing.
* **Ethical Boundary**: Protected demographic markers (gender, ethnicity, region, disability status, age) are **strictly excluded** from feature engineering and training to ensure ethical, non-discriminatory evaluations.

---

## 2. Empirical Classification Benchmarks (OULAD Cohort)

Evaluated on 5,273 held-out test records (80/20 stratified split across 26,361 total student enrollments):

| Model Architecture | Accuracy | Precision | Recall (Catch Rate) | F1-Score | ROC-AUC | PR-AUC | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Logistic Regression** | 73.6% | 69.9% | 64.6% | 0.6711 | 0.8027 | 0.7730 | Baseline |
| **Random Forest** | 75.8% | 74.5% | 63.8% | 0.6876 | 0.8237 | 0.7990 | Ensemble |
| **XGBoost** | 75.1% | 71.3% | 67.5% | 0.6933 | 0.8235 | 0.7998 | Gradient Boosted |
| **LightGBM** *(Best)* | **75.7%** | **72.3%** | **67.8%** | **0.6994** | **0.8236** | **0.8004** | **Production Winner** |

*Evaluation Objective: In higher education early warning systems, **Recall is prioritized** over raw accuracy to prevent false negatives (failing to identify a student in need of academic intervention).*

---

## 3. Production Model Confusion Matrix (LightGBM)

Evaluated on 5,273 test cases:
* **True Negatives (TN)**: **2,506** (Passing students correctly classified)
* **False Positives (FP)**: **571** (Passing students flagged for outreach — safe false alarm)
* **False Negatives (FN)**: **708** (At-risk students missed)
* **True Positives (TP)**: **1,488** (At-risk students caught early for intervention)

---

## 4. Review Priority Decision Policy

Review priority combines observed continuous assessment evidence with supervised model predictions:

| Available Evidence | Review Priority | Policy Path Description |
|---|---|---|
| `< 2` independent families available | `Insufficient data` | Path A: Insufficient data coverage |
| 0 observed concerns (including high performers) | `Routine` | Path B1: Standard healthy engagement<br/>Path B2: High-performing unusual outlier |
| 1 concerning family without corroboration | `Monitor` | Path C: Single concern under periodic monitoring |
| 1 concerning family + model corroboration | `High` | Path D: Single concern elevated via elevated supervised risk percentile (`>=90%`) & adverse feature sensitivity |
| 2+ independent concerning families | `High` | Path E: Multi-family concerning deficit |

---

## 5. Explainability: TreeSHAP & Feature Sensitivity

Rather than uninterpretable black-box predictions, the system computes local feature attribution using TreeSHAP and counterfactual sensitivity:
* Identifies which specific features (e.g., assignment submission latency, active study days, assessment score dip) push the student into high risk.
* Enables mentors to explain exactly *why* a student was flagged and set realistic goals in the **Interactive What-If Simulator**.
