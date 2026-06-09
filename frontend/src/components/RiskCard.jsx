// src/components/RiskCard.jsx
import React from 'react';

const TIER_CONFIG = {
  LOW:    { label: 'LOW RISK',    color: 'var(--risk-low)',    bg: 'var(--risk-low-bg)',    bar: '#10b981' },
  MEDIUM: { label: 'MEDIUM RISK', color: 'var(--risk-medium)', bg: 'var(--risk-medium-bg)', bar: '#f59e0b' },
  HIGH:   { label: 'HIGH RISK',   color: 'var(--risk-high)',   bg: 'var(--risk-high-bg)',   bar: '#ef4444' },
};

const SCORE_FACTORS = [
  { label: 'Glucose > 140', key: 'glucose', check: (r) => r.Glucose > 140,      pts: 3, icon: '🩸' },
  { label: 'BMI > 30',      key: 'bmi',     check: (r) => r.BMI > 30,            pts: 2, icon: '⚖️' },
  { label: 'BP > 80',       key: 'bp',      check: (r) => r.BloodPressure > 80,  pts: 1, icon: '💓' },
  { label: 'Insulin > 200', key: 'insulin', check: (r) => r.Insulin > 200,       pts: 1, icon: '💉' },
  { label: 'Age > 45',      key: 'age',     check: (r) => r.Age > 45,            pts: 1, icon: '🗓️' },
];

// Clinical reference ranges for the mini range indicator
const CLINICAL_REFS = [
  { key: 'Glucose',       label: 'Glucose',  unit: 'mg/dL', min: 44,  max: 200, normal: [70, 100],  warn: [100, 126] },
  { key: 'BMI',           label: 'BMI',      unit: 'kg/m²', min: 10,  max: 70,  normal: [18.5, 25], warn: [25, 30]   },
  { key: 'BloodPressure', label: 'BP',       unit: 'mm Hg', min: 20,  max: 140, normal: [60, 80],   warn: [80, 90]   },
];

function MiniRangeBar({ field, value }) {
  const { label, unit, min, max, normal, warn } = field;
  const pct = (v) => Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));

  // Determine zone
  let zone = 'normal';
  if (value < normal[0] || value > warn[1]) zone = 'high';
  else if (value > normal[1])               zone = 'warn';

  const zoneColor = { normal: '#10b981', warn: '#f59e0b', high: '#ef4444' }[zone];

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{label}</span>
        <span className="mono" style={{ fontSize: '0.72rem', color: zoneColor, fontWeight: 600 }}>
          {value} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>{unit}</span>
        </span>
      </div>
      {/* Track */}
      <div style={{ height: 5, background: 'rgba(99,179,237,0.07)', borderRadius: 4, position: 'relative' }}>
        {/* Normal zone band */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, borderRadius: 4,
          left: `${pct(normal[0])}%`, width: `${pct(normal[1]) - pct(normal[0])}%`,
          background: 'rgba(16,185,129,0.18)',
        }}/>
        {/* Warn zone band */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${pct(warn[0])}%`, width: `${pct(warn[1]) - pct(warn[0])}%`,
          background: 'rgba(245,158,11,0.18)',
        }}/>
        {/* Value marker */}
        <div style={{
          position: 'absolute', top: -2, width: 9, height: 9, borderRadius: '50%',
          background: zoneColor,
          left: `calc(${pct(value)}% - 4px)`,
          boxShadow: `0 0 6px ${zoneColor}`,
          transition: 'left 0.5s ease',
        }}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: '0.58rem', color: 'var(--text-dim)' }}>{min}</span>
        <span style={{ fontSize: '0.58rem', color: 'var(--text-dim)' }}>{max}</span>
      </div>
    </div>
  );
}

function ProbBar({ value, color, label, zone }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{label}</span>
        <span className="mono" style={{ fontSize: '0.75rem', color, fontWeight: 700 }}>
          {(value * 100).toFixed(1)}%
        </span>
      </div>
      <div style={{ height: 7, background: 'rgba(99,179,237,0.07)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 999,
          width: `${(value * 100).toFixed(1)}%`,
          background: color,
          boxShadow: `0 0 8px ${color}`,
          transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
        }}/>
      </div>
    </div>
  );
}

export default function RiskCard({ result, request }) {
  const { probability, risk_tier, composite_risk_score, nfhs_adjusted_probability, nfhs_adjusted_tier } = result;
  const tierCfg = TIER_CONFIG[risk_tier];
  const adjCfg  = nfhs_adjusted_tier ? TIER_CONFIG[nfhs_adjusted_tier] : null;

  return (
    <div className="card animate-fadeUp" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Probability bars ── */}
      <div>
        <div className="section-label" style={{ marginBottom: 10 }}>Model Output</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ProbBar value={probability} color={tierCfg.bar} label="Raw probability" />
          {nfhs_adjusted_probability != null && adjCfg && (
            <ProbBar
              value={nfhs_adjusted_probability}
              color={adjCfg.bar}
              label={`NFHS-5 adjusted · ${request?.IndianZone ?? ''} zone`}
            />
          )}
        </div>
      </div>

      {/* ── NFHS side-by-side ── */}
      {nfhs_adjusted_probability != null && adjCfg && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Raw Model',      val: probability,             cfg: tierCfg },
            { label: 'NFHS-5 Adjusted', val: nfhs_adjusted_probability, cfg: adjCfg  },
          ].map(({ label, val, cfg }) => (
            <div key={label} style={{
              background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
              borderRadius: 10, padding: '10px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
              <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: cfg.bar }}>{(val * 100).toFixed(1)}%</div>
              <span className={`tier-badge tier-${cfg.label.split(' ')[0].toLowerCase()}`} style={{ marginTop: 4, fontSize: '0.6rem', padding: '2px 8px' }}>
                {cfg.label.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 1, background: 'var(--border-subtle)' }}/>

      {/* ── Clinical reference ranges ── */}
      {request && (
        <div>
          <div className="section-label" style={{ marginBottom: 10 }}>Clinical Reference</div>
          {CLINICAL_REFS.map((f) => (
            <MiniRangeBar key={f.key} field={f} value={request[f.key]} />
          ))}
        </div>
      )}

      <div style={{ height: 1, background: 'var(--border-subtle)' }}/>

      {/* ── Composite risk score ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="section-label">Clinical Risk Score</div>
          <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {composite_risk_score}<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> / 7</span>
          </span>
        </div>

        {/* Score gradient bar */}
        <div style={{ height: 6, background: 'rgba(99,179,237,0.07)', borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{
            height: '100%', borderRadius: 999,
            width: `${(composite_risk_score / 7) * 100}%`,
            background: 'linear-gradient(90deg, #10b981 0%, #f59e0b 55%, #ef4444 100%)',
            transition: 'width 0.7s ease',
          }}/>
        </div>

        {/* Factor pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {request && SCORE_FACTORS.map(({ label, key, check, pts, icon }) => {
            const active = check(request);
            return (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '3px 9px', borderRadius: 999, fontSize: '0.68rem',
                background: active ? 'var(--risk-high-bg)' : 'rgba(99,179,237,0.05)',
                color: active ? 'var(--risk-high)' : 'var(--text-muted)',
                border: `1px solid ${active ? 'var(--risk-high-ring)' : 'transparent'}`,
                transition: 'all 0.2s',
              }}>
                <span>{icon}</span>
                {label}
                {active && (
                  <span style={{
                    background: 'rgba(239,68,68,0.2)', color: '#fca5a5',
                    borderRadius: 999, padding: '0 5px', fontSize: '0.6rem', fontWeight: 700,
                  }}>+{pts}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.5, paddingTop: 4 }}>
        ⚕ Clinical decision support only. Not a substitute for professional medical advice.
      </div>
    </div>
  );
}
