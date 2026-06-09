# predictor.py
# -----------------------------------------------------------------------
# Model loader and inference orchestrator.
# USER: This module loads hybrid_dl.h5 (Keras) and scaler.pkl (sklearn)
# lazily on first request. Paths are read from environment variables
# MODEL_PATH and SCALER_PATH (defaults: ./models/hybrid_dl.h5 / scaler.pkl).
# Verify that these files exist before starting the server.
# -----------------------------------------------------------------------

from __future__ import annotations
import os
import pickle
import logging
from functools import lru_cache
from typing import Optional

import numpy as np

from schemas import PredictRequest, PredictResponse, FeatureImportanceProxy
from preprocessing import build_feature_vector
from risk_tier import (
    classify_tier,
    compute_composite_risk_score,
    compute_nfhs_adjusted,
    compute_feature_importance_proxy,
)

logger = logging.getLogger("predictor")

MODEL_PATH = os.getenv("MODEL_PATH", "./models/hybrid_dl.h5")
SCALER_PATH = os.getenv("SCALER_PATH", "./models/scaler.pkl")


class Predictor:
    """Wraps Keras model + sklearn scaler for single-sample inference."""

    def __init__(self) -> None:
        self._model = None
        self._scaler = None
        self._load()

    def _load(self) -> None:
        import os, urllib.request

        # Auto-download from Google Drive if files missing (Render ephemeral filesystem)
        H5_GDRIVE_ID     = "1eendamuu32R0m2Q2CQCSCVGgNb5eSjZi"
        SCALER_GDRIVE_ID = "1V7VxAwKwWZWb_xk8JASmXvAx9cEHvUU6"

        def gdrive_download(file_id, dest_path):
            if os.path.exists(dest_path) and os.path.getsize(dest_path) > 100000:
                logger.info("File already exists: %s", dest_path)
                return
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            logger.info("Downloading %s from Google Drive...", dest_path)
            import gdown
            gdown.download(id=file_id, output=dest_path, quiet=False, fuzzy=True)
            logger.info("Downloaded %s (%.1f MB)", dest_path,
                        os.path.getsize(dest_path) / 1024 / 1024)

        try:
            gdrive_download(H5_GDRIVE_ID, MODEL_PATH)
        except Exception as exc:
            logger.error("Failed to download model: %s", exc)

        try:
            gdrive_download(SCALER_GDRIVE_ID, SCALER_PATH)
        except Exception as exc:
            logger.error("Failed to download scaler: %s", exc)

        try:
            import tensorflow as tf
            self._model = tf.keras.models.load_model(MODEL_PATH, compile=False)
            logger.info("Keras model loaded from %s", MODEL_PATH)
        except Exception as exc:
            logger.error("Failed to load Keras model: %s", exc)

        try:
            with open(SCALER_PATH, "rb") as f:
                self._scaler = pickle.load(f)
            logger.info("Scaler loaded from %s", SCALER_PATH)
        except Exception as exc:
            logger.error("Failed to load scaler: %s", exc)

    def is_ready(self) -> bool:
        return self._model is not None and self._scaler is not None

    def predict(self, request: PredictRequest) -> PredictResponse:
        """Run the full inference pipeline: preprocess → scale → model.predict → risk tier."""
        # 1. Build feature vector (returns a 1×22 numpy array, already column-ordered)
        feature_vec = build_feature_vector(request, self._scaler)  # shape: (1, 22)

        # 2. Raw model inference
        raw_prob: float = float(self._model.predict(feature_vec, verbose=0)[0][0])
        probability = round(raw_prob, 2)

        # 3. Risk tier
        risk_tier = classify_tier(probability)

        # 4. Composite risk score
        composite_risk_score = compute_composite_risk_score(
            glucose=request.Glucose,
            bmi=request.BMI,
            blood_pressure=request.BloodPressure,
            insulin=request.Insulin,
            age=request.Age,
        )

        # 5. NFHS-5 zone adjustment (only when IndianZone is provided)
        nfhs_adjusted_probability: Optional[float] = None
        nfhs_adjusted_tier: Optional[str] = None
        if request.IndianZone is not None:
            nfhs_adjusted_probability, nfhs_adjusted_tier = compute_nfhs_adjusted(
                raw_prob, request.IndianZone
            )

        # 6. Feature importance proxy (normalized for radar chart)
        feature_importance_proxy = compute_feature_importance_proxy(
            glucose=request.Glucose,
            bmi=request.BMI,
            blood_pressure=request.BloodPressure,
            insulin=request.Insulin,
            age=request.Age,
        )

        return PredictResponse(
            probability=probability,
            risk_tier=risk_tier,
            composite_risk_score=composite_risk_score,
            nfhs_adjusted_probability=nfhs_adjusted_probability,
            nfhs_adjusted_tier=nfhs_adjusted_tier,
            feature_importance_proxy=FeatureImportanceProxy(**feature_importance_proxy),
        )


@lru_cache(maxsize=1)
def get_predictor() -> Predictor:
    """Singleton factory — model is loaded once at first request."""
    return Predictor()
