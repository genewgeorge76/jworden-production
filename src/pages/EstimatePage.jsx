import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, request } from '@/api/client'
import {
  Calculator,
  Copy,
  CheckCheck,
  Sparkles,
  RotateCw,
  FileText,
  History,
  ArrowLeft,
  Zap,
  Plus,
} from 'lucide-react'

// ── Pricing Engine (local, no API) ───────────────────────────────────────────

const RATES = {
  'Asphalt Paving':  { Good: 4.50, Fair: 5.50, Poor: 7.00, Failed: 9.00 },
  'Sealcoating':     { Good: 0.35, Fair: 0.45, Poor: 0.60, Failed: 0.75 },
  'Crack Repair':    { Good: 2.00, Fair: 3.00, Poor: 4.50, Failed: 6.00 },
  'Milling':         { Good: 2.50, Fair: 3.50, Poor: 5.00, Failed: 6.50 },
  'Concrete':        { Good: 8.00, Fair: 10.00, Poor: 13.00, Failed: 16.00 },
}

const SERVICES = Object.keys(RATES)
const CONDITIONS = ['Good', 'Fair', 'Poor', 'Failed']

const CONDITION_DESC = {
  Good: 'Solid surface, minor cracks only',
  Fair: 'Moderate cracking, some patching needed',
  Poor: 'Heavy cracking, potholes forming',
  Failed: 'Base failure, full reconstruction needed',
}

const CONDITION_COLORS = {
  Good: '#22c55e',
  Fair: '#f59e0b',
  Poor: '#facc15',
  Failed: '#ef4444',
}

const MOBILIZATION = 450

function calcEstimate(sqft, service, condition, marginMultiplier = 1.25) {
  const rate = RATES[service]?.[condition]
  if (!rate || !sqft) return null
  const base = sqft * rate
  const subtotal = base + MOBILIZATION
  const margin = subtotal * (marginMultiplier - 1.0)
  const total = subtotal + margin
  return { base, mobilization: MOBILIZATION, subtotal, margin, total, rate, marginMultiplier }
}

function fmt$(n) {
  if (!n && n !== 0) return '--'
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatEstimateText(sqft, service, condition, calc, notes) {
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  return `J. WORDEN & SONS ASPHALT PAVING — ESTIMATE
Date: ${now}

Service: ${service}
Surface Condition: ${condition}
Square Footage: ${Number(sqft).toLocaleString()} sqft

LINE ITEMS:
  Base Material + Labor (${sqft.toLocaleString()} sqft × ${fmt$(calc.rate)}/sqft): ${fmt$(calc.base)}
  Mobilization:                                                                       ${fmt$(calc.mobilization)}
  Subtotal:                                                                           ${fmt$(calc.subtotal)}
  Contractor Margin (${Math.round((calc.marginMultiplier - 1.0) * 100)}%):                                                            ${fmt$(calc.margin)}
  ─────────────────────────────────────────────────────
  TOTAL ESTIMATE:                                                                     ${fmt$(calc.total)}

${notes ? `Notes: ${notes}` : ''}

This estimate is valid for 30 days. Pricing subject to site inspection.
Contact: J. Worden & Sons — (804) 372-0587`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ServiceCard({ service, selected, onClick }) {
  const icons = {
    'Asphalt Paving': '🛣️',
    'Sealcoating': '🪣',
    'Crack Repair': '🔧',
    'Milling': '⚙️',
    'Concrete': '🏗️',
  }
  return (
    <button
      type="button"
      onClick={() => onClick(service)}
      style={{
        background: selected ? '#f59e0b15' : '#0a0f1e',
        border: `2px solid ${selected ? '#f59e0b' : '#1e293b'}`,
        borderRadius: 12,
        padding: '16px 12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        textAlign: 'center',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = '#f59e0b50' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = '#1e293b' }}
    >
      <span style={{ fontSize: 24 }}>{icons[service]}</span>
      <span style={{ color: selected ? '#f59e0b' : '#94a3b8', fontSize: 12, fontWeight: 600 }}>
        {service}
      </span>
    </button>
  )
}

function ConditionCard({ condition, selected, onClick }) {
  const color = CONDITION_COLORS[condition]
  return (
    <button
      type="button"
      onClick={() => onClick(condition)}
      style={{
        background: selected ? `${color}15` : '#0a0f1e',
        border: `2px solid ${selected ? color : '#1e293b'}`,
        borderRadius: 12,
        padding: '12px 10px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'left',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = `${color}50` }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = '#1e293b' }}
    >
      <div style={{ color: selected ? color : '#94a3b8', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
        {condition}
      </div>
      <div style={{ color: '#475569', fontSize: 11, lineHeight: 1.4 }}>{CONDITION_DESC[condition]}</div>
    </button>
  )
}

function LineItem({ label, value, bold, accent, top }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderTop: top ? '1px solid #1e293b' : 'none',
    }}>
      <span style={{
        fontFamily: 'monospace', fontSize: bold ? 13 : 12,
        color: bold ? '#e2e8f0' : '#64748b',
        fontWeight: bold ? 700 : 400,
      }}>{label}</span>
      <span style={{
        fontFamily: 'monospace', fontSize: bold ? 15 : 13,
        color: accent || (bold ? '#f59e0b' : 'white'),
        fontWeight: bold ? 700 : 500,
      }}>{value}</span>
    </div>
  )
}

function HistoryPanel({ history }) {
  if (history.length === 0) return null
  return (
    <div style={{
      background: '#0a0f1e', border: '1px solid #1e293b',
      borderRadius: 16, padding: '20px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
      }}>
        <History size={16} color='#64748b' />
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569', letterSpacing: '0.12em' }}>
          RECENT ESTIMATES
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {history.slice(0, 10).map((h, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px',
            background: '#060a14', border: '1px solid #0f172a',
            borderRadius: 10,
          }}>
            <div>
              <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>
                {h.service} — {Number(h.sqft).toLocaleString()} sqft
              </div>
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                {h.condition} condition • {new Date(h.createdAt).toLocaleDateString()}
              </div>
            </div>
            <span style={{
              fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#f59e0b',
            }}>{fmt$(h.total)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── AI Parse Modal ────────────────────────────────────────────────────────────

function AiParsePanel({ onParsed }) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const parseNotes = async () => {
    if (!notes.trim()) return
    setLoading(true)
    setError(null)
    const prompt = `Extract estimate parameters from these field notes. Return a JSON object with ONLY these fields:
{
  "sqft": number (square footage, integer),
  "service": one of ["Asphalt Paving", "Sealcoating", "Crack Repair", "Milling", "Concrete"],
  "condition": one of ["Good", "Fair", "Poor", "Failed"],
  "notes": string (any remaining relevant notes)
}
Field notes: "${notes}"
Respond with ONLY the JSON, no other text.`
    try {
      let reply = null
      try {
        const r = await api.jarvisCommand(prompt, 'JARVIS')
        reply = r?.response || r?.reply || r?.message
      } catch {
        const r2 = await api.publicChat({ message: prompt, session_id: 'parse-' + Date.now() })
        reply = r2?.response || r2?.reply || r2?.message
      }
      if (reply) {
        const jsonMatch = reply.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          onParsed(parsed)
          setNotes('')
        } else {
          throw new Error('Could not extract JSON from AI response')
        }
      }
    } catch (err) {
      setError(err.message || 'AI parsing failed. Enter values manually.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      background: '#060a14', border: '1px solid #a78bfa30',
      borderRadius: 12, padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Sparkles size={14} color='#a78bfa' />
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#a78bfa', letterSpacing: '0.1em' }}>
          PARSE WITH AI
        </span>
      </div>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Paste field notes here... e.g. 'Residential driveway about 2400 sqft, major cracking throughout, needs full replacement'"
        style={{
          width: '100%', minHeight: 80,
          background: '#0a0f1e', border: '1px solid #1e293b',
          borderRadius: 8, padding: '10px 12px',
          color: 'white', fontSize: 13,
          resize: 'vertical', outline: 'none', fontFamily: 'inherit',
        }}
      />
      {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{error}</p>}
      <button
        type="button"
        onClick={parseNotes}
        disabled={loading || !notes.trim()}
        style={{
          marginTop: 10,
          background: loading || !notes.trim() ? '#1e293b' : '#a78bfa',
          border: 'none', borderRadius: 8,
          padding: '8px 16px',
          color: loading || !notes.trim() ? '#475569' : '#0a0f1e',
          fontSize: 13, fontWeight: 700,
          cursor: loading || !notes.trim() ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        {loading ? <><RotateCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Parsing…</> : <><Sparkles size={14} /> Parse Notes</>}
      </button>
    </div>
  )
}

// ── Main EstimatePage ─────────────────────────────────────────────────────────

export default function EstimatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Form state — pre-fill from URL params (set by ScannerPage)
  const [sqft, setSqft] = useState(() => searchParams.get('sqft') || '')
  const [service, setService] = useState(() => {
    const s = searchParams.get('service')
    return s && SERVICES.includes(s) ? s : 'Asphalt Paving'
  })
  const [condition, setCondition] = useState(() => {
    const c = searchParams.get('condition')
    return c && CONDITIONS.includes(c) ? c : 'Fair'
  })
  
  const [lat] = useState(() => searchParams.get('lat') || '')
  const [lng] = useState(() => searchParams.get('lng') || '')

  const [notes, setNotes] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  // UI state
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [history, setHistory] = useState([])
  
  // Portal link and Custom Deposit Overrides
  const [customTotal, setCustomTotal] = useState('')
  const [customDeposit, setCustomDeposit] = useState('')
  const [portalLink, setPortalLink] = useState('')

  // Load estimate history from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('cockpit.estimates') || '[]'
      setHistory(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  // Arbitrage Engine
  const [arbitrageData, setArbitrageData] = useState(null)
  useEffect(() => {
    if (!service) return
    const fetchArbitrage = async () => {
      try {
        const sqftVal = parseInt(sqft, 10) || 0
        const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/v1/supply-chain/arbitrage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service, sqft: sqftVal, condition, zip_code: '23219' })
        })
        const data = await res.json()
        if (data.recommended_multiplier) {
          setArbitrageData(data)
        }
      } catch (e) {
        console.error("Arbitrage engine error", e)
      }
    }
    const t = setTimeout(fetchArbitrage, 500) // Debounce
    return () => clearTimeout(t)
  }, [service, sqft, condition])

  // Calc
  const sqftNum = parseInt(sqft, 10) || 0
  const marginMultiplier = arbitrageData?.recommended_multiplier || 1.25
  const calc = sqftNum >= 1 ? calcEstimate(sqftNum, service, condition, marginMultiplier) : null

  // Handle AI parse
  const handleParsed = useCallback((parsed) => {
    if (parsed.sqft) setSqft(String(parsed.sqft))
    if (parsed.service && SERVICES.includes(parsed.service)) setService(parsed.service)
    if (parsed.condition && CONDITIONS.includes(parsed.condition)) setCondition(parsed.condition)
    if (parsed.notes) setNotes(parsed.notes)
  }, [])

  // Copy estimate
  const handleCopy = () => {
    if (!calc) return
    const text = formatEstimateText(sqftNum, service, condition, calc, notes)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  // Save as lead
  const handleSaveLead = async () => {
    if (!calc) return
    setSaving(true)
    try {
      const finalTotal = customTotal ? parseFloat(customTotal) : calc.total
      const finalDeposit = customDeposit ? parseFloat(customDeposit) : finalTotal * 0.30

      const payload = {
        name: customerName || 'Cockpit Estimate',
        email: customerEmail || '',
        phone: customerPhone || '',
        service_type: service,
        property_type: 'residential',
        urgency: 'within_2_weeks',
        project_size_sqft: sqftNum,
        notes: `Condition: ${condition}. ${notes || ''}`.trim(),
        estimated_total: finalTotal,
        geo_lat: lat ? parseFloat(lat) : null,
        geo_lng: lng ? parseFloat(lng) : null,
      }
      await api.entities.Lead.create(payload)

      // Also create the Estimate Portal instance
      // Two things were wrong with this call and it had never succeeded.
      //
      // The path was /api/v1/portal/estimates/internal. The router is mounted
      // at /portal, so that path does not exist and every request 404'd —
      // estData.public_token was always undefined and the portal link was
      // never generated.
      //
      // It also used a bare fetch() with only Content-Type, sending no
      // credentials, while the endpoint now requires authentication. request()
      // attaches the bearer and owner tokens the rest of the app uses.
      const estData = await request('POST', '/portal/estimates/internal', {
          customer_name: customerName || 'Cockpit Estimate',
          customer_email: customerEmail || '',
          service_type: service,
          scope_summary: `Square Footage: ${sqftNum}\nCondition: ${condition}\n${notes || ''}`,
          total_amount: finalTotal,
          deposit_amount: finalDeposit
      })
      if (estData?.public_token) {
          setPortalLink(`${window.location.origin}/portal/${estData.public_token}`)
      }

      // Save to local history
      const entry = {
        sqft: sqftNum, service, condition, notes,
        total: finalTotal, createdAt: new Date().toISOString(),
        customer: customerName,
      }
      const newHistory = [entry, ...history].slice(0, 20)
      setHistory(newHistory)
      window.localStorage.setItem('cockpit.estimates', JSON.stringify(newHistory))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Save lead failed:', err)
      // Still save locally
      const entry = {
        sqft: sqftNum, service, condition, notes,
        total: calc.total, createdAt: new Date().toISOString(),
        customer: customerName,
      }
      const newHistory = [entry, ...history].slice(0, 20)
      setHistory(newHistory)
      window.localStorage.setItem('cockpit.estimates', JSON.stringify(newHistory))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050810',
      color: 'white',
    }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0f1e; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #f59e0b50 !important; }
      `}</style>

      {/* Header */}
      <header style={{
        height: 56, background: '#060a14',
        borderBottom: '1px solid #0f172a',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/command-center" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: '#64748b', textDecoration: 'none', fontSize: 13,
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <ArrowLeft size={16} /> Cockpit
          </Link>
          <span style={{ color: '#1e293b' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator size={16} color='#f59e0b' />
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'white', letterSpacing: '0.15em' }}>
              ESTIMATE BUILDER
            </span>
          </div>
        </div>
        {calc && (
          <div style={{
            background: '#f59e0b20', border: '1px solid #f59e0b40',
            borderRadius: 8, padding: '6px 14px',
            fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#f59e0b',
          }}>
            {fmt$(calc.total)}
          </div>
        )}
      </header>

      {/* Body */}
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '32px 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: 24,
        alignItems: 'start',
      }}>

        {/* ── LEFT: Form ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* AI Parse */}
          <AiParsePanel onParsed={handleParsed} />

          {/* Square Footage */}
          <div style={{
            background: '#0a0f1e', border: '1px solid #1e293b',
            borderRadius: 16, padding: '24px',
          }}>
            <label style={{
              display: 'block', fontFamily: 'monospace', fontSize: 11,
              color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16,
            }}>
              SQUARE FOOTAGE
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <input
                type="number"
                value={sqft}
                onChange={e => setSqft(e.target.value)}
                placeholder="0"
                min="0"
                style={{
                  width: 140, background: '#060a14',
                  border: '1px solid #1e293b', borderRadius: 10,
                  padding: '12px 16px', color: 'white',
                  fontSize: 24, fontFamily: 'monospace', fontWeight: 700,
                  textAlign: 'center',
                }}
              />
              <div style={{ flex: 1 }}>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="50"
                  value={sqft || 0}
                  onChange={e => setSqft(e.target.value)}
                  style={{ width: '100%', accentColor: '#f59e0b' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#334155' }}>100</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#334155' }}>10,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Type */}
          <div style={{
            background: '#0a0f1e', border: '1px solid #1e293b',
            borderRadius: 16, padding: '24px',
          }}>
            <label style={{
              display: 'block', fontFamily: 'monospace', fontSize: 11,
              color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16,
            }}>
              SERVICE TYPE
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 8,
            }}>
              {SERVICES.map(s => (
                <ServiceCard key={s} service={s} selected={service === s} onClick={setService} />
              ))}
            </div>
          </div>

          {/* Surface Condition */}
          <div style={{
            background: '#0a0f1e', border: '1px solid #1e293b',
            borderRadius: 16, padding: '24px',
          }}>
            <label style={{
              display: 'block', fontFamily: 'monospace', fontSize: 11,
              color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16,
            }}>
              SURFACE CONDITION
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {CONDITIONS.map(c => (
                <ConditionCard key={c} condition={c} selected={condition === c} onClick={setCondition} />
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div style={{
            background: '#0a0f1e', border: '1px solid #1e293b',
            borderRadius: 16, padding: '24px',
          }}>
            <label style={{
              display: 'block', fontFamily: 'monospace', fontSize: 11,
              color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16,
            }}>
              CUSTOMER (optional)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Name', value: customerName, setter: setCustomerName, placeholder: 'John Smith' },
                { label: 'Email', value: customerEmail, setter: setCustomerEmail, placeholder: 'john@email.com' },
                { label: 'Phone', value: customerPhone, setter: setCustomerPhone, placeholder: '(804) 555-0100' },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label}>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#475569', marginBottom: 6, letterSpacing: '0.1em' }}>
                    {label.toUpperCase()}
                  </div>
                  <input
                    type="text"
                    value={value}
                    onChange={e => setter(e.target.value)}
                    placeholder={placeholder}
                    style={{
                      width: '100%', background: '#060a14',
                      border: '1px solid #1e293b', borderRadius: 8,
                      padding: '8px 12px', color: 'white', fontSize: 13,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{
            background: '#0a0f1e', border: '1px solid #1e293b',
            borderRadius: 16, padding: '24px',
          }}>
            <label style={{
              display: 'block', fontFamily: 'monospace', fontSize: 11,
              color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12,
            }}>
              SITE NOTES
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional notes, special conditions, access issues, materials preferences…"
              style={{
                width: '100%', minHeight: 100,
                background: '#060a14', border: '1px solid #1e293b',
                borderRadius: 8, padding: '12px 14px',
                color: 'white', fontSize: 13,
                resize: 'vertical', fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* ── RIGHT: Pricing Preview ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>

          {/* Estimate Card */}
          <div style={{
            background: '#0a0f1e', border: '1px solid #1e293b',
            borderRadius: 16, overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              background: '#060a14',
              padding: '16px 20px',
              borderBottom: '1px solid #0f172a',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <FileText size={16} color='#f59e0b' />
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#f59e0b', letterSpacing: '0.12em', fontWeight: 700 }}>
                  ESTIMATE PREVIEW
                </span>
              </div>
              <div style={{ color: '#475569', fontSize: 12 }}>J. Worden & Sons Asphalt Paving</div>
            </div>

            {/* Summary */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #0f172a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#64748b', fontSize: 12 }}>Service</span>
                <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>{service}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#64748b', fontSize: 12 }}>Condition</span>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: CONDITION_COLORS[condition],
                }}>{condition}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: 12 }}>Square Footage</span>
                <span style={{ color: 'white', fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                  {sqftNum > 0 ? sqftNum.toLocaleString() + ' sqft' : '--'}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div style={{ padding: '16px 20px' }}>
              {calc ? (
                <>
                  <LineItem
                    label={`Base (${sqftNum.toLocaleString()} × ${fmt$(calc.rate)}/sqft)`}
                    value={fmt$(calc.base)}
                  />
                  <LineItem label="Mobilization" value={fmt$(calc.mobilization)} />
                  <LineItem label="Subtotal" value={fmt$(calc.subtotal)} top />
                  <LineItem label={`Margin (${Math.round((calc.marginMultiplier - 1.0) * 100)}%)`} value={fmt$(calc.margin)} />
                  
                  {arbitrageData && (
                    <div style={{ marginTop: 8, padding: '10px 12px', background: '#3b82f615', border: '1px solid #3b82f640', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Zap size={12} color='#3b82f6' />
                        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#3b82f6', letterSpacing: '0.05em', fontWeight: 700 }}>
                          SUPPLY CHAIN ARBITRAGE ENGINE
                        </span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.4 }}>
                        <strong>{arbitrageData.market_condition}:</strong> {arbitrageData.rationale}
                      </div>
                    </div>
                  )}

                  <div style={{ margin: '12px 0 0', padding: '14px 16px', background: '#060a14', borderRadius: 10, border: '1px solid #f59e0b30' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#e2e8f0', fontWeight: 700, letterSpacing: '0.05em' }}>
                        CALCULATED TOTAL
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>
                        {fmt$(calc.total)}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4, fontFamily: 'monospace' }}>CUSTOM TOTAL (Optional Override)</label>
                          <input 
                              type="number" 
                              value={customTotal} 
                              onChange={e => setCustomTotal(e.target.value)} 
                              placeholder={calc.total.toString()}
                              style={{ width: '100%', background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 6, padding: '8px 12px', color: 'white', fontFamily: 'monospace' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4, fontFamily: 'monospace' }}>DEPOSIT AMOUNT (Default: 30%)</label>
                          <input 
                              type="number" 
                              value={customDeposit} 
                              onChange={e => setCustomDeposit(e.target.value)} 
                              placeholder={(calc.total * 0.3).toString()}
                              style={{ width: '100%', background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 6, padding: '8px 12px', color: 'white', fontFamily: 'monospace' }}
                          />
                        </div>
                    </div>
                    
                    <div style={{ color: '#475569', fontSize: 11, marginTop: 12, textAlign: 'center' }}>
                      Rate: {fmt$(calc.rate)}/sqft • Margin: {Math.round((calc.marginMultiplier - 1.0) * 100)}%
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#334155' }}>
                  <Calculator size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <div style={{ fontFamily: 'monospace', fontSize: 12 }}>Enter square footage to see estimate</div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {calc && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {portalLink ? (
                  <div style={{ background: '#16a34a15', border: '1px solid #16a34a50', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                      <CheckCheck size={24} color="#16a34a" style={{ margin: '0 auto 8px' }} />
                      <div style={{ color: '#22c55e', fontWeight: 700, marginBottom: 8 }}>Estimate Saved & Portal Created!</div>
                      <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>Copy the link below and send it to the customer.</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                          <input 
                              type="text" 
                              readOnly 
                              value={portalLink} 
                              style={{ flex: 1, background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 12px', color: '#60a5fa', fontFamily: 'monospace', fontSize: 11 }}
                          />
                          <button
                              type="button"
                              onClick={() => {
                                  navigator.clipboard.writeText(portalLink)
                                  setCopied(true)
                                  setTimeout(() => setCopied(false), 2000)
                              }}
                              style={{ background: '#3b82f6', border: 'none', borderRadius: 8, padding: '0 16px', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                          >
                              {copied ? 'Copied' : 'Copy'}
                          </button>
                      </div>
                      <button type="button" onClick={() => setPortalLink('')} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: 12, marginTop: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                          Create Another
                      </button>
                  </div>
              ) : (
                  <button
                    type="button"
                    onClick={handleSaveLead}
                    disabled={saving}
                    style={{
                      background: saveSuccess ? '#16a34a' : '#22c55e',
                      border: 'none', borderRadius: 12,
                      padding: '14px', color: '#000',
                      fontWeight: 700, fontSize: 14,
                      cursor: saving ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 0.2s',
                    }}
                  >
                    {saveSuccess ? <><CheckCheck size={16} /> Saved!</> :
                      saving ? <><RotateCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> :
                        <><Plus size={16} /> Save as Lead & Generate Link</>}
                  </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                style={{
                  background: copied ? '#1e3a5f' : '#0f172a',
                  border: `1px solid ${copied ? '#3b82f6' : '#1e293b'}`,
                  borderRadius: 12, padding: '12px',
                  color: copied ? '#60a5fa' : '#94a3b8',
                  fontWeight: 600, fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                {copied ? <><CheckCheck size={16} /> Copied!</> : <><Copy size={16} /> Copy Estimate</>}
              </button>
            </div>
          )}

          {/* Rate Reference */}
          <div style={{
            background: '#0a0f1e', border: '1px solid #1e293b',
            borderRadius: 12, padding: '14px 16px',
          }}>
            <div style={{
              fontFamily: 'monospace', fontSize: 10, color: '#475569',
              letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10,
            }}>
              RATE REFERENCE
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ color: '#475569', fontSize: 10, fontFamily: 'monospace', textAlign: 'left', paddingBottom: 6 }}>Service</th>
                  {CONDITIONS.map(c => (
                    <th key={c} style={{
                      color: CONDITION_COLORS[c], fontSize: 10,
                      fontFamily: 'monospace', textAlign: 'right', paddingBottom: 6,
                    }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SERVICES.map(s => (
                  <tr key={s}>
                    <td style={{ color: '#64748b', fontSize: 10, padding: '3px 0', fontFamily: 'monospace' }}>
                      {s.split(' ')[0]}
                    </td>
                    {CONDITIONS.map(c => (
                      <td key={c} style={{
                        color: service === s && condition === c ? '#f59e0b' : '#334155',
                        fontSize: 10, textAlign: 'right', fontFamily: 'monospace',
                        fontWeight: service === s && condition === c ? 700 : 400,
                      }}>
                        ${RATES[s][c]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* History */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 40px' }}>
        <HistoryPanel history={history} />
      </div>
    </div>
  )
}
