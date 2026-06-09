// src/components/RiskCard.jsx
// -----------------------------------------------------------------------
// Displays the prediction result: tier badge, probability bar, composite
// score indicators, and optional NFHS-5 adjusted probability side-by-side.
// -----------------------------------------------------------------------

import React from 'react';

const TIER_CONFIG = {
  LOW:    { label: 'LOW RISK',    cls: 'tier-low',    bar: 'bg-green-500', glow: 'shadow-green-500/20'  },
  MEDIUM: { label: 'MEDIUM RISK', cls: 'tier-medium', bar: 'bg-amber-500', glow: 'shadow-amber-500/20'  },
  HIGH:   { label: 'HIGH RISK',   cls: 'tier-high',   bar: 'bg-red-500',   glow: 'shadow-red-500/20'    },
};

// Clinical threshold icons for the composite score breakdown
const SCORE_FACTORS = [
  { label: 'Glucose > 140',   icon: '🩸', points: 3, key: 'glucose' },
  { label: 'BMI > 30',        icon: '⚖️', points: 2, key: 'bmi'     },
  { label: 'BP > 80',         icon: '💓', points: 1, key: 'bp'      },
  { label: 'Insulin > 200',   icon: '💉', points: 1, key: 'insulin' },
  { label: 'Age > 45',        icon: '🗓️', points: 1, key: 'age'    },
];

function getActiveFactors(request) {
  if (!request) return [];
  return {
    glucose: request.Glucose > 140,
    bmi:     request.BMI > 30,
    bp:      request.BloodPressure > 80,
    insulin: request.Insulin > 200,
    age:     request.Age > 45,
  };
}

function ProbabilityBar({ value, barClass, label }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
        <span>{label}</span>
        <span className="mono font-semibold text-slate-200">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-700/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barClass}`}
          style={{ width: `${(value * 100).toFixed(1)}%` }}
          role="progressbar"
          aria-valuenow={Math.round(value * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

export default function RiskCard({ result, request }) {
  const {
    probability,
    risk_tier,
    composite_risk_score,
    nfhs_adjusted_probability,
    nfhs_adjusted_tier,
  } = result;

  const tierCfg  = TIER_CONFIG[risk_tier];
  const adjCfg   = nfhs_adjusted_tier ? TIER_CONFIG[nfhs_adjusted_tier] : null;
  const actives  = getActiveFactors(request);

  return (
    <div
      id="risk-result-card"
      className={`glass-card p-6 shadow-xl ${tierCfg.glow}`}
    >
      {/* ── Top: tier badge + probability ────────────────────────── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Risk Assessment</p>
          <div className="flex items-center gap-3">
            <span className={tierCfg.cls}>{tierCfg.label}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Probability</p>
          <p className="mono text-3xl font-bold text-slate-100">
            {(probability * 100).toFixed(0)}
            <span className="text-lg text-slate-400">%</span>
          </p>
        </div>
      </div>

      {/* ── Probability bars ─────────────────────────────────────── */}
      <div className="space-y-3 mb-5">
        <ProbabilityBar
          value={probability}
          barClass={tierCfg.bar}
          label="Model Probability"
        />
        {nfhs_adjusted_probability !== null && nfhs_adjusted_probability !== undefined && adjCfg && (
          <ProbabilityBar
            value={nfhs_adjusted_probability}
            barClass={adjCfg.bar}
            label={`NFHS-5 Adjusted (${request?.IndianZone ?? ''} Zone)`}
          />
        )}
      </div>

      {/* ── Side-by-side if NFHS adjusted ────────────────────────── */}
      {nfhs_adjusted_probability !== null && nfhs_adjusted_probability !== undefined && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl bg-slate-900/50 border border-slate-700/40 p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Raw Model</p>
            <p className="mono text-xl font-bold">{(probability * 100).toFixed(1)}%</p>
            <span className={`mt-1 ${tierCfg.cls}`}>{risk_tier}</span>
          </div>
          <div className="rounded-xl bg-slate-900/50 border border-slate-700/40 p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">NFHS-5 Adjusted</p>
            <p className="mono text-xl font-bold">{(nfhs_adjusted_probability * 100).toFixed(1)}%</p>
            {adjCfg && <span className={`mt-1 ${adjCfg.cls}`}>{nfhs_adjusted_tier}</span>}
          </div>
        </div>
      )}

      {/* ── Composite Risk Score ──────────────────────────────────── */}
      <div className="border-t border-slate-700/50 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-300">Clinical Risk Score</p>
          <p className="mono text-sm font-bold text-slate-200">
            {composite_risk_score}
            <span className="text-slate-500"> / 7</span>
          </p>
        </div>

        {/* Score bar */}
        <div className="h-2 w-full rounded-full bg-slate-700/60 mb-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500 transition-all duration-700"
            style={{ width: `${(composite_risk_score / 7) * 100}%` }}
          />
        </div>

        {/* Factor pills */}
        <div className="flex flex-wrap gap-2">
          {SCORE_FACTORS.map(({ label, icon, points, key }) => {
            const active = actives[key];
            return (
              <div
                key={key}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                  active
                    ? 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30'
                    : 'bg-slate-700/40 text-slate-500'
                }`}
              >
                <span role="img" aria-label="">{icon}</span>
                {label}
                {active && (
                  <span className="ml-0.5 rounded-full bg-red-500/20 px-1 text-[10px] font-bold text-red-400">
                    +{points}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Disclaimer ───────────────────────────────────────────── */}
      <p className="mt-4 text-[10px] text-slate-600 leading-relaxed">
        ⚕ For clinical decision support only. Not a substitute for professional medical advice.
      </p>
    </div>
  );
}
