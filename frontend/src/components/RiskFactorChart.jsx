// src/components/RiskFactorChart.jsx
// Horizontal Recharts bar chart showing each clinical factor's
// position relative to its risk threshold — much more informative than pills.

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

// Each factor: actual value, threshold, unit, max for normalisation
function buildChartData(request, result) {
  if (!request) return [];

  const factors = [
    {
      name: 'Glucose',
      value: request.Glucose,
      threshold: 126,
      unit: 'mg/dL',
      max: 200,
      dangerThreshold: 140,
    },
    {
      name: 'BMI',
      value: request.BMI,
      threshold: 25,
      unit: 'kg/m²',
      max: 55,
      dangerThreshold: 30,
    },
    {
      name: 'Blood Pressure',
      value: request.BloodPressure,
      threshold: 80,
      unit: 'mm Hg',
      max: 140,
      dangerThreshold: 90,
    },
    {
      name: 'Insulin',
      value: request.Insulin,
      threshold: 140,
      unit: 'µU/mL',
      max: 500,
      dangerThreshold: 200,
    },
    {
      name: 'Age',
      value: request.Age,
      threshold: 40,
      unit: 'yrs',
      max: 100,
      dangerThreshold: 45,
    },
    {
      name: 'Pedigree',
      value: request.DiabetesPedigreeFunction,
      threshold: 0.5,
      unit: '',
      max: 2.5,
      dangerThreshold: 1.0,
    },
  ];

  return factors.map((f) => {
    // Normalise to 0–100 for display
    const pctValue = Math.min(100, (f.value / f.max) * 100);
    const pctThreshold = Math.min(100, (f.threshold / f.max) * 100);

    let zone = 'normal';
    if (f.value >= f.dangerThreshold) zone = 'danger';
    else if (f.value >= f.threshold)  zone = 'warning';

    return { ...f, pctValue, pctThreshold, zone };
  });
}

const ZONE_COLORS = {
  normal:  '#10b981',
  warning: '#f59e0b',
  danger:  '#ef4444',
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const zone = d.zone;
  const color = ZONE_COLORS[zone];
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-default)',
      borderRadius: 10, padding: '10px 14px', fontSize: '0.75rem', minWidth: 150,
    }}>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{d.name}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ color: 'var(--text-muted)' }}>Value</span>
        <span className="mono" style={{ color, fontWeight: 600 }}>{d.value} {d.unit}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ color: 'var(--text-muted)' }}>Threshold</span>
        <span className="mono" style={{ color: 'var(--text-secondary)' }}>{d.threshold} {d.unit}</span>
      </div>
      <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
        <span style={{
          background: ZONE_COLORS[zone] + '22', color: ZONE_COLORS[zone],
          padding: '2px 8px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
        }}>{zone}</span>
      </div>
    </div>
  );
}

export default function RiskFactorChart({ result, request }) {
  const data = buildChartData(request, result);
  if (!data.length) return null;

  return (
    <div className="card animate-fadeUp" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-400)" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6"  y1="20" x2="6"  y2="14"/>
        </svg>
        <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Clinical Factor Analysis</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          Value vs. clinical threshold
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 68 }}
          barSize={10}
        >
          <CartesianGrid horizontal={false} stroke="rgba(99,179,237,0.06)" strokeDasharray="3 3"/>
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'DM Sans', fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            width={68}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,179,237,0.04)' }}/>

          {/* Threshold reference line at pctThreshold — we use a fixed 50% line
              since each bar is normalised. The real threshold is shown in tooltip. */}
          <ReferenceLine x={50} stroke="rgba(99,179,237,0.2)" strokeDasharray="4 3" strokeWidth={1}/>

          <Bar dataKey="pctValue" radius={[0, 5, 5, 0]} background={{ fill: 'rgba(99,179,237,0.04)', radius: [0, 5, 5, 0] }}>
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={ZONE_COLORS[entry.zone]}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 10 }}>
        {[['normal', 'Within range'], ['warning', 'Borderline'], ['danger', 'Above threshold']].map(([zone, label]) => (
          <div key={zone} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: ZONE_COLORS[zone] }}/>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
