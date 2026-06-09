// src/App.jsx
// -----------------------------------------------------------------------
// Root application shell. Manages prediction history (session-only state),
// coordinates between PredictForm → result display components.
// -----------------------------------------------------------------------

import React, { useState, useCallback } from 'react';
import PredictForm from './components/PredictForm.jsx';
import RiskCard from './components/RiskCard.jsx';
import RadarChart from './components/RadarChart.jsx';
import HistoryTable from './components/HistoryTable.jsx';
import { predict } from './api.js';

const MAX_HISTORY = 10;

export default function App() {
  const [result, setResult]         = useState(null);
  const [lastRequest, setLastRequest] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [history, setHistory]       = useState([]);

  const handleSubmit = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await predict(formData);
      setResult(response);
      setLastRequest(formData);

      // Prepend to history (capped at MAX_HISTORY entries)
      setHistory((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
          tier: response.risk_tier,
          probability: response.probability,
          age: formData.Age,
          glucose: formData.Glucose,
        },
        ...prev,
      ].slice(0, MAX_HISTORY));
    } catch (err) {
      setError(err.message ?? 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return (
    <div className="min-h-screen">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-gradient">DiabetaLens</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">AI Risk Stratification</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Hybrid DL · PIMA Dataset · NFHS-5
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-10 pb-4 sm:px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-2">
          Clinical Decision Support
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight mb-3">
          Diabetes Risk from{' '}
          <span className="text-gradient">8 Clinical Inputs</span>
        </h2>
        <p className="mx-auto max-w-xl text-sm text-slate-400 leading-relaxed">
          Residual MLP with BatchNorm &amp; Dropout. Optional NFHS-5 zone adjustment
          for Indian regional prevalence. Results are indicative — always consult a clinician.
        </p>
      </section>

      {/* ── Main Grid ────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Left: Input Form */}
          <div className="glass-card p-6">
            <h2 className="mb-5 text-base font-semibold text-slate-200 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              Clinical Input Parameters
            </h2>
            <PredictForm onSubmit={handleSubmit} loading={loading} />
          </div>

          {/* Right: Results */}
          <div className="flex flex-col gap-6">
            {/* Error banner */}
            {error && (
              <div className="glass-card border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300 flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div>
                  <p className="font-semibold text-red-300 mb-0.5">Prediction Failed</p>
                  <p className="text-red-400/80">{error}</p>
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="glass-card p-6 space-y-4">
                <div className="skeleton h-6 w-32" />
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            )}

            {/* Risk Card */}
            {result && !loading && (
              <RiskCard result={result} request={lastRequest} />
            )}

            {/* Radar Chart */}
            {result && !loading && (
              <div className="glass-card p-6">
                <h3 className="mb-4 text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 2 17 12 22 22 17 22 7 12 2"/>
                  </svg>
                  Feature Profile Radar
                </h3>
                <RadarChart
                  data={result.feature_importance_proxy}
                  tier={result.risk_tier}
                />
              </div>
            )}

            {/* Empty state */}
            {!result && !loading && !error && (
              <div className="glass-card flex flex-col items-center justify-center p-12 text-center min-h-[280px]">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-700/50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-400">Fill in the clinical parameters</p>
                <p className="mt-1 text-xs text-slate-600">and click Predict to see results here</p>
              </div>
            )}
          </div>
        </div>

        {/* History Table */}
        {history.length > 0 && (
          <div className="mt-6">
            <HistoryTable history={history} onClear={clearHistory} />
          </div>
        )}
      </main>
    </div>
  );
}
