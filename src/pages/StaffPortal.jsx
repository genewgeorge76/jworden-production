import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

// ── Constants ─────────────────────────────────────────────────────────────
const LS_KEY = 'jworden_staff_token';
const LS_USER = 'jworden_staff_user';

const WORKER_TYPE_LABELS = {
  employee_ft:   'Full-Time Employee (W-2)',
  employee_pt:   'Part-Time Employee (W-2)',
  employee_temp: 'Temporary / Seasonal Employee (W-2)',
  subcontractor: 'Subcontractor (1099)',
  general_labor: 'General Labor / Day Worker (W-2)',
  cdl_driver:    'CDL Driver (W-2)',
};

const STATUS_BADGE = {
  approved:     'bg-green-100 text-green-800',
  pending:      'bg-yellow-100 text-yellow-800',
  rejected:     'bg-red-100 text-red-800',
  expired:      'bg-orange-100 text-orange-800',
  missing:      'bg-gray-100 text-gray-600',
};

const WORKER_STATUS_BADGE = {
  active:        'bg-green-100 text-green-800',
  pending_docs:  'bg-yellow-100 text-yellow-800',
  inactive:      'bg-gray-100 text-gray-600',
  terminated:    'bg-red-100 text-red-800',
  suspended:     'bg-orange-100 text-orange-800',
};

// ── VA Labor Law static data ─────────────────────────────────────────────
const VA_LAW_SECTIONS = [
  {
    title: 'Minimum Wage',
    icon: '💵',
    content: [
      'Virginia: $12.41/hr (2024 — adjusts annually with CPI). Check DOLI for current rate.',
      'Tipped employees: $2.13/hr tip credit — tips + base must reach minimum wage.',
      'Youth / training wage: 85% for employees under 18 during first 90 days.',
      'Authority: Virginia Minimum Wage Act § 40.1-28.10',
    ],
  },
  {
    title: 'Overtime (VOWA)',
    icon: '⏱️',
    content: [
      'Required for ALL non-exempt employees working >40 hours/week.',
      'Rate: 1.5× the regular rate for every hour over 40.',
      'Virginia Overtime Wage Act (§ 40.1-29.2) mirrors FLSA but extends lookback to 3 years.',
      'Day-rate workers ARE covered. Regular rate = total weekly pay ÷ total hours.',
      'Construction field workers are generally NON-EXEMPT.',
      'Exemptions (white-collar): salary ≥$684/week + duties test.',
    ],
  },
  {
    title: 'Payday Law',
    icon: '📅',
    content: [
      'Pay frequency: at least twice monthly (semimonthly) — § 40.1-29.',
      'Wages due within 7 days of pay period end.',
      'Final paycheck: all wages due by next regular payday after separation.',
      'Written notice of pay rate required at time of hire.',
      'Wage deductions require written employee authorization.',
    ],
  },
  {
    title: 'Workers\' Compensation',
    icon: '🦺',
    content: [
      'MANDATORY for employers with 3+ employees (including owners/principals).',
      'Authority: Virginia Workers\' Compensation Act § 65.2.',
      'Subcontractors must carry own WC or be covered under GC\'s policy.',
      'GC remains liable for uninsured subcontractors\' workers.',
      'Report workplace injuries to VWC within 10 days.',
      'Fine for being uninsured: $250/day.',
    ],
  },
  {
    title: 'I-9 & New Hire Reporting',
    icon: '📋',
    content: [
      'I-9 required for ALL employees — complete by Day 3 of employment.',
      'Retain I-9 for 3 years from hire OR 1 year after termination (whichever is later).',
      'New hire reporting: submit to Virginia NHRC within 20 days of hire.',
      'Includes independent contractors paid $600+ — § 63.2-1946.',
      'E-Verify required for state contractors over $50k.',
    ],
  },
  {
    title: 'Worker Classification (ABC Test)',
    icon: '⚖️',
    content: [
      'Virginia uses an ABC test (§ 40.1-28.7:7) — ALL three prongs must be met for 1099:',
      'A) Free from direction/control in performance of service.',
      'B) Work outside company\'s usual business OR performed off company premises.',
      'C) Customarily engaged in an independently established trade/business.',
      'Penalties for misclassification: back wages + 10% civil penalty + attorney fees.',
      'Subcontractors MUST carry own COI (GL + WC) and have a signed contract.',
    ],
  },
  {
    title: 'Anti-Discrimination (VHRA)',
    icon: '🤝',
    content: [
      'Virginia Human Rights Act (§ 2.2-3900) applies to ALL employers (1+ employee).',
      'Protected classes: race, color, religion, national origin, sex, pregnancy, age (40+), disability, sexual orientation, gender identity, marital status, veteran status, HIV status.',
      'File complaint with DHRM within 300 days or EEOC.',
    ],
  },
  {
    title: 'Sick Leave & FMLA',
    icon: '🏥',
    content: [
      'Virginia has NO universal paid sick leave mandate for construction workers (as of 2026).',
      'FMLA (federal): 12 weeks unpaid, job-protected leave for employers with 50+ employees.',
      'Best practice: adopt a written PTO/sick policy in your employee handbook.',
    ],
  },
  {
    title: 'CDL Driver Requirements',
    icon: '🚛',
    content: [
      'CDL Class A: combination vehicles ≥26,001 lbs GCWR (tractor-trailers, tri-axle dumps).',
      'CDL Class B: straight truck ≥26,001 lbs or large dump truck.',
      'DOT medical card (MCSA-5876): required, max 2-year validity — 49 CFR § 391.45.',
      'MVR: pre-employment + annually — 3-year lookback — 49 CFR § 391.25.',
      'DOT Drug Screen (5-panel): required BEFORE first drive — 49 CFR Part 40.',
      'FMCSA Drug & Alcohol Clearinghouse: full query pre-employment; limited query annually.',
      'Hours of Service: 11-hr driving rule, 14-hr on-duty window, 60/70-hr weekly limits.',
      'DUI in any vehicle = 1-year CDL disqualification (3 years if HazMat).',
      'Random testing: 50% drug / 10% alcohol in 2026.',
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function Badge({ label, variant = 'missing' }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[variant] || STATUS_BADGE.missing}`}>
      {label}
    </span>
  );
}

function WorkerStatusBadge({ status }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${WORKER_STATUS_BADGE[status] || 'bg-gray-100 text-gray-600'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function ComplianceMeter({ pct, complete }) {
  const color = complete ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────

function LoginForm({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const data = await api.staffLogin(form.username, form.password);
      onLogin(data.token, { username: data.username, role: data.role });
    } catch (ex) {
      setErr(ex.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">👷</div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Jworden Asphalt Paving</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-4">
          {err && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">{err}</div>}
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Username" required
            value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            autoComplete="username"
          />
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Password" required
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            autoComplete="current-password"
          />
          <button
            type="submit" disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-4">
          Contact your supervisor if you need account access.
        </p>
      </div>
    </div>
  );
}

// ── Check-In Tab ──────────────────────────────────────────────────────────

function CheckInTab({ token }) {
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [gps, setGps] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [checkins, setCheckins] = useState([]);
  const [loadingHist, setLoadingHist] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoadingHist(true);
    try {
      const data = await api.staffCheckins(token);
      setCheckins(data.checkins || []);
    } catch (_) {}
    setLoadingHist(false);
  }, [token]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const getGps = () => {
    if (!navigator.geolocation) { setGps({ err: 'GPS not available' }); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGps({ err: 'GPS denied' })
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg(''); setLoading(true);
    try {
      const fd = new FormData();
      if (note) fd.append('note', note);
      if (gps?.lat) { fd.append('gps_lat', gps.lat); fd.append('gps_lng', gps.lng); }
      if (photo) fd.append('photo', photo);
      await api.staffCheckin(token, fd);
      setMsg('Checked in ✓'); setNote(''); setPhoto(null); setGps(null);
      await loadHistory();
    } catch (ex) { setMsg(ex.message || 'Error'); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Daily Check-In</h2>
        {msg && <div className="text-sm text-green-700 bg-green-50 rounded p-2">{msg}</div>}
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Job note (optional)…"
          value={note} onChange={e => setNote(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={getGps}
            className="text-xs border rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">
            📍 {gps?.lat ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : gps?.err || 'Add GPS'}
          </button>
          <label className="text-xs border rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 cursor-pointer">
            📷 {photo ? photo.name : 'Add Photo'}
            <input type="file" accept="image/*" className="hidden"
              onChange={e => setPhoto(e.target.files?.[0] || null)} />
          </label>
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50">
          {loading ? 'Submitting…' : 'Check In'}
        </button>
      </form>

      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-2">Recent Check-Ins</h3>
        {loadingHist ? <p className="text-sm text-gray-400">Loading…</p> : (
          <div className="space-y-2">
            {checkins.length === 0 && <p className="text-sm text-gray-400">No check-ins yet.</p>}
            {checkins.map(c => (
              <div key={c.id} className="bg-white rounded-lg border p-3 text-sm">
                <div className="text-gray-800 font-medium">{new Date(c.checked_in_at).toLocaleString()}</div>
                {c.note && <div className="text-gray-600 mt-1">{c.note}</div>}
                {c.gps_lat && <div className="text-xs text-gray-400 mt-1">📍 {c.gps_lat.toFixed(4)}, {c.gps_lng.toFixed(4)}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── My Documents Tab ──────────────────────────────────────────────────────

function MyDocsTab({ token }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState('');
  const [uploadMsg, setUploadMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.staffMyProfile(token);
      setProfileData(data);
    } catch (ex) { setErr(ex.message); }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const upload = async (docType, file, expiryDate) => {
    setUploading(docType); setUploadMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('doc_type', docType);
      if (expiryDate) fd.append('expiry_date', expiryDate);
      await api.staffUploadMyDoc(token, fd);
      setUploadMsg('Uploaded — pending admin review');
      await load();
    } catch (ex) { setUploadMsg(ex.message || 'Upload failed'); }
    setUploading('');
  };

  if (loading) return <p className="text-sm text-gray-400 py-4">Loading…</p>;
  if (err) return <p className="text-sm text-red-500 py-4">{err}</p>;
  if (!profileData?.profile) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-sm text-yellow-800">
        <strong>No worker profile yet.</strong> Your supervisor needs to create your profile before you can upload documents.
      </div>
    );
  }

  const { profile, documents, compliance, required_docs } = profileData;
  const docsByType = {};
  (documents || []).forEach(d => { docsByType[d.doc_type] = d; });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-semibold text-gray-800">{profile.full_name}</div>
            <div className="text-xs text-gray-500">{WORKER_TYPE_LABELS[profile.worker_type] || profile.worker_type}</div>
          </div>
          <WorkerStatusBadge status={profile.status} />
        </div>
        {compliance && <ComplianceMeter pct={compliance.pct} complete={compliance.complete} />}
        {compliance && !compliance.complete && (
          <p className="text-xs text-gray-500 mt-1">
            {compliance.approved.length}/{compliance.required_count} docs approved
            {compliance.missing.length > 0 && ` · ${compliance.missing.length} missing`}
            {compliance.rejected.length > 0 && ` · ${compliance.rejected.length} rejected`}
          </p>
        )}
      </div>

      {uploadMsg && <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-2 text-blue-700">{uploadMsg}</div>}

      <div className="space-y-3">
        {(required_docs || []).map(({ doc_type, label, needs_expiry }) => {
          const existing = docsByType[doc_type];
          const status = existing?.status || 'missing';
          return (
            <DocUploadRow
              key={doc_type}
              docType={doc_type}
              label={label}
              status={status}
              existing={existing}
              needsExpiry={needs_expiry}
              uploading={uploading === doc_type}
              onUpload={(file, expiry) => upload(doc_type, file, expiry)}
            />
          );
        })}
      </div>
    </div>
  );
}

function DocUploadRow({ docType, label, status, existing, needsExpiry, uploading, onUpload }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [expiry, setExpiry] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    onUpload(file, expiry || null);
    setOpen(false); setFile(null); setExpiry('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-800">{label}</div>
          {existing?.expiry_date && (
            <div className="text-xs text-gray-400 mt-0.5">Expires: {existing.expiry_date.slice(0, 10)}</div>
          )}
          {existing?.notes && (
            <div className="text-xs text-orange-600 mt-0.5">Note: {existing.notes}</div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge label={status} variant={status} />
          <button onClick={() => setOpen(o => !o)}
            className="text-xs text-orange-600 underline hover:no-underline">
            {existing ? 'Replace' : 'Upload'}
          </button>
        </div>
      </div>
      {open && (
        <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t space-y-2">
          <input type="file" accept="image/*,application/pdf" required className="text-xs w-full"
            onChange={e => setFile(e.target.files?.[0] || null)} />
          {needsExpiry && (
            <div>
              <label className="text-xs text-gray-600">Expiry date (required):</label>
              <input type="date" required className="ml-2 text-xs border rounded px-2 py-1"
                value={expiry} onChange={e => setExpiry(e.target.value)} />
            </div>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={uploading}
              className="bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-50">
              {uploading ? 'Uploading…' : 'Submit'}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="text-xs text-gray-500 underline">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── VA Labor Law Tab ──────────────────────────────────────────────────────

function VALawTab() {
  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-800">
        <strong>Informational only.</strong> This is a quick-reference guide for Virginia labor law basics. Consult a licensed Virginia employment attorney before making any wage, classification, or leave policy decisions.
      </div>
      {VA_LAW_SECTIONS.map(section => (
        <details key={section.title} className="bg-white rounded-xl shadow-sm border">
          <summary className="px-4 py-3 cursor-pointer font-medium text-sm text-gray-800 flex items-center gap-2">
            <span>{section.icon}</span> {section.title}
          </summary>
          <ul className="px-4 pb-4 pt-2 space-y-1.5">
            {section.content.map((line, i) => (
              <li key={i} className="text-sm text-gray-600 flex gap-2">
                <span className="text-gray-300 mt-0.5">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}

// ── Admin Roster Tab ──────────────────────────────────────────────────────

function RosterTab() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminWorkers();
      setWorkers(data.workers || []);
    } catch (ex) { setErr(ex.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-sm text-gray-400 py-4">Loading roster…</p>;
  if (err) return <p className="text-sm text-red-500 py-4">{err}</p>;

  if (selected) {
    return <WorkerDetail worker={selected} onBack={() => { setSelected(null); load(); }} />;
  }

  const flagged = workers.filter(w => !w.compliance?.complete);

  return (
    <div className="space-y-4">
      {flagged.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          ⚠️ {flagged.length} worker{flagged.length > 1 ? 's' : ''} with incomplete compliance docs
        </div>
      )}
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-800">Worker Roster ({workers.length})</h2>
        <button onClick={() => setShowForm(true)}
          className="bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-orange-700">
          + Onboard Worker
        </button>
      </div>

      {showForm && (
        <OnboardWorkerForm
          onSaved={() => { setShowForm(false); load(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-2">
        {workers.length === 0 && <p className="text-sm text-gray-400">No workers yet.</p>}
        {workers.map(w => (
          <button key={w.id} onClick={() => setSelected(w)}
            className="w-full text-left bg-white rounded-xl border shadow-sm p-4 hover:border-orange-300 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-sm text-gray-900">{w.full_name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{WORKER_TYPE_LABELS[w.worker_type] || w.worker_type}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <WorkerStatusBadge status={w.status} />
                {w.compliance && <ComplianceMeter pct={w.compliance.pct} complete={w.compliance.complete} />}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function OnboardWorkerForm({ onSaved, onCancel }) {
  const [form, setForm] = useState({
    full_name: '', worker_type: 'employee_ft', pay_type: 'w2',
    phone: '', email: '', address: '', ssn_last4: '',
    hire_date: '', company_name: '', ein: '',
    cdl_class: '', cdl_number: '', cdl_state: '', cdl_expiry: '', dot_medical_expiry: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isCdl = form.worker_type === 'cdl_driver';
  const isSub = form.worker_type === 'subcontractor';

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null; });
      if (isSub) payload.pay_type = '1099';
      await api.adminCreateWorker(payload);
      onSaved();
    } catch (ex) { setErr(ex.message || 'Error saving'); }
    setSaving(false);
  };

  const F = ({ label, field, type = 'text', placeholder = '' }) => (
    <div>
      <label className="block text-xs text-gray-600 mb-0.5">{label}</label>
      <input type={type} placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        value={form[field] || ''} onChange={e => set(field, e.target.value)} />
    </div>
  );

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border shadow p-5 space-y-4">
      <h3 className="font-semibold text-gray-800">Onboard New Worker</h3>
      {err && <div className="text-sm text-red-600 bg-red-50 rounded p-2">{err}</div>}
      <F label="Full Name *" field="full_name" placeholder="First Last" />
      <div>
        <label className="block text-xs text-gray-600 mb-0.5">Worker Type *</label>
        <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={form.worker_type} onChange={e => set('worker_type', e.target.value)}>
          {Object.entries(WORKER_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {!isSub && (
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">Pay Type</label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.pay_type} onChange={e => set('pay_type', e.target.value)}>
            <option value="w2">W-2 Employee</option>
            <option value="1099">1099 Independent Contractor</option>
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <F label="Phone" field="phone" type="tel" />
        <F label="Email" field="email" type="email" />
      </div>
      <F label="Address" field="address" />
      <div className="grid grid-cols-2 gap-3">
        <F label="Hire Date" field="hire_date" type="date" />
        <F label="SSN Last 4 Digits" field="ssn_last4" placeholder="####" />
      </div>
      {isSub && (
        <>
          <F label="Company Name" field="company_name" />
          <F label="EIN" field="ein" placeholder="XX-XXXXXXX" />
        </>
      )}
      {isCdl && (
        <>
          <div className="border-t pt-3">
            <div className="text-xs font-semibold text-gray-600 mb-2">CDL Information</div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">CDL Class</label>
                <select className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={form.cdl_class} onChange={e => set('cdl_class', e.target.value)}>
                  <option value="">--</option>
                  <option value="A">Class A</option>
                  <option value="B">Class B</option>
                  <option value="C">Class C</option>
                </select>
              </div>
              <F label="CDL State" field="cdl_state" placeholder="VA" />
              <F label="CDL Number" field="cdl_number" />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <F label="CDL Expiry" field="cdl_expiry" type="date" />
              <F label="DOT Medical Expiry" field="dot_medical_expiry" type="date" />
            </div>
          </div>
        </>
      )}
      <F label="Notes" field="notes" placeholder="Internal notes…" />
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="flex-1 bg-orange-600 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50">
          {saving ? 'Saving…' : 'Create Profile'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 border rounded-lg text-sm text-gray-600">Cancel</button>
      </div>
    </form>
  );
}

function WorkerDetail({ worker: initialWorker, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewMsg, setReviewMsg] = useState('');
  const [uploading, setUploading] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.adminWorker(initialWorker.id);
      setData(d);
    } catch (_) {}
    setLoading(false);
  }, [initialWorker.id]);

  useEffect(() => { load(); }, [load]);

  const reviewDoc = async (docId, status) => {
    const notes = status === 'rejected' ? window.prompt('Rejection reason (optional):') : null;
    const expiryDate = (status === 'approved' && window.confirm('Set / update expiry date?'))
      ? window.prompt('Expiry date (YYYY-MM-DD):') : null;
    try {
      await api.adminReviewDoc(docId, { status, notes, expiry_date: expiryDate });
      setReviewMsg(`Doc ${status}`);
      await load();
    } catch (ex) { setReviewMsg(ex.message); }
  };

  const uploadAdminDoc = async (docType) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*,application/pdf';
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return;
      setUploading(docType);
      try {
        const fd = new FormData();
        fd.append('file', file); fd.append('doc_type', docType);
        await api.adminUploadWorkerDoc(initialWorker.id, fd);
        await load();
      } catch (ex) { setReviewMsg(ex.message); }
      setUploading('');
    };
    input.click();
  };

  if (loading || !data) return <p className="text-sm text-gray-400 py-4">Loading…</p>;

  const { profile, documents, compliance, required_docs } = data;
  const docsByType = {};
  (documents || []).forEach(d => { docsByType[d.doc_type] = d; });

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-orange-600 underline">← Back to Roster</button>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold text-gray-900">{profile.full_name}</div>
            <div className="text-xs text-gray-500">{WORKER_TYPE_LABELS[profile.worker_type] || profile.worker_type} · {profile.pay_type.toUpperCase()}</div>
            {profile.phone && <div className="text-xs text-gray-500 mt-1">📞 {profile.phone}</div>}
            {profile.email && <div className="text-xs text-gray-500">✉️ {profile.email}</div>}
            {profile.hire_date && <div className="text-xs text-gray-500">📅 Hire: {profile.hire_date.slice(0, 10)}</div>}
            {profile.cdl_class && <div className="text-xs text-gray-500">🚛 CDL Class {profile.cdl_class} · {profile.cdl_state} · Exp: {profile.cdl_expiry?.slice(0,10)}</div>}
            {profile.dot_medical_expiry && <div className="text-xs text-gray-500">🏥 DOT Med Exp: {profile.dot_medical_expiry.slice(0,10)}</div>}
          </div>
          <WorkerStatusBadge status={profile.status} />
        </div>
        {compliance && (
          <div className="mt-3">
            <ComplianceMeter pct={compliance.pct} complete={compliance.complete} />
            <div className="text-xs text-gray-500 mt-1">
              {compliance.approved.length}/{compliance.required_count} approved
              {compliance.missing.length > 0 && <span className="text-red-500"> · {compliance.missing.length} missing</span>}
              {compliance.rejected.length > 0 && <span className="text-red-500"> · {compliance.rejected.length} rejected</span>}
              {compliance.expired.length > 0 && <span className="text-orange-500"> · {compliance.expired.length} expired</span>}
            </div>
          </div>
        )}
      </div>

      {reviewMsg && <div className="text-sm bg-blue-50 border border-blue-200 rounded p-2 text-blue-700">{reviewMsg}</div>}

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Required Documents</h3>
        <div className="space-y-2">
          {(required_docs || []).map(({ doc_type, label, needs_expiry }) => {
            const doc = docsByType[doc_type];
            const status = doc?.status || 'missing';
            return (
              <div key={doc_type} className="bg-white rounded-xl border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm text-gray-800">{label}</div>
                    {doc?.expiry_date && <div className="text-xs text-gray-400">Exp: {doc.expiry_date.slice(0,10)}</div>}
                    {doc?.notes && <div className="text-xs text-orange-600">Note: {doc.notes}</div>}
                    {doc?.reviewed_by && <div className="text-xs text-gray-400">Reviewed by {doc.reviewed_by}</div>}
                    {needs_expiry && !doc && <div className="text-xs text-gray-400">⚠️ Expiry date required</div>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge label={status} variant={status} />
                    {doc && doc.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => reviewDoc(doc.id, 'approved')}
                          className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200">✓</button>
                        <button onClick={() => reviewDoc(doc.id, 'rejected')}
                          className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded hover:bg-red-200">✗</button>
                      </div>
                    )}
                    <button onClick={() => uploadAdminDoc(doc_type)}
                      disabled={uploading === doc_type}
                      className="text-xs text-orange-600 underline disabled:opacity-50">
                      {uploading === doc_type ? '…' : doc ? 'Replace' : 'Upload'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Portal ───────────────────────────────────────────────────────────

export default function StaffPortal() {
  const [token, setToken] = useState(() => localStorage.getItem(LS_KEY) || '');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_USER) || 'null'); } catch { return null; }
  });
  const [tab, setTab] = useState('checkin');

  const handleLogin = (t, u) => {
    localStorage.setItem(LS_KEY, t);
    localStorage.setItem(LS_USER, JSON.stringify(u));
    setToken(t); setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(LS_KEY); localStorage.removeItem(LS_USER);
    setToken(''); setUser(null);
  };

  if (!token || !user) return <LoginForm onLogin={handleLogin} />;

  const isAdmin = user.role === 'admin' || user.role === 'foreman';
  const tabs = [
    { id: 'checkin',  label: '✅ Check-In' },
    { id: 'docs',     label: '📄 My Docs' },
    { id: 'va-law',   label: '⚖️ VA Laws' },
    ...(isAdmin ? [{ id: 'roster', label: '👷 Roster' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-600 text-white px-4 pt-10 pb-4 sticky top-0 z-10 shadow">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg leading-tight">Staff Portal</h1>
            <p className="text-orange-200 text-xs">{user.username} · {user.role}</p>
          </div>
          <button onClick={logout} className="text-orange-200 text-xs hover:text-white underline">Sign Out</button>
        </div>
        {/* Tab bar */}
        <div className="max-w-lg mx-auto mt-3 flex gap-1 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                tab === t.id ? 'bg-white text-orange-700' : 'text-orange-100 hover:bg-orange-500'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-5">
        {tab === 'checkin'  && <CheckInTab token={token} />}
        {tab === 'docs'     && <MyDocsTab token={token} />}
        {tab === 'va-law'   && <VALawTab />}
        {tab === 'roster'   && isAdmin && <RosterTab />}
      </div>
    </div>
  );
}
