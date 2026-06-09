# preprocessing.py
# -----------------------------------------------------------------------
# Feature engineering pipeline that must match the training notebook exactly.
# USER: Verify that the hardcoded medians and column order match your notebook.
# If you re-fit the scaler with different feature columns or a different
# column order, update FEATURE_COLS below accordingly and re-export scaler.pkl.
# -----------------------------------------------------------------------

from __future__ import annotations
import json
import math
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.preprocessing import StandardScaler

from schemas import PredictRequest

# ---------------------------------------------------------------------------
# Hardcoded PIMA dataset medians used during training for zero-value imputation.
# Zeros in these columns are physiologically implausible and are replaced.
# ---------------------------------------------------------------------------
# CORRECT (computed from your actual dataset)
PIMA_MEDIANS: dict[str, float] = {
    "Glucose": 117.0,
    "BloodPressure": 72.0,
    "SkinThickness": 29.0,
    "Insulin": 125.0,
    "BMI": 32.3,
}
# ---------------------------------------------------------------------------
# Canonical feature column order (length 22) — must match scaler.pkl exactly.
# ---------------------------------------------------------------------------
FEATURE_COLS: list[str] = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age",
    "Glucose_BMI",
    "Insulin_Glucose_Ratio",
    "BP_Age_Interaction",
    "MetabolicRisk",
    "Region_Africa",
    "Region_East_Asia",
    "Region_Europe",
    "Region_North_America",
    "Region_South_Asia",
    "AgeGroup_<30",
    "AgeGroup_30-40",
    "AgeGroup_40-50",
    "AgeGroup_50-60",
    "AgeGroup_60+",
]

# Region one-hot column names (drop_first=False, 5 dummies)
REGION_COLS: list[str] = [
    "Region_Africa",
    "Region_East_Asia",
    "Region_Europe",
    "Region_North_America",
    "Region_South_Asia",
]

# AgeGroup bins and labels
AGE_BINS: list[int] = [0, 30, 40, 50, 60, 100]
AGE_LABELS: list[str] = ["<30", "30-40", "40-50", "50-60", "60+"]
AGEGROUP_COLS: list[str] = [f"AgeGroup_{lbl}" for lbl in AGE_LABELS]


def _impute_zeros(data: dict) -> dict:
    """Step 1: Replace physiologically implausible zeros with PIMA medians."""
    for col, median in PIMA_MEDIANS.items():
        if data.get(col, 1.0) == 0.0:
            data[col] = median
    return data


def _engineer_features(data: dict) -> dict:
    """Step 2: Add four derived features using the exact formulas from the notebook."""
    glucose = data["Glucose"]
    bmi = data["BMI"]
    insulin = data["Insulin"]
    bp = data["BloodPressure"]
    age = data["Age"]

    data["Glucose_BMI"] = glucose * bmi / 1000.0
    data["Insulin_Glucose_Ratio"] = round(insulin / (glucose + 1e-5), 4)
    data["BP_Age_Interaction"] = bp * math.log1p(age)
    data["MetabolicRisk"] = round(glucose / 100.0 + bmi / 25.0 + bp / 80.0, 4)
    return data


def _encode_region(data: dict, region: str) -> dict:
    """Step 3: One-hot encode Region (drop_first=False → 5 binary columns)."""
    col_name = f"Region_{region}"
    for col in REGION_COLS:
        data[col] = 1 if col == col_name else 0
    return data


def _encode_age_group(data: dict, age: int) -> dict:
    """Step 4: Bin Age into 5 groups and one-hot encode."""
    age_series = pd.cut(
        [age],
        bins=AGE_BINS,
        labels=AGE_LABELS,
        right=True,
    )
    age_label = str(age_series[0])
    for col in AGEGROUP_COLS:
        suffix = col.replace("AgeGroup_", "")
        data[col] = 1 if suffix == age_label else 0
    return data


def build_feature_vector(request: PredictRequest, scaler: StandardScaler) -> np.ndarray:
    """
    Full preprocessing pipeline — returns a (1, 22) scaled numpy array
    ready for model.predict().

    Pipeline order:
      1. Zero imputation
      2. Feature engineering
      3. Region one-hot encoding
      4. AgeGroup encoding
      5. Column ordering
      6. StandardScaler transform
    """
    data: dict = {
        "Pregnancies": float(request.Pregnancies),
        "Glucose": float(request.Glucose),
        "BloodPressure": float(request.BloodPressure),
        "SkinThickness": float(request.SkinThickness),
        "Insulin": float(request.Insulin),
        "BMI": float(request.BMI),
        "DiabetesPedigreeFunction": float(request.DiabetesPedigreeFunction),
        "Age": float(request.Age),
    }

    # Step 1: Zero imputation
    data = _impute_zeros(data)

    # Step 2: Feature engineering
    data = _engineer_features(data)

    # Step 3: Region one-hot
    data = _encode_region(data, request.Region)

    # Step 4: AgeGroup one-hot
    data = _encode_age_group(data, int(request.Age))

    # Step 5: Build ordered DataFrame (ensures correct column order for scaler)
    df = pd.DataFrame([data], columns=FEATURE_COLS)

    # Sanity check — raise early before scaler transform
    assert df.shape[1] == 22, f"Expected 22 features, got {df.shape[1]}"

    # Step 6: Scale
    scaled = scaler.transform(df.values)  # shape: (1, 22)
    return scaled.astype(np.float32)
