"""
OULAD Data Ingestion, Checkpoint Feature Engineering, and Model Training Pipeline.
Transforms the real Open University Learning Analytics Dataset (OULAD) into the
Academic Risk Monitor relational schema, fits unsupervised ML models (K-Means & Isolation Forest),
and publishes atomic assessments across Checkpoints W2, W4, and W6.
"""

import os
import sys
import hashlib
import json
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List

import numpy as np
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup workspace paths
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app.config import settings
from backend.app.db import Base, SessionLocal, engine
from backend.app.models import (
    Term, CourseOffering, Student, Enrollment, AttendanceRecord,
    Assessment, Submission, EngagementEvent, PriorAcademicRecord, FinalOutcome,
    FeatureSnapshot, ModelArtifact, ScoringRun, PublishedAssessment, User, AccessScope
)
from backend.app.security import hash_password
from backend.app.ml.feature_spec import ML_FEATURE_COLUMNS, FEATURE_DEFINITIONS
from backend.app.ml.preprocess import PreprocessingPipeline
from backend.app.ml.cluster import ClusterEngine
from backend.app.ml.anomaly import AnomalyEngine
from backend.app.ml.priority import ReviewPriorityEngine
from backend.app.ml.explain import SensitivityExplainer

# Locate OULAD dataset files
OULAD_DIR = None
CANDIDATE_PATHS = [
    os.path.join(ROOT_DIR, "Early warning system", "ML", "Data", "Oulad"),
    os.path.join(ROOT_DIR, "ML", "Data", "Oulad"),
    os.path.join(ROOT_DIR, "ml", "data", "oulad"),
]
for p in CANDIDATE_PATHS:
    if os.path.exists(p) and os.path.exists(os.path.join(p, "courses.csv")):
        OULAD_DIR = p
        break

if not OULAD_DIR:
    raise FileNotFoundError(f"Could not find Oulad directory in {CANDIDATE_PATHS}")

print(f"Using OULAD directory: {OULAD_DIR}")

# Deterministic name pool for realistic UI presentation of anonymized student IDs
FIRST_NAMES = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
    "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
    "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
    "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
    "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa",
    "Edward", "Deborah", "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon",
    "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy",
    "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen", "Stephen", "Anna",
    "Larry", "Brenda", "Justin", "Pamela", "Scott", "Nicole", "Brandon", "Emma",
    "Benjamin", "Samantha", "Samuel", "Katherine", "Gregory", "Christine", "Frank", "Debra",
    "Alexander", "Rachel", "Raymond", "Catherine", "Patrick", "Carolyn", "Jack", "Janet"
]
LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
    "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
    "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
    "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
    "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker",
    "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy",
    "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey",
    "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson", "Watson",
    "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes"
]

def make_deterministic_name(student_id: int):
    rng = random.Random(int(student_id))
    fn = rng.choice(FIRST_NAMES)
    ln = rng.choice(LAST_NAMES)
    return fn, ln

MODULE_METADATA = {
    "AAA": {"name": "Discovering the Arts and Humanities", "credits": 60, "instructor": "FAC-02"},
    "BBB": {"name": "Introduction to Business and Management", "credits": 60, "instructor": "FAC-02"},
    "CCC": {"name": "Computer Science & Software Development", "credits": 60, "instructor": "FAC-01"},
    "DDD": {"name": "Data Science & Technical Computing", "credits": 60, "instructor": "FAC-01"},
    "EEE": {"name": "Engineering: Design & Practice", "credits": 60, "instructor": "FAC-02"},
    "FFF": {"name": "Introducing Natural and Physical Sciences", "credits": 60, "instructor": "FAC-02"},
    "GGG": {"name": "Voices, Texts and Global Cultures", "credits": 60, "instructor": "FAC-02"},
}

TERM_METADATA = {
    "2014J": {"name": "Fall 2014 (Active)", "start": datetime(2014, 10, 1), "end": datetime(2015, 6, 30)},
    "2014B": {"name": "Spring 2014 (Evaluation)", "start": datetime(2014, 2, 1), "end": datetime(2014, 10, 1)},
    "2013J": {"name": "Fall 2013 (Training)", "start": datetime(2013, 10, 1), "end": datetime(2014, 6, 30)},
    "2013B": {"name": "Spring 2013 (Training)", "start": datetime(2013, 2, 1), "end": datetime(2013, 10, 1)},
}

def run_oulad_import():
    db = SessionLocal()
    print("Initializing clean schema for OULAD data ingestion...")
    Base.metadata.create_all(bind=engine)

    print("Clearing prior records for clean OULAD ingestion...")
    for model in [PublishedAssessment, FeatureSnapshot, FinalOutcome, AttendanceRecord,
                  Submission, Assessment, Enrollment, PriorAcademicRecord, Student,
                  CourseOffering, Term, ScoringRun, ModelArtifact]:
        db.query(model).delete()
    db.commit()

    # 1. Seed Demo Accounts
    print("1. Setting up demo role accounts...")
    default_pwd = hash_password("password123")
    demo_users = [
        {"id": "ADM-01", "name": "Elena Rostova", "email": "elena.rostova@campus.edu", "role": "admin"},
        {"id": "MEN-01", "name": "Dr. Sarah Chen", "email": "sarah.chen@campus.edu", "role": "mentor"},
        {"id": "MEN-02", "name": "Marcus Brody", "email": "marcus.brody@campus.edu", "role": "mentor"},
        {"id": "FAC-01", "name": "Prof. Alan Vance", "email": "alan.vance@campus.edu", "role": "faculty"},
        {"id": "FAC-02", "name": "Prof. Clara Oswald", "email": "clara.oswald@campus.edu", "role": "faculty"},
    ]
    for u in demo_users:
        existing = db.query(User).filter(User.user_id == u["id"]).first()
        if not existing:
            db.add(User(
                user_id=u["id"],
                email=u["email"],
                hashed_password=default_pwd,
                full_name=u["name"],
                role=u["role"],
                is_active=True
            ))
    db.commit()

    # 2. Seed Terms
    print("2. Seeding Academic Terms from OULAD...")
    for t_code, t_info in TERM_METADATA.items():
        existing = db.query(Term).filter(Term.term_code == t_code).first()
        if not existing:
            db.add(Term(
                term_code=t_code,
                term_name=t_info["name"],
                start_date=t_info["start"],
                end_date=t_info["end"]
            ))
    db.commit()

    # 3. Load Courses & Offerings from courses.csv
    print("3. Loading Course Offerings from courses.csv...")
    courses_df = pd.read_csv(os.path.join(OULAD_DIR, "courses.csv"))
    for _, row in courses_df.iterrows():
        mod = str(row["code_module"])
        pres = str(row["code_presentation"])
        meta = MODULE_METADATA.get(mod, {"name": f"Module {mod}", "credits": 60, "instructor": "FAC-01"})
        off_id = f"OFF-{mod}-{pres}"

        existing = db.query(CourseOffering).filter(CourseOffering.offering_id == off_id).first()
        if not existing:
            db.add(CourseOffering(
                offering_id=off_id,
                term_code=pres,
                course_code=mod,
                course_name=meta["name"],
                section="01",
                credits=meta["credits"],
                faculty_user_id=meta["instructor"]
            ))
    db.commit()

    # 4. Load Assessments
    print("4. Loading Assessments from assessments.csv...")
    assess_df = pd.read_csv(os.path.join(OULAD_DIR, "assessments.csv"))
    for _, row in assess_df.iterrows():
        a_id = f"ASM-{int(row['id_assessment'])}"
        off_id = f"OFF-{row['code_module']}-{row['code_presentation']}"
        t_start = TERM_METADATA.get(row['code_presentation'], {}).get("start", datetime(2014, 1, 1))
        
        # Calculate due date
        days_offset = float(row["date"]) if pd.notna(row["date"]) else 60.0
        due_utc = t_start + timedelta(days=days_offset)
        week_due = max(1, int(days_offset // 7))

        existing = db.query(Assessment).filter(Assessment.assessment_id == a_id).first()
        if not existing:
            db.add(Assessment(
                assessment_id=a_id,
                offering_id=off_id,
                name=f"{row['assessment_type']} {row['id_assessment']}",
                week_due=week_due,
                due_date_utc=due_utc,
                weight_pct=float(row["weight"]) if pd.notna(row["weight"]) else 10.0,
                max_score=100.0
            ))
    db.commit()

    # 5. Load Students, Prior Records, Enrollments, Outcomes
    print("5. Loading Students, Enrollments, and Final Outcomes from studentInfo.csv...")
    info_df = pd.read_csv(os.path.join(OULAD_DIR, "studentInfo.csv"))
    
    # Target presentations: 2014J as active, plus 2013J, 2013B, 2014B for historical depth
    # Sample or take all: 2014J has 8,818 enrollments. We ingest all 8,818 in 2014J plus 2,000 from 2013J for training reference
    info_2014j = info_df[info_df["code_presentation"] == "2014J"]
    info_train = info_df[info_df["code_presentation"].isin(["2013J", "2014B", "2013B"])].sample(n=2500, random_state=42)
    selected_info = pd.concat([info_2014j, info_train], ignore_index=True)

    print(f"Selected {len(selected_info)} enrollments for database ingestion ({len(info_2014j)} in active 2014J).")

    unique_students = selected_info.drop_duplicates(subset=["id_student"])
    existing_stu_ids = set(r[0] for r in db.query(Student.student_id).all())

    students_to_add = []
    prior_records_to_add = []

    edu_tier_map = {
        "No Formal quals": 0, "Lower Than A Level": 1, "A Level or Equivalent": 2,
        "HE Qualification": 3, "Post Graduate Qualification": 4
    }

    for _, row in unique_students.iterrows():
        s_raw_id = int(row["id_student"])
        s_id = f"STU-{s_raw_id}"
        if s_id not in existing_stu_ids:
            students_to_add.append(Student(
                student_id=s_id,
                first_name="Student",
                last_name=f"#{s_raw_id}",
                email=f"student.{s_raw_id}@campus.edu",
                cohort_year=2014
            ))
            existing_stu_ids.add(s_id)

            # Prior academic record
            tier = edu_tier_map.get(str(row["highest_education"]), 1)
            credits = int(row["studied_credits"]) if pd.notna(row["studied_credits"]) else 60
            prior_records_to_add.append(PriorAcademicRecord(
                record_id=f"PAR-{s_id}",
                student_id=s_id,
                prior_credits_earned=credits,
                entry_qualification_tier=tier,
                high_school_gpa=round(2.5 + (tier * 0.3), 2),
                available_at_utc=datetime(2014, 8, 1)
            ))

    if students_to_add:
        db.bulk_save_objects(students_to_add)
        db.commit()
    if prior_records_to_add:
        db.bulk_save_objects(prior_records_to_add)
        db.commit()

    # Enrollments and outcomes
    existing_enr_ids = set(r[0] for r in db.query(Enrollment.enrollment_id).all())
    enrollments_to_add = []
    outcomes_to_add = []

    for i, row in selected_info.iterrows():
        s_raw_id = int(row["id_student"])
        s_id = f"STU-{s_raw_id}"
        mod = str(row["code_module"])
        pres = str(row["code_presentation"])
        enr_id = f"ENR-{s_raw_id}-{mod}-{pres}"
        off_id = f"OFF-{mod}-{pres}"

        if enr_id not in existing_enr_ids:
            mentor = "MEN-01" if (s_raw_id % 2 == 0) else "MEN-02"
            t_start = TERM_METADATA.get(pres, {}).get("start", datetime(2014, 10, 1))
            enrollments_to_add.append(Enrollment(
                enrollment_id=enr_id,
                student_id=s_id,
                offering_id=off_id,
                enrolled_at_utc=t_start - timedelta(days=20),
                mentor_user_id=mentor,
                status="active"
            ))
            existing_enr_ids.add(enr_id)

            # Outcome
            res_str = str(row["final_result"])
            at_risk = 1 if res_str in ["Fail", "Withdrawn"] else 0
            outcomes_to_add.append(FinalOutcome(
                outcome_id=f"OUT-{enr_id}",
                enrollment_id=enr_id,
                outcome_status=res_str,
                final_grade=85.0 if res_str == "Distinction" else (65.0 if res_str == "Pass" else 40.0),
                letter_grade="A" if res_str == "Distinction" else ("B" if res_str == "Pass" else "F"),
                recorded_at_utc=t_start + timedelta(days=270)
            ))

    if enrollments_to_add:
        db.bulk_save_objects(enrollments_to_add)
        db.commit()
    if outcomes_to_add:
        db.bulk_save_objects(outcomes_to_add)
        db.commit()

    print(f"Persisted {len(enrollments_to_add)} enrollments into academic_risk.db.")

    # 6. Point-in-Time Checkpoint Feature Engineering
    print("6. Extracting Point-in-Time Checkpoint Features (W2, W4, W6)...")
    
    # Read studentVle chunks to get active_days, total_clicks, recent_clicks up to Day 14, 28, 42
    print("   Reading studentVle in streaming chunks for Day 14 (W2), Day 28 (W4), Day 42 (W6)...")
    vle_w2_chunks = []
    vle_w4_chunks = []
    vle_w6_chunks = []

    for chunk in pd.read_csv(os.path.join(OULAD_DIR, "studentVle.csv"), chunksize=2500000,
                             usecols=["code_module", "code_presentation", "id_student", "date", "sum_click"]):
        vle_w2_chunks.append(chunk[chunk["date"] <= 14])
        vle_w4_chunks.append(chunk[chunk["date"] <= 28])
        vle_w6_chunks.append(chunk[chunk["date"] <= 42])

    df_w2 = pd.concat(vle_w2_chunks, ignore_index=True)
    df_w4 = pd.concat(vle_w4_chunks, ignore_index=True)
    df_w6 = pd.concat(vle_w6_chunks, ignore_index=True)

    def aggregate_vle(df_sub, cutoff_day):
        df_sub["recent"] = df_sub["date"] > (cutoff_day - 7)
        g = df_sub.groupby(["code_module", "code_presentation", "id_student"])
        tot_clicks = g["sum_click"].sum()
        act_days = g["date"].nunique()
        recent_clicks = df_sub[df_sub["recent"]].groupby(["code_module", "code_presentation", "id_student"])["sum_click"].sum()
        
        agg = pd.DataFrame({"total_clicks": tot_clicks, "active_days": act_days}).join(recent_clicks.rename("recent_clicks")).fillna(0)
        agg["recent_activity_ratio"] = (agg["recent_clicks"] / agg["total_clicks"]).fillna(0.2)
        agg["attendance_rate"] = ((agg["active_days"] / (cutoff_day / 2.0)) * 100.0).clip(0, 100).round(1)
        return agg.reset_index()

    vle_agg_w2 = aggregate_vle(df_w2, 14)
    vle_agg_w4 = aggregate_vle(df_w4, 28)
    vle_agg_w6 = aggregate_vle(df_w6, 42)

    # Assessments up to cutoff
    sa_df = pd.read_csv(os.path.join(OULAD_DIR, "studentAssessment.csv"))
    assess_clean = assess_df[["id_assessment", "code_module", "code_presentation", "date"]].copy()
    sa_merged = sa_df.merge(assess_clean, on="id_assessment", how="inner")

    def aggregate_coursework(cutoff_day):
        # Assessments due by cutoff
        due_asms = assess_clean[(assess_clean["date"] <= cutoff_day)]
        due_counts = due_asms.groupby(["code_module", "code_presentation"]).size().rename("n_due").reset_index()

        # Student submissions by cutoff
        sub_cut = sa_merged[sa_merged["date_submitted"] <= cutoff_day]
        sub_agg = sub_cut.groupby(["code_module", "code_presentation", "id_student"]).agg(
            n_submitted=("id_assessment", "nunique"),
            assessment_avg_score=("score", "mean")
        ).reset_index()

        res = sub_agg.merge(due_counts, on=["code_module", "code_presentation"], how="left")
        res["n_due"] = res["n_due"].fillna(0)
        res["overdue_submissions_count"] = (res["n_due"] - res["n_submitted"]).clip(lower=0)
        return res

    cw_w2 = aggregate_coursework(14)
    cw_w4 = aggregate_coursework(28)
    cw_w6 = aggregate_coursework(42)

    # Merge features per checkpoint
    checkpoints_data = {
        "W2": {"vle": vle_agg_w2, "cw": cw_w2, "cutoff_day": 14},
        "W4": {"vle": vle_agg_w4, "cw": cw_w4, "cutoff_day": 28},
        "W6": {"vle": vle_agg_w6, "cw": cw_w6, "cutoff_day": 42},
    }

    artifacts_dir = settings.ARTIFACTS_DIR
    os.makedirs(artifacts_dir, exist_ok=True)

    # 7. Unsupervised Model Fitting on Training Terms (2013J, 2013B, 2014B)
    print("7. Training & Activating Checkpoint Models (K-Means & Isolation Forest)...")
    fitted_models = {}

    for ck in ["W2", "W4", "W6"]:
        c_info = checkpoints_data[ck]
        vle_df = c_info["vle"]
        cw_df = c_info["cw"]

        # Full joined feature frame for training terms
        base_df = selected_info[["code_module", "code_presentation", "id_student", "studied_credits", "highest_education"]].copy()
        feat_df = base_df.merge(vle_df, on=["code_module", "code_presentation", "id_student"], how="left")
        feat_df = feat_df.merge(cw_df, on=["code_module", "code_presentation", "id_student"], how="left")

        edu_gpa_map = {
            "No Formal quals": 2.2,
            "Lower Than A Level": 2.6,
            "A Level or Equivalent": 3.0,
            "HE Qualification": 3.4,
            "Post Graduate Qualification": 3.8
        }
        feat_df["high_school_gpa"] = feat_df["highest_education"].map(edu_gpa_map).fillna(2.8)
        feat_df["prior_credits_earned"] = feat_df["studied_credits"].fillna(60.0)

        # Fill defaults for observed quantities
        feat_df["total_clicks"] = feat_df["total_clicks"].fillna(0.0)
        feat_df["active_study_days"] = feat_df["active_days"].fillna(0.0)
        feat_df["attendance_rate"] = feat_df["attendance_rate"].fillna(15.0)
        feat_df["recent_activity_ratio"] = feat_df["recent_activity_ratio"].fillna(0.1)
        feat_df["assessment_avg_score"] = feat_df["assessment_avg_score"].fillna(55.0)
        feat_df["overdue_submissions_count"] = feat_df["overdue_submissions_count"].fillna(0.0)

        # Chronological Split: Train on 2013J, 2013B, 2014B
        train_split = feat_df[feat_df["code_presentation"].isin(["2013J", "2013B", "2014B"])]
        if len(train_split) < 500:
            train_split = feat_df.sample(n=min(3000, len(feat_df)), random_state=42)

        # Fit ML components
        preprocessor = PreprocessingPipeline(ML_FEATURE_COLUMNS)
        X_train_scaled = preprocessor.fit_transform(train_split[ML_FEATURE_COLUMNS])

        clusterer = ClusterEngine(n_clusters=4, random_state=42)
        clusterer.fit(X_train_scaled, train_split[ML_FEATURE_COLUMNS])

        anomaly_engine = AnomalyEngine(contamination=0.12, random_state=42)
        anomaly_engine.fit(X_train_scaled)

        # Artifact persistence with SHA256 checksum
        version_id = f"OULAD-{ck}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        artifact_path = os.path.join(artifacts_dir, f"model_{version_id}.joblib")
        
        bundle = {
            "version_id": version_id,
            "checkpoint": ck,
            "feature_columns": ML_FEATURE_COLUMNS,
            "feature_medians": preprocessor.feature_medians,
            "cluster_profiles": clusterer.cluster_profiles,
            "reference_anomaly_scores": anomaly_engine.reference_scores.tolist(),
            "package_versions": {"scikit_learn": "1.4.1", "pandas": "2.2.0"}
        }
        
        import joblib
        joblib.dump({
            "preprocessor": preprocessor,
            "clusterer": clusterer,
            "anomaly_engine": anomaly_engine,
            "meta": bundle
        }, artifact_path)

        with open(artifact_path, "rb") as f:
            checksum = hashlib.sha256(f.read()).hexdigest()

        # Deactivate older models and activate this candidate
        db.query(ModelArtifact).filter(ModelArtifact.checkpoint == ck).update({"is_active": False})
        mod_art = ModelArtifact(
            version_id=version_id,
            checkpoint=ck,
            algorithm_type="KMeans+IsolationForest",
            artifact_path=artifact_path,
            integrity_checksum=checksum,
            training_window_terms="2013J, 2013B, 2014B",
            is_active=True,
            cluster_profiles_json=clusterer.cluster_profiles
        )
        db.add(mod_art)
        db.commit()

        fitted_models[ck] = {
            "version_id": version_id,
            "preprocessor": preprocessor,
            "clusterer": clusterer,
            "anomaly_engine": anomaly_engine,
            "feat_df": feat_df
        }
        print(f"   Checkpoint {ck} model fitted and activated (ID: {version_id})")

    # 8. Batch Scoring on Active Presentation 2014J
    print("8. Scoring Active Enrollments in 2014J across Checkpoints W2, W4, W6...")
    priority_engine = ReviewPriorityEngine()

    for ck in ["W2", "W4", "W6"]:
        model_ctx = fitted_models[ck]
        preprocessor = model_ctx["preprocessor"]
        clusterer = model_ctx["clusterer"]
        anomaly_engine = model_ctx["anomaly_engine"]
        version_id = model_ctx["version_id"]
        feat_df = model_ctx["feat_df"]

        explainer = SensitivityExplainer(preprocessor, anomaly_engine)

        run_id = f"RUN-2014J-{ck}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        scoring_run = ScoringRun(
            run_id=run_id,
            term_code="2014J",
            checkpoint=ck,
            model_version_id=version_id,
            status="running"
        )
        db.add(scoring_run)
        db.commit()

        # Score all enrollments in 2014J
        active_enrollments = feat_df[feat_df["code_presentation"] == "2014J"]
        print(f"   Scoring {len(active_enrollments)} enrollments for Checkpoint {ck}...")

        published_records = []
        counts = {"High": 0, "Monitor": 0, "Routine": 0, "Insufficient data": 0}

        X_act_scaled = preprocessor.transform(active_enrollments[ML_FEATURE_COLUMNS])
        pred_clusters = clusterer.predict(X_act_scaled)
        anom_scores = anomaly_engine.score(X_act_scaled)
        anom_pcts = [anomaly_engine.score_to_percentile(s) for s in anom_scores]

        t_start = TERM_METADATA["2014J"]["start"]
        cutoff_utc = t_start + timedelta(days=checkpoints_data[ck]["cutoff_day"])

        snapshots_to_add = []
        for idx, (_, row) in enumerate(active_enrollments.iterrows()):
            s_raw_id = int(row["id_student"])
            mod = str(row["code_module"])
            enr_id = f"ENR-{s_raw_id}-{mod}-2014J"

            features = {col: float(row[col]) for col in ML_FEATURE_COLUMNS}
            coverage = {
                "attendance": float(row["active_study_days"]) > 1,
                "coursework": float(row["assessment_avg_score"]) > 0 or ck == "W2",
                "engagement": float(row["total_clicks"]) > 5,
                "academic_background": True
            }

            cluster_id = int(pred_clusters[idx])
            cluster_label = clusterer.get_profile_by_id(cluster_id).get("label", "Profile")
            anom_pct = float(anom_pcts[idx])

            # Efficient local sensitivity: calculate when anomaly rank >= 90% or for top review candidates
            if anom_pct >= 90.0 and idx < 150:
                sensitivities = explainer.explain_enrollment(features)
            else:
                sensitivities = []

            # 5-path decision policy
            eval_res = priority_engine.evaluate_priority(
                features=features,
                coverage=coverage,
                anomaly_percentile=anom_pct,
                score_sensitivities=sensitivities
            )
            priority = eval_res["priority"]
            counts[priority] = counts.get(priority, 0) + 1

            att_val = round(float(features.get("attendance_rate", 100.0)), 1)
            cw_val = round(float(features.get("assessment_avg_score", 0.0)), 1)
            overdue_val = int(features.get("overdue_submissions_count", 0))
            clicks_val = int(features.get("total_clicks", 0))
            days_val = int(features.get("active_study_days", 0))
            ratio_val = round(float(features.get("recent_activity_ratio", 0.0)) * 100, 1)

            att_concern = att_val < 70.0
            cw_concern = cw_val < 60.0 or overdue_val > 0
            eng_concern = days_val < 4 or clicks_val < 40

            evidence_breakdown = {
                "attendance": {
                    "value": f"{att_val}%",
                    "denominator": "Session attendance rate",
                    "status": "Concerning" if att_concern else "Adequate"
                },
                "coursework": {
                    "value": f"{cw_val}%",
                    "denominator": f"Continuous assessment ({overdue_val} overdue)",
                    "status": "Concerning" if cw_concern else "Adequate"
                },
                "engagement": {
                    "value": f"{clicks_val} clicks",
                    "denominator": f"{days_val} active days ({ratio_val}% recent)",
                    "status": "Concerning" if eng_concern else "Adequate"
                },
                "coverage": {
                    "has_sufficient_coverage": True,
                    "covered_families_count": 3
                }
            }
            for col in ML_FEATURE_COLUMNS:
                evidence_breakdown[col] = {
                    "value": round(float(features.get(col, 0.0)), 2),
                    "is_concerning": (
                        (col == "attendance_rate" and att_concern) or
                        (col == "assessment_avg_score" and cw_val < 60.0) or
                        (col == "overdue_submissions_count" and overdue_val >= 1) or
                        (col == "active_study_days" and days_val < 4) or
                        (col == "total_clicks" and clicks_val < 40)
                    )
                }

            # Feature snapshot
            snapshots_to_add.append(FeatureSnapshot(
                snapshot_id=f"FS-{enr_id}-{ck}",
                enrollment_id=enr_id,
                checkpoint=ck,
                cutoff_time_utc=cutoff_utc,
                features_json=features,
                coverage_json=coverage,
                has_sufficient_coverage=True
            ))

            record_id = f"PUB-{enr_id}-{ck}"
            published_records.append(PublishedAssessment(
                assessment_record_id=record_id,
                enrollment_id=enr_id,
                run_id=run_id,
                checkpoint=ck,
                review_priority=priority,
                cluster_id=cluster_id,
                cluster_label=cluster_label,
                anomaly_score=float(anom_scores[idx]),
                anomaly_percentile=round(anom_pct, 1),
                policy_path_taken=eval_res["policy_path"],
                primary_triggers_json=eval_res["primary_triggers"],
                evidence_breakdown_json=evidence_breakdown,
                score_sensitivities_json=sensitivities
            ))

        # Clear and bulk insert feature snapshots & published assessments
        db.query(FeatureSnapshot).filter(
            FeatureSnapshot.checkpoint == ck,
            FeatureSnapshot.enrollment_id.in_([p.enrollment_id for p in published_records])
        ).delete(synchronize_session=False)

        db.query(PublishedAssessment).filter(
            PublishedAssessment.checkpoint == ck,
            PublishedAssessment.enrollment_id.in_([p.enrollment_id for p in published_records])
        ).delete(synchronize_session=False)

        db.bulk_save_objects(snapshots_to_add)
        db.bulk_save_objects(published_records)

        scoring_run.status = "completed"
        scoring_run.total_scored = len(published_records)
        scoring_run.high_priority_count = counts.get("High", 0)
        scoring_run.monitor_count = counts.get("Monitor", 0)
        scoring_run.routine_count = counts.get("Routine", 0)
        scoring_run.insufficient_data_count = counts.get("Insufficient data", 0)
        scoring_run.completed_at = datetime.utcnow()
        db.commit()

        print(f"   Checkpoint {ck} scoring published atomically! Total: {len(published_records)} (High: {counts['High']}, Monitor: {counts['Monitor']}, Routine: {counts['Routine']})")

    db.close()
    print("OULAD data ingestion, model fitting, and batch scoring completed successfully!")

if __name__ == "__main__":
    run_oulad_import()
