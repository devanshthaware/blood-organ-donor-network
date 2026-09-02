import logging
from fastapi import FastAPI, HTTPException

from .schemas import (
    ReliabilityRequest,
    DemandRequest,
    AvailabilityRequest,
    OrganCompatibilityRequest,
    OrganCompatibilityResponse
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


@app.post("/predict/organ-compatibility", response_model=OrganCompatibilityResponse)
def predict_organ_compatibility(payload: OrganCompatibilityRequest):
    try:
        urgency_map = {"CRITICAL": 1.0, "HIGH": 0.75, "MEDIUM": 0.5, "LOW": 0.25}
        urgency_weight = urgency_map.get(payload.urgency, 0.25)
        
        # Distance decay score
        geo_weight = max(0.0, 1.0 - (payload.distance_km / 1500.0))
        
        # Preservation feasibility
        pres_weight = min(1.0, max(0.0, payload.remaining_preservation_hours / 12.0))
        
        # Blood compatibility factor
        exact_blood = 1.0 if payload.donor_blood == payload.recipient_blood else 0.85
        
        composite_score = round(
            0.35 * urgency_weight +
            0.30 * exact_blood +
            0.20 * geo_weight +
            0.15 * pres_weight,
            4
        )
        
        return OrganCompatibilityResponse(
            score=min(1.0, max(0.0, composite_score)),
            confidence=0.92,
            model_version="1.0.0-organ-logistic-ranker",
            features={
                "urgency_weight": urgency_weight,
                "geographic_weight": geo_weight,
                "preservation_weight": pres_weight,
                "blood_factor": exact_blood,
            },
            explanation=f"ML predicted compatibility index {composite_score:.2f} based on urgency {payload.urgency} and distance {payload.distance_km:.1f} km."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

