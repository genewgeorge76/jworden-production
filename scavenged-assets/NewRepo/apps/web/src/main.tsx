import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import './index.css';

// ── Sentry — error + performance observability ─────────────────────────────────
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
  });
}

// ── Web Vitals → Sentry custom metrics ────────────────────────────────────────
function sendVital({ name, value, rating }: { name: string; value: number; rating?: string }) {
  if (SENTRY_DSN) {
    Sentry.setMeasurement(name, value, name === 'CLS' ? '' : 'millisecond');
  }
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug(`[vitals] ${name}: ${value.toFixed(1)}${rating ? ` (${rating})` : ''}`);
  }
}

onCLS(sendVital);
onFCP(sendVital);
onINP(sendVital);
onLCP(sendVital);
onTTFB(sendVital);

// ── Service Worker registration ────────────────────────────────────────────────
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Check for updates every 60 minutes
        setInterval(() => reg.update(), 60 * 60 * 1000);
      })
      .catch((err) => {
        if (SENTRY_DSN) Sentry.captureException(err);
      });
  });
}

// ── App render ─────────────────────────────────────────────────────────────────
const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center px-4">
          <div className="max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <p className="text-red-400 font-bold text-lg mb-2">Something went wrong</p>
            <p className="text-zinc-500 text-sm mb-6">{String(error)}</p>
            <button
              onClick={resetError}
              className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )}
      showDialog={false}
    >
      <RouterProvider router={router} />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
