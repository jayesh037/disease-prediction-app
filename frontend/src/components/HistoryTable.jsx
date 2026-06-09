// src/components/HistoryTable.jsx
import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

const TIER_CONFIG = {
  LOW:    { cls: 'tier-low',    dot: '#10b981' },
  MEDIUM: { cls: 'tier-medium', dot: '#f59e0b' },
  HIGH:   { cls: 'tier-high',   dot: '#ef4444' },
};

// Mini sparkline for probability trend across last N sessions
function Sparkline({ history }) {
  if (history.length < 2) return null;
  const data = [...history].reverse().map((h, i) => ({ i, v: h.probability }));
  return (
    <div style={{ width: 90, height: 28 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 3, right: 3, bottom: 3, left: 3 }}>
          <Line
            type="monotone" dataKey="v"
            stroke="var(--cyan-400)" strokeWidth={1.5}
            dot={false} isAnimationActive={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                  borderRadius: 6, padding: '3px 7px', fontSize: '0.65rem',
                  color: 'var(--cyan-400)', fontFamily: 'JetBrains Mono',
                }}>
                  {(payload[0].value * 100).toFixed(1)}%
                </div>
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function HistoryTable({ history, onClear }) {
  if (!history?.length) return null;

  const avgProb = (history.reduce((s, h) => s + h.probability, 0) / history.length * 100).toFixed(1);
  const highCount = history.filter((h) => h.tier === 'HIGH').length;
  const lastTier  = history[0]?.tier;
  const lastCfg   = TIER_CONFIG[lastTier] ?? TIER_CONFIG.MEDIUM;

  return (
    <div className="card animate-fadeUp" style={{ padding: 20 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-400)" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Session History</span>
          <span className="mono" style={{
            background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
            borderRadius: 999, padding: '1px 8px', fontSize: '0.68rem', color: 'var(--cyan-400)',
          }}>{history.length}/10</span>
        </div>

        <button onClick={onClear} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 8,
          background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer',
          transition: 'all 0.15s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
          Clear
        </button>
      </div>

      {/* Session summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Predictions', value: history.length },
          { label: 'Avg Prob',    value: `${avgProb}%`,  mono: true },
          { label: 'High Risk',   value: highCount,       color: highCount > 0 ? '#ef4444' : 'var(--text-primary)' },
          { label: 'Last Result', value: lastTier,        color: lastCfg.dot },
        ].map(({ label, value, mono, color }) => (
          <div key={label} style={{
            background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
            borderRadius: 8, padding: '8px 10px', textAlign: 'center',
          }}>
            <div className={mono ? 'mono' : ''} style={{ fontSize: '0.85rem', fontWeight: 700, color: color ?? 'var(--text-primary)' }}>
              {value}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Sparkline trend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '8px 12px', background: 'var(--bg-raised)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Probability trend</span>
        <Sparkline history={history} />
        <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--cyan-400)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {history.length} sessions
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border-subtle)' }}>
              {['#', 'Time', 'Tier', 'Probability', 'Score', 'Age', 'Glucose', 'BMI'].map((h) => (
                <th key={h} style={{
                  padding: '9px 12px', textAlign: h === '#' || h === 'Time' || h === 'Tier' ? 'left' : 'right',
                  color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.65rem',
                  letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((entry, idx) => {
              const cfg = TIER_CONFIG[entry.tier] ?? TIER_CONFIG.MEDIUM;
              return (
                <tr key={entry.id} style={{
                  borderBottom: idx < history.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,179,237,0.04)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="mono" style={{ padding: '10px 12px', color: 'var(--text-dim)' }}>{history.length - idx}</td>
                  <td className="mono" style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{entry.timestamp}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`tier-badge ${cfg.cls}`}>{entry.tier}</span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <span className="mono" style={{ color: cfg.dot, fontWeight: 700 }}>
                      {(entry.probability * 100).toFixed(1)}%
                    </span>
                    <div style={{ height: 3, background: 'var(--bg-raised)', borderRadius: 999, marginTop: 3, width: 48, marginLeft: 'auto' }}>
                      <div style={{ height: '100%', borderRadius: 999, background: cfg.dot, width: `${(entry.probability * 100).toFixed(0)}%` }}/>
                    </div>
                  </td>
                  <td className="mono" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {entry.composite ?? '—'}<span style={{ color: 'var(--text-dim)' }}>/7</span>
                  </td>
                  <td className="mono" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{entry.age}</td>
                  <td className="mono" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{entry.glucose}</td>
                  <td className="mono" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{entry.bmi}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
