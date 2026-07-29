import React, { useState } from 'react'
import { Satellite, Search, RefreshCw, MapPin, Send, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react'
import { api } from '@/api/client'

/**
 * Property scan + direct-mail engine.
 *
 * The previous version of this panel showed a "PCI condition score" and an
 * "AI Surface Degradation Analysis" that the backend computed from the length of
 * the address string, and a mailer button that mailed nothing. None of that is
 * here. This talks to a backend backed by Regrid (real parcel data) and Lob
 * (real print + mail). When the keys are unset it says so; it never invents a
 * scan result and never reports a send that did not happen. Square footage is a
 * labelled estimate from the parcel's lot size, and pavement condition is not
 * scored at all — that needs a site visit.
 */

const DISCOUNTS = [5, 10, 15, 20]
const money = (n) => (n == null ? '—' : `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
const sqftFmt = (n) => (n == null ? '—' : `${Number(n).toLocaleString()} sq ft`)

function NotConfigured({ missing, detail }) {
  return (
    <div className="rounded-xl border border-amber-900 bg-amber-950/30 p-4 text-sm">
      <p className="font-semibold text-amber-200 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" /> Not connected yet
      </p>
      <p className="mt-1 text-xs text-amber-300/90">{detail}</p>
      {missing?.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-xs text-amber-300/80">
          {missing.map((m) => <li key={m}><code>{m}</code></li>)}
        </ul>
      )}
      <p className="mt-2 text-[11px] text-amber-300/70">
        Add these in the API Keys panel. Regrid supplies the property list; Lob prints and mails.
      </p>
    </div>
  )
}

function Stat({ label, value, accent }) {
  const color = accent === 'amber' ? 'text-amber-400' : accent === 'emerald' ? 'text-emerald-400' : 'text-white'
  return (
    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
      <div className={`text-lg font-bold font-mono truncate ${color}`}>{value}</div>
      <div className="text-[10px] font-mono text-slate-400 uppercase mt-1">{label}</div>
    </div>
  )
}

export default function SatelliteMailerPanel() {
  const [mode, setMode] = useState('address') // 'address' | 'zip'
  const [address, setAddress] = useState('')
  const [zip, setZip] = useState('')
  const [commercialOnly, setCommercialOnly] = useState(true)
  const [discountPct, setDiscountPct] = useState(10)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notConfigured, setNotConfigured] = useState(null)
  const [scan, setScan] = useState(null)          // single-address result
  const [zipResult, setZipResult] = useState(null) // whole-zip result

  const [confirming, setConfirming] = useState(false)
  const [mailing, setMailing] = useState(false)
  const [mailResult, setMailResult] = useState(null)

  const reset = () => {
    setError(null); setNotConfigured(null); setScan(null)
    setZipResult(null); setMailResult(null); setConfirming(false)
  }

  const runAddressScan = async (e) => {
    e?.preventDefault()
    if (!address.trim()) return
    reset(); setBusy(true)
    try {
      const res = await api.scanSatelliteProperty({ address: address.trim() })
      if (res?.configured === false) setNotConfigured(res)
      else if (res?.ok === false) setError(res.detail || 'Scan failed.')
      else setScan(res)
    } catch (err) {
      setError(err?.message || 'Scan failed.')
    } finally {
      setBusy(false)
    }
  }

  const runZipScan = async (e) => {
    e?.preventDefault()
    if (!/^\d{5}$/.test(zip)) { setError('Enter a 5-digit ZIP code.'); return }
    reset(); setBusy(true)
    try {
      const res = await api.scanZipCode({ zip, commercial_only: commercialOnly })
      if (res?.configured === false) setNotConfigured(res)
      else if (res?.ok === false) setError(res.detail || 'ZIP scan failed.')
      else setZipResult(res)
    } catch (err) {
      setError(err?.message || 'ZIP scan failed.')
    } finally {
      setBusy(false)
    }
  }

  // Build the recipient list + campaign for whichever mode produced a result.
  const buildCampaign = () => {
    if (mode === 'zip' && zipResult && zipResult.property_count > 0) {
      return {
        recipients: (zipResult.recipients || []).map((r) => ({
          name: r.owner || undefined, address: r.address, city: r.city, state: r.state, zip: r.zip,
        })),
        campaign_name: `ZIP ${zipResult.zip} — ${discountPct}% asphalt offer`,
        count: zipResult.property_count,
        cost: zipResult.estimated_mail_cost_usd,
      }
    }
    if (mode === 'address' && scan?.found) {
      return {
        recipients: [{ name: scan.owner || undefined, address: scan.address }],
        campaign_name: `${scan.address} — ${discountPct}% asphalt offer`,
        count: 1,
        cost: 0.63,
      }
    }
    return null
  }

  const campaign = buildCampaign()

  const doMail = async () => {
    if (!campaign) return
    setMailing(true); setError(null)
    try {
      const res = await api.triggerDirectMailCampaign({
        recipients: campaign.recipients,
        campaign_name: campaign.campaign_name,
        offer_discount_pct: discountPct,
        confirm_spend: true,
        confirm_large: campaign.count > 250,
      })
      setMailResult(res)
      setConfirming(false)
    } catch (err) {
      setError(err?.message || 'Mail send failed.')
    } finally {
      setMailing(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-[#060913] p-6 shadow-xl space-y-5 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Satellite className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold tracking-tight">Property Scan &amp; Direct-Mail Engine</h3>
          <p className="text-xs text-slate-400">Real parcel data (Regrid) + real print &amp; mail (Lob). Nothing is mailed until you confirm the cost.</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        {[['address', 'Single Address'], ['zip', 'Whole ZIP Code']].map(([m, label]) => (
          <button
            key={m}
            onClick={() => { setMode(m); reset() }}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-colors ${
              mode === m
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Address mode */}
      {mode === 'address' && (
        <form onSubmit={runAddressScan} className="space-y-3">
          <label className="text-[11px] font-mono text-slate-400 uppercase block">Property Address</label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text" value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="1200 E Cary St, Richmond, VA 23219"
              className="w-full bg-slate-900/60 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <button type="submit" disabled={busy || !address.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
            {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {busy ? 'Looking up parcel…' : 'Look Up Property'}
          </button>
        </form>
      )}

      {/* ZIP mode */}
      {mode === 'zip' && (
        <form onSubmit={runZipScan} className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">ZIP Code</label>
              <input
                type="text" inputMode="numeric" value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="23219"
                className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-300 pb-2">
              <input type="checkbox" checked={commercialOnly} onChange={(e) => setCommercialOnly(e.target.checked)} />
              Commercial only
            </label>
          </div>
          <button type="submit" disabled={busy || zip.length !== 5}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
            {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {busy ? 'Scanning ZIP…' : 'Scan Whole ZIP'}
          </button>
        </form>
      )}

      {notConfigured && <NotConfigured missing={notConfigured.missing} detail={notConfigured.detail} />}
      {error && (
        <p className="rounded-lg border border-red-900 bg-red-950/30 px-3 py-2 text-xs text-red-300">{error}</p>
      )}

      {/* Single-address result */}
      {scan && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
          {scan.found === false ? (
            <p className="text-sm text-slate-400">No parcel record matched that address.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                <Stat label="Owner" value={scan.owner || '—'} />
                <Stat label="Lot size" value={sqftFmt(scan.parcel?.lot_sqft)} />
                <Stat label="Est. paving area" value={sqftFmt(scan.estimate?.paving_sqft_estimate)} accent="amber" />
              </div>
              <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 mt-px shrink-0" />
                {scan.estimate?.condition_note} Paving area is an estimate ({scan.estimate?.basis}).
              </p>
            </>
          )}
        </div>
      )}

      {/* Whole-ZIP result */}
      {zipResult && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
            <Stat label={`Properties in ${zipResult.zip}`} value={zipResult.property_count?.toLocaleString()} accent="amber" />
            <Stat label="Aggregate est. paving" value={sqftFmt(zipResult.aggregate_paving_sqft_estimate)} />
            <Stat label="Est. mail cost" value={money(zipResult.estimated_mail_cost_usd)} accent="emerald" />
          </div>
          {zipResult.property_count === 0 ? (
            <p className="text-sm text-slate-400">No matching properties returned for that ZIP{zipResult.commercial_only ? ' (commercial filter on)' : ''}.</p>
          ) : (
            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer text-slate-300">Preview first {Math.min(25, zipResult.sample?.length || 0)} of {zipResult.property_count}</summary>
              <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {(zipResult.sample || []).map((r, i) => (
                  <li key={i} className="flex justify-between gap-3 border-b border-slate-800/50 py-1">
                    <span className="truncate">{r.address}</span>
                    <span className="text-slate-500 shrink-0">{sqftFmt(r.paving_sqft_estimate)}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 mt-px shrink-0" /> {zipResult.note}
          </p>
        </div>
      )}

      {/* Offer + mail trigger (shown when there's something to mail) */}
      {campaign && !mailResult && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-slate-300">Offer:</span>
            {DISCOUNTS.map((pct) => (
              <button key={pct} onClick={() => setDiscountPct(pct)}
                className={`px-2.5 py-1 rounded text-xs font-mono border ${
                  discountPct === pct ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}>
                {pct}% OFF
              </button>
            ))}
          </div>
          <button onClick={() => setConfirming(true)}
            className="py-2 px-5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <Send className="w-4 h-4" />
            Mail {campaign.count?.toLocaleString()} — {money(campaign.cost)}
          </button>
        </div>
      )}

      {/* Spend confirmation */}
      {confirming && campaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirming(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-[#0a0f1c] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white">Confirm mail spend</h4>
              <button onClick={() => setConfirming(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <p className="text-sm text-slate-300">
              This prints and mails <b className="text-white">{campaign.count?.toLocaleString()}</b> real postcard(s)
              through Lob at an estimated <b className="text-emerald-400">{money(campaign.cost)}</b>.
              It charges your Lob account and cannot be recalled once printed.
            </p>
            {campaign.count > 250 && (
              <p className="text-xs text-amber-300 flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Large batch — over 250 pieces.
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setConfirming(false)}
                className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm">Cancel</button>
              <button onClick={doMail} disabled={mailing}
                className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {mailing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {mailing ? 'Sending…' : `Mail & charge ${money(campaign.cost)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {mailResult && (
        <div className={`rounded-xl border p-4 text-sm ${
          mailResult.failed_count > 0 ? 'border-amber-900 bg-amber-950/30' : 'border-emerald-900 bg-emerald-950/30'
        }`}>
          <p className="font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {mailResult.sent_count} of {mailResult.requested} postcard(s) accepted by Lob
          </p>
          <div className="mt-1 text-xs text-slate-300 space-y-0.5">
            <div>Estimated cost: {money(mailResult.estimated_cost_usd)}</div>
            {mailResult.failed_count > 0 && <div className="text-amber-300">{mailResult.failed_count} failed — see below</div>}
            {mailResult.qr_tracking_url && <div className="text-slate-500 break-all">Tracking: {mailResult.qr_tracking_url}</div>}
          </div>
          {mailResult.failures?.length > 0 && (
            <ul className="mt-2 max-h-32 overflow-y-auto text-[11px] text-amber-300/80 space-y-0.5">
              {mailResult.failures.map((f, i) => <li key={i}>{f.address} — {f.error}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
