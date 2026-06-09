// src/components/GaugeChart.jsx
// Fixed SVG semicircle gauge — verified coordinate math:
// Gauge spans from 180° (left) to 0° (right) in standard math coords.
// SVG y-axis is inverted, so point(angle) = (cx + r·cos(a), cy - r·sin(a))
// Arc always uses sweep-flag=1 (clockwise on screen), large-arc=1 only if span>180°.

import React, { useEffect, useState } from 'react';

const TIER_COLORS = {
  LOW:    { primary: '#10b981', glow: 'rgba(16,185,129,0.4)',  label: 'LOW RISK'    },
  MEDIUM: { primary: '#f59e0b', glow: 'rgba(245,158,11,0.4)', label: 'MEDIUM RISK' },
  HIGH:   { primary: '#ef4444', glow: 'rgba(239,68,68,0.4)',  label: 'HIGH RISK'   },
};

const CX = 110, CY = 100, R = 80;

function pt(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + R * Math.cos(rad),
    y: CY - R * Math.sin(rad), // SVG y is flipped
  };
}

function arcPath(fromDeg, toDeg) {
  const start    = pt(fromDeg);
  const end      = pt(toDeg);
  const spanDeg  = Math.abs(fromDeg - toDeg);
  const largeArc = spanDeg > 180 ? 1 : 0;
  // Always sweep=1 (clockwise on screen) going from left→top→right
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${R} ${R} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

// Zone tick mark at a probability position
function zoneTick(prob) {
  const angleDeg = 180 - prob * 180;
  const inner = pt_r(angleDeg, R - 10);
  const outer = pt_r(angleDeg, R + 10);
  return { inner, outer };
}

function pt_r(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

export default function GaugeChart({ probability, tier }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    setAnimated(0);
    const t = setTimeout(() => setAnimated(probability), 60);
    return () => clearTimeout(t);
  }, [probability]);

  const colors = TIER_COLORS[tier] ?? TIER_COLORS.MEDIUM;

  // Full track: 180° → 0°
  const trackPath = arcPath(180, 0);

  // Zone background arcs
  const lowArc    = arcPath(180, 180 - 0.30 * 180);   // 0%→30%
  const medArc    = arcPath(180 - 0.30 * 180, 180 - 0.60 * 180); // 30%→60%
  const highArc   = arcPath(180 - 0.60 * 180, 0);     // 60%→100%

  // Animated fill arc: 180° → (180 - prob*180)°
  const fillEndDeg = 180 - animated * 180;
  const fillPath   = animated > 0.005 ? arcPath(180, fillEndDeg) : null;

  // Needle
  const needleDeg = 180 - animated * 180;
  const needleTip = pt_r(needleDeg, 64);

  // Zone ticks
  const tick30 = zoneTick(0.30);
  const tick60 = zoneTick(0.60);

  // Label positions
  const lowLabel    = pt_r(180 - 0.15 * 180, R + 22);
  const medLabel    = pt_r(180 - 0.45 * 180, R + 22);
  const highLabel   = pt_r(180 - 0.80 * 180, R + 22);

  return (
    <div className="card animate-scaleIn" style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="section-label" style={{ marginBottom: 8, alignSelf: 'flex-start' }}>Risk Gauge</div>

      <svg viewBox={`0 0 220 130`} style={{ width: '100%', maxWidth: 260, overflow: 'visible' }}>
        <defs>
          <filter id="glow-fill" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-needle" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ── Track ── */}
        <path d={trackPath} fill="none" stroke="rgba(99,179,237,0.08)" strokeWidth="12" strokeLinecap="round"/>

        {/* ── Zone background bands ── */}
        <path d={lowArc}  fill="none" stroke="rgba(16,185,129,0.13)"  strokeWidth="12" strokeLinecap="round"/>
        <path d={medArc}  fill="none" stroke="rgba(245,158,11,0.13)"  strokeWidth="12" strokeLinecap="round"/>
        <path d={highArc} fill="none" stroke="rgba(239,68,68,0.13)"   strokeWidth="12" strokeLinecap="round"/>

        {/* ── Animated fill ── */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={colors.primary}
            strokeWidth="12"
            strokeLinecap="round"
            filter="url(#glow-fill)"
            style={{ transition: 'all 0.75s cubic-bezier(0.34,1.4,0.64,1)' }}
          />
        )}

        {/* ── Zone tick marks ── */}
        {[tick30, tick60].map((t, i) => (
          <line key={i}
            x1={t.inner.x.toFixed(2)} y1={t.inner.y.toFixed(2)}
            x2={t.outer.x.toFixed(2)} y2={t.outer.y.toFixed(2)}
            stroke="rgba(148,163,184,0.3)" strokeWidth="1.5"/>
        ))}

        {/* ── Zone text labels ── */}
        <text x={lowLabel.x.toFixed(1)}  y={lowLabel.y.toFixed(1)}  textAnchor="middle" fontSize="8" fill="rgba(16,185,129,0.65)"  fontFamily="DM Sans" fontWeight="600">LOW</text>
        <text x={medLabel.x.toFixed(1)}  y={medLabel.y.toFixed(1)}  textAnchor="middle" fontSize="8" fill="rgba(245,158,11,0.65)"  fontFamily="DM Sans" fontWeight="600">MED</text>
        <text x={highLabel.x.toFixed(1)} y={highLabel.y.toFixed(1)} textAnchor="middle" fontSize="8" fill="rgba(239,68,68,0.65)"   fontFamily="DM Sans" fontWeight="600">HIGH</text>

        {/* ── 0 / 100 edge labels ── */}
        <text x={pt_r(180, R + 16).x.toFixed(1)} y={(pt_r(180, R + 16).y + 4).toFixed(1)} textAnchor="middle" fontSize="7" fill="rgba(99,179,237,0.3)" fontFamily="JetBrains Mono">0</text>
        <text x={pt_r(0,   R + 16).x.toFixed(1)} y={(pt_r(0,   R + 16).y + 4).toFixed(1)} textAnchor="middle" fontSize="7" fill="rgba(99,179,237,0.3)" fontFamily="JetBrains Mono">100</text>

        {/* ── Needle ── */}
        <line
          x1={CX} y1={CY}
          x2={needleTip.x.toFixed(2)} y2={needleTip.y.toFixed(2)}
          stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round"
          filter="url(#glow-needle)"
          style={{ transition: 'all 0.75s cubic-bezier(0.34,1.4,0.64,1)' }}
        />

        {/* ── Hub ── */}
        <circle cx={CX} cy={CY} r="7" fill={colors.primary} style={{ filter: `drop-shadow(0 0 6px ${colors.glow})`, transition: 'fill 0.3s' }}/>
        <circle cx={CX} cy={CY} r="3.5" fill="var(--bg-base)"/>

        {/* ── Centre readout ── */}
        <text x={CX} y={CY + 26} textAnchor="middle" fontSize="26" fontWeight="800"
              fill={colors.primary} fontFamily="JetBrains Mono"
              style={{ transition: 'fill 0.3s' }}>
          {Math.round(animated * 100)}
        </text>
        <text x={CX} y={CY + 38} textAnchor="middle" fontSize="9"
              fill="rgba(148,163,184,0.45)" fontFamily="DM Sans">percent</text>
      </svg>

      {/* Tier badge */}
      <span className={`tier-badge tier-${tier.toLowerCase()}`} style={{ marginTop: 2 }}>
        {colors.label}
      </span>
      <div style={{ marginTop: 6, fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Probability of diabetes onset
      </div>
    </div>
  );
}
