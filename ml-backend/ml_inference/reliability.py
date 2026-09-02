import logging
import pandas as pd
from .loader import load_model
from .data_logger import save_prediction

logger = logging.getLogger(__name__)
MODEL_FILE = "donor_reliability_model.joblib"

def predict_reliability(payload: dict) -> float:
    # Load the trained model
    model = load_model(MODEL_FILE)

    # Transform payload to match model's expected features
    # Handle both API schema format and legacy format
    transformed = {
        "total_requests": payload.get("total_requests", 0),
        "accepted_requests": payload.get("accepted_requests", 0),
        "completed_donations": payload.get("completed_donations", payload.get("accepted_requests", 0)),
        "no_shows": payload.get("no_shows", payload.get("missed_requests", 0)),
        "avg_response_time_minutes": payload.get("avg_response_time_minutes", payload.get("avg_response_time", 0) / 60),
    }

    df = pd.DataFrame([transformed])
    score = model.predict(df)[0]

    # Clamp score between 0 and 1
    score = float(max(0, min(1, score)))
    result = {"reliability_score": score}
    
    # Save prediction data for retraining
    # Use transformed data (model features) instead of raw payload
    save_prediction("reliability", transformed, result)
    
    return score
