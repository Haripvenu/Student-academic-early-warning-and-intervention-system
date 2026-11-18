import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db import init_db

# Ensure database tables exist for API tests
init_db()

client = TestClient(app)

def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "active_models_count" in data

def test_dashboard_filters_endpoint():
    response = client.get("/api/v1/dashboard/filters")
    assert response.status_code == 200
    data = response.json()
    assert "terms" in data
    assert "checkpoints" in data
    assert "offerings" in data

def test_demo_auth_switch():
    response = client.post("/api/v1/auth/demo-switch/mentor")
    assert response.status_code == 200
    data = response.json()
    assert "session_token" in data
    assert data["user"]["role"] == "mentor"
