import os
import json
import io
import pandas as pd
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from .schemas import (
    StudentFeatures, PredictionResponse, FeatureImpact,
    WhatIfRequest, WhatIfResponse, BatchPredictionResponse
)
from .ml_engine import engine, FEATURE_NAMES_DISPLAY

app = FastAPI(
    title="EduGuard Early Warning System API",
    description="Explainable Machine Learning Backend for Student Dropout and Failure Prediction",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load sample data for instant demonstration in dashboard
SAMPLES_CACHE = []

def load_sample_students():
    global SAMPLES_CACHE
    if SAMPLES_CACHE:
        return SAMPLES_CACHE
    
    # Locate oulad_features.csv
    possible_paths = [
        os.path.join(os.path.dirname(__file__), "..", "..", "ml", "data", "oulad_features.csv"),
        os.path.join(os.path.dirname(__file__), "..", "..", "Early warning system", "ML", "Data", "oulad_features.csv")
    ]
    csv_path = next((p for p in possible_paths if os.path.exists(p)), None)
    if csv_path:
        try:
            df = pd.read_csv(csv_path)
            # Pick a representative sample: 15 at-risk and 15 not at-risk
            sample_df = pd.concat([
                df[df["at_risk"] == 1].head(25),
                df[df["at_risk"] == 0].head(25)
            ]).sample(frac=1, random_state=42).reset_index(drop=True)
            
            records = []
            for idx, row in sample_df.iterrows():
                feat_dict = {col: (None if pd.isna(row[col]) else row[col]) for col in engine.feature_cols}
                # Run prediction through engine
                pred = engine.predict(feat_dict)
                records.append({
                    "id_student": int(row.get("id_student", 10000 + idx)),
                    "code_module": str(row.get("code_module", "BBB")),
                    "code_presentation": str(row.get("code_presentation", "2014J")),
                    "actual_at_risk": int(row.get("at_risk", 0)),
                    "features": feat_dict,
                    "prediction": pred
                })
            SAMPLES_CACHE = records
        except Exception as e:
            print(f"Error loading sample data: {e}")
    return SAMPLES_CACHE

@app.on_event("startup")
async def startup_event():
    load_sample_students()

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": engine.is_loaded,
        "best_model": engine.metrics.get("best_model_name", "N/A"),
        "total_training_samples": engine.metrics.get("total_dataset_size", 0)
    }

@app.get("/api/v1/model/metrics")
def get_model_metrics():
    if not engine.metrics:
        raise HTTPException(status_code=500, detail="Metrics not loaded.")
    return {
        "best_model_name": engine.metrics.get("best_model_name"),
        "model_comparison": engine.metrics.get("model_comparison"),
        "global_feature_importance": engine.metrics.get("global_feature_importance", [])[:10],
        "cutoff_day": engine.metrics.get("cutoff_day", 60),
        "at_risk_ratio": engine.metrics.get("at_risk_ratio", 0.416)
    }

@app.get("/api/v1/feature-specs")
def get_feature_specs():
    stats = engine.feature_stats
    specs = []
    for col in engine.feature_cols:
        col_stat = stats.get(col, {})
        specs.append({
            "key": col,
            "label": FEATURE_NAMES_DISPLAY.get(col, col.replace("_", " ").title()),
            "min": col_stat.get("min", 0),
            "max": col_stat.get("max", 100),
            "mean": col_stat.get("mean", 0),
            "median": col_stat.get("median", 0),
            "std": col_stat.get("std", 1)
        })
    return {"features": specs}

@app.get("/api/v1/dashboard/stats")
def get_dashboard_stats():
    samples = load_sample_students()
    high_risk = sum(1 for s in samples if s["prediction"]["risk_level"] == "High Risk")
    mod_risk = sum(1 for s in samples if s["prediction"]["risk_level"] == "Moderate Risk")
    low_risk = sum(1 for s in samples if s["prediction"]["risk_level"] == "Low Risk")
    
    avg_score = round(sum(s["features"].get("avg_score") or 0 for s in samples) / max(len(samples), 1), 1)
    avg_clicks = round(sum(s["features"].get("total_clicks") or 0 for s in samples) / max(len(samples), 1), 1)

    return {
        "total_monitored_students": len(samples),
        "high_risk_count": high_risk,
        "moderate_risk_count": mod_risk,
        "low_risk_count": low_risk,
        "average_early_score": avg_score,
        "average_early_clicks": avg_clicks,
        "risk_breakdown": [
            {"name": "High Risk (>60%)", "value": high_risk, "color": "#e11d48"},
            {"name": "Moderate Risk (35-60%)", "value": mod_risk, "color": "#d97706"},
            {"name": "Low Risk (<35%)", "value": low_risk, "color": "#059669"}
        ]
    }

@app.get("/api/v1/students/sample")
def get_sample_students():
    return load_sample_students()

@app.post("/api/v1/predict", response_model=PredictionResponse)
def predict_single(features: StudentFeatures):
    feat_dict = features.model_dump() if hasattr(features, 'model_dump') else features.dict()
    result = engine.predict(feat_dict)
    return result

@app.post("/api/v1/what-if", response_model=WhatIfResponse)
def simulate_what_if(req: WhatIfRequest):
    base_dict = req.base_features.model_dump() if hasattr(req.base_features, 'model_dump') else req.base_features.dict()
    orig_pred = engine.predict(base_dict)
    
    simulated_dict = base_dict.copy()
    simulated_dict.update(req.modified_features)
    sim_pred = engine.predict(simulated_dict)
    
    delta = round(sim_pred["risk_score"] - orig_pred["risk_score"], 4)
    
    if delta < -0.05:
        summary = f"Simulated intervention reduces dropout risk by {abs(round(delta * 100, 1))}%. Significant positive impact!"
    elif delta > 0.05:
        summary = f"Simulated drop in engagement increases dropout risk by {round(delta * 100, 1)}%."
    else:
        summary = "Minimal change in predicted outcome with these adjustments."

    return {
        "original_risk_score": orig_pred["risk_score"],
        "simulated_risk_score": sim_pred["risk_score"],
        "risk_score_delta": delta,
        "original_level": orig_pred["risk_level"],
        "simulated_level": sim_pred["risk_level"],
        "impact_summary": summary
    }

@app.post("/api/v1/predict-batch")
async def predict_batch(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(e)}")
    
    results = []
    high = 0
    mod = 0
    low = 0
    
    for idx, row in df.iterrows():
        feat_dict = {col: (None if pd.isna(row.get(col, np.nan)) else row.get(col)) for col in engine.feature_cols}
        pred = engine.predict(feat_dict)
        if pred["risk_level"] == "High Risk":
            high += 1
        elif pred["risk_level"] == "Moderate Risk":
            mod += 1
        else:
            low += 1
            
        results.append({
            "id_student": int(row.get("id_student", idx + 1)),
            "code_module": str(row.get("code_module", "Module")),
            "risk_score": pred["risk_score"],
            "risk_level": pred["risk_level"],
            "top_factor": pred["top_factors"][0]["interpretation"] if pred["top_factors"] else "Normal activity"
        })
        
    return {
        "total_students": len(results),
        "high_risk_count": high,
        "moderate_risk_count": mod,
        "low_risk_count": low,
        "students": results
    }
