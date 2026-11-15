"""
Train and evaluate supervised ML models for Student Early Warning System.
Compares Logistic Regression, Random Forest, and LightGBM / XGBoost.
Computes evaluation metrics (ROC-AUC, PR-AUC, Recall, F1) and precomputes SHAP explainer.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix, classification_report
)
import lightgbm as lgb
import xgboost as xgb
import shap

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Check both potential data paths
DATA_PATH_OPTIONS = [
    os.path.join(BASE_DIR, "data", "oulad_features.csv"),
    os.path.join(BASE_DIR, "..", "Early warning system", "ML", "Data", "oulad_features.csv"),
    os.path.join(BASE_DIR, "ML", "Data", "oulad_features.csv"),
    os.path.join(os.path.dirname(BASE_DIR), "Early warning system", "ML", "Data", "oulad_features.csv")
]

DATA_PATH = None
for p in DATA_PATH_OPTIONS:
    if os.path.exists(p):
        DATA_PATH = os.path.abspath(p)
        break

if not DATA_PATH:
    raise FileNotFoundError(f"Could not find oulad_features.csv in checked paths: {DATA_PATH_OPTIONS}")

ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

print(f"Loading data from: {DATA_PATH}")
df = pd.read_csv(DATA_PATH)
print(f"Data shape: {df.shape}")

# Define feature columns
DROP_COLS = ["code_module", "code_presentation", "id_student", "at_risk"]
FEATURE_COLS = [c for c in df.columns if c not in DROP_COLS]
TARGET_COL = "at_risk"

print(f"Number of features: {len(FEATURE_COLS)}")
print(f"Features: {FEATURE_COLS}")

X = df[FEATURE_COLS].copy()
y = df[TARGET_COL].values

# Stratified Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)
print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")
print(f"Target distribution in Train: {np.bincount(y_train) / len(y_train)}")

# Preprocessing: Imputation for models that require clean inputs
imputer = SimpleImputer(strategy="median")
X_train_imp = pd.DataFrame(imputer.fit_transform(X_train), columns=FEATURE_COLS)
X_test_imp = pd.DataFrame(imputer.transform(X_test), columns=FEATURE_COLS)

# Define models to compare
models = {
    "Logistic Regression": Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced"))
    ]),
    "Random Forest": RandomForestClassifier(
        n_estimators=150, max_depth=12, min_samples_split=10,
        random_state=42, class_weight="balanced", n_jobs=-1
    ),
    "XGBoost": xgb.XGBClassifier(
        n_estimators=150, max_depth=6, learning_rate=0.08,
        subsample=0.8, colsample_bytree=0.8, eval_metric="logloss",
        random_state=42, scale_pos_weight=(len(y_train) - sum(y_train)) / sum(y_train)
    ),
    "LightGBM": lgb.LGBMClassifier(
        n_estimators=150, max_depth=6, learning_rate=0.08,
        subsample=0.8, colsample_bytree=0.8, random_state=42,
        class_weight="balanced", verbose=-1
    )
}

results = {}
trained_models = {}

print("\n--- Training and Evaluating Models ---")
for name, model in models.items():
    print(f"\nTraining {name}...")
    if name == "Logistic Regression":
        model.fit(X_train_imp, y_train)
        y_pred = model.predict(X_test_imp)
        y_prob = model.predict_proba(X_test_imp)[:, 1]
    else:
        # Tree models can use imputed data
        model.fit(X_train_imp, y_train)
        y_pred = model.predict(X_test_imp)
        y_prob = model.predict_proba(X_test_imp)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)
    pr_auc = average_precision_score(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred).tolist()

    results[name] = {
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(roc_auc), 4),
        "pr_auc": round(float(pr_auc), 4),
        "confusion_matrix": cm
    }
    trained_models[name] = model

    print(f"{name} -> Accuracy: {acc:.4f}, Recall: {rec:.4f}, F1: {f1:.4f}, ROC-AUC: {roc_auc:.4f}")

# Select best model based on ROC-AUC & Recall balance (LightGBM/XGBoost)
best_model_name = "LightGBM" if "LightGBM" in results else "Random Forest"
print(f"\nSelected Best Model: {best_model_name}")
best_model = trained_models[best_model_name]

# Save imputer and best model
joblib.dump(imputer, os.path.join(ARTIFACTS_DIR, "imputer.joblib"))
joblib.dump(best_model, os.path.join(ARTIFACTS_DIR, "best_model.joblib"))

# Precompute SHAP TreeExplainer for Explainable AI
print("\nComputing SHAP TreeExplainer...")
explainer = shap.TreeExplainer(best_model)
joblib.dump(explainer, os.path.join(ARTIFACTS_DIR, "shap_explainer.joblib"))

# Calculate Global Feature Importance via SHAP on a sample of test data
sample_X = X_test_imp.iloc[:500]
shap_values_sample = explainer.shap_values(sample_X)
if isinstance(shap_values_sample, list):
    # For binary classification some versions return [class 0, class 1]
    shap_vals_risk = shap_values_sample[1]
else:
    shap_vals_risk = shap_values_sample

mean_abs_shap = np.abs(shap_vals_risk).mean(axis=0)
feat_importance = [
    {"feature": feat, "importance": round(float(imp), 4)}
    for feat, imp in sorted(zip(FEATURE_COLS, mean_abs_shap), key=lambda x: x[1], reverse=True)
]

# Calculate feature statistics (min, max, mean, median, 25%, 75%) for UI sliders and what-if simulation
feature_stats = {}
for col in FEATURE_COLS:
    feature_stats[col] = {
        "min": round(float(df[col].min()), 2) if not pd.isna(df[col].min()) else 0,
        "max": round(float(df[col].max()), 2) if not pd.isna(df[col].max()) else 100,
        "mean": round(float(df[col].mean()), 2) if not pd.isna(df[col].mean()) else 0,
        "median": round(float(df[col].median()), 2) if not pd.isna(df[col].median()) else 0,
        "std": round(float(df[col].std()), 2) if not pd.isna(df[col].std()) else 1
    }

# Save metadata
metadata = {
    "feature_cols": FEATURE_COLS,
    "best_model_name": best_model_name,
    "model_comparison": results,
    "global_feature_importance": feat_importance,
    "feature_stats": feature_stats,
    "total_dataset_size": len(df),
    "at_risk_ratio": round(float(df["at_risk"].mean()), 4),
    "cutoff_day": 60
}

with open(os.path.join(ARTIFACTS_DIR, "metrics.json"), "w") as f:
    json.dump(metadata, f, indent=2)

print("\n--- Training Pipeline Complete ---")
print(f"Artifacts saved in {ARTIFACTS_DIR}:")
print("  - best_model.joblib")
print("  - imputer.joblib")
print("  - shap_explainer.joblib")
print("  - metrics.json")
