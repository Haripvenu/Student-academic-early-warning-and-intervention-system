import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.db import Base
from backend.app.models import User
from backend.app.security import hash_password

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()

    # Seed default user
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
