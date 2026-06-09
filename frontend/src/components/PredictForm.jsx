// src/components/PredictForm.jsx
import React, { useState, useCallback } from 'react';

const REGIONS     = ['South_Asia', 'North_America', 'Europe', 'East_Asia', 'Africa'];
const INDIAN_ZONES = ['North', 'South', 'East', 'West', 'Central'];

const FIELDS = [
  { key: 'Pregnancies',             label: 'Pregnancies',      type: 'integer', min: 0,   max: 20,  step: 1,     placeholder: '0–20',         hint: 'Times pregnant',             icon: '🤰' },
  { key: 'Glucose',                 label: 'Glucose',          type: 'float',   min: 44,  max: 200, step: 0.1,   placeholder: '44–200 mg/dL', hint: 'Plasma glucose (mg/dL)',      icon: '🩸' },
  { key: 'BloodPressure',           label: 'Blood Pressure',   type: 'float',   min: 20,  max: 140, step: 0.1,   placeholder: '20–140 mm Hg', hint: 'Diastolic BP (mm Hg)',        icon: '💓' },
  { key: 'SkinThickness',           label: 'Skin Thickness',   type: 'float',   min: 0,   max: 100, step: 0.1,   placeholder: '0–100 mm',     hint: 'Triceps fold (mm)',           icon: '📏' },
  { key: 'Insulin',                 label: 'Insulin',          type: 'float',   min: 0,   max: 900, step: 0.1,   placeholder: '0–900 µU/mL',  hint: '2-hr serum insulin',         icon: '💉' },
  { key: 'BMI',                     label: 'BMI',              type: 'float',   min: 10,  max: 70,  step: 0.1,   placeholder: '10–70 kg/m²',  hint: 'Body mass index',             icon: '⚖️' },
  { key: 'DiabetesPedigreeFunction',label: 'Pedigree Function',type: 'float',   min: 0,   max: 2.5, step: 0.001, placeholder: '0.000–2.500',  hint: 'Diabetes pedigree score',    icon: '🧬' },
  { key: 'Age',                     label: 'Age',              type: 'integer', min: 1,   max: 120, step: 1,     placeholder: '1–120 yrs',    hint: 'Age in years',               icon: '🗓️' },
];

const DEFAULTS = {
  Pregnancies: '', Glucose: '', BloodPressure: '', SkinThickness: '',
  Insulin: '', BMI: '', DiabetesPedigreeFunction: '', Age: '',
  Region: 'South_Asia', IndianZone: '',
};

function validateField(key, value, type, min, max) {
  if (value === '' || value == null) return `Required`;
  const num = Number(value);
  if (isNaN(num))              return 'Must be a number';
  if (num < min || num > max)  return `${min}–${max}`;
  if (type === 'integer' && !Number.isInteger(num)) return 'Whole number only';
  return null;
}

export default function PredictForm({ onSubmit, loading }) {
  const [values,  setValues]  = useState(DEFAULTS);
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback((key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setTouched((prev) => {
      if (!prev[key]) return prev;
      const f = FIELDS.find((f) => f.key === key);
      if (f) setErrors((e) => ({ ...e, [key]: validateField(key, val, f.type, f.min, f.max) }));
      return prev;
    });
  }, []);

  const handleBlur = useCallback((key) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const f = FIELDS.find((f) => f.key === key);
    if (f) setErrors((e) => ({ ...e, [key]: validateField(key, values[key], f.type, f.min, f.max) }));
  }, [values]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const newErrors = {};
    let valid = true;
    FIELDS.forEach(({ key, type, min, max }) => {
      const err = validateField(key, values[key], type, min, max);
      if (err) { newErrors[key] = err; valid = false; }
    });
    setErrors(newErrors);
    setTouched(FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: true }), {}));
    if (!valid) return;

    onSubmit({
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
    });
  }, [values, onSubmit]);

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* 2-column grid for numeric inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {FIELDS.map(({ key, label, type, min, max, step, placeholder, hint, icon }) => {
          const hasError = touched[key] && errors[key];
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label htmlFor={`f-${key}`} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)',
              }}>
                <span>{icon}</span>{label}
              </label>
              <input
                id={`f-${key}`}
                type="number"
                inputMode="decimal"
                min={min} max={max} step={step}
                value={values[key]}
                placeholder={placeholder}
                onChange={(e) => handleChange(key, e.target.value)}
                onBlur={() => handleBlur(key)}
                disabled={loading}
                className={`input-field${hasError ? ' input-error' : ''}`}
              />
              <span style={{ fontSize: '0.62rem', color: hasError ? '#ef4444' : 'var(--text-dim)', minHeight: 14 }}>
                {hasError ? `⚠ ${errors[key]}` : hint}
              </span>
            </div>
          );
        })}
      </div>

      {/* Dropdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Region */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label htmlFor="f-Region" style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            🌍 Region
          </label>
          <select id="f-Region" value={values.Region}
            onChange={(e) => handleChange('Region', e.target.value)}
            disabled={loading} className="input-field"
            style={{ appearance: 'none', cursor: 'pointer' }}>
            {REGIONS.map((r) => (
              <option key={r} value={r} style={{ background: 'var(--bg-card)' }}>
                {r.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Indian Zone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label htmlFor="f-IndianZone" style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
            🇮🇳 Indian Zone
            <span style={{
              background: 'rgba(6,182,212,0.1)', color: 'var(--cyan-400)',
              border: '1px solid rgba(6,182,212,0.2)',
              borderRadius: 999, padding: '1px 6px', fontSize: '0.58rem', fontWeight: 600,
            }}>optional</span>
          </label>
          <select id="f-IndianZone" value={values.IndianZone}
            onChange={(e) => handleChange('IndianZone', e.target.value)}
            disabled={loading} className="input-field"
            style={{ appearance: 'none', cursor: 'pointer' }}>
            <option value="" style={{ background: 'var(--bg-card)' }}>None — skip NFHS-5</option>
            {INDIAN_ZONES.map((z) => (
              <option key={z} value={z} style={{ background: 'var(--bg-card)' }}>{z}</option>
            ))}
          </select>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>Enables regional prevalence adjustment</span>
        </div>
      </div>

      {/* Submit */}
      <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: 4 }}>
        {loading ? (
          <>
            <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.25" strokeWidth="4"/>
              <path d="M4 12a8 8 0 018-8" stroke="white" strokeWidth="4" strokeLinecap="round"/>
            </svg>
            Running inference…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Predict Risk
          </>
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
