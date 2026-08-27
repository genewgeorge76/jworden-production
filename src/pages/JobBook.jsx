import React, { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import DiamondMap from '../components/DiamondMap'
import {
  LayoutDashboard, Briefcase, MapPin, Search, Plus, X, Loader2,
  ShieldCheck, AlertTriangle, FileText, Building2, Home
} from 'lucide-react'

/**
 * JobBook — the job book, on our own records.
 *
 * Built on the Diamond Solutions portal's bones because that layout works: a
 * dark rail, a dense list, a detail panel with tabs, a satellite map. What is
 * different is whose data it reads. Diamond is a vendor portal showing work
 * they offer us; this is 2,610 jobs of our own that sat inside somebody else's
 * subscription for a decade — an account cancelled over a failed card in 2019
 * and locked out again in 2023.
 *
 * TWO RULES THIS SCREEN HOLDS
 *
 * 1. There is no total. The Kickserv export sums to $41,295,234.93 and that
 *    figure includes 66 bids the company LOST. Completed, quoted and lost are
 *    shown as three separate tiles and are never added, because one big number
 *    assembled from true rows is the easiest lie a dashboard can tell.
 *
 * 2. A residential job is a town. 1,955 of these are private driveways. Those
 *    customers hired a paving crew, not a listing — so no street, no postcode
 *    and no pin, and the API does not send them either.
 */

const GRADE_STYLE = {
  invoiced:   { label: 'Invoiced',   cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  completed:  { label: 'Completed',  cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  contracted: { label: 'Contracted', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  authorized: { label: 'Authorized', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  quoted:     { label: 'Quoted',     cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  listed:     { label: 'Listed',     cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  requested:  { label: 'Lost / asked', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' }
}

const money = (v) =>
  v == null ? '—' : `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function Grade({ value }) {
  const s = GRADE_STYLE[value] || GRADE_STYLE.listed
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
    rose: 'border-rose-500/25 bg-rose-500/[0.06]',
    slate: 'border-slate-700/60 bg-slate-900/40'
  }
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">{label}</div>
      <div className="mt-1.5 text-2xl font-bold text-white tabular-nums tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  )
}

export default function JobBook() {
  const qc = useQueryClient()
  const [nav, setNav] = useState('dashboard')
  const [filters, setFilters] = useState({ q: '', evidence: '', category: '', state: '' })
  const [selectedId, setSelectedId] = useState(null)
  const [tab, setTab] = useState('overview')
  const [creating, setCreating] = useState(false)

  const summary = useQuery({ queryKey: ['jobbook-summary'], queryFn: api.getJobBookSummary })
  const jobs = useQuery({
    queryKey: ['jobbook-jobs', filters],
    queryFn: () => api.getJobBookJobs({ ...filters, limit: 100 })
  })
  const pins = useQuery({
    queryKey: ['jobbook-pins'],
    queryFn: () => api.getJobBookPins('all'),
    enabled: nav === 'map'
  })
  const detail = useQuery({
    queryKey: ['jobbook-job', selectedId],
    queryFn: () => api.getJobBookJob(selectedId),
    enabled: selectedId != null
  })

  const createJob = useMutation({
    mutationFn: (body) => api.createJobBookJob(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobbook-jobs'] })
      qc.invalidateQueries({ queryKey: ['jobbook-summary'] })
      setCreating(false)
    }
  })

  const grades = summary.data?.by_evidence || {}
  const job = detail.data?.job

  // The map wants Diamond's shape: it reads price and a name off each job.
  const mapJobs = useMemo(
    () => (pins.data?.pins || []).map((p) => ({
      id: p.id, latitude: p.lat, longitude: p.lon,
      name: p.label, customer_name: p.client, price: 0,
      city: p.city, state: p.state, status: p.evidence
    })),
    [pins.data]
  )

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-200 flex flex-col md:flex-row font-sans antialiased">

      {/* ── Rail ─────────────────────────────────────────────────────────── */}
      <aside className="w-full md:w-60 bg-black/40 border-r border-slate-800/80 shrink-0 flex flex-col">
        <div className="p-5 border-b border-slate-800/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold">
            W
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-[0.08em] uppercase leading-none">Job Book</div>
            <div className="text-[10px] text-amber-400 font-bold tracking-[0.08em] uppercase mt-0.5">J. Worden &amp; Sons</div>
          </div>
        </div>

        <nav className="px-3 py-3 space-y-1 flex-1">
          {[
            ['dashboard', 'Dashboard', LayoutDashboard],
            ['jobs', 'Jobs', Briefcase],
            ['map', 'Map', MapPin]
          ].map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => { setNav(key); setSelectedId(null) }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                nav === key ? 'bg-amber-500/10 text-amber-300 border border-amber-500/25'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800/60">
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-slate-950 text-sm font-bold hover:bg-amber-400 transition"
          >
            <Plus size={16} /> New job
          </button>
        </div>
      </aside>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 p-5 md:p-7 overflow-x-hidden">

        {nav === 'dashboard' && (
          <section>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight">The job book</h1>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              {summary.data?.total_jobs?.toLocaleString() ?? '—'} jobs. Each figure sits against the
              evidence behind it, and they are never added together — a combined total would
              include work that was bid and not won.
            </p>

            {summary.isLoading && (
              <div className="mt-8 flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 className="animate-spin" size={16} /> Reading the book…
              </div>
            )}

            {summary.data && (
              <>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Tile tone="emerald" label="Completed"
                        value={grades.completed?.count?.toLocaleString() ?? '0'}
                        sub={money(grades.completed?.value)} />
                  <Tile tone="emerald" label="Invoiced"
                        value={grades.invoiced?.count?.toLocaleString() ?? '0'}
                        sub={money(grades.invoiced?.value)} />
                  <Tile tone="amber" label="Quoted, not closed"
                        value={grades.quoted?.count?.toLocaleString() ?? '0'}
                        sub={money(grades.quoted?.value)} />
                  <Tile tone="rose" label="Bid and lost"
                        value={grades.requested?.count?.toLocaleString() ?? '0'}
                        sub={money(grades.requested?.value)} />
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-3 text-xs text-amber-200/90">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <p>
                    The completed figure is a <strong>floor</strong>. Jobs finished on site whose
                    completion box was never ticked are not counted in it. Attaching an invoice or
                    the completion photos moves one up.
                  </p>
                </div>

                <div className="mt-7 grid gap-5 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                    <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Commercial and residential</h2>
                    <div className="mt-3 space-y-2">
                      {Object.entries(summary.data.by_kind || {}).map(([kind, n]) => (
                        <div key={kind} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-slate-300 capitalize">
                            {kind === 'residential' ? <Home size={14} /> : <Building2 size={14} />}{kind}
                          </span>
                          <span className="font-bold tabular-nums text-white">{n.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
                      Residential jobs are held by town only — no street, no postcode, no pin.
                      Those customers hired a paving crew, not a listing.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                    <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Where the work is</h2>
                    <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
                      {(summary.data.by_state || []).slice(0, 12).map((s) => (
                        <div key={s.state} className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">{s.state}</span>
                          <span className="font-bold tabular-nums text-white">{s.jobs.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] text-slate-500">
                      {summary.data.mappable?.toLocaleString() ?? 0} commercial jobs carry a real
                      coordinate and can be pinned.
                    </p>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {nav === 'jobs' && !selectedId && (
          <section>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-white uppercase tracking-tight mr-auto">Jobs</h1>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={filters.q}
                  onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                  placeholder="Client, town, scope, store…"
                  className="w-64 pl-9 pr-3 py-2 rounded-lg bg-slate-900/70 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <select
                value={filters.evidence}
                onChange={(e) => setFilters((f) => ({ ...f, evidence: e.target.value }))}
                className="px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-800 text-sm text-slate-300"
              >
                <option value="">Any evidence</option>
                <option value="publishable">Publishable only</option>
                {Object.keys(GRADE_STYLE).map((g) => (
                  <option key={g} value={g}>{GRADE_STYLE[g].label}</option>
                ))}
              </select>
              <select
                value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                className="px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-800 text-sm text-slate-300"
              >
                <option value="">Both kinds</option>
                <option value="commercial">Commercial</option>
                <option value="residential">Residential</option>
              </select>
            </div>

            {jobs.isLoading && (
              <div className="mt-8 flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 className="animate-spin" size={16} /> Loading…
              </div>
            )}

            {jobs.data && (
              <>
                <div className="mt-3 text-xs text-slate-500">
                  {jobs.data.total.toLocaleString()} matching
                  {jobs.data.total > jobs.data.jobs.length && ` · showing the first ${jobs.data.jobs.length}`}
                </div>
                <div className="mt-3 space-y-2">
                  {jobs.data.jobs.map((j) => (
                    <button
                      key={j.id}
                      onClick={() => { setSelectedId(j.id); setTab('overview') }}
                      className="w-full text-left rounded-xl border border-slate-800 bg-slate-900/40 hover:border-amber-500/40 hover:bg-slate-900/70 transition p-4 flex flex-wrap items-center gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white truncate">
                            {j.client || j.address || j.city || 'Untitled job'}
                          </span>
                          <Grade value={j.evidence} />
                          {j.publishable && <ShieldCheck size={14} className="text-emerald-400" />}
                        </div>
                        <div className="mt-1 text-xs text-slate-400 truncate">
                          {[j.address, j.city, j.state].filter(Boolean).join(', ') || '—'}
                          {j.store_number && ` · ${j.store_number}`}
                          {j.invoice_number && ` · #${j.invoice_number}`}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold tabular-nums text-white">{money(j.amount)}</div>
                        <div className="text-[11px] text-slate-500">{j.completed_on || 'no completion date'}</div>
                      </div>
                    </button>
                  ))}
                  {jobs.data.jobs.length === 0 && (
                    <p className="text-sm text-slate-500 py-8">Nothing matches that.</p>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {selectedId && (
          <section>
            <button onClick={() => setSelectedId(null)}
                    className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400 hover:text-amber-300">
              ← Back to jobs
            </button>

            {detail.isLoading && (
              <div className="mt-6 flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 className="animate-spin" size={16} /> Loading…
              </div>
            )}

            {job && (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
                    {job.client || job.address || job.city || 'Job'}
                  </h1>
                  <Grade value={job.evidence} />
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  {[job.address, job.city, job.state, job.postal_code].filter(Boolean).join(', ') || '—'}
                </p>

                <div className="mt-5 flex gap-1 border-b border-slate-800">
                  {['overview', 'scope', 'evidence'].map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] transition ${
                        tab === t ? 'text-amber-300 border-b-2 border-amber-400'
                                  : 'text-slate-500 hover:text-slate-300'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>

                {tab === 'overview' && (
                  <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 max-w-3xl text-sm">
                    {[
                      ['Contract value', money(job.job_total)],
                      ['Invoiced', money(job.amount)],
                      ['Paid', money(job.amount_paid)],
                      ['Cheque', job.check_number || '—'],
                      ['Completed', job.completed_on || '—'],
                      ['Paid on', job.paid_date || '—'],
                      ['Store number', job.store_number || '—'],
                      ['Job / invoice no.', job.invoice_number || '—'],
                      ['Programme', job.program || '—'],
                      ['Kind', job.category || '—'],
                      ['Area', job.area_sqft ? `${job.area_sqft.toLocaleString()} sq ft` : '—'],
                      ['Area stated by', job.area_source || '—']
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-b border-slate-800/60 pb-2">
                        <dt className="text-slate-400">{k}</dt>
                        <dd className="font-semibold text-slate-100 tabular-nums text-right">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {tab === 'scope' && (
                  <div className="mt-5 max-w-3xl space-y-4 text-sm">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">What was done</h3>
                      <p className="mt-2 text-slate-200 leading-relaxed whitespace-pre-line">
                        {job.scope || 'No scope is recorded. Nothing is inferred from the job next to it.'}
                      </p>
                      {job.scope_source && (
                        <p className="mt-2 text-[11px] text-slate-500">Stated by: {job.scope_source}</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Our role</h3>
                      <p className="mt-2 text-slate-200">{job.role || 'Not recorded.'}</p>
                      {job.role_source && (
                        <p className="mt-1 text-[11px] text-slate-500">Established by: {job.role_source}</p>
                      )}
                    </div>
                    {job.outstanding_issues && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Outstanding</h3>
                        <p className="mt-2 text-slate-200 whitespace-pre-line">{job.outstanding_issues}</p>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'evidence' && (
                  <div className="mt-5 max-w-3xl space-y-4">
                    <div className={`rounded-xl border p-4 ${
                      job.publishable ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
                                      : 'border-slate-800 bg-slate-900/40'
                    }`}>
                      <div className="flex items-center gap-2">
                        {job.publishable
                          ? <ShieldCheck size={16} className="text-emerald-400" />
                          : <AlertTriangle size={16} className="text-amber-400" />}
                        <span className="font-bold text-white">
                          {job.publishable ? 'May back a public claim' : 'Not publishable'}
                        </span>
                        <Grade value={job.evidence} />
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{job.evidence_means}</p>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-400">
                      <FileText size={14} className="mt-0.5 shrink-0" />
                      <span>Source: <code className="text-slate-300">{job.source_document || 'not recorded'}</code></span>
                    </div>
                    {job.notes && <p className="text-sm text-slate-300">{job.notes}</p>}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {nav === 'map' && (
          <section>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Map</h1>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              {pins.data?.count?.toLocaleString() ?? '—'} commercial jobs with a real coordinate.
              A job without one is left off rather than dropped on its town centre — a pin in the
              wrong car park is a false claim with a map reference attached. Residential jobs are
              never pinned.
            </p>
            <div className="mt-5 h-[65vh] rounded-xl overflow-hidden border border-slate-800">
              {pins.isLoading
                ? <div className="h-full grid place-items-center text-slate-500 text-sm">Loading pins…</div>
                : <DiamondMap jobs={mapJobs} />}
            </div>
          </section>
        )}
      </main>

      {/* ── New job ──────────────────────────────────────────────────────── */}
      {creating && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" role="dialog" aria-modal="true">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              createJob.mutate(Object.fromEntries(
                [...f.entries()].filter(([, v]) => String(v).trim() !== '')
              ))
            }}
            className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0d1424] p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white uppercase tracking-tight">New job</h2>
              <button type="button" onClick={() => setCreating(false)} className="text-slate-500 hover:text-slate-300">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400 sm:col-span-2">
                Client
                <input name="client" className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm font-normal normal-case tracking-normal text-slate-100" />
              </label>
              <label className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                Kind
                <select name="category" defaultValue="commercial" className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm font-normal normal-case tracking-normal text-slate-100">
                  <option value="commercial">Commercial</option>
                  <option value="residential">Residential</option>
                </select>
              </label>
              <label className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                Amount
                <input name="amount" inputMode="decimal" placeholder="25589.39" className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm font-normal normal-case tracking-normal text-slate-100" />
              </label>
              <label className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400 sm:col-span-2">
                Address <span className="normal-case font-normal text-slate-500">(commercial only — a residential street is never stored)</span>
                <input name="address" className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm font-normal normal-case tracking-normal text-slate-100" />
              </label>
              <label className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                Town
                <input name="city" className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm font-normal normal-case tracking-normal text-slate-100" />
              </label>
              <label className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                State
                <input name="state" maxLength={2} className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm font-normal uppercase tracking-normal text-slate-100" />
              </label>
              <label className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400 sm:col-span-2">
                Scope
                <textarea name="scope" rows={3} className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm font-normal normal-case tracking-normal text-slate-100" />
              </label>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              A job raised here starts at <strong className="text-slate-300">listed</strong> — however
              certain you are. Attach the invoice or the completion photos to move it up. Nothing in
              this system grades itself.
            </p>

            {createJob.isError && (
              <p className="text-xs text-rose-300">{String(createJob.error?.message || 'Could not save that.')}</p>
            )}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white">
                Cancel
              </button>
              <button type="submit" disabled={createJob.isPending}
                      className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-sm font-bold hover:bg-amber-400 disabled:opacity-60">
                {createJob.isPending ? 'Saving…' : 'Raise job'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
