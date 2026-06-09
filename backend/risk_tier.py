# risk_tier.py
# -----------------------------------------------------------------------
# Risk tier classification, composite clinical risk scoring, NFHS-5 zone
# probability adjustment, and feature importance proxy computation.
# USER: NFHS-5 multipliers are hardcoded from the spec. Verify these match
# your regional calibration if you update the model cohort.
# -----------------------------------------------------------------------

from __future__ import annotations
import numpy as np
from typing import Optional, Tuple

# ---------------------------------------------------------------------------
# Tier thresholds
# ---------------------------------------------------------------------------
LOW_THRESHOLD = 0.30
HIGH_THRESHOLD = 0.60


def classify_tier(probability: float) -> str:
    """Map a probability (0–1) to a risk tier string."""
    if probability < LOW_THRESHOLD:
        return "LOW"
    elif probability < HIGH_THRESHOLD:
        return "MEDIUM"
    else:
        return "HIGH"


# ---------------------------------------------------------------------------
# Composite risk score  (integer 0–7)
# ---------------------------------------------------------------------------
def compute_composite_risk_score(
    glucose: float,
    bmi: float,
    blood_pressure: float,
    insulin: float,
    age: float,
) -> int:
    """
    Clinical threshold-based risk score.

    Scoring rules:
      Glucose > 140   → +3
      BMI > 30        → +2
      BloodPressure > 80 → +1
      Insulin > 200   → +1
      Age > 45        → +1
    Max possible: 8, but capped at 7 per spec (Glucose + BMI alone = 5 max meaningful).
    Actual max from the formula is 8; the spec says 0–7, so we cap it.
    """
    score = (
        (3 if glucose > 140 else 0)
        + (2 if bmi > 30 else 0)
        + (1 if blood_pressure > 80 else 0)
        + (1 if insulin > 200 else 0)
        + (1 if age > 45 else 0)
    )
    return min(score, 7)


# ---------------------------------------------------------------------------
# NFHS-5 zone adjustment
# ---------------------------------------------------------------------------
ZONE_MULTIPLIERS: dict[str, float] = {
    "North":   1.008,
    "South":   1.098,
    "East":    0.942,
    "West":    0.998,
    "Central": 0.954,
}


def compute_nfhs_adjusted(
    raw_prob: float, zone: str
) -> Tuple[float, str]:
    """
    Apply NFHS-5 zone multiplier and re-classify tier on the adjusted probability.
    Returns (adjusted_probability rounded to 2dp, adjusted_tier).
    """
    multiplier = ZONE_MULTIPLIERS[zone]
    adjusted = float(np.clip(raw_prob * multiplier, 0.0, 1.0))
    adjusted = round(adjusted, 2)
    return adjusted, classify_tier(adjusted)


# ---------------------------------------------------------------------------
# Feature importance proxy (normalised for radar chart)
# ---------------------------------------------------------------------------
# Clinical reference ranges used for min-max normalisation.
# These are the physiological bounds also used for frontend validation.
_RADAR_RANGES: dict[str, Tuple[float, float]] = {
    "Glucose":       (44.0, 200.0),
    "BMI":           (10.0, 70.0),
    "BloodPressure": (20.0, 140.0),
    "Insulin":       (0.0,  900.0),
    "Age":           (1.0,  120.0),
}


def _normalise(value: float, min_val: float, max_val: float) -> float:
    """Min-max normalise to [0, 1], clamp to handle out-of-range inputs."""
    norm = (value - min_val) / (max_val - min_val)
    return round(float(np.clip(norm, 0.0, 1.0)), 4)


def compute_feature_importance_proxy(
    glucose: float,
    bmi: float,
    blood_pressure: float,
    insulin: float,
    age: float,
) -> dict[str, float]:
    """
    Return normalised (0–1) values for the 5 radar chart axes.
    These are NOT SHAP values — they represent the patient's position within
    the physiological range, used purely for visualisation.
    """
    return {
        "Glucose":       _normalise(glucose,        *_RADAR_RANGES["Glucose"]),
        "BMI":           _normalise(bmi,            *_RADAR_RANGES["BMI"]),
        "BloodPressure": _normalise(blood_pressure, *_RADAR_RANGES["BloodPressure"]),
        "Insulin":       _normalise(insulin,        *_RADAR_RANGES["Insulin"]),
        "Age":           _normalise(age,            *_RADAR_RANGES["Age"]),
    }
