#!/usr/bin/env python3
"""
Deterministic Multi-Term Synthetic Data Generator for Academic Risk Monitor.
Generates realistic institutional academic records across 3 terms:
- 2024-F (Historical training cohort)
- 2025-S (Historical validation & calibration cohort)
- 2025-F (Current active scoring & mentor triage cohort)

Generates point-in-time events with dual timestamps (event_time & available_at_utc),
distinct missingness states, and diverse risk archetypes for unsupervised ML evaluation.
"""

import os
import random
import csv
from datetime import datetime, timedelta

SEED = 42
random.seed(SEED)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic")
os.makedirs(OUTPUT_DIR, exist_ok=True)

TERMS = [
    {"code": "2024-F", "name": "Fall 2024", "start": "2024-09-02T00:00:00Z", "end": "2024-12-20T23:59:59Z"},
    {"code": "2025-S", "name": "Spring 2025", "start": "2025-01-13T00:00:00Z", "end": "2025-05-09T23:59:59Z"},
    {"code": "2025-F", "name": "Fall 2025", "start": "2025-09-01T00:00:00Z", "end": "2025-12-19T23:59:59Z"},
]

COURSES = [
    {"code": "CS101", "name": "Intro to Computer Science", "credits": 4, "faculty": "FAC-01"},
    {"code": "MATH201", "name": "Linear Algebra & Calculus", "credits": 4, "faculty": "FAC-02"},
    {"code": "ENG105", "name": "Engineering Physics & Mechanics", "credits": 3, "faculty": "FAC-03"},
    {"code": "DATA102", "name": "Principles of Data Science", "credits": 3, "faculty": "FAC-01"},
    {"code": "BIO110", "name": "Cellular Biology & Genetics", "credits": 4, "faculty": "FAC-04"},
]

FIRST_NAMES = ["Marcus", "Elena", "Devon", "Aaliyah", "Liam", "Sophia", "Noah", "Olivia", "James", "Emma",
               "Lucas", "Mia", "Benjamin", "Charlotte", "Henry", "Amelia", "Alexander", "Harper", "Ethan", "Evelyn"]
LAST_NAMES = ["Vance", "Rios", "Zhao", "Patel", "O'Connor", "Kim", "Smith", "Johnson", "Williams", "Brown",
              "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson"]

def parse_iso(iso_str):
    return datetime.fromisoformat(iso_str.replace("Z", "+00:00"))

def to_iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

def generate_dataset():
    print(f"Generating deterministic synthetic data (Seed: {SEED})...")

    # 1. Terms
    terms_file = os.path.join(OUTPUT_DIR, "terms.csv")
    with open(terms_file, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["term_code", "term_name", "start_date", "end_date"])
        for t in TERMS:
            w.writerow([t["code"], t["name"], t["start"], t["end"]])

    # 2. Offerings
    offerings = []
    offerings_file = os.path.join(OUTPUT_DIR, "course_offerings.csv")
    with open(offerings_file, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["offering_id", "term_code", "course_code", "course_name", "section", "credits", "faculty_user_id"])
        for t in TERMS:
            for c in COURSES:
                off_id = f"OFF-{c['code']}-{t['code']}"
                offerings.append({"offering_id": off_id, "term_code": t["code"], "course": c, "start": parse_iso(t["start"])})
                w.writerow([off_id, t["code"], c["code"], c["name"], "01", c["credits"], c["faculty"]])

    # 3. Students & Prior Academic Records
    total_students = 120
    students = []
    students_file = os.path.join(OUTPUT_DIR, "students.csv")
    priors_file = os.path.join(OUTPUT_DIR, "prior_academic_records.csv")

    with open(students_file, "w", newline="", encoding="utf-8") as fs, \
         open(priors_file, "w", newline="", encoding="utf-8") as fp:
        ws = csv.writer(fs)
        wp = csv.writer(fp)
        ws.writerow(["student_id", "first_name", "last_name", "email", "cohort_year"])
        wp.writerow(["record_id", "student_id", "high_school_gpa", "prior_credits_earned", "entry_qualification_tier", "available_at_utc"])

        for i in range(1, total_students + 1):
            stu_id = f"STU-{1000 + i}"
            fname = random.choice(FIRST_NAMES)
            lname = random.choice(LAST_NAMES)
            email = f"{fname.lower()}.{lname.lower()}{i}@campus.edu"
            cohort = 2024 if i <= 60 else 2025
            students.append({"student_id": stu_id, "first_name": fname, "last_name": lname, "email": email, "idx": i})
            ws.writerow([stu_id, fname, lname, email, cohort])

            # Prior academic record
            gpa = round(random.gauss(3.1, 0.45), 2)
            gpa = max(2.0, min(4.0, gpa))
            credits_earned = random.choice([0, 15, 30, 45, 60])
            tier = 3 if gpa >= 3.5 else (2 if gpa >= 2.8 else 1)
            wp.writerow([f"REC-{1000 + i}", stu_id, gpa, credits_earned, tier, "2024-08-01T00:00:00Z"])

    # 4. Enrollments across terms
    enrollments = []
    enrollments_file = os.path.join(OUTPUT_DIR, "enrollments.csv")
    mentors = ["MEN-01", "MEN-02", "MEN-03"]

    with open(enrollments_file, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["enrollment_id", "student_id", "offering_id", "enrolled_at_utc", "status", "mentor_user_id"])

        for off in offerings:
            term_code = off["term_code"]
            term_students = students[:50] if term_code == "2024-F" else (students[30:80] if term_code == "2025-S" else students[60:])
            # enroll ~25-30 students per course
            chosen = random.sample(term_students, min(28, len(term_students)))
            for s in chosen:
                enr_id = f"ENR-{s['student_id']}-{off['course']['code']}-{term_code}"
                mentor = random.choice(mentors)
                enroll_date = off["start"] - timedelta(days=random.randint(5, 14))
                archetype = determine_archetype(s["idx"], off["course"]["code"])
                enrollments.append({
                    "enrollment_id": enr_id,
                    "student_id": s["student_id"],
                    "offering_id": off["offering_id"],
                    "offering": off,
                    "mentor": mentor,
                    "archetype": archetype
                })
                w.writerow([enr_id, s["student_id"], off["offering_id"], to_iso(enroll_date), "active", mentor])

    # 5. Assessments definitions
    assessments = []
    assessments_file = os.path.join(OUTPUT_DIR, "assessments.csv")
    with open(assessments_file, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["assessment_id", "offering_id", "name", "week_due", "due_date_utc", "weight_pct", "max_score"])
        for off in offerings:
            # Checkpoint Week 2 quiz, Week 3 lab, Week 4 assignment, Week 6 midterm
            schedule = [
                ("Quiz 1: Fundamentals", 2, 10, 100),
                ("Lab 1: Application", 3, 15, 100),
                ("Assignment 1: Comprehensive", 4, 20, 100),
                ("Midterm Assessment", 6, 25, 100)
            ]
            for idx, (name, wk, wt, mx) in enumerate(schedule, 1):
                asm_id = f"ASM-{off['course']['code']}-{off['term_code']}-{idx:02d}"
                due_dt = off["start"] + timedelta(days=wk * 7)
                assessments.append({"assessment_id": asm_id, "offering_id": off["offering_id"], "week": wk, "due_date": due_dt, "max_score": mx, "offering": off})
                w.writerow([asm_id, off["offering_id"], name, wk, to_iso(due_dt), wt, mx])

    # 6. Attendance, Submissions, Engagement Events & Final Outcomes
    att_file = os.path.join(OUTPUT_DIR, "attendance.csv")
    sub_file = os.path.join(OUTPUT_DIR, "submissions.csv")
    eng_file = os.path.join(OUTPUT_DIR, "engagement_events.csv")
    out_file = os.path.join(OUTPUT_DIR, "final_outcomes.csv")

    with open(att_file, "w", newline="", encoding="utf-8") as fa, \
         open(sub_file, "w", newline="", encoding="utf-8") as fs, \
         open(eng_file, "w", newline="", encoding="utf-8") as fe, \
         open(out_file, "w", newline="", encoding="utf-8") as fo:

        wa = csv.writer(fa)
        ws = csv.writer(fs)
        we = csv.writer(fe)
        wo = csv.writer(fo)

        wa.writerow(["attendance_id", "enrollment_id", "session_date", "status", "event_timestamp_utc", "available_at_utc"])
        ws.writerow(["submission_id", "assessment_id", "enrollment_id", "submitted_at_utc", "score", "is_released", "available_at_utc"])
        we.writerow(["event_id", "enrollment_id", "event_type", "event_timestamp_utc", "session_duration_minutes", "clicks_count", "available_at_utc"])
        wo.writerow(["outcome_id", "enrollment_id", "final_grade", "letter_grade", "outcome_status", "recorded_at_utc"])

        att_counter = 1
        sub_counter = 1
        evt_counter = 1

        for enr in enrollments:
            off = enr["offering"]
            arch = enr["archetype"]
            start_dt = off["start"]

            # Attendance sessions: 2 per week for weeks 1 to 6 (12 sessions total)
            for sess_idx in range(12):
                day_offset = (sess_idx // 2) * 7 + (1 if sess_idx % 2 == 0 else 3)
                sess_dt = start_dt + timedelta(days=day_offset, hours=10)
                avail_dt = sess_dt + timedelta(hours=random.randint(2, 8))

                # Archetype behavior
                if arch == "insufficient_data":
                    # Attendance unrecorded feed
                    if sess_idx < 3:
                        wa.writerow([f"ATT-{att_counter:06d}", enr["enrollment_id"], sess_dt.strftime("%Y-%m-%d"), "present", to_iso(sess_dt), to_iso(avail_dt)])
                        att_counter += 1
                elif arch == "high_risk":
                    status = "present" if random.random() < 0.35 else "absent"
                    wa.writerow([f"ATT-{att_counter:06d}", enr["enrollment_id"], sess_dt.strftime("%Y-%m-%d"), status, to_iso(sess_dt), to_iso(avail_dt)])
                    att_counter += 1
                elif arch == "moderate_struggle":
                    status = "present" if random.random() < 0.60 else "absent"
                    wa.writerow([f"ATT-{att_counter:06d}", enr["enrollment_id"], sess_dt.strftime("%Y-%m-%d"), status, to_iso(sess_dt), to_iso(avail_dt)])
                    att_counter += 1
                elif arch == "high_anomaly": # High performer with unusual behavior
                    status = "present" if random.random() < 0.70 else "absent"
                    wa.writerow([f"ATT-{att_counter:06d}", enr["enrollment_id"], sess_dt.strftime("%Y-%m-%d"), status, to_iso(sess_dt), to_iso(avail_dt)])
                    att_counter += 1
                else: # routine high/average
                    status = "present" if random.random() < 0.92 else "absent"
                    wa.writerow([f"ATT-{att_counter:06d}", enr["enrollment_id"], sess_dt.strftime("%Y-%m-%d"), status, to_iso(sess_dt), to_iso(avail_dt)])
                    att_counter += 1

            # Submissions for assessments matching this offering
            off_asms = [a for a in assessments if a["offering_id"] == off["offering_id"]]
            grades_list = []
            for a in off_asms:
                due_dt = a["due_date"]
                if arch == "insufficient_data":
                    continue # No released submissions yet
                elif arch == "high_risk":
                    # Often misses or submits late with low score
                    if random.random() < 0.40:
                        # Missed!
                        continue
                    sub_dt = due_dt + timedelta(hours=random.randint(12, 72)) # late
                    score = round(random.uniform(35.0, 58.0), 1)
                elif arch == "moderate_struggle":
                    sub_dt = due_dt + timedelta(hours=random.randint(-12, 24))
                    score = round(random.uniform(55.0, 72.0), 1)
                elif arch == "high_anomaly":
                    sub_dt = due_dt - timedelta(hours=random.randint(24, 72))
                    score = round(random.uniform(92.0, 99.0), 1)
                else:
                    sub_dt = due_dt - timedelta(hours=random.randint(4, 48))
                    score = round(random.uniform(78.0, 96.0), 1)

                avail_dt = sub_dt + timedelta(hours=random.randint(12, 36))
                grades_list.append(score)
                ws.writerow([f"SUB-{sub_counter:06d}", a["assessment_id"], enr["enrollment_id"], to_iso(sub_dt), score, True, to_iso(avail_dt)])
                sub_counter += 1

            # Engagement events
            num_events = 25
            if arch == "high_risk":
                num_events = random.randint(3, 8)
            elif arch == "moderate_struggle":
                num_events = random.randint(12, 20)
            elif arch == "high_anomaly":
                num_events = random.randint(60, 110) # very high activity outlier
            elif arch == "insufficient_data":
                num_events = random.randint(1, 3)

            for ev_i in range(num_events):
                event_day = random.randint(1, 42) # First 6 weeks
                ev_dt = start_dt + timedelta(days=event_day, hours=random.randint(8, 22), minutes=random.randint(0, 59))
                ev_type = random.choice(["lms_login", "resource_read", "quiz_attempt", "forum_view", "assignment_view"])
                dur = random.randint(10, 80) if arch != "high_risk" else random.randint(2, 15)
                clicks = random.randint(15, 60) if arch != "high_risk" else random.randint(1, 8)
                avail_dt = ev_dt + timedelta(hours=1)
                we.writerow([f"EVT-{evt_counter:07d}", enr["enrollment_id"], ev_type, to_iso(ev_dt), dur, clicks, to_iso(avail_dt)])
                evt_counter += 1

            # Retrospective Final Outcome
            avg_grade = sum(grades_list) / len(grades_list) if grades_list else 50.0
            if arch == "high_risk":
                outcome = "Fail" if random.random() < 0.75 else "Withdrawn"
                final_score = round(random.uniform(30.0, 52.0), 1)
                letter = "F"
            elif arch == "moderate_struggle":
                outcome = "Pass" if random.random() < 0.65 else "Fail"
                final_score = round(random.uniform(55.0, 70.0), 1)
                letter = "C" if outcome == "Pass" else "F"
            elif arch == "high_anomaly":
                outcome = "Pass"
                final_score = round(random.uniform(90.0, 98.0), 1)
                letter = "A"
            else:
                outcome = "Pass"
                final_score = round(random.uniform(75.0, 96.0), 1)
                letter = "A" if final_score >= 90 else ("B" if final_score >= 80 else "C")

            rec_dt = off["start"] + timedelta(days=110)
            wo.writerow([f"OUT-{enr['enrollment_id']}", enr["enrollment_id"], final_score, letter, outcome, to_iso(rec_dt)])

    print("Synthetic dataset successfully generated:")
    print(f" -> Output directory: {OUTPUT_DIR}")
    print(f" -> Total enrollments: {len(enrollments)}")

def determine_archetype(stu_idx, course_code):
    # Deterministic mapping for student archetypes
    mod = stu_idx % 10
    if mod in [1, 2]:
        return "high_risk"          # Multi-concerning (attendance, tests, clicks)
    elif mod in [3]:
        return "moderate_struggle"  # 1 concerning family (e.g. low attendance or low tests)
    elif mod in [4]:
        return "high_anomaly"       # High performer with unusual outlier activity (Routine anomaly)
    elif mod in [5] and course_code == "CS101":
        return "insufficient_data"  # Missing required data coverage
    else:
        return "routine"            # Normal healthy engagement

if __name__ == "__main__":
    generate_dataset()
