// src/components/PredictForm.jsx
// -----------------------------------------------------------------------
// Input form for all 8 clinical features + Region + IndianZone.
// Validates ranges client-side (matching backend Pydantic constraints).
// Disables submit while loading. Shows inline field-level error messages.
// USER: Validation ranges (Glucose 44-200 etc.) must stay in sync with
// schemas.py. The Region dropdown values must match the API enum exactly.
// -----------------------------------------------------------------------

import React, { useState, useCallback } from 'react';

const REGIONS = ['South_Asia', 'North_America', 'Europe', 'East_Asia', 'Africa'];
const INDIAN_ZONES = ['North', 'South', 'East', 'West', 'Central'];

const FIELDS = [
  {
    key: 'Pregnancies',
    label: 'Pregnancies',
    type: 'integer',
    min: 0,
    max: 20,
    step: 1,
    placeholder: '0–20',
    hint: 'Number of times pregnant',
    icon: '🤰',
  },
  {
    key: 'Glucose',
    label: 'Glucose',
    type: 'float',
    min: 44,
    max: 200,
    step: 0.1,
    placeholder: '44–200 mg/dL',
    hint: 'Plasma glucose concentration (mg/dL)',
    icon: '🩸',
  },
  {
    key: 'BloodPressure',
    label: 'Blood Pressure',
    type: 'float',
    min: 20,
    max: 140,
    step: 0.1,
    placeholder: '20–140 mm Hg',
    hint: 'Diastolic blood pressure (mm Hg)',
    icon: '💓',
  },
  {
    key: 'SkinThickness',
    label: 'Skin Thickness',
    type: 'float',
    min: 0,
    max: 100,
    step: 0.1,
    placeholder: '0–100 mm',
    hint: 'Triceps skin fold thickness (mm)',
    icon: '📏',
  },
  {
    key: 'Insulin',
    label: 'Insulin',
    type: 'float',
    min: 0,
    max: 900,
    step: 0.1,
    placeholder: '0–900 µU/mL',
    hint: '2-hour serum insulin (µU/mL)',
    icon: '💉',
  },
  {
    key: 'BMI',
    label: 'BMI',
    type: 'float',
    min: 10,
    max: 70,
    step: 0.1,
    placeholder: '10–70 kg/m²',
    hint: 'Body mass index (kg/m²)',
    icon: '⚖️',
  },
  {
    key: 'DiabetesPedigreeFunction',
    label: 'Pedigree Function',
    type: 'float',
    min: 0,
    max: 2.5,
    step: 0.001,
    placeholder: '0.000–2.500',
    hint: 'Diabetes pedigree function score',
    icon: '🧬',
  },
  {
    key: 'Age',
    label: 'Age',
    type: 'integer',
    min: 1,
    max: 120,
    step: 1,
    placeholder: '1–120 years',
    hint: 'Age in years',
    icon: '🗓️',
  },
];

const DEFAULTS = {
  Pregnancies: '',
  Glucose: '',
  BloodPressure: '',
  SkinThickness: '',
  Insulin: '',
  BMI: '',
  DiabetesPedigreeFunction: '',
  Age: '',
  Region: 'South_Asia',
  IndianZone: '',
};

function validateField(key, value, type, min, max) {
  if (value === '' || value === undefined || value === null) return `${key} is required`;
  const num = Number(value);
  if (isNaN(num)) return 'Must be a number';
  if (num < min || num > max) return `Must be between ${min} and ${max}`;
  if (type === 'integer' && !Number.isInteger(num)) return 'Must be a whole number';
  return null;
}

export default function PredictForm({ onSubmit, loading }) {
  const [values, setValues]   = useState(DEFAULTS);
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback((key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    // Re-validate on change if field was already touched
    setTouched((prev) => {
      if (!prev[key]) return prev;
      const field = FIELDS.find((f) => f.key === key);
      if (field) {
        const err = validateField(key, val, field.type, field.min, field.max);
        setErrors((e) => ({ ...e, [key]: err }));
      }
      return prev;
    });
  }, []);

  const handleBlur = useCallback((key) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const field = FIELDS.find((f) => f.key === key);
    if (field) {
      const err = validateField(key, values[key], field.type, field.min, field.max);
      setErrors((e) => ({ ...e, [key]: err }));
    }
  }, [values]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    // Validate all numeric fields
    const newErrors = {};
    let valid = true;
    FIELDS.forEach(({ key, type, min, max }) => {
      const err = validateField(key, values[key], type, min, max);
      if (err) { newErrors[key] = err; valid = false; }
    });
    setErrors(newErrors);
    setTouched(FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: true }), {}));

    if (!valid) return;

    const payload = {
      Pregnancies:              parseInt(values.Pregnancies, 10),
      Glucose:                  parseFloat(values.Glucose),
      BloodPressure:            parseFloat(values.BloodPressure),
      SkinThickness:            parseFloat(values.SkinThickness),
      Insulin:                  parseFloat(values.Insulin),
      BMI:                      parseFloat(values.BMI),
      DiabetesPedigreeFunction: parseFloat(values.DiabetesPedigreeFunction),
      Age:                      parseInt(values.Age, 10),
      Region:                   values.Region,
      IndianZone:               values.IndianZone || null,
    };

    onSubmit(payload);
  }, [values, onSubmit]);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4" id="predict-form">
      {/* 8 clinical inputs in 2-column grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map(({ key, label, type, min, max, step, placeholder, hint, icon }) => (
          <div key={key} className="flex flex-col gap-1">
            <label
              htmlFor={`field-${key}`}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400"
            >
              <span role="img" aria-label="">{icon}</span>
              {label}
            </label>
            <input
              id={`field-${key}`}
              type="number"
              inputMode="decimal"
              min={min}
              max={max}
              step={step}
              value={values[key]}
              placeholder={placeholder}
              onChange={(e) => handleChange(key, e.target.value)}
              onBlur={() => handleBlur(key)}
              disabled={loading}
              className={`input-field ${touched[key] && errors[key] ? 'input-error' : ''}`}
              aria-describedby={errors[key] ? `${key}-error` : `${key}-hint`}
              aria-invalid={!!(touched[key] && errors[key])}
            />
            {touched[key] && errors[key] ? (
              <p id={`${key}-error`} className="text-[11px] text-red-400 flex items-center gap-1">
                <span>⚠</span> {errors[key]}
              </p>
            ) : (
              <p id={`${key}-hint`} className="text-[10px] text-slate-600">{hint}</p>
            )}
          </div>
        ))}
      </div>

      {/* Dropdowns row */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Region */}
        <div className="flex flex-col gap-1">
          <label htmlFor="field-Region" className="text-xs font-medium text-slate-400">
            🌍 Region
          </label>
          <select
            id="field-Region"
            value={values.Region}
            onChange={(e) => handleChange('Region', e.target.value)}
            disabled={loading}
            className="input-field appearance-none cursor-pointer"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r} className="bg-slate-900">
                {r.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* IndianZone (optional) */}
        <div className="flex flex-col gap-1">
          <label htmlFor="field-IndianZone" className="text-xs font-medium text-slate-400">
            🇮🇳 Indian Zone
            <span className="ml-1 rounded-full bg-slate-700 px-1.5 py-0.5 text-[9px] text-slate-500">
              optional
            </span>
          </label>
          <select
            id="field-IndianZone"
            value={values.IndianZone}
            onChange={(e) => handleChange('IndianZone', e.target.value)}
            disabled={loading}
            className="input-field appearance-none cursor-pointer"
          >
            <option value="" className="bg-slate-900">None (skip NFHS-5)</option>
            {INDIAN_ZONES.map((z) => (
              <option key={z} value={z} className="bg-slate-900">{z}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-600">Enables NFHS-5 regional adjustment</p>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        id="predict-submit-btn"
        disabled={loading}
        className="btn-primary w-full mt-2"
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Running Inference…
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Predict Risk
          </>
        )}
      </button>
    </form>
  );
}
