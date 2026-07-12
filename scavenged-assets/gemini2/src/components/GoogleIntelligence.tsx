/**
 * JWORDENAI — Google Intelligence Component
 *
 * Mounts once in the root layout and autonomously:
 *  • Loads Google Analytics 4 (GA4) via VITE_GA4_MEASUREMENT_ID
 *  • Loads Google Tag Manager (GTM) via VITE_GTM_CONTAINER_ID (optional)
 *  • Tracks page views on every TanStack Router navigation
 *  • Measures Core Web Vitals (LCP, INP, CLS, FCP, TTFB) in real time
 *  • Reports all vitals + ranking score to GA4 as custom events
 *  • Persists a 30-session performance history for self-learning trend detection
 *  • Emits E-E-A-T + algorithm compliance signals
 */
import { useEffect, useRef } from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  initGA4,
  initGTM,
  trackPageView,
  measureCoreWebVitals,
  calculateRankingScore,
  reportVitalsToGA4,
  saveSessionToHistory,
  emitAlgorithmComplianceSignals,
  type CoreWebVitals,
} from '@/lib/google-intelligence-engine'

const GA4_ID  = (import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined)?.trim() ?? ''
const GTM_ID  = (import.meta.env.VITE_GTM_CONTAINER_ID   as string | undefined)?.trim() ?? ''

export default function GoogleIntelligence() {
  const router       = useRouter()
  const vitalsRef    = useRef<CoreWebVitals>({ lcp: null, inp: null, cls: null, fcp: null, ttfb: null })
  const reportedRef  = useRef(false)

  // ── 1. Boot GA4 + GTM on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (GA4_ID) initGA4(GA4_ID)
    if (GTM_ID) initGTM(GTM_ID)
  }, [])

  // ── 2. Core Web Vitals — measure and accumulate ────────────────────────────
  useEffect(() => {
    measureCoreWebVitals((updated) => {
      vitalsRef.current = updated

      // Compute ranking score from latest vitals
      const report = calculateRankingScore(updated)

      // Report to GA4 (throttled — only after at least LCP is measured)
      if (updated.lcp !== null && !reportedRef.current) {
        reportedRef.current = true
        reportVitalsToGA4(updated, report.score)
        saveSessionToHistory(window.location.pathname, updated, report.score)
        emitAlgorithmComplianceSignals()

        // Dev-mode console summary
        if (import.meta.env.DEV) {
          console.groupCollapsed(
            `%c[JWORDENAI] Google Ranking Score: ${report.score}/100 (${report.grade})`,
            'color: #ffcc00; font-weight: bold; background: #111'
          )
          console.table({
            LCP:  { value: updated.lcp   !== null ? `${Math.round(updated.lcp)}ms`   : '—', rating: report.vitals.lcp.rating  },
            INP:  { value: updated.inp   !== null ? `${Math.round(updated.inp)}ms`   : '—', rating: report.vitals.inp.rating  },
            CLS:  { value: updated.cls   !== null ? updated.cls.toFixed(3)           : '—', rating: report.vitals.cls.rating  },
            FCP:  { value: updated.fcp   !== null ? `${Math.round(updated.fcp)}ms`   : '—', rating: report.vitals.fcp.rating  },
            TTFB: { value: updated.ttfb  !== null ? `${Math.round(updated.ttfb)}ms`  : '—', rating: report.vitals.ttfb.rating },
          })
          if (report.recommendations.length > 0) {
            console.log('Recommendations:')
            report.recommendations.forEach((r) => console.log(r))
          }
          console.log(`E-E-A-T Compliance Score: ${report.eeaScore}/100`)
          console.groupEnd()
        }
      }
    })
  }, [])

  // ── 3. SPA Page View Tracking — fires on every route change ───────────────
  useEffect(() => {
    const unsub = router.subscribe('onResolved', ({ toLocation }) => {
      const path  = toLocation.pathname
      const title = document.title
      trackPageView(path, title)
    })
    return unsub
  }, [router])

  // This component renders nothing — it is purely a side-effect layer
  return null
}
