import pytest
from backend.app.services.csv_import import CSVImportService
from backend.app.models import Student

def test_csv_import_valid_and_missing_headers(db_session):
    # Missing headers test
    bad_csv = "id,name\n1,Alice"
    res_bad = CSVImportService.process_csv(db_session, "students", "bad.csv", bad_csv)
    assert res_bad["status"] == "failed"
    assert res_bad["error_rows"] == 1

    # Valid import test
    good_csv = "student_id,first_name,last_name,email,cohort_year\nSTU-IMP-1,Alice,Smith,alice@campus.edu,2025"
    res_good = CSVImportService.process_csv(db_session, "students", "good.csv", good_csv)
    assert res_good["status"] == "completed"
    assert res_good["imported_rows"] == 1

    stu = db_session.query(Student).filter(Student.student_id == "STU-IMP-1").first()
    assert stu is not None
    assert stu.first_name == "Alice"
