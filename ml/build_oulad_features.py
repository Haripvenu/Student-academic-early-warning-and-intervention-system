"""
Build an early-warning feature table from OULAD.
One row per (student, module, presentation), using ONLY data available up to CUTOFF_DAY.

Usage:  python build_oulad_features.py
Output: ml/data/oulad_features.csv
"""
import numpy as np
import pandas as pd

# ---------------- settings you can change ----------------
DATA_DIR = "ml/data/oulad"                 # folder with the 7 OULAD csv files
OUT_FILE = "ml/data/oulad_features.csv"
CUTOFF_DAY = 60                            # "early" = first 60 days of the course
INCLUDE_DEMOGRAPHICS = False               # gender, region, disability (ethically sensitive)
KEYS = ["code_module", "code_presentation", "id_student"]
# ----------------------------------------------------------

def read(name, **kw):
    return pd.read_csv(f"{DATA_DIR}/{name}.csv", **kw)

# 1. Base table + target ---------------------------------------------------
info = read("studentInfo")
info["at_risk"] = info["final_result"].isin(["Fail", "Withdrawn"]).astype(int)

edu_order = {"No Formal quals": 0, "Lower Than A Level": 1, "A Level or Equivalent": 2,
             "HE Qualification": 3, "Post Graduate Qualification": 4}
info["highest_education"] = info["highest_education"].map(edu_order)
info["imd_band"] = (info["imd_band"].astype(str).str.extract(r"^(\d+)")[0].astype(float))  # 0-10% -> 0, 10-20% -> 10 ...

# 2. Registration: drop students who already left before the cutoff ---------
reg = read("studentRegistration")
df = info.merge(reg, on=KEYS, how="left")
already_left = df["date_unregistration"].notna() & (df["date_unregistration"] <= CUTOFF_DAY)
print(f"Dropping {already_left.sum()} students who unregistered before day {CUTOFF_DAY}")
df = df[~already_left].drop(columns=["date_unregistration"])

# 3. VLE engagement up to the cutoff ---------------------------------------
chunks = []
for ch in pd.read_csv(f"{DATA_DIR}/studentVle.csv", chunksize=2_000_000,
                      usecols=KEYS + ["id_site", "date", "sum_click"]):
    chunks.append(ch[ch["date"] <= CUTOFF_DAY])
vle = pd.concat(chunks, ignore_index=True)
vle["recent"] = vle["date"] > (CUTOFF_DAY - 14)

g = vle.groupby(KEYS)
eng = pd.DataFrame({
    "total_clicks": g["sum_click"].sum(),
    "active_days": g["date"].nunique(),
    "distinct_resources": g["id_site"].nunique(),
})
eng["clicks_per_active_day"] = eng["total_clicks"] / eng["active_days"]
recent = vle[vle["recent"]].groupby(KEYS)["sum_click"].sum().rename("clicks_last_2wk")
eng = eng.join(recent).fillna({"clicks_last_2wk": 0})
eng["recent_share"] = eng["clicks_last_2wk"] / eng["total_clicks"]       # falling share = disengaging
eng = eng.reset_index()
df = df.merge(eng, on=KEYS, how="left")
for c in ["total_clicks", "active_days", "distinct_resources", "clicks_last_2wk"]:
    df[c] = df[c].fillna(0)            # no VLE activity at all = 0 clicks

# 4. Assessments (continuous assessment) up to the cutoff -------------------
assess = read("assessments")
sa = read("studentAssessment")
due = assess[(assess["assessment_type"] != "Exam") & (assess["date"] <= CUTOFF_DAY)]
due = due[["code_module", "code_presentation", "id_assessment", "date", "weight"]]

n_due = due.groupby(["code_module", "code_presentation"]).size().rename("n_assessments_due").reset_index()

# studentAssessment has no module columns, so join through the assessments table
sub = sa.merge(due, on="id_assessment", how="inner")
sub = sub[sub["date_submitted"] <= CUTOFF_DAY]
sub["days_late"] = sub["date_submitted"] - sub["date"]
sub["is_late"] = (sub["days_late"] > 0).astype(int)
gs = sub.groupby(KEYS)
ca = pd.DataFrame({
    "n_submitted": gs["id_assessment"].nunique(),
    "avg_score": gs["score"].mean(),
    "min_score": gs["score"].min(),
    "avg_days_late": gs["days_late"].mean(),
    "late_submissions": gs["is_late"].sum(),
}).reset_index()
df = df.merge(ca, on=KEYS, how="left").merge(n_due, on=["code_module", "code_presentation"], how="left")
df["n_assessments_due"] = df["n_assessments_due"].fillna(0)
df["n_submitted"] = df["n_submitted"].fillna(0)
df["late_submissions"] = df["late_submissions"].fillna(0)
df["submission_rate"] = np.where(df["n_assessments_due"] > 0,
                                 df["n_submitted"] / df["n_assessments_due"], np.nan)
df["missed_assessments"] = (df["n_assessments_due"] - df["n_submitted"]).clip(lower=0)

# 5. Relative-to-cohort features (compare a student with classmates) ---------
coh = df.groupby(["code_module", "code_presentation"])
df["clicks_vs_cohort"] = df["total_clicks"] / coh["total_clicks"].transform("mean").replace(0, np.nan)
df["score_vs_cohort"] = df["avg_score"] - coh["avg_score"].transform("mean")

# 6. Tidy up and save --------------------------------------------------------
if not INCLUDE_DEMOGRAPHICS:
    df = df.drop(columns=["gender", "region", "disability", "age_band"])
df = df.drop(columns=["final_result"])      # LEAKAGE: never use as a feature
cols = KEYS + [c for c in df.columns if c not in KEYS + ["at_risk"]] + ["at_risk"]
df = df[cols]
df.to_csv(OUT_FILE, index=False)

print("Saved:", OUT_FILE, df.shape)
print("At-risk share:", df["at_risk"].mean().round(3))
print("Missing values:\n", df.isna().sum()[df.isna().sum() > 0])
