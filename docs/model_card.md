# Academic Risk Monitor — Unsupervised Model Card

## 1. Model Overview

* **Architecture**: Ensemble of **K-Means Clustering** (for behavioral profile discovery) and **Isolation Forest** (for anomaly rank and unusualness detection).
* **Objective**: Discover students who deviate from cohort baseline behaviors or manifest multi-family academic concerns during early course weeks (Weeks 2, 4, 6), enabling proactive mentor outreach.
* **Input Features**: 7 engineered behavioral indicators (attendance rate, continuous assessment average, overdue submissions count, active study days, total clicks, recent activity ratio, high school GPA).
* **Ethical Boundary**: Demographic markers (gender, ethnicity, region, disability status, age) and course final outcomes are **strictly excluded** from feature engineering and training to prevent systemic algorithmic bias.

---

## 2. Review Priority Decision Policy

Review priority is determined via an interpretable deterministic decision table:

| Available Evidence | Review Priority | Policy Path Description |
|---|---|---|
| `< 2` independent families available | `Insufficient data` | Path A: Insufficient data coverage |
| 0 observed concerns (including high performers) | `Routine` | Path B1: Standard healthy engagement<br/>Path B2: High-performing unusual outlier |
| 1 concerning family without corroboration | `Monitor` | Path C: Single concern under periodic monitoring |
| 1 concerning family + model corroboration | `High` | Path D: Single concern elevated via elevated anomaly percentile (`>=90%`) & adverse sensitivity |
| 2+ independent concerning families | `High` | Path E: Multi-family concerning deficit |

---

## 3. Explainability: Score Sensitivity to Benchmark Substitution

Rather than uninterpretable black-box predictions, Academic Risk Monitor computes local score sensitivity by substituting each observed feature with the cohort benchmark median and rescoring through the pipeline:
$$\Delta \text{Anomaly Score} = \text{Score}_{\text{median substitution}} - \text{Score}_{\text{observed}}$$

If replacing the student's observed metric with the cohort median significantly reduces the anomaly score ($\Delta < -0.02$), the student's observed value is isolated as the driving factor behind the alert.
