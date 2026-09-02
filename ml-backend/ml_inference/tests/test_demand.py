from ml_inference.demand import predict_demand

def test_demand_forecasting_model():
    payload = {
        "region": 1,
        "blood_group": 3,
        "month": 6,
        "day": 18,
        "demand_units": 120,
        "supply_units": 90
    }

    result = predict_demand(payload)

    assert "predicted_demand" in result
    assert isinstance(result["predicted_demand"], (int, float))
