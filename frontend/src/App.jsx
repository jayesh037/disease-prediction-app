// src/App.jsx
import React, { useState, useCallback, useRef } from 'react';
import PredictForm from './components/PredictForm.jsx';
import RiskCard from './components/RiskCard.jsx';
import RadarChart from './components/RadarChart.jsx';
import HistoryTable from './components/HistoryTable.jsx';
import RiskFactorChart from './components/RiskFactorChart.jsx';
import GaugeChart from './components/GaugeChart.jsx';
import { predict } from './api.js';

const MAX_HISTORY = 10;

const STAT_CHIPS = [
  { label: 'Architecture',  value: 'Residual MLP'  },
  { label: 'Dataset',       value: 'PIMA Indians'  },
  { label: 'Features',      value: '22 engineered' },
  { label: 'Risk Tiers',    value: '3-level'       },
  { label: 'Region Adjust', value: 'NFHS-5'        },
];

export default function App() {
  const [result, setResult]           = useState(null);
  const [lastRequest, setLastRequest] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [history, setHistory]         = useState([]);
  const [inferenceMs, setInferenceMs] = useState(null);
  const resultRef = useRef(null);

  const handleSubmit = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    setResult(null);
    const t0 = performance.now();
    try {
      const response = await predict(formData);
      setInferenceMs(Math.round(performance.now() - t0));
      setResult(response);
      setLastRequest(formData);
      setHistory((prev) => [{
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        tier: response.risk_tier,
        probability: response.probability,
        age: formData.Age,
        glucose: formData.Glucose,
        bmi: formData.BMI,
        composite: response.composite_risk_score,
      }, ...prev].slice(0, MAX_HISTORY));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err.message ?? 'Unexpected error — check backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(7,14,26,0.88)',
        backdropFilter: 'blur(14px)',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 14px rgba(6,182,212,0.35)',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.03em' }} className="text-gradient">DiabetaLens</div>
                <div style={{ fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Clinical Risk Intelligence</div>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 13px', borderRadius: 999,
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              fontSize: '0.7rem', color: 'var(--text-secondary)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}/>
              Model loaded · inference ready
              {inferenceMs && (
                <span className="mono" style={{ color: 'var(--cyan-400)', marginLeft: 4 }}>{inferenceMs}ms</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 18px', textAlign: 'center' }}>
        <div className="section-label" style={{ marginBottom: 8 }}>Clinical Decision Support · Diabetes Risk</div>
        <h1 style={{ fontSize: 'clamp(1.5rem,3.5vw,2.4rem)', fontWeight: 800, marginBottom: 10, lineHeight: 1.15 }}>
          Risk Stratification from <span className="text-gradient">8 Clinical Inputs</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 500, margin: '0 auto 18px', lineHeight: 1.7 }}>
          Residual MLP with BatchNorm &amp; Dropout trained on PIMA Indians dataset.
          3-tier risk scoring with optional NFHS-5 regional calibration for India.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 7 }}>
          {STAT_CHIPS.map(({ label, value }) => (
            <div key={label} className="stat-chip">
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--cyan-400)' }}>{value}</span>
              <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Main ── */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 60px' }}>

        {/* Row 1: Form (left) + Results (right) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,420px) minmax(0,1fr)', gap: 18, alignItems: 'start' }}>

          {/* Form */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: 'rgba(6,182,212,0.10)', border: '1px solid rgba(6,182,212,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-400)" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Clinical Input Parameters</span>
            </div>
            <PredictForm onSubmit={handleSubmit} loading={loading} />
          </div>

          {/* Results */}
          <div ref={resultRef} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Error */}
            {error && (
              <div className="card animate-scaleIn" style={{ padding: 14, background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}>
                <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="#ef4444"/>
                  </svg>
                  <div>
                    <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.78rem', marginBottom: 2 }}>Prediction failed</div>
                    <div style={{ color: '#fca5a5', fontSize: '0.75rem' }}>{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="skeleton" style={{ height: 18, width: '40%' }}/>
                <div className="skeleton" style={{ height: 72 }}/>
                <div className="skeleton" style={{ height: 13, width: '65%' }}/>
                <div className="skeleton" style={{ height: 13, width: '45%' }}/>
              </div>
            )}

            {result && !loading && (
              <>
                {/* ── Row A: Gauge + RiskCard side by side ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <GaugeChart probability={result.probability} tier={result.risk_tier} />
                  <RiskCard result={result} request={lastRequest} />
                </div>

                {/* ── Row B: Factor Analysis + Radar side by side ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <RiskFactorChart result={result} request={lastRequest} />

                  <div className="card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-400)" strokeWidth="2">
                        <polygon points="12 2 2 7 2 17 12 22 22 17 22 7 12 2"/>
                      </svg>
                      <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>Feature Profile Radar</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: 'var(--text-muted)' }}>Normalised physiological position</span>
                    </div>
                    <RadarChart data={result.feature_importance_proxy} tier={result.risk_tier} />
                  </div>
                </div>
              </>
            )}

            {/* Empty state */}
            {!result && !loading && !error && (
              <div className="card" style={{
                padding: 44, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 300,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 4 }}>Awaiting clinical input</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>Fill in the parameters and click Predict Risk</div>
              </div>
            )}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <HistoryTable history={history} onClear={clearHistory} />
          </div>
        )}
      </main>
    </div>
  );
}
