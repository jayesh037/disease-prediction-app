// src/api.js
// -----------------------------------------------------------------------
// Fetch wrapper for all backend API calls.
// In dev:  Vite proxies /api/* → http://localhost:8000/* (no env var needed)
// In prod: Set VITE_API_URL=https://your-backend.onrender.com in Vercel env.
// USER: Ensure VITE_API_URL does NOT have a trailing slash.
// -----------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}`
  : '/api';

/**
 * POST /predict
 * @param {Object} payload - matches PredictRequest schema
 * @returns {Promise<Object>} PredictResponse
 */
export async function predict(payload) {
  const res = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch (_) {
      // ignore parse error
    }
    throw new Error(detail);
  }

  return res.json();
}

/**
 * GET /health
 * @returns {Promise<{status: string, model_loaded: boolean}>}
 */
export async function healthCheck() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed: HTTP ${res.status}`);
  return res.json();
}
