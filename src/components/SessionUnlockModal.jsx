import React, { useState } from 'react'
import { setOwnerToken } from '@/lib/ownerToken'
import { authenticateWithPin } from '@/api/client'

export default function SessionUnlockModal({ open, defaultPin = '', defaultToken = '', onCancel, onUnlock }) {
  const [pin, setPin] = useState(defaultPin || '')
  const [token, setToken] = useState(defaultToken || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (!open) return null
  const handleUnlock = async () => {
    if (!pin) { setError('Enter your PIN to unlock this session'); return }
    setBusy(true)
    setError('')
    try {
      // This previously POSTed to /api/v1/admin/owner/unlock, which does not
      // exist in the backend — verified 404 against production and absent from
      // every router. So this modal failed 100% of the time. The real, working
      // exchange is /api/v1/auth/pin-token via authenticateWithPin().
      await authenticateWithPin(pin.trim())
      try {
        // The owner token is an optional extra credential for owner-scoped
        // endpoints; it is NOT what authorises ordinary panels (the JWT is).
        if (token) setOwnerToken(token)
      } catch { /* storage unavailable — non-fatal */ }
      onUnlock({ pin, token })
    } catch (err) {
      setError(err?.message || String(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white">
        <h3 className="font-bold text-lg mb-2">Unlock Owner Session</h3>
        <p className="text-sm text-white/70 mb-3">Enter your admin PIN to unlock this session. The owner token is optional and only needed for owner-scoped tools.</p>
        <div className="mb-3">
          <label className="block text-[12px] text-white/60 mb-1">Session PIN</label>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-white/80" />
        </div>
        <div className="mb-3">
          <label className="block text-[12px] text-white/60 mb-1">Owner token</label>
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-white/80" />
        </div>
        {error ? <div className="text-red-300 text-sm mb-2">{error}</div> : null}
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} disabled={busy} className="px-3 py-1.5 rounded bg-white/[0.03] border border-white/10 text-white/70">Cancel</button>
          <button onClick={handleUnlock} disabled={busy} className="px-3 py-1.5 rounded bg-brand-amber text-brand-navy font-semibold">{busy ? 'Unlocking…' : 'Unlock'}</button>
        </div>
      </div>
    </div>
  )
}
