import React, { useState } from 'react'
import { request } from '@/api/client'

export default function SessionUnlockModal({ open, defaultPin = '', defaultToken = '', onCancel, onUnlock }) {
  const [pin, setPin] = useState(defaultPin || '')
  const [token, setToken] = useState(defaultToken || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (!open) return null
  const handleUnlock = async () => {
    if (!pin) { setError('Enter a PIN to unlock for this session'); return }
    setBusy(true)
    setError('')
    try {
      const res = await request('POST', '/api/v1/admin/owner/unlock', { owner_token: token, pin })
      if (res?.session_id) {
        try {
          sessionStorage.setItem('OWNER_SESSION_ID', res.session_id)
          if (token) sessionStorage.setItem('OWNER_TOKEN', token)
        } catch (e) {}
        onUnlock({ pin, token, session_id: res.session_id })
      } else {
        setError('Unlock failed')
      }
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
        <p className="text-sm text-white/70 mb-3">Enter a short PIN for this browser session and paste your owner token. Unlocking creates a short-lived server session.</p>
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
