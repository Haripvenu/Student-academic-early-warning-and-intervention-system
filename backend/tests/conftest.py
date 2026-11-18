import sys
import os
import pytest

# Ensure root workspace and backend directories are in sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
for p in (REPO_ROOT, BACKEND_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.db import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Ensure database schema is initialized for test execution."""
    init_db()
