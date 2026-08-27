import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';
import {
  Users,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Search,
  Loader2,
  AlertTriangle,
  RefreshCw,
  X,
  ChevronRight,
  Plus,
  Filter,
  TrendingUp,
  ShieldAlert,
  CalendarPlus,
  Upload,
  CheckCircle2,
} from 'lucide-react';

/**
 * Customers — the owner-facing CRM.
 *
 * Backed by /api/v1/customers (app/routers/customers.py): list, stats/overview,
 * detail, service history (view + log), create, and update. The backend was
 * fully built and mounted but had no frontend caller, so the customer database
 * was invisible. This is the interface for it.
 *
 * Honest states only: it never fabricates rows. Auth failures, load errors, and
 * a genuinely empty database are each rendered as themselves.
 */

const CUSTOMER_TYPES = ['residential', 'commercial', 'municipal', 'franchise', 'gc', 'hoa'];
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const money = (n) =>
  typeof n === 'number'
    ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    : '—';

const CHURN = {
  low: { label: 'Low risk', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  medium: { label: 'Watch', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  high: { label: 'At risk', cls: 'border-red-500/30 bg-red-500/10 text-red-300' },
};

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-amber-500/15 text-amber-400">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold leading-tight text-white tabular-nums">{value}</div>
        <div className="truncate text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none';

export default function Customers() {
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ customer_type: '', state_code: '', is_franchise: '' });
  const [status, setStatus] = useState('loading'); // loading | ready | error | unauthorized
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState(null);

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      customer_type: filters.customer_type || undefined,
      state_code: filters.state_code || undefined,
      is_franchise: filters.is_franchise === '' ? undefined : filters.is_franchise,
      limit: 200,
    }),
    [search, filters],
  );

  const load = useCallback(async (q) => {
    setStatus('loading');
    setError('');
    try {
      const [statsRes, listRes] = await Promise.all([
        api.customersStats().catch(() => null),
        api.customersList(q),
      ]);
      if (statsRes) setStats(statsRes);
      const items = Array.isArray(listRes?.items) ? listRes.items : Array.isArray(listRes) ? listRes : [];
      setRows(items);
      setTotal(typeof listRes?.total === 'number' ? listRes.total : items.length);
      setStatus('ready');
    } catch (err) {
      const msg = String(err?.message || err);
      if (/401|403|unauthor|forbidden|premium/i.test(msg)) setStatus('unauthorized');
      else {
        setStatus('error');
        setError(msg);
      }
    }
  }, []);

  useEffect(() => {
    load(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => load(query);

  const openCustomer = async (c) => {
    setSelected({ customer: c, history: null, loading: true });
    try {
      const [full, history] = await Promise.all([
        api.customerGet(c.id).catch(() => c),
        api.customerHistory(c.id).catch(() => null),
      ]);
      const entries = Array.isArray(history?.items) ? history.items : Array.isArray(history) ? history : [];
      setSelected({ customer: full || c, history: entries, loading: false });
    } catch {
      setSelected({ customer: c, history: [], loading: false });
    }
  };

  return (
    <div className="min-h-screen bg-[#070a10] px-4 py-8 text-slate-200 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-amber-400">Command Center</p>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Customers</h1>
            <p className="mt-1 text-sm text-slate-400">Your customer database — accounts, service history, lifetime value, and churn risk.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => load(query)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.07]"
            >
              <RefreshCw className={`h-4 w-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.07]"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-[#070a10] transition-colors hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              Add customer
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard icon={Users} label="Customers" value={(stats.total_customers ?? 0).toLocaleString()} />
            <StatCard icon={Building2} label="Franchise accts" value={(stats.franchise_accounts ?? 0).toLocaleString()} />
            <StatCard icon={MapPin} label="States" value={(stats.states_represented ?? 0).toLocaleString()} />
            <StatCard icon={Briefcase} label="Jobs on record" value={(stats.total_jobs_on_record ?? 0).toLocaleString()} />
            <StatCard icon={DollarSign} label="Revenue" value={money(stats.total_revenue_on_record)} />
          </div>
        )}

        {/* Toolbar: search + filters */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Search name, email, or company…"
              className={`${inputCls} pl-9`}
            />
          </div>
          <select value={filters.customer_type} onChange={(e) => setFilters((f) => ({ ...f, customer_type: e.target.value }))} className={`${inputCls} sm:w-40`}>
            <option value="">All types</option>
            {CUSTOMER_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
          <select value={filters.state_code} onChange={(e) => setFilters((f) => ({ ...f, state_code: e.target.value }))} className={`${inputCls} sm:w-28`}>
            <option value="">All states</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.is_franchise} onChange={(e) => setFilters((f) => ({ ...f, is_franchise: e.target.value }))} className={`${inputCls} sm:w-36`}>
            <option value="">All accounts</option>
            <option value="1">Franchise only</option>
            <option value="0">Non-franchise</option>
          </select>
          <button type="button" onClick={applyFilters} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/[0.07]">
            <Filter className="h-4 w-4" /> Apply
          </button>
        </div>

        {/* States */}
        {status === 'unauthorized' && (
          <Banner tone="amber" title="Sign in to view customers" body="This is a premium owner tool. Unlock the Command Center to load the customer database." />
        )}
        {status === 'error' && <Banner tone="red" title="Couldn't load customers" body={error} />}
        {status === 'loading' && (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] py-16 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading customers…
          </div>
        )}
        {status === 'ready' && rows.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] py-16 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-slate-600" />
            <p className="font-semibold text-slate-300">No customers{search || filters.customer_type || filters.state_code || filters.is_franchise ? ' match these filters' : ' yet'}</p>
            <p className="text-sm text-slate-500">Add your first customer with the button above, or import a list.</p>
          </div>
        )}

        {/* Table */}
        {status === 'ready' && rows.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Location</th>
                    <th className="px-4 py-3 text-right font-semibold">Jobs</th>
                    <th className="px-4 py-3 text-right font-semibold">Revenue</th>
                    <th className="px-4 py-3 font-semibold">Health</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {rows.map((c) => (
                    <tr key={c.id} onClick={() => openCustomer(c)} className="cursor-pointer transition-colors hover:bg-white/[0.04]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{c.name || '—'}</div>
                        <div className="text-xs text-slate-400">{c.company || c.email || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs capitalize text-slate-300">{c.customer_type || 'customer'}</span>
                        {c.is_franchise ? <span className="ml-1 inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">{c.brand || 'franchise'}</span> : null}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{[c.city, c.state_code].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-300">{c.total_jobs ?? 0}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-white">{money(c.total_revenue)}</td>
                      <td className="px-4 py-3">
                        {c.churn_risk && CHURN[String(c.churn_risk).toLowerCase()] ? (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${CHURN[String(c.churn_risk).toLowerCase()].cls}`}>
                            <ShieldAlert className="h-3 w-3" />{CHURN[String(c.churn_risk).toLowerCase()].label}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500"><ChevronRight className="ml-auto h-4 w-4" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-white/10 bg-white/[0.02] px-4 py-2 text-xs text-slate-500">Showing {rows.length} of {total.toLocaleString()} customer{total === 1 ? '' : 's'}</div>
          </div>
        )}
      </div>

      {selected && (
        <CustomerDrawer
          data={selected}
          onClose={() => setSelected(null)}
          onLogged={() => { openCustomer(selected.customer); load(query); }}
          onEdit={(c) => { setSelected(null); setEditing(c); }}
        />
      )}
      {editing && (
        <CreateCustomerModal
          existing={editing}
          onClose={() => setEditing(null)}
          onCreated={() => { setEditing(null); load(query); }}
        />
      )}
      {showCreate && (
        <CreateCustomerModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(query); }}
        />
      )}
      {showImport && (
        <ImportCustomersModal
          onClose={() => setShowImport(false)}
          onImported={() => load(query)}
        />
      )}
    </div>
  );
}

function Banner({ tone, title, body }) {
  const cls = tone === 'red' ? 'border-red-500/25 bg-red-500/10' : 'border-amber-500/25 bg-amber-500/10';
  const icon = tone === 'red' ? 'text-red-400' : 'text-amber-400';
  const head = tone === 'red' ? 'text-red-300' : 'text-amber-300';
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-4 ${cls}`}>
      <AlertTriangle className={`mt-0.5 h-5 w-5 flex-none ${icon}`} />
      <div className="text-sm">
        <p className={`font-semibold ${head}`}>{title}</p>
        <p className="break-words text-slate-300">{body}</p>
      </div>
    </div>
  );
}

function CustomerDrawer({ data, onClose, onLogged, onEdit }) {
  const { customer: c, history, loading } = data;
  const [logging, setLogging] = useState(false);
  const [logForm, setLogForm] = useState({ service_type: '', revenue: '', job_date: '', scope_summary: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submitLog = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api.customerAddHistory(c.id, {
        service_type: logForm.service_type || undefined,
        revenue: logForm.revenue ? Number(logForm.revenue) : undefined,
        job_date: logForm.job_date ? new Date(logForm.job_date).toISOString() : undefined,
        scope_summary: logForm.scope_summary || undefined,
      });
      setLogging(false);
      setLogForm({ service_type: '', revenue: '', job_date: '', scope_summary: '' });
      onLogged();
    } catch (e2) {
      setErr(String(e2?.message || e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0b0f16] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">{c.name || 'Customer'}</h2>
            <p className="text-sm text-slate-400">{c.company || c.email || ''}</p>
          </div>
          <div className="flex flex-none items-center gap-2">
            <button type="button" onClick={() => onEdit(c)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.06]">Edit</button>
            <button type="button" onClick={onClose} className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:bg-white/[0.06]" aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Value signals */}
        <div className="mb-4 flex flex-wrap gap-2">
          {c.ltv_score != null && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
              <TrendingUp className="h-3.5 w-3.5" /> LTV {Math.round(c.ltv_score)}
            </span>
          )}
          {c.churn_risk && CHURN[String(c.churn_risk).toLowerCase()] && (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${CHURN[String(c.churn_risk).toLowerCase()].cls}`}>
              <ShieldAlert className="h-3.5 w-3.5" /> {CHURN[String(c.churn_risk).toLowerCase()].label}
            </span>
          )}
        </div>

        <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
          {[
            ['Email', c.email],
            ['Phone', c.phone],
            ['Address', [c.address, c.city, c.state_code, c.zip_code].filter(Boolean).join(', ')],
            ['Type', c.customer_type],
            ['Total jobs', c.total_jobs],
            ['Revenue', money(c.total_revenue)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wider text-slate-500">{k}</dt>
              <dd className="truncate text-slate-200">{v === 0 || v ? v : '—'}</dd>
            </div>
          ))}
        </dl>
        {(c.services || c.maintenance_agreement) && (
          <div className="mb-6 space-y-2 text-sm">
            {c.services && (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Services</div>
                <div className="text-slate-200">{c.services}</div>
              </div>
            )}
            {c.maintenance_agreement && (
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2">
                <div className="text-[11px] uppercase tracking-wider text-amber-400/80">Maintenance agreement</div>
                <div className="whitespace-pre-wrap text-slate-200">{c.maintenance_agreement}</div>
              </div>
            )}
          </div>
        )}

        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Service history</h3>
          <button type="button" onClick={() => setLogging((v) => !v)} className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300">
            <CalendarPlus className="h-3.5 w-3.5" /> Log service
          </button>
        </div>

        {logging && (
          <form onSubmit={submitLog} className="mb-3 space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="grid grid-cols-2 gap-2">
              <input value={logForm.service_type} onChange={(e) => setLogForm((f) => ({ ...f, service_type: e.target.value }))} placeholder="Service type" className={inputCls} />
              <input value={logForm.revenue} onChange={(e) => setLogForm((f) => ({ ...f, revenue: e.target.value }))} placeholder="Revenue ($)" inputMode="decimal" className={inputCls} />
            </div>
            <input type="date" value={logForm.job_date} onChange={(e) => setLogForm((f) => ({ ...f, job_date: e.target.value }))} className={inputCls} />
            <textarea value={logForm.scope_summary} onChange={(e) => setLogForm((f) => ({ ...f, scope_summary: e.target.value }))} rows={2} placeholder="Scope / notes" className={`${inputCls} resize-none`} />
            {err && <p className="text-xs text-red-400">{err}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-lg bg-amber-500 py-2 text-sm font-bold text-[#070a10] hover:bg-amber-400 disabled:opacity-60">
              {busy ? 'Saving…' : 'Save service entry'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : history && history.length > 0 ? (
          <ul className="space-y-2">
            {history.map((h, i) => (
              <li key={h.id ?? i} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-200">{h.service_type || h.scope_summary || 'Service'}</span>
                  {(h.revenue != null || h.amount != null) && <span className="tabular-nums text-slate-300">{money(h.revenue ?? h.amount)}</span>}
                </div>
                {(h.job_date || h.service_date || h.created_at) && (
                  <div className="text-xs text-slate-500">{new Date(h.job_date || h.service_date || h.created_at).toLocaleDateString()}</div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-sm text-slate-500">No service history on record yet.</p>
        )}
      </div>
    </div>
  );
}

function CreateCustomerModal({ onClose, onCreated, existing = null }) {
  const isEdit = Boolean(existing);
  const [form, setForm] = useState({
    name: existing?.name || '', email: existing?.email || '', phone: existing?.phone || '',
    company: existing?.company || '', address: existing?.address || '', city: existing?.city || '',
    state_code: existing?.state_code || '', zip_code: existing?.zip_code || '',
    customer_type: existing?.customer_type || 'residential', is_franchise: existing?.is_franchise ? 1 : 0,
    brand: existing?.brand || '', services: existing?.services || '',
    maintenance_agreement: existing?.maintenance_agreement || '', notes: existing?.notes || '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErr('Name is required.'); return; }
    setBusy(true);
    setErr('');
    const payload = {
      ...form,
      is_franchise: Number(form.is_franchise) ? 1 : 0,
      email: form.email || undefined,
      phone: form.phone || undefined,
      company: form.company || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state_code: form.state_code || undefined,
      zip_code: form.zip_code || undefined,
      brand: form.brand || undefined,
      services: form.services || undefined,
      maintenance_agreement: form.maintenance_agreement || undefined,
      notes: form.notes || undefined,
    };
    try {
      if (isEdit) await api.customerUpdate(existing.id, payload);
      else await api.customerCreate(payload);
      onCreated();
    } catch (e2) {
      const msg = String(e2?.message || e2);
      setErr(/401|403|unauthor|forbidden|premium/i.test(msg) ? 'Sign in to add customers.' : msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f16] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-bold text-white">{isEdit ? 'Edit customer' : 'Add customer'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:bg-white/[0.06]" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4">
          <Field label="Name *"><input value={form.name} onChange={set('name')} required placeholder="Full name or account name" className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email"><input value={form.email} onChange={set('email')} type="email" className={inputCls} /></Field>
            <Field label="Phone"><input value={form.phone} onChange={set('phone')} className={inputCls} /></Field>
          </div>
          <Field label="Company"><input value={form.company} onChange={set('company')} className={inputCls} /></Field>
          <Field label="Street address"><input value={form.address} onChange={set('address')} placeholder="123 Main St" className={inputCls} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City"><input value={form.city} onChange={set('city')} className={inputCls} /></Field>
            <Field label="State">
              <select value={form.state_code} onChange={set('state_code')} className={inputCls}>
                <option value="">—</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="ZIP"><input value={form.zip_code} onChange={set('zip_code')} inputMode="numeric" className={inputCls} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select value={form.customer_type} onChange={set('customer_type')} className={`${inputCls} capitalize`}>
                {CUSTOMER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Franchise?">
              <select value={form.is_franchise} onChange={set('is_franchise')} className={inputCls}>
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </Field>
          </div>
          {Number(form.is_franchise) === 1 && (
            <Field label="Brand"><input value={form.brand} onChange={set('brand')} placeholder="e.g. KFC, Taco Bell" className={inputCls} /></Field>
          )}
          <Field label="Services"><input value={form.services} onChange={set('services')} placeholder="e.g. Paving, Sealcoating, Line striping" className={inputCls} /></Field>
          <Field label="Maintenance agreement"><textarea value={form.maintenance_agreement} onChange={set('maintenance_agreement')} rows={2} placeholder="Plan, cadence, renewal date, terms…" className={`${inputCls} resize-none`} /></Field>
          <Field label="Notes"><textarea value={form.notes} onChange={set('notes')} rows={2} className={`${inputCls} resize-none`} /></Field>
          {err && <p className="text-sm text-red-400">{err}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/[0.06]">Cancel</button>
          <button type="submit" disabled={busy} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-[#070a10] hover:bg-amber-400 disabled:opacity-60">{busy ? 'Saving…' : 'Add customer'}</button>
        </div>
      </form>
    </div>
  );
}

function ImportCustomersModal({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) { setErr('Choose a .csv or .json file to import.'); return; }
    setBusy(true); setErr(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.customerImport(fd);
      setResult(res);
      if ((res?.imported ?? 0) > 0) onImported();
    } catch (e2) {
      const msg = String(e2?.message || e2);
      setErr(/401|403|unauthor|forbidden|premium/i.test(msg) ? 'Sign in to import customers.' : msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f16] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-bold text-white">Import customers</h2>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:bg-white/[0.06]" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          <p className="text-sm text-slate-400">
            Upload a <span className="font-medium text-slate-200">.csv</span> (header row) or{' '}
            <span className="font-medium text-slate-200">.json</span> array. Columns/keys map to
            <code className="mx-1 rounded bg-white/[0.06] px-1 py-0.5 font-mono text-xs">name, email, phone, company, address, city, state_code, zip_code, customer_type, brand, services, maintenance_agreement, notes</code>.
            Rows without a name are skipped; existing customers matched on email are skipped (no duplicates).
          </p>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-8 text-center hover:border-amber-500/40">
            <Upload className="h-6 w-6 text-slate-500" />
            <span className="text-sm text-slate-300">{file ? file.name : 'Choose a CSV or JSON file'}</span>
            <input type="file" accept=".csv,.json,text/csv,application/json" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); setErr(''); }} />
          </label>

          {err && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" /> <span className="break-words">{err}</span>
            </div>
          )}

          {result && (
            <div className="space-y-2 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-3 text-sm">
              <div className="flex items-center gap-2 font-semibold text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Import complete</div>
              <div className="flex gap-4 text-slate-200">
                <span><b className="tabular-nums">{result.imported ?? 0}</b> imported</span>
                <span><b className="tabular-nums">{result.skipped ?? 0}</b> skipped</span>
                {Array.isArray(result.errors) && <span><b className="tabular-nums">{result.errors.length}</b> errors</span>}
              </div>
              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <ul className="max-h-32 overflow-y-auto text-xs text-amber-300/90">
                  {result.errors.slice(0, 20).map((x, i) => <li key={i}>• {String(x)}</li>)}
                </ul>
              )}
            </div>
          )}
        </form>
        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/[0.06]">{result ? 'Done' : 'Cancel'}</button>
          <button type="button" onClick={submit} disabled={busy || !file} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-[#070a10] hover:bg-amber-400 disabled:opacity-60">{busy ? 'Importing…' : 'Import'}</button>
        </div>
      </div>
    </div>
  );
}
