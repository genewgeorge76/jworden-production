import React, { useState } from 'react'

export default function OwnerConfirmModal({ open, title, message, defaultToken = '', onCancel, onConfirm }) {
  const [token, setToken] = useState(defaultToken || '')
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative max-w-xl w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white">
        <h3 className="font-bold text-lg mb-2">{title || 'Confirm action'}</h3>
        <p className="text-sm text-white/70 mb-4">{message}</p>
        <div className="mb-3">
          <label className="block text-[12px] text-white/60 mb-1">Owner token (session)</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste owner token or leave empty"
            className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-white/80"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 rounded bg-white/[0.03] border border-white/10 text-white/70">Cancel</button>
          <button
            onClick={() => onConfirm({ token: token || null })}
            className="px-3 py-1.5 rounded bg-brand-amber text-brand-navy font-semibold"
          >Confirm</button>
        </div>
      </div>
    </div>
  )
}
