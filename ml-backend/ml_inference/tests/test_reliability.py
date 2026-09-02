from ml_inference.reliability import predict_reliability

def test_reliability_model():
    payload = {
        "total_requests": 40,
        "accepted_requests": 32,
        "avg_response_time": 900,  # seconds (will be converted to minutes: 15)
        "missed_requests": 3,  # will be mapped to no_shows
        "completed_donations": 32  # explicitly match the model feature
    }

    result = predict_reliability(payload)

    assert isinstance(result, float), "Result should be a float"
    assert 0.0 <= result <= 1.0, "Result should be between 0 and 1"
