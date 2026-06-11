<div align="center">

<img src="https://img.shields.io/badge/-%F0%9F%A9%BA%20DiabetaLens-0891b2?style=for-the-badge&labelColor=070E1A" alt="DiabetaLens"/>

# DiabetaLens

### Clinical Diabetes Risk Intelligence Platform

*Hybrid Deep Learning · 3-Tier Risk Stratification · NFHS-5 Regional Calibration*

<br/>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-06b6d4?style=flat-square&logo=vercel&logoColor=white)](https://disease-prediction-app-three.vercel.app)
[![API Docs](https://img.shields.io/badge/API%20Docs-Swagger%20UI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://disease-prediction-app-pebt.onrender.com/docs)
[![Model Hub](https://img.shields.io/badge/Model%20Hub-HuggingFace-FFD21E?style=flat-square&logo=huggingface&logoColor=black)](https://huggingface.co/Lunarbrsh/diabetalens-models)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=flat-square)](LICENSE)

<br/>

![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.21-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

</div>

---

## What is DiabetaLens?

DiabetaLens is a **production-deployed clinical decision support system** that predicts diabetes risk from 8 standard clinical parameters. It goes beyond a typical ML notebook — the system is fully productionised with a REST API backend, an interactive clinical dashboard frontend, automated model artifact delivery, and optional India-specific regional risk calibration using NFHS-5 prevalence data.

The core model is a **Hybrid Residual MLP** — a deep learning architecture with skip connections, BatchNorm, and Dropout — trained on the PIMA Indians Diabetes dataset with SMOTE class balancing and 22 engineered features. Risk output is expressed as a continuous probability and bucketed into three clinical tiers (LOW / MEDIUM / HIGH), with an additional composite clinical score based on hard thresholds used in clinical practice.

> ⚕ *For clinical decision support and educational use only. Not a substitute for professional medical advice.*

---

## Live System

| Service | Platform | URL |
|---|---|---|
| Frontend Dashboard | Vercel | [disease-prediction-app-three.vercel.app](https://disease-prediction-app-three.vercel.app) |
| REST API | Render | [disease-prediction-app-pebt.onrender.com](https://disease-prediction-app-pebt.onrender.com) |
| Interactive API Docs | Render / Swagger | [/docs](https://disease-prediction-app-pebt.onrender.com/docs) |
| Model Artifacts | HuggingFace Hub | [Lunarbrsh/diabetalens-models](https://huggingface.co/Lunarbrsh/diabetalens-models) |

> **Note:** The backend runs on Render's free tier and may take 30–50 seconds to wake from cold start after inactivity.

---

## System Architecture

```
╔══════════════════════════════════════════════════════════════════╗
║                     USER BROWSER                                ║
║                                                                  ║
║  ┌────────────┐  ┌────────────┐  ┌───────────┐  ┌───────────┐  ║
║  │PredictForm │  │ GaugeChart │  │ RiskCard  │  │  Radar +  │  ║
║  │ 8 clinical │→ │ SVG needle │  │ Ref ranges│  │BarChart   │  ║
║  │   inputs   │  │  gauge     │  │ NFHS-5    │  │ Recharts  │  ║
║  └────────────┘  └────────────┘  └───────────┘  └───────────┘  ║
║                                                                  ║
║                    React 18 + Vite + Tailwind                   ║
║                         Vercel CDN                              ║
╚══════════════════════╦═══════════════════════════════════════════╝
                       ║  POST /predict  GET /health
                       ║  JSON REST API
╔══════════════════════╩═══════════════════════════════════════════╗
║                     FASTAPI BACKEND                             ║
║                                                                  ║
║  Request → Pydantic validation                                  ║
║         → preprocessing.py  (zero impute → engineer → encode)  ║
║         → predictor.py      (StandardScaler → model.predict)   ║
║         → risk_tier.py      (tier · composite · NFHS-5)        ║
║         → Pydantic response                                     ║
║                                                                  ║
║                   Uvicorn · Python 3.11                         ║
║                       Render.com                                ║
╚══════════════════════╦═══════════════════════════════════════════╝
                       ║  urllib download on first startup
╔══════════════════════╩═══════════════════════════════════════════╗
║                  HUGGINGFACE MODEL HUB                          ║
║                                                                  ║
║         hybrid_dl_v2.keras          scaler_v2.pkl               ║
║         Residual MLP (Keras 3)      StandardScaler (sklearn)    ║
║                                                                  ║
║              Lunarbrsh/diabetalens-models                       ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Model Details

### Architecture

```
Input (22 features)
    │
    ▼
┌─────────────────────┐
│   Dense(128, ReLU)  │
│   BatchNorm         │
│   Dropout(0.3)      │
└──────────┬──────────┘
           │  ┌─── Skip connection ───┐
           ▼  │                       │
┌─────────────────────┐               │
│   Dense(64, ReLU)   │               │
│   BatchNorm         │               │
│   Dropout(0.2)      │               │
└──────────┬──────────┘               │
           │◄──────────────────────── ┘
           ▼
┌─────────────────────┐
│   Dense(32, ReLU)   │
│   BatchNorm         │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│   Dense(1, Sigmoid) │
└─────────────────────┘
    │
    ▼
Probability (0–1)
```

### Feature Engineering Pipeline

```python
# Step 1: Zero-value imputation (physiologically implausible zeros)
PIMA_MEDIANS = {
    "Glucose": 117.0, "BloodPressure": 72.0,
    "SkinThickness": 29.0, "Insulin": 125.0, "BMI": 32.3
}

# Step 2: Derived features
Glucose_BMI           = Glucose * BMI / 1000
Insulin_Glucose_Ratio = Insulin / (Glucose + 1e-5)
BP_Age_Interaction    = BloodPressure * log1p(Age)
MetabolicRisk         = Glucose/100 + BMI/25 + BloodPressure/80

# Step 3: One-hot encoding
Region    → 5 binary columns (Africa, East_Asia, Europe, North_America, South_Asia)
AgeGroup  → 5 bins  (<30, 30-40, 40-50, 50-60, 60+)

# Step 4: StandardScaler transform → final 22-feature vector
```

### Risk Scoring

| Component | Logic |
|---|---|
| Probability tiers | LOW < 0.30 · MEDIUM 0.30–0.60 · HIGH ≥ 0.60 |
| Composite score | Glucose > 140 (+3) · BMI > 30 (+2) · BP > 80 (+1) · Insulin > 200 (+1) · Age > 45 (+1) |
| NFHS-5 adjustment | Zone multipliers: North 1.008 · South 1.098 · East 0.942 · West 0.998 · Central 0.954 |

---

## Dashboard Features

| Feature | Description |
|---|---|
| **Risk Gauge** | Animated SVG semicircle with needle, zone bands (green/amber/red at 30%/60%), and smooth transition animation |
| **Clinical Reference Bars** | Mini range indicators for Glucose, BMI, BP — shows patient value against normal / borderline / danger zones |
| **Risk Factor Chart** | Recharts horizontal bar chart — 6 clinical factors normalised and coloured by zone (within range / borderline / above threshold) |
| **Feature Radar** | Recharts 5-axis radar showing normalised physiological position for Glucose, BMI, BP, Insulin, Age |
| **NFHS-5 Panel** | Side-by-side raw vs zone-adjusted probability with separate tier badges |
| **Session History** | Last 10 predictions with sparkline trend, 4 session stat chips (count, avg prob, high-risk count, last result), BMI column |
| **Inference Timer** | Live ms counter in header showing round-trip API latency |
| **Input Validation** | Client-side range validation matching backend Pydantic constraints — inline errors per field |

---

## API Reference

### `POST /predict`

**Request body:**

```json
{
  "Pregnancies": 2,
  "Glucose": 138.0,
  "BloodPressure": 78.0,
  "SkinThickness": 30.0,
  "Insulin": 95.0,
  "BMI": 34.5,
  "DiabetesPedigreeFunction": 0.627,
  "Age": 42,
  "Region": "South_Asia",
  "IndianZone": "North"
}
```

`Region` options: `South_Asia` `North_America` `Europe` `East_Asia` `Africa`  
`IndianZone` options: `North` `South` `East` `West` `Central` (optional, `null` to skip NFHS-5)

**Response:**

```json
{
  "probability": 0.81,
  "risk_tier": "HIGH",
  "composite_risk_score": 5,
  "nfhs_adjusted_probability": 0.82,
  "nfhs_adjusted_tier": "HIGH",
  "feature_importance_proxy": {
    "Glucose": 0.6026,
    "BMI": 0.4083,
    "BloodPressure": 0.4833,
    "Insulin": 0.1056,
    "Age": 0.3445
  }
}
```

### `GET /health`

```json
{ "status": "ok", "model_loaded": true }
```

---

## Local Setup

### Requirements

- Python 3.11+
- Node.js 18+

### 1. Clone

```bash
git clone https://github.com/jayesh037/disease-prediction-app.git
cd disease-prediction-app
```

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate
source venv/bin/activate        # Linux / Mac
venv\Scripts\Activate.ps1      # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Start
uvicorn main:app --reload
```

Model artifacts download automatically from HuggingFace on first startup (~30 seconds). No manual file setup required.

```bash
# Verify
curl http://localhost:8000/health
# → {"status":"ok","model_loaded":true}
```

### 3. Frontend

```bash
# New terminal
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

The Vite dev proxy forwards `/api/*` to `http://localhost:8000` automatically. No `.env` configuration needed for local development.

---

## Deployment Guide

### Backend → Render.com

```yaml
# render.yaml
services:
  - type: web
    runtime: python
    pythonVersion: "3.11.9"
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: MODEL_PATH
        value: ./models/hybrid_dl_v2.keras
      - key: SCALER_PATH
        value: ./models/scaler_v2.pkl
```

### Frontend → Vercel

```bash
npm install -g vercel
cd frontend
vercel --prod
```

Set environment variable in Vercel dashboard:
```
VITE_API_URL = https://your-backend.onrender.com
```

---

## Validated Test Cases

These are real records from the PIMA Indians dataset used to verify model correctness end-to-end.

### Case 1 — Confirmed Diabetic (Outcome = 1)

```bash
curl -X POST https://disease-prediction-app-pebt.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Pregnancies": 1, "Glucose": 199, "BloodPressure": 76,
    "SkinThickness": 43, "Insulin": 0, "BMI": 42.9,
    "DiabetesPedigreeFunction": 1.394, "Age": 22,
    "Region": "South_Asia", "IndianZone": null
  }'
```

Expected: `risk_tier: "HIGH"` · `probability > 0.60` · `composite_risk_score: 5`

### Case 2 — Confirmed Non-Diabetic (Outcome = 0)

```bash
curl -X POST https://disease-prediction-app-pebt.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Pregnancies": 1, "Glucose": 71, "BloodPressure": 48,
    "SkinThickness": 18, "Insulin": 76, "BMI": 20.4,
    "DiabetesPedigreeFunction": 0.323, "Age": 22,
    "Region": "South_Asia", "IndianZone": null
  }'
```

Expected: `risk_tier: "LOW"` · `probability < 0.30` · `composite_risk_score: 0`

---

## Project Structure

```
disease-prediction-app/
│
├── backend/
│   ├── main.py                 # FastAPI app, CORS, lifespan startup loader
│   ├── predictor.py            # HuggingFace download, model/scaler loader, inference
│   ├── preprocessing.py        # Full 22-feature engineering pipeline
│   ├── risk_tier.py            # Tier thresholds, composite scoring, NFHS-5 zones
│   ├── schemas.py              # Pydantic v2 request/response models
│   ├── requirements.txt        # Python dependencies
│   ├── render.yaml             # Render deployment config
│   ├── .python-version         # Pins Python 3.11.9
│   └── models/
│       └── .gitkeep            # Artifacts auto-downloaded from HuggingFace
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Root shell, state, layout grid
│   │   ├── api.js              # Fetch wrapper, error handling
│   │   ├── index.css           # CSS design system, variables, component classes
│   │   └── components/
│   │       ├── PredictForm.jsx      # Input form with client-side validation
│   │       ├── GaugeChart.jsx       # SVG semicircle probability gauge
│   │       ├── RiskCard.jsx         # Risk output, reference ranges, score factors
│   │       ├── RiskFactorChart.jsx  # Horizontal bar chart (Recharts)
│   │       ├── RadarChart.jsx       # 5-axis feature radar (Recharts)
│   │       └── HistoryTable.jsx     # Session history, sparkline, stats
│   │
│   ├── package.json
│   ├── vite.config.js          # Dev proxy → localhost:8000
│   ├── tailwind.config.js
│   └── index.html
│
└── .gitignore
```

---

## Authors

<table>
<tr>
<td align="center">
<b>Jayesh</b><br/>
B.Tech CSE · Bennett University<br/>
<a href="https://github.com/jayesh037">@jayesh037</a>
</td>
<td align="center">
<b>Gunnu</b><br/>
B.Tech CSE · Bennett University<br/>
<a href="https://github.com/Gunnu29">@Gunnu29</a>
</td>
</tr>
</table>

---

<div align="center">

*Built with TensorFlow · FastAPI · React · Deployed on Render + Vercel*

⚕ *Clinical decision support only. Always consult a qualified healthcare professional.*

</div>
