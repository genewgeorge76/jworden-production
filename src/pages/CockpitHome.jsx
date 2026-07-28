import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import {
  Calculator,
  Camera,
  ClipboardList,
  Users,
  Truck,
  Bot,
  Power,
  ChevronRight,
  Activity,
  TrendingUp,
  Zap,
  AlertCircle,
  Send,
  RotateCw,
  DollarSign,
  BarChart3,
  Target,
  Layers,
} from 'lucide-react'
import SiteFactoryPanel from '@/components/SiteFactoryPanel'
import BlogGeneratorPanel from '@/components/BlogGeneratorPanel'

const BASE = import.meta.env.VITE_API_BASE_URL || 'https://jworden-api.fly.dev'

// ── Helpers ─────────────────────────────────────────────────────────────────

function getGreetingPeriod() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function fmt$(n) {
  if (n == null || isNaN(Number(n))) return '--'
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function fmtNum(n) {
  if (n == null || isNaN(Number(n))) return '--'
  return Number(n).toLocaleString('en-US')
}

function isToday(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function btnStyle(color) {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: '5px 8px',
    background: `${color}22`,
    border: `1px solid ${color}55`,
    borderRadius: 8,
    color: color === '#16a34a' ? '#22c55e' : color === '#2563eb' ? '#60a5fa' : color === '#0891b2' ? '#22d3ee' : color === '#7c3aed' ? '#a78bfa' : '#fbbf24',
    fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
    textDecoration: 'none', letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  }
}

// ── Status Dot ───────────────────────────────────────────────────────────────

function StatusDot({ color }) {
  const colors = {
    green: '#22c55e',
    amber: '#f59e0b',
    red: '#ef4444',
    gray: '#475569',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: colors[color] || colors.gray,
        boxShadow: color === 'green' ? `0 0 6px ${colors.green}80` : 'none',
        flexShrink: 0,
      }}
    />
  )
}

// ── Live Clock ───────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: 13, letterSpacing: '0.08em' }}>
      {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      {'  '}
      <span style={{ color: '#f59e0b', fontWeight: 700 }}>
        {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </span>
  )
}

// ── Autonomy Toggle ──────────────────────────────────────────────────────────

function AutonomyToggle({ autonomyOn, onToggle, loading }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: autonomyOn ? '#16a34a20' : '#1e293b',
        border: `1px solid ${autonomyOn ? '#22c55e50' : '#334155'}`,
        borderRadius: 20,
        padding: '6px 14px',
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.2s',
        color: autonomyOn ? '#22c55e' : '#64748b',
      }}
    >
      <Power size={14} />
      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
        AUTONOMY
      </span>
      <span
        style={{
          width: 32,
          height: 18,
          background: autonomyOn ? '#22c55e' : '#334155',
          borderRadius: 9,
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: autonomyOn ? 14 : 2,
            width: 14,
            height: 14,
            background: 'white',
            borderRadius: '50%',
            transition: 'left 0.2s',
          }}
        />
      </span>
    </button>
  )
}

// ── Navigation Tile ──────────────────────────────────────────────────────────

function NavTile({ to, icon: Icon, label, sublabel, accent, count }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 12,
        background: '#0a0f1e',
        border: '1px solid #1e293b',
        borderRadius: 16,
        padding: '24px 20px',
        textDecoration: 'none',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.border = `1px solid ${accent || '#f59e0b'}40`
        e.currentTarget.style.boxShadow = `0 0 0 1px ${accent || '#f59e0b'}20, 0 4px 24px ${accent || '#f59e0b'}10`
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = '1px solid #1e293b'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Glow accent top-right */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 80, height: 80,
        background: `radial-gradient(circle at 100% 0%, ${accent || '#f59e0b'}15 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: 44, height: 44,
        background: `${accent || '#f59e0b'}15`,
        border: `1px solid ${accent || '#f59e0b'}30`,
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} color={accent || '#f59e0b'} />
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>{label}</span>
          {count != null && count !== '--' && (
            <span style={{
              background: `${accent || '#f59e0b'}20`,
              color: accent || '#f59e0b',
              borderRadius: 20, padding: '1px 8px',
              fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
            }}>{count}</span>
          )}
        </div>
        <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{sublabel}</div>
      </div>

      <ChevronRight size={16} color='#334155' style={{ position: 'absolute', bottom: 16, right: 16 }} />
    </Link>
  )
}

// ── KPI Tile ─────────────────────────────────────────────────────────────────

function KpiTile({ label, value, icon: Icon, color }) {
  return (
    <div style={{
      background: '#0a0f1e',
      border: '1px solid #1e293b',
      borderRadius: 12,
      padding: '16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36,
        background: `${color || '#f59e0b'}15`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={18} color={color || '#f59e0b'} />
      </div>
      <div>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: 'white', lineHeight: 1.2, marginTop: 2 }}>{value}</div>
      </div>
    </div>
  )
}

// ── Morning Briefing Card ─────────────────────────────────────────────────────

function MorningBriefingCard({ briefing, loading }) {
  if (loading) {
    return (
      <div style={{
        background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 16,
        padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <RotateCw size={16} color='#f59e0b' style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: '#64748b', fontSize: 13 }}>Generating morning briefing…</span>
      </div>
    )
  }
  if (!briefing) return null
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #0a0f1e 100%)',
      border: '1px solid #f59e0b30',
      borderRadius: 16,
      padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Zap size={16} color='#f59e0b' />
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#f59e0b', letterSpacing: '0.12em', fontWeight: 700 }}>
          MORNING BRIEFING
        </span>
      </div>
      <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{briefing}</p>
    </div>
  )
}

// ── Quick Jarvis Chat ─────────────────────────────────────────────────────────

function QuickJarvis({ leads }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [thinking, setThinking] = useState(false)
  const sessionId = useRef('cockpit-' + Date.now())
  const bottomRef = useRef(null)

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const send = useCallback(async (text) => {
    const msg = text?.trim() || input.trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg, ts: new Date() }])
    setThinking(true)
    try {
      let reply = null
      try {
        const r = await api.jarvisCommand(msg, 'JARVIS')
        reply = r?.response || r?.reply || r?.message || r?.answer || JSON.stringify(r)
      } catch {
        const r2 = await api.publicChat({ message: msg, session_id: sessionId.current })
        reply = r2?.response || r2?.reply || r2?.message || JSON.stringify(r2)
      }
      setMessages(prev => [...prev, { role: 'jarvis', text: reply || '(no response)', ts: new Date() }])
    } catch {
      setMessages(prev => [...prev, { role: 'jarvis', text: 'Unable to reach Jarvis right now. Try again.', ts: new Date() }])
    } finally {
      setThinking(false)
    }
  }, [input])

  const quickChips = [
    'Give me a morning briefing — what do I need to do today?',
    'Draft a follow-up text for my most recent lead',
    'What should I charge for a 2,000 sqft driveway repave in VA?',
    'Write me a professional estimate email to send a customer',
    'Any Diamond jobs near me worth bidding?',
    'How do I close a warm lead who hasn\'t responded in 3 days?',
  ]

  return (
    <div style={{
      background: '#0a0f1e',
      border: '1px solid #1e293b',
      borderRadius: 16,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid #0f172a',
        background: '#060a14',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, background: '#f59e0b20', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={16} color='#f59e0b' />
          </div>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#f59e0b', letterSpacing: '0.1em' }}>
            JARVIS QUICK CHAT
          </span>
        </div>
        <Link to="/jarvis" style={{
          fontFamily: 'monospace', fontSize: 11, color: '#64748b',
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
        }}>
          Full Jarvis <ChevronRight size={12} />
        </Link>
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div style={{ maxHeight: 220, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
              gap: 8, alignItems: 'flex-start',
            }}>
              <div style={{
                background: m.role === 'user' ? '#f59e0b20' : '#1e293b',
                border: `1px solid ${m.role === 'user' ? '#f59e0b30' : '#334155'}`,
                borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                padding: '8px 12px',
                maxWidth: '80%',
              }}>
                <p style={{ color: m.role === 'user' ? '#fbbf24' : '#e2e8f0', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                  {m.text}
                </p>
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#475569', marginTop: 4, display: 'block' }}>
                  {m.ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {thinking && (
            <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, background: '#f59e0b', borderRadius: '50%',
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Quick chips */}
      {messages.length === 0 && (
        <div style={{ padding: '12px 20px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {quickChips.map(chip => (
            <button
              key={chip}
              type="button"
              onClick={() => send(chip)}
              style={{
                background: '#0f172a', border: '1px solid #1e293b',
                borderRadius: 20, padding: '4px 12px',
                color: '#94a3b8', fontSize: 12, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b50'; e.currentTarget.style.color = '#f59e0b' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#94a3b8' }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 16px',
        borderTop: '1px solid #0f172a',
        background: '#060a14',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Ask Jarvis something quick…"
          style={{
            flex: 1, background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: 10, padding: '8px 14px',
            color: 'white', fontSize: 13, outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="button"
          onClick={() => send()}
          disabled={thinking || !input.trim()}
          style={{
            background: thinking || !input.trim() ? '#1e293b' : '#f59e0b',
            border: 'none', borderRadius: 10,
            width: 38, height: 38,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: thinking || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s', flexShrink: 0,
          }}
        >
          <Send size={15} color={thinking || !input.trim() ? '#475569' : '#000'} />
        </button>
      </div>
    </div>
  )
}

// ── System Health Bar ─────────────────────────────────────────────────────────

function SystemHealthBar() {
  const [statuses, setStatuses] = useState({
    BACKEND: 'gray',
    'AI ENGINE': 'gray',
    LEADS: 'gray',
    EMAIL: 'gray',
    VOICE: 'gray',
    PAYMENTS: 'green',
  })

  const check = useCallback(async () => {
    const next = { ...statuses }

    // BACKEND
    try {
      const r = await fetch(`${BASE}/api/v1/auth/status`, { signal: AbortSignal.timeout(5000) })
      next.BACKEND = r.ok ? 'green' : 'red'
    } catch { next.BACKEND = 'red' }

    // AI ENGINE
    try {
      const r = await fetch(`${BASE}/api/v1/jarvis/status`, { signal: AbortSignal.timeout(5000) })
      next['AI ENGINE'] = r.ok ? 'green' : 'amber'
    } catch { next['AI ENGINE'] = 'red' }

    // LEADS
    try {
      const leads = await api.entities.Lead.list()
      next.LEADS = Array.isArray(leads) ? 'green' : 'amber'
    } catch { next.LEADS = 'red' }

    // EMAIL
    try {
      const r = await fetch(`${BASE}/api/v1/metrics/providers`, { signal: AbortSignal.timeout(5000) })
      if (r.ok) {
        const data = await r.json()
        const emailProvider = Array.isArray(data) ? data.find(p => p.type === 'email') : null
        next.EMAIL = emailProvider ? (emailProvider.status === 'active' ? 'green' : 'amber') : 'amber'
      } else next.EMAIL = 'amber'
    } catch { next.EMAIL = 'amber' }

    // VOICE
    //
    // This used to read VITE_ELEVENLABS_API_KEY, which never controlled voice
    // at all — synthesis happens on the backend. The light therefore showed
    // amber while voice worked fine, and would have shown green only when a
    // key was exposed in the browser bundle. It reported the wrong thing in
    // both directions.
    //
    // Ask the backend what provider it actually has, the same way every other
    // light on this board is derived.
    try {
      const r = await fetch(`${BASE}/api/v1/jarvis/readiness`, { signal: AbortSignal.timeout(5000) })
      if (r.ok) {
        const data = await r.json()
        const provider = data?.providers?.tts_provider
        next.VOICE = provider && provider !== 'none' ? 'green' : 'amber'
      } else next.VOICE = 'amber'
    } catch { next.VOICE = 'red' }

    // PAYMENTS — static green
    next.PAYMENTS = 'green'

    setStatuses(next)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    check()
    const id = setInterval(check, 120_000)
    return () => clearInterval(id)
  }, [check])

  return (
    <div style={{
      height: 36,
      background: '#060a14',
      borderTop: '1px solid #0f172a',
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      paddingLeft: 20,
      paddingRight: 20,
      flexShrink: 0,
    }}>
      {Object.entries(statuses).map(([label, color]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusDot color={color} />
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#475569', letterSpacing: '0.08em' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main CockpitHome ──────────────────────────────────────────────────────────

export default function CockpitHome() {
  const [autonomyOn, setAutonomyOn] = useState(true)
  const [autonomyLoading, setAutonomyLoading] = useState(false)
  const [leads, setLeads] = useState([])
  const [jobs, setJobs] = useState([])
  const [estimates, setEstimates] = useState([])
  const [briefing, setBriefing] = useState(null)
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  const ownerPin = typeof window !== 'undefined'
    ? (window.sessionStorage.getItem('OWNER_TOKEN') || '–')
    : '–'

  // ── Load autonomy state ──────────────────────────────────────────────────
  useEffect(() => {
    api.autonomyStatus()
      .then(s => {
        if (s?.level != null) setAutonomyOn(s.level !== 0)
        else if (s?.frozen != null) setAutonomyOn(!s.frozen)
      })
      .catch(() => {
        api.getAutonomyState()
          .then(s => { if (s?.frozen != null) setAutonomyOn(!s.frozen) })
          .catch(() => {})
      })
  }, [])

  // ── Load KPI data ────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const token = sessionStorage.getItem('OWNER_TOKEN') || localStorage.getItem('owner_token') || ''
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

    const [leadsResult, jobsResult, estimatesResult] = await Promise.allSettled([
      // Use CRM endpoint which has phone, email, address
      fetch(`${BASE}/api/v1/crm/leads?limit=50`, { headers })
        .then(r => r.json())
        .then(d => d.leads || d || []),
      api.listJobs(),
      api.listEstimates(),
    ])
    if (leadsResult.status === 'fulfilled') setLeads(leadsResult.value || [])
    if (jobsResult.status === 'fulfilled') {
      const j = jobsResult.value
      setJobs(Array.isArray(j) ? j : (Array.isArray(j?.jobs) ? j.jobs : []))
    }
    if (estimatesResult.status === 'fulfilled') {
      const e = estimatesResult.value
      setEstimates(Array.isArray(e) ? e : (Array.isArray(e?.estimates) ? e.estimates : []))
    }
    setDataLoaded(true)
  }, [])


  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-refresh every 5 min when autonomy is ON
  useEffect(() => {
    if (!autonomyOn) return
    const id = setInterval(loadData, 300_000)
    return () => clearInterval(id)
  }, [autonomyOn, loadData])

  // ── Morning briefing ─────────────────────────────────────────────────────
  useEffect(() => {
    const BRIEFING_KEY = 'cockpit.briefing.' + new Date().toDateString()
    const cached = typeof window !== 'undefined' ? window.sessionStorage.getItem(BRIEFING_KEY) : null
    if (cached) { setBriefing(cached); return }

    setBriefingLoading(true)
    const leadsCount = leads.length
    const prompt = `Good ${getGreetingPeriod()}! Provide a one-paragraph morning briefing for J. Worden & Sons Asphalt Paving. We have ${leadsCount} leads in the pipeline, autonomy is ${autonomyOn ? 'ON' : 'OFF'}. Summarize what to focus on today — leads to call, any operational priorities, and a motivational note. Keep it under 60 words. Be direct and practical.`

    const run = async () => {
      try {
        let reply = null
        try {
          const r = await api.jarvisCommand(prompt, 'JARVIS')
          reply = r?.response || r?.reply || r?.message
        } catch {
          const r2 = await api.publicChat({ message: prompt, session_id: 'briefing-' + Date.now() })
          reply = r2?.response || r2?.reply || r2?.message
        }
        if (reply) {
          setBriefing(reply)
          if (typeof window !== 'undefined') window.sessionStorage.setItem(BRIEFING_KEY, reply)
        }
      } catch { /* silently skip briefing if AI unavailable */ }
      setBriefingLoading(false)
    }
    run()
  }, [dataLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Autonomy toggle ──────────────────────────────────────────────────────
  const handleAutonomyToggle = async () => {
    setAutonomyLoading(true)
    try {
      if (autonomyOn) {
        await api.freezeAutonomy('manual')
        setAutonomyOn(false)
      } else {
        await api.unfreezeAutonomy()
        setAutonomyOn(true)
      }
    } catch { /* keep current state on error */ }
    setAutonomyLoading(false)
  }

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const leadsToday = leads.filter(l => isToday(l.created_at || l.created_date)).length
  const activeJobs = jobs.filter(j =>
    ['active', 'in_progress', 'in-progress', 'scheduled'].includes(String(j.status).toLowerCase())
  ).length
  const estCount = estimates.length
  const revenueMtd = jobs.reduce((sum, j) => {
    const v = Number(j.total_amount || j.amount || j.revenue || j.value || 0)
    return sum + (isNaN(v) ? 0 : v)
  }, 0)
  const wonEstimates = estimates.filter(e => ['won', 'accepted', 'approved'].includes(String(e.status).toLowerCase()))
  const winRate = estimates.length > 0
    ? Math.round((wonEstimates.length / estimates.length) * 100)
    : null

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050810',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0f1e; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
      `}</style>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header style={{
        height: 56,
        background: '#060a14',
        borderBottom: '1px solid #0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}>
        {/* Left: Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            fontFamily: 'monospace', fontWeight: 700, fontSize: 13,
            color: 'white', letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>
            WORDEN STANDARD
          </span>
          <span style={{
            background: '#f59e0b20', border: '1px solid #f59e0b40',
            borderRadius: 4, padding: '2px 8px',
            fontFamily: 'monospace', fontSize: 10, color: '#f59e0b',
            letterSpacing: '0.1em',
          }}>
            OPS
          </span>
        </div>

        {/* Center: Clock */}
        <LiveClock />

        {/* Right: Autonomy + PIN + Full CC */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AutonomyToggle
            autonomyOn={autonomyOn}
            onToggle={handleAutonomyToggle}
            loading={autonomyLoading}
          />
          {ownerPin !== '–' && (
            <span style={{
              fontFamily: 'monospace', fontSize: 10, color: '#475569',
              background: '#0f172a', border: '1px solid #1e293b',
              borderRadius: 6, padding: '4px 8px',
            }}>
              PIN ✓
            </span>
          )}
          <Link to="/command-center/legacy" style={{
            fontFamily: 'monospace', fontSize: 11, color: '#64748b',
            background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: 8, padding: '5px 12px', textDecoration: 'none',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#334155' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#1e293b' }}
          >
            Full CC
          </Link>
        </div>
      </header>

      {/* ── BODY ────────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Morning Briefing ─────────────────────────────────────────────── */}
          <MorningBriefingCard briefing={briefing} loading={briefingLoading} />

          {/* ── KPI Strip ────────────────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
          }}>
            <KpiTile label="Leads Today" value={dataLoaded ? fmtNum(leadsToday) : '…'} icon={Target} color="#22c55e" />
            <KpiTile label="Revenue MTD" value={dataLoaded ? fmt$(revenueMtd) : '…'} icon={DollarSign} color="#f59e0b" />
            <KpiTile label="Jobs Active" value={dataLoaded ? fmtNum(activeJobs) : '…'} icon={ClipboardList} color="#3b82f6" />
            <KpiTile label="Win Rate" value={winRate != null ? `${winRate}%` : '--'} icon={TrendingUp} color="#a78bfa" />
            <KpiTile label="Estimates" value={dataLoaded ? fmtNum(estCount) : '…'} icon={BarChart3} color="#f97316" />
            <KpiTile label="Total Leads" value={dataLoaded ? fmtNum(leads.length) : '…'} icon={Users} color="#06b6d4" />
          </div>

          {/* ── Autonomy status banner if OFF ────────────────────────────────── */}
          {!autonomyOn && (
            <div style={{
              background: '#1c0a00',
              border: '1px solid #f59e0b50',
              borderRadius: 12,
              padding: '12px 20px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <AlertCircle size={16} color='#f59e0b' />
              <span style={{ color: '#fbbf24', fontSize: 13, fontFamily: 'monospace' }}>
                AUTONOMY IS FROZEN — AI-driven actions are paused. Toggle above to resume.
              </span>
            </div>
          )}

          {/* ── Navigation Tiles ──────────────────────────────────────────────── */}
          <div>
            <div style={{
              fontFamily: 'monospace', fontSize: 10, color: '#475569',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              marginBottom: 12,
            }}>
              OPERATIONS HUB
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}>
              <NavTile
                to="/estimate"
                icon={Calculator}
                label="Estimates"
                sublabel="Build & price jobs"
                accent="#f59e0b"
                count={dataLoaded ? estCount : null}
              />
              <NavTile
                to="/jarvis"
                icon={Bot}
                label="Jarvis AI"
                sublabel="Command center AI"
                accent="#a78bfa"
              />
              <NavTile
                to="/leads"
                icon={Users}
                label="Leads"
                sublabel="CRM pipeline"
                accent="#22c55e"
                count={dataLoaded ? leads.length : null}
              />
              <NavTile
                to="/scanner"
                icon={Camera}
                label="Scanner"
                sublabel="Driveway AI analysis"
                accent="#06b6d4"
              />
              <NavTile
                to="/crew-eta"
                icon={Truck}
                label="Crew"
                sublabel="Dispatch & status"
                accent="#3b82f6"
              />
              <NavTile
                to="/diamond"
                icon={Layers}
                label="Diamond Jobs"
                sublabel="Scraped active & available"
                accent="#ec4899"
              />
              <NavTile
                to="/command-center"
                icon={Activity}
                label="Full CC"
                sublabel="13-tab operations center"
                accent="#f97316"
              />
            </div>
          </div>

          {/* ── Quick Jarvis Chat ─────────────────────────────────────────────── */}
          <QuickJarvis leads={leads} />

          {/* ── System Overview ───────────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}>
            {/* Recent Leads */}
            <div style={{
              background: '#0a0f1e', border: '1px solid #1e293b',
              borderRadius: 16, padding: '16px 20px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  RECENT LEADS
                </span>
                <Link to="/leads" style={{ fontFamily: 'monospace', fontSize: 10, color: '#f59e0b', textDecoration: 'none' }}>
                  View all →
                </Link>
              </div>
              {leads.length === 0 ? (
                <div style={{ color: '#334155', fontSize: 13, fontFamily: 'monospace' }}>
                  {dataLoaded ? 'No leads yet.' : 'Loading…'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {leads.slice(0, 5).map((lead, i) => {
                    const phone = (lead.phone || lead.phone_number || '').replace(/\s/g, '')
                    const email = lead.email || lead.email_address || ''
                    const address = lead.address || lead.project_address || ''
                    const name = lead.name || lead.client_name || 'Unknown'
                    const service = lead.service_type || 'New lead'
                    const sqft = lead.project_size_sqft ? `${lead.project_size_sqft.toLocaleString()} sqft` : ''
                    const jarvisPrompt = `Lead: ${name}, service: ${service}${address ? ', address: ' + address : ''}${sqft ? ', size: ' + sqft : ''}. Draft a short, professional follow-up message to book a free estimate. Make it personal and direct.`
                    const cleanPhone = phone.replace(/\D/g, '')
                    const mapsUrl = address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : null
                    const emailUrl = email ? `mailto:${email}?subject=Your Asphalt Paving Estimate - J. Worden %26 Sons&body=Hi ${encodeURIComponent(name)},%0A%0AThank you for reaching out to J. Worden %26 Sons Asphalt Paving! We received your inquiry about ${service} and would love to schedule a free estimate.%0A%0APlease reply with your availability or call us directly.%0A%0ABest regards,%0AJ. Worden %26 Sons Asphalt Paving` : null
                    const smsUrl = cleanPhone ? `sms:${cleanPhone}?body=Hi ${encodeURIComponent(name)}, this is J. Worden %26 Sons Asphalt Paving. We got your ${service} inquiry — when's a good time for a free estimate?` : null

                    return (
                      <div key={lead.id || i} style={{ padding: '10px 12px', background: '#060a14', border: '1px solid #1e293b', borderRadius: 12 }}>
                        <div style={{ marginBottom: 5 }}>
                          <div style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{name}</div>
                          <div style={{ color: '#94a3b8', fontSize: 11 }}>{service}{sqft ? ` · ${sqft}` : ''}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
                          {phone && <div style={{ color: '#64748b', fontSize: 11, fontFamily: 'monospace' }}>📞 {phone}</div>}
                          {email && <div style={{ color: '#64748b', fontSize: 11, fontFamily: 'monospace' }}>✉️ {email}</div>}
                          {address && <div style={{ color: '#64748b', fontSize: 11 }}>📍 {address}</div>}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {cleanPhone && <a href={`tel:${cleanPhone}`} style={btnStyle('#16a34a')}>📞 Call</a>}
                          {smsUrl && <a href={smsUrl} style={btnStyle('#2563eb')}>💬 Text</a>}
                          {emailUrl && <a href={emailUrl} style={btnStyle('#0891b2')}>✉️ Email</a>}
                          {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" style={btnStyle('#7c3aed')}>🗺 Maps</a>}
                          <button
                            onClick={() => {
                              const el = document.querySelector('input[placeholder*="Jarvis"], textarea[placeholder]')
                              if (el) { el.value = jarvisPrompt; el.dispatchEvent(new Event('input', { bubbles: true })); el.focus() }
                            }}
                            style={{ ...btnStyle('#b45309'), border: '1px solid #b4530955', cursor: 'pointer' }}
                          >🤖 Jarvis</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Active Jobs */}
            <div style={{
              background: '#0a0f1e', border: '1px solid #1e293b',
              borderRadius: 16, padding: '16px 20px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  ACTIVE JOBS
                </span>
                <Link to="/command-center" style={{ fontFamily: 'monospace', fontSize: 10, color: '#3b82f6', textDecoration: 'none' }}>
                  View all →
                </Link>
              </div>
              {jobs.length === 0 ? (
                <div style={{ color: '#334155', fontSize: 13, fontFamily: 'monospace' }}>
                  {dataLoaded ? 'No active jobs.' : 'Loading…'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {jobs.slice(0, 5).map((job, i) => {
                    const statusColors = {
                      complete: '#22c55e', completed: '#22c55e',
                      scheduled: '#f59e0b',
                      in_progress: '#3b82f6', 'in-progress': '#3b82f6', active: '#3b82f6',
                    }
                    const statusColor = statusColors[String(job.status).toLowerCase()] || '#475569'
                    return (
                      <div key={job.id || i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: '#060a14',
                        border: '1px solid #0f172a',
                        borderLeft: `3px solid ${statusColor}`,
                        borderRadius: 8,
                      }}>
                        <div>
                          <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>
                            {job.title || job.client_name || `Job #${job.id?.toString().slice(-4)}`}
                          </div>
                          <div style={{ color: '#64748b', fontSize: 11 }}>
                            {job.address || job.surface_type || job.scheduled_date || ''}
                          </div>
                        </div>
                        <span style={{
                          background: `${statusColor}20`, color: statusColor,
                          borderRadius: 20, padding: '2px 8px',
                          fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
                          textTransform: 'uppercase',
                        }}>
                          {job.status || 'pending'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* ── SaaS Panels ────────────────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginTop: 12,
          }}>
            <SiteFactoryPanel />
            <BlogGeneratorPanel />
          </div>

        </div>
      </main>

      {/* ── STATUS BAR ──────────────────────────────────────────────────────── */}
      <SystemHealthBar />
    </div>
  )
}
