import logging
from fastapi import FastAPI, HTTPException

from .schemas import (
    ReliabilityRequest,
    DemandRequest,
    AvailabilityRequest
)
from ..reliability import predict_reliability as predict_reliability_func
from ..demand import predict_demand as predict_demand_func
from ..availability import predict_availability as predict_availability_func

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="ML Inference API")

# API version
API_VERSION = "1.0.0"


@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": True}


@app.get("/version")
def version():
    return {"version": API_VERSION}


@app.post("/predict/reliability")
def predict_reliability(payload: ReliabilityRequest):
    try:
        score = predict_reliability_func(payload.model_dump())
        return {"reliability_score": float(score)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/demand")
def predict_demand(payload: DemandRequest):
    try:
        result = predict_demand_func(payload.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/availability")
def predict_availability(payload: AvailabilityRequest):
    try:
        result = predict_availability_func(payload.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
