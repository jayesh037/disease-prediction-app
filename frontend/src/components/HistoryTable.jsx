// src/components/HistoryTable.jsx
// -----------------------------------------------------------------------
// Session-only prediction history table (React state, not localStorage).
// Stores last 10 predictions. Cleared on page refresh or "Clear" button.
// -----------------------------------------------------------------------

import React from 'react';

const TIER_CONFIG = {
  LOW:    { cls: 'tier-low',    dot: 'bg-green-400' },
  MEDIUM: { cls: 'tier-medium', dot: 'bg-amber-400' },
  HIGH:   { cls: 'tier-high',   dot: 'bg-red-400'   },
};

export default function HistoryTable({ history, onClear }) {
  if (!history?.length) return null;

  return (
    <div id="history-table-container" className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Prediction History
          <span className="ml-1 rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-400 mono">
            {history.length}/10
          </span>
        </h3>
        <button
          id="clear-history-btn"
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-1.5
                     text-xs text-slate-400 transition-colors hover:border-red-500/40 hover:text-red-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/>
          </svg>
          Clear
        </button>
      </div>

      {/* Table — scrollable on mobile */}
      <div className="overflow-x-auto rounded-xl border border-slate-700/40">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-900/40">
              <th className="px-4 py-2.5 text-left font-medium text-slate-500 uppercase tracking-wider">#</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500 uppercase tracking-wider">Time</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500 uppercase tracking-wider">Tier</th>
              <th className="px-4 py-2.5 text-right font-medium text-slate-500 uppercase tracking-wider">Probability</th>
              <th className="px-4 py-2.5 text-right font-medium text-slate-500 uppercase tracking-wider">Age</th>
              <th className="px-4 py-2.5 text-right font-medium text-slate-500 uppercase tracking-wider">Glucose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {history.map((entry, idx) => {
              const cfg = TIER_CONFIG[entry.tier] ?? TIER_CONFIG.MEDIUM;
              return (
                <tr
                  key={entry.id}
                  className="transition-colors hover:bg-slate-700/20"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <td className="px-4 py-3 text-slate-600 mono">{history.length - idx}</td>
                  <td className="px-4 py-3 text-slate-400 mono">{entry.timestamp}</td>
                  <td className="px-4 py-3">
                    <span className={cfg.cls}>{entry.tier}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="mono text-slate-200 font-semibold">
                      {(entry.probability * 100).toFixed(1)}%
                    </span>
                    <div
                      className="ml-auto mt-1 h-1 rounded-full bg-slate-700/60 overflow-hidden"
                      style={{ width: '48px' }}
                    >
                      <div
                        className={`h-full rounded-full ${cfg.dot}`}
                        style={{ width: `${(entry.probability * 100).toFixed(0)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300 mono">{entry.age}</td>
                  <td className="px-4 py-3 text-right text-slate-300 mono">{entry.glucose}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
