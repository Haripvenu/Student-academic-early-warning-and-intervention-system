import sys
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure root workspace and backend directories are in sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
for p in (REPO_ROOT, BACKEND_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.db import Base, init_db
from backend.app.models import User
from backend.app.security import hash_password

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Ensure database schema is initialized for test execution."""
    init_db()

@pytest.fixture(scope="function")
def db_session():
    """Isolated in-memory database session for functional unit tests."""
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()

    # Seed default test users
    demo_mentor = User(
        user_id="MEN-TEST",
        email="mentor.test@campus.edu",
        full_name="Dr. Test Mentor",
        role="mentor",
        hashed_password=hash_password("password123")
    )
    demo_admin = User(
        user_id="ADM-TEST",
        email="admin.test@campus.edu",
        full_name="Admin Test",
        role="admin",
        hashed_password=hash_password("password123")
    )
    session.add_all([demo_mentor, demo_admin])
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)
