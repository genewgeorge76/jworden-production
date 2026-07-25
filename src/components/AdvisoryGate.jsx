/**
 * AdvisoryGate.jsx — restricts /advisory/* routes to operators who know the
 * dashboard PIN.
 *
 * The advisory hub is internal back-end tooling for Mr. Worden — it must never
 * be reachable from the public surface. The PIN is exchanged with the backend
 * (POST /api/v1/auth/pin-token) for a short-lived JWT, which every subsequent
 * API call then carries. The sessionStorage flag only avoids re-prompting
 * while navigating between advisory pages in one tab.
 *
 * SECURITY: the real boundary is the backend, which rejects any request
 * without a valid token. This gate must never be "satisfied" by a client-side
 * comparison — doing so unlocks the UI while leaving every panel unauthorised,
 * which is precisely the bug this replaced.
 */

import { useCallback, useState } from 'react'

import { authenticateWithPin } from '@/api/client'

const STORAGE_KEY = 'jworden:advisory_unlocked'

function PinGate({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      if (!pin) return
      setBusy(true)
      setError('')
      try {
        // Exchange the PIN with the backend for a real JWT. This is the whole
        // point: the previous version compared the typed PIN against a literal
        // baked into the JS bundle and merely set a sessionStorage flag, so it
        // let you "in" without ever obtaining a credential — and then every
        // panel behind it 403'd because no token was ever issued.
        await authenticateWithPin(pin.trim())
        try { sessionStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
        onUnlock()
      } catch (err) {
        setError(err?.message || 'Incorrect PIN. Try again.')
        setPin('')
      } finally {
        setBusy(false)
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
              setError('')
            }}
            className="w-full rounded-lg border border-brand-navy/20 px-4 py-3 text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-brand-amber"
          />
          {error ? <p className="text-red-500 text-sm">{error}</p> : null}
          <button type="submit" disabled={busy} className="btn-primary py-3">{busy ? 'Verifying…' : 'Unlock'}</button>
        </form>
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

  if (!unlocked) return <PinGate onUnlock={handleUnlock} />
  return children
}
