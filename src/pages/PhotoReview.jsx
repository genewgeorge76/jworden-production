import React, { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import {
  Camera, MapPin, Check, X, Loader2, ExternalLink, ShieldCheck,
  AlertTriangle, Building2, Home, Images
} from 'lucide-react'

/**
 * PhotoReview — the screen that decides whether a photograph is proof.
 *
 * WHY IT HAD TO EXIST
 * ───────────────────
 * /api/v1/photo-proof shipped with four endpoints: scan the Dropbox archive,
 * import Google Maps pins, list the places found, and record a decision about
 * one. There was no interface over any of it. So nothing could ever be
 * confirmed, and a cluster that is never confirmed never becomes publishable —
 * the entire archive sat at `pending` with no door out of it.
 *
 * WHAT THIS SCREEN IS ACTUALLY FOR
 * ────────────────────────────────
 * A camera's GPS says where a shutter opened. It does not say that the company
 * worked there. The archive that fed these clusters is a personal Dropbox and a
 * personal Google account: a family holiday, a relative's driveway and a school
 * car park all produce geotagged photographs indistinguishable, to a machine,
 * from a jobsite. Something in the loop has to be a person who was there.
 *
 * That is the whole reason this reads as a queue with two buttons rather than a
 * dashboard. The previous version of "which photographs belong to which job"
 * in this codebase was a Python script that hardcoded ten invented KFC stores
 * and dealt the photographs out to them by array slice. It was served publicly.
 * The lesson was not "check harder" — it was that a machine must not be the one
 * asserting a photograph is evidence.
 *
 * TWO RULES THE SCREEN ENFORCES
 * ─────────────────────────────
 * 1. Confirming needs a kind. The API refuses a confirmation without
 *    commercial/residential and it is right to: the two publish differently and
 *    the difference cannot be read off a coordinate. So the buttons are
 *    "Confirm as commercial" and "Confirm as residential", never one "Confirm".
 *
 * 2. A residential confirmation collects no street and no postcode. The form
 *    hides both fields, because a homeowner who let a crew photograph their
 *    driveway did not agree to have the address published. City and state are a
 *    service area, not an address, so those stay.
 */

const STATUS_STYLE = {
  pending: { label: 'Pending', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  confirmed: { label: 'Confirmed', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  rejected: { label: 'Rejected', cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30' }
}

const EVIDENCE_LABEL = {
  photo_gps: 'Photo GPS only',
  invoice: 'Invoice',
  both: 'Photo GPS + invoice'
}

function Status({ value }) {
  const s = STATUS_STYLE[value] || STATUS_STYLE.pending
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${s.cls}`}>
      {s.label}
    </span>
  )
}

function Tile({ label, value, sub, tone = 'slate' }) {
  const tones = {
    emerald: 'border-emerald-500/25 bg-emerald-500/[0.06]',
    amber: 'border-amber-500/25 bg-amber-500/[0.06]',
    slate: 'border-slate-700/60 bg-slate-900/40'
  }
  return (
    <div className={`rounded-lg border p-4 ${tones[tone] || tones.slate}`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-black text-slate-100 tabular-nums">{value}</div>
      {sub ? <div className="mt-1 text-[11px] text-slate-500 leading-snug">{sub}</div> : null}
    </div>
  )
}

/** The decision form for one cluster. */
function ReviewPanel({ cluster, onDone }) {
  const qc = useQueryClient()
  const [kind, setKind] = useState(cluster.kind || '')
  const [label, setLabel] = useState(cluster.label || '')
  const [address, setAddress] = useState(cluster.address || '')
  const [city, setCity] = useState(cluster.city || '')
  const [state, setState] = useState(cluster.state || '')
  const [evidence, setEvidence] = useState(cluster.evidence || 'photo_gps')
  const [note, setNote] = useState(cluster.evidence_note || '')
  const [error, setError] = useState(null)

  const review = useMutation({
    mutationFn: (body) => api.reviewPhotoCluster(cluster.id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photo-clusters'] })
      setError(null)
      onDone?.()
    },
    onError: (e) => setError(e?.message || 'The review did not save.')
  })

  const residential = kind === 'residential'

  function confirm(asKind) {
    setKind(asKind)
    review.mutate({
      status: 'confirmed',
      kind: asKind,
      label: label.trim() || null,
      // Never sent for a residential place, whatever is sitting in the field.
      address: asKind === 'residential' ? null : (address.trim() || null),
      city: city.trim() || null,
      state: state.trim() || null,
      evidence,
      evidence_note: note.trim() || null
    })
  }

  function reject() {
    review.mutate({
      status: 'rejected',
      evidence_note: note.trim() || null
    })
  }

  const busy = review.isPending

  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-900/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Status value={cluster.status} />
            <span className="text-[11px] text-slate-500 tabular-nums">
              {cluster.photo_count} {cluster.photo_count === 1 ? 'photo' : 'photos'}
            </span>
            <span className="text-[11px] text-slate-600">·</span>
            <span className="text-[11px] text-slate-500">{cluster.source}</span>
          </div>
          <div className="mt-2 font-mono text-sm text-slate-300 tabular-nums">
            {cluster.lat?.toFixed(6)}, {cluster.lon?.toFixed(6)}
          </div>
          {cluster.first_seen || cluster.last_seen ? (
            <div className="mt-1 text-[11px] text-slate-500">
              {cluster.first_seen?.slice(0, 10)}
              {cluster.last_seen && cluster.last_seen !== cluster.first_seen
                ? ` — ${cluster.last_seen.slice(0, 10)}`
                : ''}
            </div>
          ) : null}
        </div>
        <a
          href={cluster.map_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-300 hover:border-sky-400"
        >
          <MapPin className="h-3.5 w-3.5" />
          Open the pin
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <p className="mt-4 rounded border border-slate-700/50 bg-slate-950/50 p-3 text-[11px] leading-relaxed text-slate-400">
        Open the pin before deciding. A coordinate cannot tell a jobsite from a
        relative&rsquo;s driveway or a holiday, and this archive contains all
        three. If you were not there, reject it.
      </p>

      {cluster.sample_paths?.length ? (
        <div className="mt-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
            <Images className="h-3 w-3" />
            Files at this place
          </div>
          <ul className="mt-2 space-y-1">
            {cluster.sample_paths.slice(0, 8).map((p) => (
              <li key={p} className="truncate font-mono text-[11px] text-slate-400" title={p}>
                {p}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
            What is this place
          </span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="KFC Waco N Loop, Harris Teeter Midlothian…"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
            What backs it up
          </span>
          <select
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            {Object.entries(EVIDENCE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>

        {!residential ? (
          <label className="block sm:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Street address <span className="text-slate-600">— commercial only</span>
            </span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </label>
        ) : (
          <p className="sm:col-span-2 rounded border border-slate-700/50 bg-slate-950/50 p-3 text-[11px] leading-relaxed text-slate-400">
            No street and no postcode are collected for a residential place, and
            none is sent if one is typed. A homeowner who let a crew photograph
            their driveway did not agree to have the address published. City and
            state are kept — a service area is not an address.
          </p>
        )}

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">City</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">State</span>
          <input
            value={state}
            onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
            placeholder="VA"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm uppercase text-slate-200 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
            Note — what makes you certain, or why you are rejecting it
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
          />
        </label>
      </div>

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded border border-rose-500/40 bg-rose-500/10 p-3 text-[12px] text-rose-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => confirm('commercial')}
          className="inline-flex items-center gap-2 rounded bg-emerald-500/15 border border-emerald-500/40 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-emerald-300 hover:border-emerald-400 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Building2 className="h-3.5 w-3.5" />}
          Confirm as commercial
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => confirm('residential')}
          className="inline-flex items-center gap-2 rounded bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-emerald-300 hover:border-emerald-400 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Home className="h-3.5 w-3.5" />}
          Confirm as residential
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={reject}
          className="inline-flex items-center gap-2 rounded border border-slate-600 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:border-slate-400 hover:text-slate-200 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          Not a jobsite
        </button>
      </div>
    </div>
  )
}

export default function PhotoReview() {
  const [status, setStatus] = useState('pending')
  const [openId, setOpenId] = useState(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['photo-clusters', status],
    queryFn: () => api.getPhotoClusters({ status, limit: 200 })
  })

  const counts = data?.counts || {}
  const clusters = useMemo(() => data?.clusters || [], [data])

  // Reviewed, not "accuracy". A count of decisions is a fact; a percentage of
  // them would imply a denominator nobody has established.
  const decided = (counts.confirmed || 0) + (counts.rejected || 0)

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-8 text-slate-200 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400">
            <Camera className="h-3.5 w-3.5" />
            Photo archive
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-50 sm:text-4xl">
            Which of these were jobs
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
            Every place below is somewhere a geotagged photograph was taken. That
            is all a coordinate proves. Nothing here is published until you say
            it was a jobsite, and a machine is never the one that says so.
          </p>
        </header>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <Tile
            label="Waiting on you"
            value={(counts.pending ?? 0).toLocaleString()}
            sub="Places found that nobody has decided about yet"
            tone="amber"
          />
          <Tile
            label="Confirmed as jobs"
            value={(counts.confirmed ?? 0).toLocaleString()}
            sub="Eligible to be published as proof"
            tone="emerald"
          />
          <Tile
            label="Decided either way"
            value={decided.toLocaleString()}
            sub={`${(counts.rejected ?? 0).toLocaleString()} rejected — a rejection is a result, not a failure`}
          />
        </div>

        <div className="mt-7 flex flex-wrap gap-2">
          {['pending', 'confirmed', 'rejected', 'all'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setStatus(s); setOpenId(null) }}
              className={`rounded border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                status === s
                  ? 'border-sky-500 bg-sky-500/15 text-sky-300'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              {s}
              {s !== 'all' && counts[s] != null ? (
                <span className="ml-1.5 tabular-nums text-slate-500">{counts[s]}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 p-6 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Reading the archive…
            </div>
          ) : isError ? (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-5 text-sm text-rose-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-bold">The cluster list did not load.</p>
                <p className="mt-1 text-[12px] text-rose-300/80">
                  {error?.message || 'No detail returned.'} The archive belongs to
                  the platform operator, so this screen needs an owner session.
                </p>
              </div>
            </div>
          ) : clusters.length === 0 ? (
            <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-6">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Nothing {status === 'all' ? 'in the archive' : `at ${status}`}.
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
                {status === 'pending'
                  ? 'Either every place found has been decided, or no scan has run yet. A scan surveys the Dropbox archive for photographs that carry GPS; it does not download them.'
                  : 'Switch tabs to see the places at another status.'}
              </p>
            </div>
          ) : (
            clusters.map((c) => (
              <div key={c.id}>
                {openId === c.id ? (
                  <ReviewPanel cluster={c} onDone={() => setOpenId(null)} />
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenId(c.id)}
                    className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 text-left transition-colors hover:border-slate-500"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Status value={c.status} />
                        {c.kind ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {c.kind}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1.5 truncate text-sm font-semibold text-slate-200">
                        {c.label || <span className="text-slate-500">Unnamed place</span>}
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[11px] text-slate-500 tabular-nums">
                        {c.lat?.toFixed(5)}, {c.lon?.toFixed(5)}
                        {c.city ? ` · ${c.city}${c.state ? `, ${c.state}` : ''}` : ''}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-lg font-black tabular-nums text-slate-300">{c.photo_count}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-600">
                        {c.photo_count === 1 ? 'photo' : 'photos'}
                      </div>
                    </div>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <p className="mt-10 flex items-start gap-2 border-t border-slate-800 pt-5 text-[11px] leading-relaxed text-slate-500">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
          <span>
            A confirmation records who decided and when. It is the only thing in
            this system that turns a photograph into evidence, and it is
            deliberately not something the software can do on its own.
          </span>
        </p>
      </div>
    </div>
  )
}
