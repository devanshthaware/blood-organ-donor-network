from fastapi.testclient import TestClient
from ml_inference.api.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_reliability():
    payload = {
        "total_requests": 40,
        "accepted_requests": 35,
        "completed_donations": 30,
        "no_shows": 5,
        "avg_response_time_minutes": 18
    }
    res = client.post("/predict/reliability", json=payload)
    assert res.status_code == 200
    assert "reliability_score" in res.json()


def test_demand():
    payload = {
        "region": 1,
        "blood_group": 3,
        "demand_units": 120,
        "supply_units": 90,
        "month": 7,
        "day": 15
    }
    res = client.post("/predict/demand", json=payload)
    assert res.status_code == 200
    assert "predicted_demand" in res.json()


def test_availability():
    payload = {
        "blood_group": 2,
        "distance_km": 8.5,
        "days_since_last_donation": 60,
        "past_acceptance_rate": 0.75,
        "urgency_level": 2,
        "time_of_day": 1
    }
    res = client.post("/predict/availability", json=payload)
    assert res.status_code == 200
    assert "availability_probability" in res.json()
