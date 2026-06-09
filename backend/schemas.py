# schemas.py
# -----------------------------------------------------------------------
# Pydantic v2 request/response models for the /predict endpoint.
# USER: These schemas mirror the exact API contract defined in the spec.
# Validation ranges (Glucose, BMI, Age, BloodPressure) are enforced here
# and duplicated on the frontend for a fast UX — keep them in sync.
# -----------------------------------------------------------------------

from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


RegionType = Literal["South_Asia", "North_America", "Europe", "East_Asia", "Africa"]
IndianZoneType = Literal["North", "South", "East", "West", "Central"]


class PredictRequest(BaseModel):
    Pregnancies: int = Field(..., ge=0, le=20, description="Number of pregnancies (0–20)")
    Glucose: float = Field(..., ge=44, le=200, description="Plasma glucose concentration (mg/dL)")
    BloodPressure: float = Field(..., ge=20, le=140, description="Diastolic blood pressure (mm Hg)")
    SkinThickness: float = Field(..., ge=0, le=100, description="Triceps skin fold thickness (mm)")
    Insulin: float = Field(..., ge=0, le=900, description="2-Hour serum insulin (mu U/ml)")
    BMI: float = Field(..., ge=10, le=70, description="Body mass index (weight in kg/(height in m)^2)")
    DiabetesPedigreeFunction: float = Field(
        ..., ge=0.0, le=2.5, description="Diabetes pedigree function"
    )
    Age: int = Field(..., ge=1, le=120, description="Age in years")
    Region: RegionType = Field(..., description="Geographic region for cohort adjustment")
    IndianZone: Optional[IndianZoneType] = Field(
        None, description="NFHS-5 Indian zone for regional probability adjustment"
    )

    model_config = {"json_schema_extra": {
        "example": {
            "Pregnancies": 2,
            "Glucose": 138.0,
            "BloodPressure": 78.0,
            "SkinThickness": 30.0,
            "Insulin": 95.0,
            "BMI": 34.5,
            "DiabetesPedigreeFunction": 0.627,
            "Age": 42,
            "Region": "South_Asia",
            "IndianZone": "North",
        }
    }}


class FeatureImportanceProxy(BaseModel):
    """Normalized (0–1 range) values of 5 key features for radar chart display."""
    Glucose: float
    BMI: float
    BloodPressure: float
    Insulin: float
    Age: float


class PredictResponse(BaseModel):
    probability: float = Field(..., description="Raw model output probability (0–1, 2 dp)")
    risk_tier: Literal["LOW", "MEDIUM", "HIGH"]
    composite_risk_score: int = Field(..., ge=0, le=7, description="Clinical threshold score (0–7)")
    nfhs_adjusted_probability: Optional[float] = Field(
        None, description="NFHS-5 zone-adjusted probability; null when IndianZone is not provided"
    )
    nfhs_adjusted_tier: Optional[Literal["LOW", "MEDIUM", "HIGH"]] = None
    feature_importance_proxy: FeatureImportanceProxy


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
