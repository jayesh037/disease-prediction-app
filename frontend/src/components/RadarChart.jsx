// src/components/RadarChart.jsx
import React from 'react';
import {
  RadarChart as RechartsRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const TIER_COLORS = {
  LOW:    { stroke: '#10b981', fill: '#10b981' },
  MEDIUM: { stroke: '#f59e0b', fill: '#f59e0b' },
  HIGH:   { stroke: '#ef4444', fill: '#ef4444' },
};

const AXIS_LABELS = {
  Glucose:       'Glucose',
  BMI:           'BMI',
  BloodPressure: 'Blood Pressure',
  Insulin:       'Insulin',
  Age:           'Age',
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-default)',
      borderRadius: 10, padding: '8px 12px', fontSize: '0.75rem',
    }}>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{item.payload.subject}</div>
      <div style={{ color: 'var(--text-muted)' }}>
        Normalised:&nbsp;
        <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {(item.value * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export default function RadarChart({ data, tier }) {
  if (!data) return null;
  const colors = TIER_COLORS[tier] ?? TIER_COLORS.MEDIUM;

  const chartData = Object.entries(data).map(([key, value]) => ({
    subject: AXIS_LABELS[key] ?? key,
    value:   parseFloat(value.toFixed(4)),
    fullMark: 1,
  }));

  return (
    <div id="radar-chart-container" style={{ height: 240, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart
          data={chartData}
          margin={{ top: 8, right: 28, bottom: 8, left: 28 }}
          cx="50%" cy="50%" outerRadius="68%"
        >
          <PolarGrid stroke="rgba(99,179,237,0.10)" gridType="polygon"/>
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'DM Sans', fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90} domain={[0, 1]} tickCount={4}
            tick={{ fill: 'var(--text-dim)', fontSize: 8, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
          />
          <Radar
            name="Feature Profile"
            dataKey="value"
            stroke={colors.stroke}
            fill={colors.fill}
            fillOpacity={0.15}
            strokeWidth={2}
            dot={{ r: 3, fill: colors.stroke, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: colors.stroke, strokeWidth: 2, stroke: 'var(--bg-base)' }}
          />
          <Tooltip content={<CustomTooltip />}/>
        </RechartsRadarChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.stroke }}/>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          Feature position within physiological range (0 = min, 1 = max)
        </span>
      </div>
    </div>
  );
}
