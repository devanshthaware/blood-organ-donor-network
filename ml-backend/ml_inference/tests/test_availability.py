from ml_inference.availability import predict_availability

def test_availability_model():
    payload = {
        "blood_group": 2,
        "urgency_level": 2,
        "time_of_day": 1,
        "distance_km": 12.0,
        "days_since_last_donation": 85,
        "past_acceptance_rate": 0.6
    }

    result = predict_availability(payload)

    assert "availability_probability" in result
    assert 0.0 <= result["availability_probability"] <= 1.0
    assert isinstance(result["availability_probability"], (int, float))
