import logging
import pandas as pd
import numpy as np
from .loader import load_model
from .data_logger import save_prediction

logger = logging.getLogger(__name__)
MODEL_FILE = "donor_availability_model.joblib"

def predict_availability(payload: dict):
    model = load_model(MODEL_FILE)

    features = model.feature_names_in_

    # Check for missing features
    missing_features = [f for f in features if f not in payload]
    if missing_features:
        raise ValueError(f"Missing required fields: {missing_features}. Available fields: {list(payload.keys())}")

    try:
        values = [payload[f] for f in features]
    except KeyError as e:
        raise ValueError(f"Missing required field: {e.args[0]}")

    # Create DataFrame with proper column order
    df = pd.DataFrame([values], columns=features)
    
    # OneHotEncoder expects categorical columns as object type
    # Based on the preprocessing: ['blood_group', 'urgency_level', 'time_of_day'] are categorical
    categorical_cols = ['blood_group', 'urgency_level', 'time_of_day']
    for col in categorical_cols:
        if col in df.columns:
            df[col] = df[col].astype(object)
    
    # Ensure numeric columns are numeric
    numeric_cols = ['distance_km', 'days_since_last_donation', 'past_acceptance_rate']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').astype('float64')

    prob = model.predict_proba(df)[0][1]

    result = {
        "availability_probability": round(float(prob), 4)
    }
    
    # Save prediction data for retraining
    save_prediction("availability", payload, result)
    
    return result