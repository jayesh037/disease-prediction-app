// src/components/RadarChart.jsx
// -----------------------------------------------------------------------
// Recharts RadarChart visualising the 5-feature importance proxy returned
// by the API. Color theme adapts to the predicted risk tier.
// Feature values are already normalised 0–1 by the backend.
// -----------------------------------------------------------------------

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
  LOW:    { stroke: '#22c55e', fill: '#22c55e' },
  MEDIUM: { stroke: '#f59e0b', fill: '#f59e0b' },
  HIGH:   { stroke: '#ef4444', fill: '#ef4444' },
};

const AXIS_LABELS = {
  Glucose:       'Glucose',
  BMI:           'BMI',
  BloodPressure: 'Blood\nPressure',
  Insulin:       'Insulin',
  Age:           'Age',
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-200">{item.payload.subject}</p>
      <p className="text-slate-400">
        Normalized: <span className="mono text-slate-200">{(item.value * 100).toFixed(1)}%</span>
      </p>
    </div>
  );
}

export default function RadarChart({ data, tier }) {
  if (!data) return null;

  const colors = TIER_COLORS[tier] ?? TIER_COLORS.MEDIUM;

  // Transform API response object into Recharts data format
  const chartData = Object.entries(data).map(([key, value]) => ({
    subject: AXIS_LABELS[key] ?? key,
    value:   parseFloat((value).toFixed(4)),
    fullMark: 1,
  }));

  return (
    <div id="radar-chart-container" className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart
          data={chartData}
          margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
          cx="50%"
          cy="50%"
          outerRadius="70%"
        >
          <PolarGrid
            stroke="rgba(148,163,184,0.12)"
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: '#94a3b8',
              fontSize: 11,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 1]}
            tickCount={4}
            tick={{
              fill: '#475569',
              fontSize: 9,
              fontFamily: 'JetBrains Mono, monospace',
            }}
            axisLine={false}
          />
          <Radar
            name="Feature Profile"
            dataKey="value"
            stroke={colors.stroke}
            fill={colors.fill}
            fillOpacity={0.18}
            strokeWidth={2}
            dot={{ r: 3, fill: colors.stroke, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: colors.stroke, strokeWidth: 2, stroke: '#0f172a' }}
          />
          <Tooltip content={<CustomTooltip />} />
        </RechartsRadarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-1">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: colors.stroke }}
        />
        <span className="text-[10px] text-slate-500">
          Feature Position within Physiological Range (0 = min, 1 = max)
        </span>
      </div>
    </div>
  );
}
