import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from '@/App.jsx'
import '@/index.css'
import { trackEvent } from '@/api/client'
import { canonicalBackendDomain } from '@/config/integration'


const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const backendTraceTarget = (() => {
  const host = new URL(canonicalBackendDomain).host
  return new RegExp(`^https://${escapeRegex(host)}`)
})()

// Lazy-load Sentry after the page is interactive so it doesn't block LCP.
// Sentry's bundle is ~150KB+ and shouldn't be on the critical path.
const _sentryDsn = (import.meta.env.VITE_SENTRY_DSN || '').trim()
const _isValidSentryDsn = /^https:\/\/[^@]+@[^/]+\.ingest\.[^/]+\/\d+/.test(_sentryDsn)
if (_isValidSentryDsn && typeof window !== 'undefined') {
  const _initSentry = () => {
    import('@sentry/react').then((Sentry) => {
      Sentry.init({
        dsn: _sentryDsn,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration(),
        ],
        tracesSampleRate: 1.0,
        tracePropagationTargets: ["localhost", backendTraceTarget, /^https:\/\/app\.jwordenasphaltpaving\.com/],
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });
    }).catch(() => { /* swallow load errors */ });
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(_initSentry, { timeout: 4000 });
  } else {
    setTimeout(_initSentry, 2500);
  }
}


// ── Global conversion tracking for tel: / mailto: clicks ──────────────────
// Catches every phone/email link site-wide so Google Ads + GA4 see the
// click without needing onClick on each individual <a>.
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]')
    if (!a) return
    const href = a.getAttribute('href') || ''
    if (href.startsWith('tel:')) {
      trackEvent('phone_click', { source: location.pathname, href })
    } else if (href.startsWith('mailto:')) {
      trackEvent('email_click', { source: location.pathname, href })
    }
  }, { capture: true, passive: true })
}

const rootElement = document.getElementById('root');

// Prerendered HTML is kept for SEO, but we intentionally remount on the client
// to avoid hydration drift caused by non-deterministic runtime widgets.
ReactDOM.createRoot(rootElement).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
