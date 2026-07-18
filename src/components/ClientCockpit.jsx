import { useState, useEffect, useRef } from 'react';
import { api } from '@/api/client';
import { useTenant } from '@/lib/TenantContext';
import { getSaasBrandingLabel } from '@/lib/siteProfiles';
import {
  LayoutDashboard, FileText, Users, Briefcase, Bot, Send,
  TrendingUp, ChevronRight, Phone, Mail, X, Loader2,
} from 'lucide-react';

/* ─── Helpers ─────────────────────────────────────────────── */
const f$ = n => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0 });
const fDate = s => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
const STATUS_COLORS = {
  active: '#22c55e', 'in-progress': '#22c55e',
  scheduled: '#f59e0b', pending: '#6b7280',
  complete: '#3b82f6', paid: '#8b5cf6',
};

/* ─── KPI Card ───────────────────────────────────────────── */
function KpiCard({ label, value, sub, color = '#f59e0b', icon: Icon }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{label}</span>
        {Icon && <Icon size={16} color={color} />}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{sub}</div>}
    </div>
  );
}

/* ─── Status Dot ──────────────────────────────────────────── */
function StatusDot({ status }) {
  const c = STATUS_COLORS[status?.toLowerCase()] || '#6b7280';
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c, marginRight: 6 }} />;
}

/* ─── Panels ─────────────────────────────────────────────── */
function HomePanel({ leads, jobs }) {
  const now = new Date();
  const todayLeads = leads.filter(l => {
    const d = new Date(l.created_at || l.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }).length;
  const activeJobs = jobs.filter(j => ['active','in-progress','scheduled'].includes(j.status?.toLowerCase())).length;
  const revenue = jobs.filter(j => j.status?.toLowerCase() === 'paid').reduce((s, j) => s + (j.bid || j.total || 0), 0);
  const pipeline = jobs.reduce((s, j) => s + (j.bid || j.total || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        <KpiCard label="Leads Today" value={todayLeads} icon={Users} color="#22c55e" />
        <KpiCard label="Active Jobs" value={activeJobs} icon={Briefcase} color="#f59e0b" />
        <KpiCard label="Revenue" value={f$(revenue)} sub="paid invoices" icon={TrendingUp} color="#8b5cf6" />
        <KpiCard label="Pipeline" value={f$(pipeline)} sub="total estimated" icon={FileText} color="#3b82f6" />
      </div>
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Recent Leads</div>
        {leads.slice(0, 5).map((l, i) => (
          <div key={l.id || i} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{l.name || l.full_name || 'Unknown'}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'monospace' }}>{l.service || l.service_type || '—'} · {fDate(l.created_at)}</div>
            </div>
            <ChevronRight size={14} color="rgba(255,255,255,0.25)" />
          </div>
        ))}
        {!leads.length && <div style={{ padding: '24px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No leads yet</div>}
      </div>
    </div>
  );
}

function LeadsPanel({ leads }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>All Leads ({leads.length})</div>
        <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
          {leads.map((l, i) => (
            <div key={l.id || i} onClick={() => setSelected(l)} style={{ padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', background: selected?.id === l.id ? 'rgba(245,158,11,0.06)' : 'transparent', borderLeft: selected?.id === l.id ? '2px solid #f59e0b' : '2px solid transparent', transition: 'all 0.15s' }}>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{l.name || l.full_name || 'Unknown'}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'monospace', marginTop: 2 }}>{l.phone || l.email || '—'} · {fDate(l.created_at)}</div>
            </div>
          ))}
          {!leads.length && <div style={{ padding: '32px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No leads yet</div>}
        </div>
      </div>
      {selected && (
        <div style={{ width: 300, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>{selected.name || selected.full_name}</div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={16} /></button>
          </div>
          {[['Phone', selected.phone], ['Email', selected.email], ['Service', selected.service || selected.service_type], ['Source', selected.source], ['Date', fDate(selected.created_at)], ['Notes', selected.notes || selected.message]].filter(([, v]) => v).map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
              <div style={{ color: '#e2e8f0', fontSize: 13 }}>{v}</div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            {selected.phone && <a href={`tel:${selected.phone}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', background: '#22c55e', borderRadius: 8, color: '#000', fontWeight: 700, fontSize: 12, textDecoration: 'none', fontFamily: 'monospace' }}><Phone size={14} /> Call</a>}
            {selected.email && <a href={`mailto:${selected.email}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 12, textDecoration: 'none', fontFamily: 'monospace' }}><Mail size={14} /> Email</a>}
          </div>
        </div>
      )}
    </div>
  );
}

function JobsPanel({ jobs }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Jobs ({jobs.length})</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {['Job', 'Customer', 'Service', 'Status', 'Value', 'Date'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {jobs.map((j, i) => (
              <tr key={j.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{j.id?.slice(0, 8) || `J-${i + 1}`}</td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#fff', fontWeight: 600 }}>{j.customer || j.name || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{j.service || j.trade || '—'}</td>
                <td style={{ padding: '12px 16px' }}><span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, background: `${STATUS_COLORS[j.status?.toLowerCase()] || '#6b7280'}20`, color: STATUS_COLORS[j.status?.toLowerCase()] || '#6b7280', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase' }}><StatusDot status={j.status} />{j.status || 'Pending'}</span></td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13, color: '#f59e0b', fontWeight: 700 }}>{f$(j.bid || j.total || 0)}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{fDate(j.date || j.created_at)}</td>
              </tr>
            ))}
            {!jobs.length && <tr><td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No jobs yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AiPanel({ persona }) {
  const [msgs, setMsgs] = useState([{ role: 'ai', text: persona === 'jarvis' ? 'Jarvis online. Ready for business commands — leads, estimates, scheduling.' : "Hi! I'm Angelic. I can draft emails, follow up with leads, and write proposals. What do you need?" }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    const m = input.trim();
    if (!m || loading) return;
    setInput('');
    setMsgs(p => [...p, { role: 'user', text: m }]);
    setLoading(true);
    try {
      const r = await api.jarvisCommand(m, persona === 'jarvis' ? 'JARVIS' : 'ANGELIC', { confirmed: true });
      setMsgs(p => [...p, { role: 'ai', text: r?.text || r?.message || 'No response.' }]);
    } catch {
      try {
        const r2 = await api.publicChat({ message: m, session_id: 'saas-' + Date.now() });
        setMsgs(p => [...p, { role: 'ai', text: r2?.text || r2?.message || 'No response.' }]);
      } catch {
        setMsgs(p => [...p, { role: 'ai', text: 'Connection error. Please try again.' }]);
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
        <span style={{ fontSize: 13, fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{persona === 'jarvis' ? 'Jarvis — Business Mode' : 'Angelic — Customer Comms'}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
            <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{m.role === 'user' ? 'YOU' : persona === 'jarvis' ? 'JARVIS' : 'ANGELIC'}</div>
            <div style={{ maxWidth: '75%', padding: '12px 16px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px', background: m.role === 'user' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)', border: m.role === 'user' ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.text}</div>
          </div>
        ))}
        {loading && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: 'monospace' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Thinking...</div>}
        <div ref={endRef} />
      </div>
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10 }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={persona === 'jarvis' ? 'Ask about leads, pricing, scheduling...' : 'Draft an email, follow up with a client...'} rows={2} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#e2e8f0', padding: '10px 14px', resize: 'none', fontFamily: 'inherit', fontSize: 14, outline: 'none' }} />
        <button onClick={send} disabled={!input.trim() || loading} style={{ padding: '10px 18px', background: input.trim() && !loading ? '#f59e0b' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', color: input.trim() && !loading ? '#000' : 'rgba(255,255,255,0.3)', transition: 'all 0.2s' }}><Send size={18} /></button>
      </div>
    </div>
  );
}

/* ─── Root Export ─────────────────────────────────────────── */
export default function ClientCockpit() {
  const tenant = useTenant();
  const brandLabel = getSaasBrandingLabel(tenant);
  const brandColor = tenant?.primary_color || '#f59e0b';
  const companyName = tenant?.name || 'Your Company';

  const [view, setView] = useState('home');
  const [leads, setLeads] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [aiPersona, setAiPersona] = useState('jarvis');

  useEffect(() => { document.documentElement.style.setProperty('--saas-brand', brandColor); }, [brandColor]);
  useEffect(() => {
    api.entities?.Lead?.list?.().then(setLeads).catch(() => {});
    api.listJobs?.().then(setJobs).catch(() => {});
  }, []);

  const NAV = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users, badge: leads.length || null },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, badge: jobs.filter(j => ['active','in-progress'].includes(j.status?.toLowerCase())).length || null },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#030308', color: '#c9cdd8', fontFamily: "'Inter','Segoe UI',sans-serif", overflow: 'hidden' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Sidebar */}
      <div style={{ width: 220, minWidth: 220, borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
        <div style={{ padding: '20px 12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {tenant?.logo_url && <img src={tenant.logo_url} alt="logo" style={{ height: 32, marginBottom: 8 }} />}
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{companyName}</div>
          {brandLabel && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, letterSpacing: '0.06em' }}>{brandLabel}</div>}
        </div>
        <nav style={{ flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ id, label, icon: Icon, badge }) => {
            const active = view === id;
            return (
              <button key={id} onClick={() => setView(id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', background: active ? `${brandColor}18` : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.45)', fontWeight: active ? 600 : 400, fontSize: 14, transition: 'all 0.15s', borderLeft: active ? `2px solid ${brandColor}` : '2px solid transparent' }}>
                <Icon size={18} color={active ? brandColor : undefined} />
                <span style={{ flex: 1 }}>{label}</span>
                {badge ? <span style={{ background: brandColor, color: '#000', borderRadius: 10, fontSize: 10, fontWeight: 800, padding: '1px 6px', fontFamily: 'monospace' }}>{badge}</span> : null}
              </button>
            );
          })}
        </nav>
        {view === 'ai' && (
          <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'monospace' }}>AI Mode</div>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3 }}>
              {[['jarvis', 'Jarvis'], ['angelic', 'Angelic']].map(([p, l]) => (
                <button key={p} onClick={() => setAiPersona(p)} style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: aiPersona === p ? brandColor : 'transparent', color: aiPersona === p ? '#000' : 'rgba(255,255,255,0.5)', transition: 'all 0.15s' }}>{l}</button>
              ))}
            </div>
          </div>
        )}
        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} /> Systems Online
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{NAV.find(n => n.id === view)?.label}</h1>
          <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.35)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {view === 'home'  && <HomePanel leads={leads} jobs={jobs} />}
          {view === 'leads' && <LeadsPanel leads={leads} />}
          {view === 'jobs'  && <JobsPanel jobs={jobs} />}
          {view === 'ai'    && <AiPanel persona={aiPersona} />}
        </div>
      </div>
    </div>
  );
}
