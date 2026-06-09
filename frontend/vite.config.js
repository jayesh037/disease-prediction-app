// vite.config.js
// -----------------------------------------------------------------------
// Vite build config.
// In dev mode, /api/* is proxied to localhost:8000 so no CORS issues arise.
// In production builds (Vercel), set VITE_API_URL in Vercel env settings.
// USER: If your backend runs on a different local port, update the target below.
// -----------------------------------------------------------------------

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
