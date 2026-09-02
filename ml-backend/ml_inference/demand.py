import logging
import pandas as pd
import numpy as np
from .loader import load_model
from .data_logger import save_prediction

logger = logging.getLogger(__name__)
MODEL_FILE = "demand_forecasting_model.joblib"

def predict_demand(payload: dict):
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
    # Based on the preprocessing: ['region', 'blood_group'] are categorical
    categorical_cols = ['region', 'blood_group']
    for col in categorical_cols:
        if col in df.columns:
            df[col] = df[col].astype(object)
    
    # Ensure numeric columns are numeric
    numeric_cols = ['month', 'day', 'demand_units', 'supply_units']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').astype('float64')

    # Model is a classifier, so get probability of "High" demand
    # Classes are ['High', 'Low', 'Medium']
    proba = model.predict_proba(df)[0]
    classes = model.named_steps['classifier'].classes_
    
    # Find index of 'High' class and return its probability
    high_idx = list(classes).index('High') if 'High' in classes else 0
    high_probability = float(proba[high_idx])
    
    # Alternatively, we could map classes to numeric values
    # But probability is more useful for demand forecasting
    result = {
        "predicted_demand": high_probability
    }
    
    # Save prediction data for retraining
    save_prediction("demand", payload, result)
    
    return result