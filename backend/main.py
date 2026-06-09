# main.py
# -----------------------------------------------------------------------
# FastAPI application entrypoint for the diabetes risk prediction service.
# USER: Drop hybrid_dl.h5 and scaler.pkl into backend/models/ before running.
# Verify that MODEL_PATH and SCALER_PATH env vars point to those files.
# -----------------------------------------------------------------------

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import PredictRequest, PredictResponse, HealthResponse
from predictor import get_predictor

app = FastAPI(
    title="Diabetes Risk Prediction API",
    description="Hybrid deep-learning model serving layer for diabetes risk stratification.",
    version="1.0.0",
)

# CORS — allow all origins in development; restrict in production as needed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["infra"])
def health_check():
    """Liveness + readiness probe. Returns model_loaded=True only after
    the model and scaler are both successfully loaded from disk."""
    predictor = get_predictor()
    return HealthResponse(status="ok", model_loaded=predictor.is_ready())


@app.post("/predict", response_model=PredictResponse, tags=["inference"])
def predict(request: PredictRequest):
    """Run inference on 8 clinical inputs and return risk tier, probability,
    composite risk score, optional NFHS-5 zone-adjusted probability, and
    a radar-chart-ready feature importance proxy."""
    predictor = get_predictor()
    if not predictor.is_ready():
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Ensure hybrid_dl.h5 and scaler.pkl exist in backend/models/.",
        )
    try:
        result = predictor.predict(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(exc)}")
    return result
