# DiabetaLens — Diabetes Risk Prediction & Stratification

A production-ready serving layer for a **hybrid deep-learning diabetes risk model** trained on the PIMA Indians Diabetes dataset. Outputs probability scores, LOW/MEDIUM/HIGH risk tiers, composite clinical scores, and optional NFHS-5 zone-adjusted probabilities for Indian regional context.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| pip | 23+ |
| npm | 9+ |

---

## 1 · Serialize Model Artifacts from Your Notebook

After training your model, run the following in your notebook to export the two files required by this server:

```python
import pickle

# ── Save Keras model ──────────────────────────────────────────────────────
# model is your compiled/trained tf.keras.Model
model.save("hybrid_dl.h5")          # HDF5 format

# ── Save fitted StandardScaler ────────────────────────────────────────────
# scaler is your sklearn.preprocessing.StandardScaler fitted on X_train
with open("scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)
```

Then copy both files into `backend/models/`:

```bash
cp hybrid_dl.h5 disease-prediction-app/backend/models/
cp scaler.pkl   disease-prediction-app/backend/models/
```

> **Important**: The scaler must have been fitted on features in **exactly** this column order (22 features):
> `Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI, DiabetesPedigreeFunction, Age, Glucose_BMI, Insulin_Glucose_Ratio, BP_Age_Interaction, MetabolicRisk, Region_Africa, Region_East_Asia, Region_Europe, Region_North_America, Region_South_Asia, AgeGroup_<30, AgeGroup_30-40, AgeGroup_40-50, AgeGroup_50-60, AgeGroup_60+`

---

## 2 · Local Development Setup

### Backend

```bash
cd disease-prediction-app/backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp ../.env.example .env
# Edit .env: set MODEL_PATH and SCALER_PATH (defaults work if files are in backend/models/)

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be live at http://localhost:8000  
Interactive docs: http://localhost:8000/docs

### Frontend

```bash
cd disease-prediction-app/frontend

npm install
npm run dev
```

App will be at http://localhost:5173  
Vite automatically proxies `/api/*` → `http://localhost:8000/*` in dev mode.

---

## 3 · Deploy to Render (Backend)

1. Push this repository to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service**.
3. Connect your GitHub repo. Set **Root Directory** to `backend`.
4. Render will auto-detect `render.yaml` — review and confirm settings.
5. Under **Environment**, add:
   - `MODEL_PATH` = `./models/hybrid_dl.h5`
   - `SCALER_PATH` = `./models/scaler.pkl`
6. **Upload model artifacts** via the Render shell (one-time):
   ```bash
   # In Render shell:
   curl -F "file=@hybrid_dl.h5" ...  # or use Render's persistent disk / S3
   ```
   > **Tip**: On Render's free tier, the filesystem is ephemeral. For persistent model storage, use a Render [Persistent Disk](https://render.com/docs/disks) or S3 + download-on-startup script.

---

## 4 · Deploy to Vercel (Frontend)

```bash
cd disease-prediction-app/frontend
npm run build          # outputs to dist/
```

1. Connect your GitHub repo to [vercel.com](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable:
   - `VITE_API_URL` = `https://your-backend.onrender.com`

Vercel will automatically rebuild on every push to main.

---

## 5 · API Reference

### `GET /health`

```bash
curl https://your-backend.onrender.com/health
```

```json
{ "status": "ok", "model_loaded": true }
```

---

### `POST /predict`

```bash
curl -X POST https://your-backend.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

**Response:**

```json
{
  "probability": 0.73,
  "risk_tier": "HIGH",
  "composite_risk_score": 4,
  "nfhs_adjusted_probability": 0.74,
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

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `probability` | float | Raw model output (0–1, 2 dp) |
| `risk_tier` | string | `LOW` \| `MEDIUM` \| `HIGH` |
| `composite_risk_score` | int | 0–7 clinical threshold score |
| `nfhs_adjusted_probability` | float \| null | Zone-adjusted probability; null if `IndianZone` omitted |
| `nfhs_adjusted_tier` | string \| null | Tier re-classified on adjusted probability |
| `feature_importance_proxy` | object | Normalised feature values for radar chart |

#### Validation Constraints

| Field | Type | Range |
|-------|------|-------|
| `Pregnancies` | int | 0–20 |
| `Glucose` | float | 44–200 |
| `BloodPressure` | float | 20–140 |
| `SkinThickness` | float | 0–100 |
| `Insulin` | float | 0–900 |
| `BMI` | float | 10–70 |
| `DiabetesPedigreeFunction` | float | 0.0–2.5 |
| `Age` | int | 1–120 |

---

## Project Structure

```
disease-prediction-app/
├── backend/
│   ├── main.py            # FastAPI app + CORS
│   ├── schemas.py         # Pydantic request/response models
│   ├── predictor.py       # Model load + inference orchestration
│   ├── preprocessing.py   # Feature engineering pipeline (22 features)
│   ├── risk_tier.py       # Tier classification + NFHS-5 + radar proxy
│   ├── models/            # ← drop hybrid_dl.h5 + scaler.pkl here
│   ├── requirements.txt
│   └── render.yaml
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── components/
│   │       ├── PredictForm.jsx
│   │       ├── RiskCard.jsx
│   │       ├── RadarChart.jsx
│   │       └── HistoryTable.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── .env.example
└── README.md
```

---

## NFHS-5 Zone Multipliers

| Zone | Multiplier | Effect |
|------|-----------|--------|
| North | 1.008 | +0.8% |
| South | 1.098 | +9.8% |
| East | 0.942 | −5.8% |
| West | 0.998 | −0.2% |
| Central | 0.954 | −4.6% |

Multipliers derived from NFHS-5 (2019–21) state-level diabetes prevalence data.

---

## License

For research and clinical decision support only. Not a substitute for professional medical advice.
