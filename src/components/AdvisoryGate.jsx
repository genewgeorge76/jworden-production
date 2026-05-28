/**
 * AdvisoryGate.jsx — restricts /advisory/* routes to operators who know the
 * dashboard PIN.
 *
 * The advisory hub is internal back-end tooling for Mr. Worden — it must never
 * be reachable from the public surface. This gate uses the same PIN as the
 * Command Center (`VITE_CC_PASSWORD`) and persists the unlocked state in
 * sessionStorage so navigating between advisory pages within one tab session
 * doesn't re-prompt.
 *
 * If `VITE_CC_PASSWORD` is not set in the build, the gate renders a "not
 * available" card — same posture as Command Center.
 *
 * SECURITY NOTE — same caveat as CommandCenter: client-side PIN is a
 * convenience deterrent only, not real access control. Genuine protection
 * requires a Netlify Edge Function or equivalent.
 */

import { useCallback, useState } from 'react'

const CC_PASSWORD = import.meta.env.VITE_CC_PASSWORD
const STORAGE_KEY = 'jworden:advisory_unlocked'

function PinGate({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      if (pin === CC_PASSWORD) {
        try { sessionStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
        onUnlock()
      } else {
        setError(true)
        setPin('')
      }
    },
    [pin, onUnlock],
  )

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-brand-navy/10 bg-white p-8 shadow-xl text-center">
        <div className="w-14 h-14 rounded-xl bg-brand-navy flex items-center justify-center text-brand-amber text-2xl mx-auto mb-6">
          🔒
        </div>
        <h2 className="font-display font-bold text-2xl text-brand-navy mb-2">Internal Advisory</h2>
        <p className="text-brand-navy/55 text-sm mb-6">
          This area is reserved for operators. Enter your dashboard PIN to continue.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="PIN"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value)
              setError(false)
            }}
            className="w-full rounded-lg border border-brand-navy/20 px-4 py-3 text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-brand-amber"
          />
          {error && <p className="text-red-500 text-sm">Incorrect PIN. Try again.</p>}
          <button type="submit" className="btn-primary py-3">Unlock</button>
        </form>
      </div>
    </div>
  )
}

function DisabledNotice() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-brand-navy/10 bg-white p-8 text-center shadow-xl">
        <div className="w-14 h-14 rounded-xl bg-brand-navy/5 flex items-center justify-center text-brand-navy/40 text-2xl mx-auto mb-6">
          🚫
        </div>
        <h2 className="font-display font-bold text-xl text-brand-navy mb-2">Not Available</h2>
        <p className="text-brand-navy/55 text-sm">
          The Internal Advisory area is not configured in this environment.
        </p>
      </div>
    </div>
  )
}

export default function AdvisoryGate({ children }) {
  // Determine initial unlock state from sessionStorage so navigating between
  // advisory pages within a session doesn't re-prompt for the PIN.
  const initialUnlocked = (() => {
    try { return sessionStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
  })()
  const [unlocked, setUnlocked] = useState(initialUnlocked)
  const handleUnlock = useCallback(() => setUnlocked(true), [])

  if (!CC_PASSWORD) return <DisabledNotice />
  if (!unlocked) return <PinGate onUnlock={handleUnlock} />
  return children
}
