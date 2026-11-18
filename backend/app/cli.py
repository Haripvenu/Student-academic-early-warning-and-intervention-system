"""
Command-Line Interface for Academic Risk Monitor.
Provides commands for database seeding, training, scoring, and evaluation.
"""

import os
import sys
import argparse
from datetime import datetime
from .db import init_db, SessionLocal
from .models import (
    User, Term, CourseOffering, Student, Enrollment,
    AttendanceRecord, Assessment, Submission, EngagementEvent,
    PriorAcademicRecord, FinalOutcome
)
from .security import hash_password
from .ml.train import train_checkpoint_model
from .services.scoring import ScoringService
from .ml.evaluate import evaluate_retrospective_performance

def seed_database():
    print("Initializing schema and seeding demo accounts & synthetic data...")
    init_db()
    db = SessionLocal()

    try:
        # 1. Create standard demo users
        users = [
            {"id": "MEN-01", "name": "Dr. Sarah Chen", "email": "sarah.chen@campus.edu", "role": "mentor"},
            {"id": "MEN-02", "name": "Marcus Brody", "email": "marcus.brody@campus.edu", "role": "mentor"},
            {"id": "FAC-01", "name": "Prof. Alan Vance", "email": "alan.vance@campus.edu", "role": "faculty"},
            {"id": "FAC-02", "name": "Prof. Clara Oswald", "email": "clara.oswald@campus.edu", "role": "faculty"},
            {"id": "ADM-01", "name": "Elena Rostova", "email": "elena.rostova@campus.edu", "role": "admin"}
        ]
        default_pwd = hash_password("password123")
        for u in users:
            existing = db.query(User).filter(User.user_id == u["id"]).first()
            if not existing:
                db.add(User(
                    user_id=u["id"],
                    email=u["email"],
                    full_name=u["name"],
                    role=u["role"],
                    hashed_password=default_pwd
                ))
        db.commit()

        # Check if OULAD dataset exists
        oulad_path = os.path.join(base_dir, "Early warning system", "ML", "Data", "Oulad")
        if os.path.exists(oulad_path):
            from scripts.import_oulad_data import run_oulad_import
            run_oulad_import()
            return

        # 2. Load generated synthetic CSVs if available
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        syn_dir = os.path.join(base_dir, "data", "synthetic")

        if not os.path.exists(os.path.join(syn_dir, "terms.csv")):
            print("Synthetic data not found on disk. Generating now...")
            from scripts.generate_demo_data import generate_dataset
            generate_dataset()

        import pandas as pd
        # Terms
        terms_df = pd.read_csv(os.path.join(syn_dir, "terms.csv"))
        for _, r in terms_df.iterrows():
            db.merge(Term(
                term_code=r["term_code"],
                term_name=r["term_name"],
                start_date=datetime.fromisoformat(r["start_date"].replace("Z", "+00:00")),
                end_date=datetime.fromisoformat(r["end_date"].replace("Z", "+00:00"))
            ))

        # Course Offerings
        off_df = pd.read_csv(os.path.join(syn_dir, "course_offerings.csv"))
        for _, r in off_df.iterrows():
            db.merge(CourseOffering(
                offering_id=r["offering_id"],
                term_code=r["term_code"],
                course_code=r["course_code"],
                course_name=r["course_name"],
                section=str(r["section"]),
                credits=int(r["credits"]),
                faculty_user_id=r["faculty_user_id"]
            ))

        # Students
        stu_df = pd.read_csv(os.path.join(syn_dir, "students.csv"))
        for _, r in stu_df.iterrows():
            db.merge(Student(
                student_id=r["student_id"],
                first_name=r["first_name"],
                last_name=r["last_name"],
                email=r["email"],
                cohort_year=int(r["cohort_year"])
            ))

        # Prior records
        priors_df = pd.read_csv(os.path.join(syn_dir, "prior_academic_records.csv"))
        for _, r in priors_df.iterrows():
            db.merge(PriorAcademicRecord(
                record_id=r["record_id"],
                student_id=r["student_id"],
                high_school_gpa=float(r["high_school_gpa"]),
                prior_credits_earned=int(r["prior_credits_earned"]),
                entry_qualification_tier=int(r["entry_qualification_tier"]),
                available_at_utc=datetime.fromisoformat(r["available_at_utc"].replace("Z", "+00:00"))
            ))

        # Enrollments
        enr_df = pd.read_csv(os.path.join(syn_dir, "enrollments.csv"))
        for _, r in enr_df.iterrows():
            db.merge(Enrollment(
                enrollment_id=r["enrollment_id"],
                student_id=r["student_id"],
                offering_id=r["offering_id"],
                enrolled_at_utc=datetime.fromisoformat(r["enrolled_at_utc"].replace("Z", "+00:00")),
                status=r["status"],
                mentor_user_id=r["mentor_user_id"]
            ))

        # Assessments
        asm_df = pd.read_csv(os.path.join(syn_dir, "assessments.csv"))
        for _, r in asm_df.iterrows():
            db.merge(Assessment(
                assessment_id=r["assessment_id"],
                offering_id=r["offering_id"],
                name=r["name"],
                week_due=int(r["week_due"]),
                due_date_utc=datetime.fromisoformat(r["due_date_utc"].replace("Z", "+00:00")),
                weight_pct=float(r["weight_pct"]),
                max_score=float(r["max_score"])
            ))

        # Attendance
        att_df = pd.read_csv(os.path.join(syn_dir, "attendance.csv"))
        for _, r in att_df.iterrows():
            db.merge(AttendanceRecord(
                attendance_id=r["attendance_id"],
                enrollment_id=r["enrollment_id"],
                session_date=r["session_date"],
                status=r["status"],
                event_timestamp_utc=datetime.fromisoformat(r["event_timestamp_utc"].replace("Z", "+00:00")),
                available_at_utc=datetime.fromisoformat(r["available_at_utc"].replace("Z", "+00:00"))
            ))

        # Submissions
        sub_df = pd.read_csv(os.path.join(syn_dir, "submissions.csv"))
        for _, r in sub_df.iterrows():
            sub_dt = datetime.fromisoformat(r["submitted_at_utc"].replace("Z", "+00:00")) if pd.notna(r["submitted_at_utc"]) else None
            score_val = float(r["score"]) if pd.notna(r["score"]) else None
            db.merge(Submission(
                submission_id=r["submission_id"],
                assessment_id=r["assessment_id"],
                enrollment_id=r["enrollment_id"],
                submitted_at_utc=sub_dt,
                score=score_val,
                is_released=bool(r["is_released"]),
                available_at_utc=datetime.fromisoformat(r["available_at_utc"].replace("Z", "+00:00"))
            ))

        # Engagement
        eng_df = pd.read_csv(os.path.join(syn_dir, "engagement_events.csv"))
        for _, r in eng_df.iterrows():
            db.merge(EngagementEvent(
                event_id=r["event_id"],
                enrollment_id=r["enrollment_id"],
                event_type=r["event_type"],
                event_timestamp_utc=datetime.fromisoformat(r["event_timestamp_utc"].replace("Z", "+00:00")),
                session_duration_minutes=float(r["session_duration_minutes"]),
                clicks_count=int(r["clicks_count"]),
                available_at_utc=datetime.fromisoformat(r["available_at_utc"].replace("Z", "+00:00"))
            ))

        # Final Outcomes
        out_df = pd.read_csv(os.path.join(syn_dir, "final_outcomes.csv"))
        for _, r in out_df.iterrows():
            db.merge(FinalOutcome(
                outcome_id=r["outcome_id"],
                enrollment_id=r["enrollment_id"],
                final_grade=float(r["final_grade"]),
                letter_grade=r["letter_grade"],
                outcome_status=r["outcome_status"],
                recorded_at_utc=datetime.fromisoformat(r["recorded_at_utc"].replace("Z", "+00:00"))
            ))

        db.commit()
        print("Database successfully seeded with multi-term academic fixtures!")

    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description="Academic Risk Monitor CLI")
    subparsers = parser.add_subparsers(dest="command")

    # Seed
    subparsers.add_parser("seed", help="Seed database with synthetic cohorts and users")

    # Train
    train_p = subparsers.add_parser("train", help="Train models for checkpoint")
    train_p.add_argument("--checkpoint", default="W4", help="Checkpoint (W2, W4, W6)")

    # Score
    score_p = subparsers.add_parser("score", help="Score active term enrollments")
    score_p.add_argument("--term", default="2014J", help="Term code")
    score_p.add_argument("--checkpoint", default="W4", help="Checkpoint")

    # Evaluate
    eval_p = subparsers.add_parser("evaluate", help="Retrospective evaluation report")
    eval_p.add_argument("--checkpoint", default="W4", help="Checkpoint")

    args = parser.parse_args()

    if args.command == "seed":
        seed_database()
    elif args.command == "train":
        db = SessionLocal()
        train_checkpoint_model(db, checkpoint=args.checkpoint)
        db.close()
    elif args.command == "score":
        db = SessionLocal()
        ScoringService.run_scoring(db, term_code=args.term, checkpoint=args.checkpoint)
        db.close()
    elif args.command == "evaluate":
        db = SessionLocal()
        res = evaluate_retrospective_performance(db, checkpoint=args.checkpoint)
        import pprint
        pprint.pprint(res)
        db.close()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
