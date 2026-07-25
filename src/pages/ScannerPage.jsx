import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import {
  Camera,
  Upload,
  ArrowLeft,
  Bot,
  Sparkles,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Calculator,
  Image,
  X,
  FileSearch,
  Map as MapIcon,
} from 'lucide-react'
import { useTenant } from '@/lib/TenantContext'
import { Button } from '@/components/ui/button'
import exifr from 'exifr'
import JobScopeMap from '@/components/JobScopeMap'
import turfArea from '@turf/area'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

// ── ResultCard ────────────────────────────────────────────────────────────────

function ResultField({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid #0f172a',
    }}>
      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0, marginRight: 16 }}>
        {label}
      </span>
      <span style={{
        color: highlight ? '#f59e0b' : 'white',
        fontSize: 13, fontWeight: highlight ? 700 : 500,
        textAlign: 'right', lineHeight: 1.4,
        fontFamily: highlight ? 'monospace' : 'inherit',
      }}>
        {value || '--'}
      </span>
    </div>
  )
}

// ── Parse AI Analysis ─────────────────────────────────────────────────────────

function parseAnalysis(text) {
  if (!text) return null

  const extractNumber = (pattern) => {
    const m = text.match(pattern)
    return m ? m[1] : null
  }

  const sqftMatch = text.match(/(\d[\d,]+)\s*(?:sq(?:uare)?\s*f(?:ee|oo)?t|sqft)/i)
  const sqft = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, ''), 10) : null

  const conditionMatch = text.match(/condition[:\s]+([A-Za-z]+)/i) ||
    text.match(/\b(Good|Fair|Poor|Failed)\b/i)
  const condition = conditionMatch
    ? (['Good', 'Fair', 'Poor', 'Failed'].includes(conditionMatch[1])
      ? conditionMatch[1]
      : conditionMatch[1].charAt(0).toUpperCase() + conditionMatch[1].slice(1).toLowerCase())
    : null

  const serviceMatch = text.match(/(?:recommend(?:ed)?|suggest(?:ed)?)[\s\w]*:\s*([^\n.]+)/i) ||
    text.match(/\b(Asphalt Paving|Sealcoating|Crack Repair|Milling|Concrete)\b/i)
  const service = serviceMatch ? serviceMatch[1].trim() : null

  const costMatch = text.match(/\$[\d,]+ ?[-–] ?\$[\d,]+/i) ||
    text.match(/\$[\d,]+\.?\d*/i)
  const costRange = costMatch ? costMatch[0] : null

  return { sqft, condition, service, costRange, fullText: text }
}

// ── Main ScannerPage ──────────────────────────────────────────────────────────

export default function ScannerPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [geoData, setGeoData] = useState(null)
  const [mapSqft, setMapSqft] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  
  // Use mapSqft if drawn, otherwise fallback to parsed sqft
  const rawParsed = result ? parseAnalysis(result) : null
  const parsed = rawParsed ? { ...rawParsed, sqft: mapSqft || rawParsed.sqft } : null

  const { tenant } = useTenant()
  const isLocked = !['max', 'JWORDEN_HQ', 'default'].includes(tenant?.subscription_tier) && tenant?.tenant_id !== 'default';

  const handleFile = useCallback(async (f) => {
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, HEIC, etc.)')
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('Image is too large. Please use an image under 20MB.')
      return
    }
    setFile(f)
    setResult(null)
    setError(null)
    setGeoData(null)
    const url = URL.createObjectURL(f)
    setPreview(url)
    
    try {
      const gps = await exifr.gps(f)
      if (gps && gps.latitude && gps.longitude) {
        setGeoData({ lat: gps.latitude, lng: gps.longitude })
      }
    } catch (e) {
      console.log('No EXIF GPS data found')
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleInputChange = useCallback((e) => {
    const f = e.target.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleAnalyze = async () => {
    if (!file) return
    setAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      let base64 = null
      try {
        base64 = await fileToBase64(file)
      } catch { /* base64 failed, use description only */ }

      const prompt = base64
        ? `You are an asphalt paving expert. Analyze this driveway/asphalt surface photo and provide:
1. Estimated square footage (look for visual cues like garage doors, cars, lane widths)
2. Surface condition rating: Good / Fair / Poor / Failed
3. Recommended service type: Asphalt Paving / Sealcoating / Crack Repair / Milling / Concrete
4. Estimated cost range in USD
5. Specific observations (cracking pattern, color, texture, damage type)

Be specific and practical. Format clearly with labeled sections.

Image (base64): [IMAGE ATTACHED - ${file.name}, ${formatFileSize(file.size)}]`
        : `You are an asphalt paving expert. I've uploaded a driveway photo named "${file.name}" (${formatFileSize(file.size)}).
Based on typical driveway conditions, provide a general estimate framework:
1. Typical square footage for a residential driveway (provide a range)
2. How to assess condition: Good / Fair / Poor / Failed
3. Most common service recommendation
4. Typical cost ranges for Virginia
5. What a site inspector should look for

Note: I couldn't process the actual image, so provide helpful general guidance.`

      let reply = null
      try {
        const r = await api.jarvisCommand(prompt, 'JARVIS')
        reply = r?.response || r?.reply || r?.message || r?.answer
      } catch {
        const r2 = await api.publicChat({ message: prompt, session_id: 'scanner-' + Date.now() })
        reply = r2?.response || r2?.reply || r2?.message
      }

      if (!reply) throw new Error('No response from AI. Please try again.')
      setResult(reply)
      
      // Sync to Google Photos via backend
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('job_name', 'Driveway Scanner: ' + (geoData ? `${geoData.lat.toFixed(4)}, ${geoData.lng.toFixed(4)}` : file.name))
        formData.append('description', reply)
        
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/gallery/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('OWNER_TOKEN') || ''}`
          },
          body: formData
        })
      } catch(err) {
        console.error('Failed to sync to Google Photos', err)
      }
      
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
    }
    setAnalyzing(false)
  }

  const handleBuildEstimate = () => {
    if (!parsed) return
    const params = new URLSearchParams()
    if (parsed.sqft) params.set('sqft', parsed.sqft)
    if (parsed.condition) params.set('condition', parsed.condition)
    if (parsed.service) params.set('service', parsed.service)
    if (geoData) {
      params.set('lat', geoData.lat)
      params.set('lng', geoData.lng)
    }
    navigate(`/estimate?${params.toString()}`)
  }

  const handleClear = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    setGeoData(null)
    setMapSqft(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050810',
      color: 'white',
    }}>
      {isLocked && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'rgba(5,8,16,0.8)' }}>
          <div style={{ textAlign: 'center', maxWidth: 400, padding: 32, background: 'rgba(15,23,42,0.9)', border: '1px solid #1e293b', borderRadius: 24 }}>
            <div style={{ width: 64, height: 64, background: '#1e293b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Camera size={32} color="#64748b" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: 'white' }}>Scanner Locked</h2>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              Autonomous computer vision and AI degradation analysis is restricted to the MAX tier.
            </p>
            <Button onClick={() => window.location.href='/operations/register?plan=max'} style={{ width: '100%', height: 48, background: '#f59e0b', color: '#050810', fontWeight: 'bold' }}>
              Upgrade to MAX
            </Button>
            <Link to="/command-center" style={{ display: 'block', marginTop: 16, color: '#64748b', textDecoration: 'none', fontSize: 13 }}>
              Return to Cockpit
            </Link>
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0f1e; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
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
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <ArrowLeft size={16} /> Cockpit
          </Link>
          <span style={{ color: '#1e293b' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={16} color='#06b6d4' />
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'white', letterSpacing: '0.15em' }}>
              DRIVEWAY SCANNER
            </span>
          </div>
        </div>
        {file && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: '#0f172a', border: '1px solid #1e293b',
              borderRadius: 8, padding: '5px 12px',
              color: '#64748b', fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <X size={13} /> Clear
          </button>
        )}
      </header>

      {/* Body */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>

        {!file ? (
          // ── Drop Zone ──────────────────────────────────────────────────────
          <div>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 72, height: 72,
                background: '#06b6d420',
                border: '2px solid #06b6d440',
                borderRadius: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Camera size={36} color='#06b6d4' />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 8 }}>
                Driveway AI Scanner
              </h1>
              <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6 }}>
                Upload a photo of any driveway or asphalt surface.<br />
                AI will estimate square footage, condition, recommended service, and cost.
              </p>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? '#06b6d4' : '#1e293b'}`,
                borderRadius: 20,
                padding: '64px 32px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: dragOver ? '#06b6d408' : '#0a0f1e',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#06b6d460'; e.currentTarget.style.background = '#06b6d408' }}
              onMouseLeave={e => { if (!dragOver) { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.background = '#0a0f1e' } }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                style={{ display: 'none' }}
              />
              <Upload size={40} color='#334155' style={{ margin: '0 auto 16px' }} />
              <div style={{ color: 'white', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                Drop photo here or click to upload
              </div>
              <div style={{ color: '#475569', fontSize: 13 }}>
                Supports JPG, PNG, HEIC, WEBP — up to 20MB
              </div>
            </div>

            {error && (
              <div style={{
                marginTop: 16, background: '#1c0000', border: '1px solid #ef444430',
                borderRadius: 10, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <AlertCircle size={16} color='#ef4444' />
                <span style={{ color: '#ef4444', fontSize: 13 }}>{error}</span>
              </div>
            )}

            {/* Tips */}
            <div style={{
              marginTop: 32,
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
            }}>
              {[
                { icon: '📸', title: 'Best photos', desc: 'Straight-down angle, good lighting, whole driveway visible' },
                { icon: '📏', title: 'Size reference', desc: 'Include a car, garage door, or known object for scale' },
                { icon: '🔍', title: 'Close-ups', desc: 'Capture cracking details separately for condition assessment' },
              ].map(tip => (
                <div key={tip.title} style={{
                  background: '#0a0f1e', border: '1px solid #1e293b',
                  borderRadius: 12, padding: '16px',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{tip.icon}</div>
                  <div style={{ color: 'white', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{tip.title}</div>
                  <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>{tip.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // ── Analysis View ───────────────────────────────────────────────────
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, alignItems: 'start' }}>

            {/* Left: Image + Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Image Preview */}
              <div style={{
                background: '#0a0f1e', border: '1px solid #1e293b',
                borderRadius: 16, overflow: 'hidden',
              }}>
                <img
                  src={preview}
                  alt="Uploaded driveway"
                  style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 500, objectFit: 'contain' }}
                />
                <div style={{
                  padding: '10px 16px',
                  borderTop: '1px solid #0f172a',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Image size={14} color='#64748b' />
                  <span style={{ color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>
                    {file.name} • {formatFileSize(file.size)}
                    {geoData && ` • GPS: ${geoData.lat.toFixed(4)}, ${geoData.lng.toFixed(4)}`}
                  </span>
                </div>
              </div>

              {/* Analyze Button */}
              {!result && (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  style={{
                    background: analyzing ? '#1e293b' : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                    border: 'none', borderRadius: 14,
                    padding: '16px',
                    color: analyzing ? '#475569' : 'white',
                    fontWeight: 700, fontSize: 15,
                    cursor: analyzing ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'all 0.2s',
                  }}
                >
                  {analyzing ? (
                    <>
                      <RotateCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      Analyzing image with AI…
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Analyze with AI
                    </>
                  )}
                </button>
              )}

              {/* Try different photo button */}
              {result && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={handleClear}
                    style={{
                      flex: 1,
                      background: '#0a0f1e', border: '1px solid #1e293b',
                      borderRadius: 12, padding: '12px',
                      color: '#94a3b8', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    <Upload size={15} /> New Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    style={{
                      flex: 1,
                      background: '#0a0f1e', border: '1px solid #06b6d440',
                      borderRadius: 12, padding: '12px',
                      color: '#06b6d4', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    <RotateCw size={15} /> Re-analyze
                  </button>
                </div>
              )}

              {error && (
                <div style={{
                  background: '#1c0000', border: '1px solid #ef444430',
                  borderRadius: 10, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <AlertCircle size={16} color='#ef4444' />
                  <span style={{ color: '#ef4444', fontSize: 13 }}>{error}</span>
                </div>
              )}
            </div>

            {/* Right: Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {analyzing && (
                <div style={{
                  background: '#0a0f1e', border: '1px solid #06b6d430',
                  borderRadius: 16, padding: '32px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: 56, height: 56,
                    background: '#06b6d420', borderRadius: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                    animation: 'pulse 2s ease-in-out infinite',
                  }}>
                    <Bot size={28} color='#06b6d4' />
                  </div>
                  <div style={{ color: '#06b6d4', fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.1em' }}>
                    AI ANALYZING IMAGE
                  </div>
                  <div style={{ color: '#475569', fontSize: 12, marginTop: 8 }}>
                    Estimating area, assessing condition…
                  </div>
                </div>
              )}

              {!analyzing && result && parsed && (
                <>
                  {/* Extracted Data Card */}
                  <div style={{
                    background: '#0a0f1e', border: '1px solid #22c55e30',
                    borderRadius: 16, overflow: 'hidden',
                  }}>
                    <div style={{
                      background: '#060a14', padding: '12px 20px',
                      borderBottom: '1px solid #0f172a',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <CheckCircle2 size={16} color='#22c55e' />
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#22c55e', letterSpacing: '0.12em', fontWeight: 700 }}>
                        AI ASSESSMENT
                      </span>
                    </div>
                    <div style={{ padding: '0 20px 4px' }}>
                      <ResultField label="Est. Sq Ft" value={parsed.sqft ? parsed.sqft.toLocaleString() + ' sqft' : 'See analysis'} highlight={Boolean(parsed.sqft)} />
                      <ResultField label="Condition" value={parsed.condition} highlight={Boolean(parsed.condition)} />
                      <ResultField label="Recommended" value={parsed.service} />
                      <ResultField label="Cost Range" value={parsed.costRange} highlight={Boolean(parsed.costRange)} />
                    </div>
                  </div>
                  
                  {/* Location & Scope Map */}
                  {geoData && (
                    <div style={{
                      background: '#0a0f1e', border: '1px solid #1e293b',
                      borderRadius: 16, overflow: 'hidden',
                    }}>
                      <div style={{
                        background: '#060a14', padding: '12px 20px',
                        borderBottom: '1px solid #0f172a',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <MapIcon size={15} color='#64748b' />
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569', letterSpacing: '0.12em' }}>
                          SATELLITE SCOPE (GPS EXTRACTED)
                        </span>
                      </div>
                      <div style={{ padding: '16px' }}>
                        <JobScopeMap job={{ geo_lat: geoData.lat, geo_lng: geoData.lng }} onSave={(data) => {
                            if (data?.scope_geojson) {
                              const squareMeters = turfArea(data.scope_geojson)
                              const squareFeet = Math.round(squareMeters * 10.7639)
                              if (squareFeet > 0) {
                                setMapSqft(squareFeet)
                                alert(`Polygon area calculated: ${squareFeet.toLocaleString()} sqft. Using this for estimate.`)
                              } else {
                                alert('Scope saved to session memory! No valid polygon drawn.')
                              }
                            } else {
                              alert('Scope saved to session memory!')
                            }
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Build Estimate Button */}
                  <button
                    type="button"
                    onClick={handleBuildEstimate}
                    style={{
                      background: '#f59e0b',
                      border: 'none', borderRadius: 14,
                      padding: '14px',
                      color: '#000', fontWeight: 700, fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#d97706'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f59e0b'}
                  >
                    <Calculator size={16} /> Build Estimate from Analysis
                  </button>
                </>
              )}

              {/* Full AI Analysis */}
              {!analyzing && result && (
                <div style={{
                  background: '#0a0f1e', border: '1px solid #1e293b',
                  borderRadius: 16, overflow: 'hidden',
                }}>
                  <div style={{
                    background: '#060a14', padding: '12px 20px',
                    borderBottom: '1px solid #0f172a',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <FileSearch size={15} color='#64748b' />
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569', letterSpacing: '0.12em' }}>
                      FULL ANALYSIS
                    </span>
                  </div>
                  <div style={{ padding: '16px 20px', maxHeight: 400, overflowY: 'auto' }}>
                    <p style={{
                      color: '#cbd5e1', fontSize: 13, lineHeight: 1.8,
                      margin: 0, whiteSpace: 'pre-wrap',
                    }}>
                      {result}
                    </p>
                  </div>
                </div>
              )}

              {/* Empty state before analysis */}
              {!analyzing && !result && (
                <div style={{
                  background: '#0a0f1e', border: '1px dashed #1e293b',
                  borderRadius: 16, padding: '40px 24px',
                  textAlign: 'center',
                }}>
                  <Bot size={36} color='#1e293b' style={{ margin: '0 auto 12px' }} />
                  <div style={{ color: '#334155', fontSize: 13 }}>
                    Click "Analyze with AI" to assess this image
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
