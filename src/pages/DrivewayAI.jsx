import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileVideo,
  MapPin,
  PenLine,
  Phone,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import SmartImage from '@/components/SmartImage'
import { api, trackEvent } from '@/api/client'
import { estimatePrice } from '@/lib/pricing'
import { trackPhoneClick } from '@/lib/analytics'
import { SITE_IMAGES } from '@/lib/siteImages'

const ISSUE_OPTIONS = [
  { id: 'cracks', label: 'Cracking', impact: 9 },
  { id: 'potholes', label: 'Potholes', impact: 16 },
  { id: 'failed_patches', label: 'Failed patches', impact: 15 },
  { id: 'oxidation', label: 'Gray / dry surface', impact: 8 },
  { id: 'drainage', label: 'Standing water', impact: 18 },
  { id: 'water_pumping', label: 'Water seepage / pumping', impact: 22 },
  { id: 'edge_failure', label: 'Broken edges', impact: 12 },
  { id: 'base_failure', label: 'Soft or sinking spots', impact: 20 },
]

const SURFACE_OPTIONS = [
  { value: 'driveway', label: 'Home driveway', propertyType: 'residential', widthFt: 12, lengthFt: 80, serviceType: 'driveway' },
  { value: 'parking_lot', label: 'Small / medium parking lot', propertyType: 'commercial', widthFt: 80, lengthFt: 120, serviceType: 'parking_lot' },
]

const SERVICE_OPTIONS = [
  { value: 'driveway', label: 'New driveway / replacement' },
  { value: 'parking_lot', label: 'Parking lot repair / replacement' },
  { value: 'paving', label: 'Overlay / resurfacing' },
  { value: 'sealcoating', label: 'Sealcoating' },
  { value: 'crackfill', label: 'Crack repair' },
]

const PAID_SCAN_PACKAGES = [
  {
    name: 'Phone Scan Review',
    price: '$149+',
    bestFor: 'Driveways, small lots, visible potholes, broken edges, and water issues',
    deliverable: 'Estimator-reviewed condition summary, repair direction, and draft range',
  },
  {
    name: 'Decision Packet',
    price: '$349+',
    bestFor: 'Owners comparing repair, overlay, sealcoat, drainage, or replacement choices',
    deliverable: 'Photo/video review, risk notes, scope options, and recommended next step',
  },
  {
    name: 'Drone Assessment',
    price: '$750+',
    bestFor: 'Shopping centers, industrial lots, large commercial pavement, and multi-building sites',
    deliverable: 'Recommended when a full accurate assessment needs aerial coverage and site mapping',
  },
]

const DEFAULT_FORM = {
  name: '',
  phone: '',
  email: '',
  address: '',
  stateCode: 'VA',
  surfaceType: 'driveway',
  serviceType: 'driveway',
  urgency: 'within_2_weeks',
  widthFt: 12,
  lengthFt: 80,
  manualSqft: '',
  notes: '',
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value || 0)
}

function polygonAreaPercent(points) {
  if (points.length < 3) return 0
  let sum = 0
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    sum += point.x * next.y - next.x * point.y
  })
  return Math.abs(sum / 2) / 10000
}

function scoreCondition(selectedIssues, photoCount, hasWalkaround) {
  const issuePenalty = ISSUE_OPTIONS.reduce(
    (total, issue) => total + (selectedIssues.includes(issue.id) ? issue.impact : 0),
    0,
  )
  const documentationBonus = Math.min(8, photoCount * 2 + (hasWalkaround ? 4 : 0))
  return clamp(92 - issuePenalty + documentationBonus, 18, 98)
}

function conditionLabel(score) {
  if (score >= 82) return 'Strong candidate'
  if (score >= 64) return 'Needs review'
  if (score >= 46) return 'Likely repair scope'
  return 'Replacement review'
}

function EdgeSketch({ points, onPointsChange, widthFt, lengthFt, surfaceLabel }) {
  const handlePointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 4, 96)
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 4, 96)
    onPointsChange([...points, { x, y }].slice(0, 12))
  }

  const path = points.map((point) => `${point.x},${point.y}`).join(' ')
  const baseArea = Math.max(1, Number(widthFt || 0) * Number(lengthFt || 0))
  const sketchedArea = points.length >= 3 ? Math.round(baseArea * polygonAreaPercent(points)) : 0

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="font-display text-primary text-xs tracking-[0.18em] uppercase">{surfaceLabel} Edges</p>
          <h3 className="font-display font-black text-foreground text-xl uppercase tracking-tight">Customer Sketch</h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onPointsChange(points.slice(0, -1))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
            aria-label="Undo last edge point"
            title="Undo"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onPointsChange([])}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
            aria-label="Clear edge sketch"
            title="Clear"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePointer}
        className="relative block w-full overflow-hidden rounded-xl border border-border bg-stone-100 text-left shadow-inner aspect-[4/3] sm:aspect-[16/10]"
        aria-label={`Draw ${surfaceLabel.toLowerCase()} edge points`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <div className="absolute left-[12%] top-0 h-full w-[18%] bg-neutral-300/80" />
        <div className="absolute right-[8%] top-[9%] h-[28%] w-[24%] rounded-sm bg-white/75 border border-neutral-300" />
        <div className="absolute left-[24%] top-[16%] h-[66%] w-[42%] rotate-[-6deg] rounded-[18px] bg-neutral-700/75 shadow-xl" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {points.length >= 3 ? <polygon points={path} fill="rgba(209, 139, 35, 0.30)" stroke="rgb(209, 139, 35)" strokeWidth="1.4" /> : null}
          {points.length >= 2 ? <polyline points={path} fill="none" stroke="rgb(209, 139, 35)" strokeWidth="1.3" strokeDasharray="2 1" /> : null}
          {points.map((point, index) => (
            <g key={`${point.x}-${point.y}-${index}`}>
              <circle cx={point.x} cy={point.y} r="2.1" fill="rgb(209, 139, 35)" />
              <text x={point.x + 2.6} y={point.y + 1.2} fontSize="4" fill="rgb(15,23,42)">{index + 1}</text>
            </g>
          ))}
        </svg>
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/50 bg-white/85 px-3 py-2 backdrop-blur">
          <span className="text-xs font-semibold text-foreground">{points.length} points marked</span>
          <span className="text-xs font-bold text-primary">{sketchedArea ? `${formatNumber(sketchedArea)} sq ft sketch` : 'Tap corners'}</span>
        </div>
      </button>
    </div>
  )
}

function ScoreRing({ score }) {
  const circumference = 2 * Math.PI * 42
  const dash = (score / 100) * circumference
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(15,23,42,0.10)" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="rgb(209,139,35)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-black text-foreground">{score}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">score</span>
      </div>
    </div>
  )
}

export default function DrivewayAI() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [edgePoints, setEdgePoints] = useState([
    { x: 31, y: 21 },
    { x: 67, y: 17 },
    { x: 63, y: 81 },
    { x: 28, y: 84 },
  ])
  const [selectedIssues, setSelectedIssues] = useState(['cracks', 'oxidation'])
  const [photoFiles, setPhotoFiles] = useState([])
  const [videoFiles, setVideoFiles] = useState([])
  const [submitted, setSubmitted] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const baseSqft = Math.max(1, Number(form.widthFt || 0) * Number(form.lengthFt || 0))
  const sketchSqft = edgePoints.length >= 3 ? Math.round(baseSqft * polygonAreaPercent(edgePoints)) : 0
  const effectiveSqft = Number(form.manualSqft || 0) > 0 ? Number(form.manualSqft) : sketchSqft || baseSqft
  const conditionScore = scoreCondition(selectedIssues, photoFiles.length, videoFiles.length > 0)
  const stateCode = String(form.stateCode || '').toUpperCase().slice(0, 2)
  const surfaceConfig = SURFACE_OPTIONS.find((option) => option.value === form.surfaceType) || SURFACE_OPTIONS[0]
  const surfaceLabel = form.surfaceType === 'parking_lot' ? 'Parking Lot' : 'Driveway'
  const propertyType = surfaceConfig.propertyType
  const price = useMemo(
    () => estimatePrice(form.serviceType, propertyType, effectiveSqft, stateCode || 'VA'),
    [effectiveSqft, form.serviceType, propertyType, stateCode],
  )

  const confidence = useMemo(() => {
    let value = 54
    if (form.address.trim()) value += 10
    if (edgePoints.length >= 4) value += 14
    if (photoFiles.length >= 3) value += 12
    if (videoFiles.length > 0) value += 10
    return clamp(value, 42, 96)
  }, [edgePoints.length, form.address, photoFiles.length, videoFiles.length])

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const updateSurfaceType = (value) => {
    const nextSurface = SURFACE_OPTIONS.find((option) => option.value === value) || SURFACE_OPTIONS[0]
    setForm((current) => ({
      ...current,
      surfaceType: nextSurface.value,
      serviceType: nextSurface.serviceType,
      widthFt: nextSurface.widthFt,
      lengthFt: nextSurface.lengthFt,
      manualSqft: '',
    }))
  }

  const toggleIssue = (id) => {
    setSelectedIssues((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    setSubmitted(null)
    if (!form.name.trim() || !form.phone.trim()) {
      setSubmitError('Name and phone are required for estimator review.')
      return
    }
    setSubmitting(true)
    const issueLabels = ISSUE_OPTIONS.filter((issue) => selectedIssues.includes(issue.id)).map((issue) => issue.label)
    const message = [
      `Driveway / Lot AI intake for ${surfaceConfig.label}: ${conditionScore}/100 (${conditionLabel(conditionScore)}).`,
      `Estimated area: ${formatNumber(effectiveSqft)} sq ft. Confidence: ${confidence}%.`,
      `Selected issues: ${issueLabels.join(', ') || 'None selected'}.`,
      `Customer upload counts: ${photoFiles.length} photos, ${videoFiles.length} videos.`,
      form.notes ? `Customer notes: ${form.notes}` : '',
    ].filter(Boolean).join('\n')

    try {
      const result = await api.submitQuote({
        name: form.name,
        email: form.email,
        phone: form.phone,
        service_type: form.serviceType,
        property_type: propertyType,
        urgency: form.urgency,
        project_size_sqft: effectiveSqft,
        address: form.address,
        state_code: stateCode || 'VA',
        message,
      })
      trackEvent('driveway_ai_submitted', {
        service_type: form.serviceType,
        sqft: effectiveSqft,
        score: conditionScore,
        confidence,
      })
      setSubmitted(result || { status: 'received' })
    } catch (error) {
      setSubmitError(error.message || 'Could not submit right now. Please call the office.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title="Driveway & Parking Lot AI Scan | J. Worden & Sons Paving LLC"
        description="Use your phone to sketch driveway or small parking lot edges, upload photos or video, flag potholes and drainage failures, and receive a premium asphalt estimate review from J. Worden & Sons."
        canonicalPath="/driveway-ai"
      />
      <Navbar />

      <main className="pt-24">
        <section className="border-b border-border bg-background">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-5 lg:gap-6 items-start">
              <div className="space-y-5">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="grid gap-0 lg:grid-cols-[1.12fr_0.88fr]">
                    <div className="p-4 sm:p-5 lg:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <p className="font-display text-primary text-xs tracking-[0.24em] uppercase mb-2">Driveway + Small Lot AI Estimate Studio</p>
                      <h1 className="font-display font-black text-foreground text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight leading-[0.95] max-w-4xl">
                        Draw The Pavement. Upload The Damage. Get A Premium Review.
                      </h1>
                      <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
                        Built for homeowners and small property owners using their own phone: edge sketch, potholes, broken areas, water seepage, photos, walkaround video, condition score, and a paid assessment path when you want a deeper estimator-reviewed decision packet.
                      </p>
                    </div>
                    <a
                      href="tel:+18044461296"
                      onClick={() => trackPhoneClick('driveway_ai_header')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 font-display text-xs font-bold uppercase tracking-[0.14em] text-background hover:bg-foreground/90"
                    >
                      <Phone className="h-4 w-4" />
                      Call Office
                    </a>
                      </div>

                      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {[
                          { label: 'AI condition', value: `${conditionScore}/100` },
                          { label: 'Estimate area', value: `${formatNumber(effectiveSqft)} sq ft` },
                          { label: 'Review confidence', value: `${confidence}%` },
                          { label: 'Price range', value: price ? `${price.lowFmt} - ${price.highFmt}` : 'Pending' },
                        ].map((item) => (
                          <div key={item.label} className="rounded-xl border border-border bg-background px-3 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                            <p className="mt-1 font-display text-lg font-black text-foreground leading-tight">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="relative min-h-[260px] border-t border-border lg:border-l lg:border-t-0">
                      <SmartImage
                        src={form.surfaceType === 'parking_lot' ? SITE_IMAGES.commercialLot : SITE_IMAGES.driveway}
                        alt={`${surfaceLabel} asphalt scan example`}
                        width={1100}
                        height={900}
                        sizes="(max-width: 1024px) 100vw, 36vw"
                        className="h-full w-full"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                        <p className="font-display text-xs uppercase text-primary">Photo-backed intake</p>
                        <p className="mt-1 text-sm text-white/85">Customers upload real damage photos before estimator review.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <EdgeSketch
                  points={edgePoints}
                  onPointsChange={setEdgePoints}
                  widthFt={form.widthFt}
                  lengthFt={form.lengthFt}
                  surfaceLabel={surfaceLabel}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="h-4 w-4 text-primary" />
                      <h2 className="font-display font-black text-foreground text-xl uppercase tracking-tight">Phone Capture</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="rounded-xl border border-dashed border-primary/50 bg-primary/5 p-4 cursor-pointer hover:bg-primary/10">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          multiple
                          className="sr-only"
                          onChange={(event) => setPhotoFiles(Array.from(event.target.files || []))}
                        />
                        <Upload className="h-5 w-5 text-primary mb-2" />
                        <p className="text-sm font-bold text-foreground">Site photos</p>
                        <p className="text-xs text-muted-foreground mt-1">{photoFiles.length ? `${photoFiles.length} selected` : 'Cracks, potholes, broken areas, drainage'}</p>
                      </label>
                      <label className="rounded-xl border border-dashed border-primary/50 bg-primary/5 p-4 cursor-pointer hover:bg-primary/10">
                        <input
                          type="file"
                          accept="video/*"
                          capture="environment"
                          multiple
                          className="sr-only"
                          onChange={(event) => setVideoFiles(Array.from(event.target.files || []))}
                        />
                        <FileVideo className="h-5 w-5 text-primary mb-2" />
                        <p className="text-sm font-bold text-foreground">Walkaround video</p>
                        <p className="text-xs text-muted-foreground mt-1">{videoFiles.length ? `${videoFiles.length} selected` : 'Traffic path, low spots, water seepage'}</p>
                      </label>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <ClipboardCheck className="h-4 w-4 text-primary" />
                      <h2 className="font-display font-black text-foreground text-xl uppercase tracking-tight">Site Signals</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {ISSUE_OPTIONS.map((issue) => {
                        const active = selectedIssues.includes(issue.id)
                        return (
                          <button
                            type="button"
                            key={issue.id}
                            onClick={() => toggleIssue(issue.id)}
                            className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors ${active ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
                          >
                            {issue.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <aside className="xl:sticky xl:top-24 space-y-5">
                <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h2 className="font-display font-black text-foreground text-xl uppercase tracking-tight">Estimate Review</h2>
                  </div>

                  <div className="space-y-3">
                    <input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" placeholder="Name" value={form.name} onChange={(event) => update('name', event.target.value)} />
                    <input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" placeholder="Phone" value={form.phone} onChange={(event) => update('phone', event.target.value)} />
                    <input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" placeholder="Email" value={form.email} onChange={(event) => update('email', event.target.value)} />
                    <input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" placeholder="Property address" value={form.address} onChange={(event) => update('address', event.target.value)} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SURFACE_OPTIONS.map((option) => {
                        const active = form.surfaceType === option.value
                        return (
                          <button
                            type="button"
                            key={option.value}
                            onClick={() => updateSurfaceType(option.value)}
                            className={`rounded-lg border px-3 py-2.5 text-left text-xs font-bold uppercase tracking-[0.1em] transition-colors ${active ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                    <div className="grid grid-cols-[0.6fr_1.4fr] gap-2">
                      <input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm uppercase" placeholder="VA" maxLength={2} value={form.stateCode} onChange={(event) => update('stateCode', event.target.value.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 2))} />
                      <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.serviceType} onChange={(event) => update('serviceType', event.target.value)}>
                        {SERVICE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" type="number" min="1" value={form.widthFt} onChange={(event) => update('widthFt', event.target.value)} aria-label="Width in feet" />
                      <input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" type="number" min="1" value={form.lengthFt} onChange={(event) => update('lengthFt', event.target.value)} aria-label="Length in feet" />
                      <input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" type="number" min="1" placeholder="Sq ft" value={form.manualSqft} onChange={(event) => update('manualSqft', event.target.value)} aria-label="Manual square footage" />
                    </div>
                    <textarea className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm" rows={3} placeholder="Notes for estimator" value={form.notes} onChange={(event) => update('notes', event.target.value)} />
                  </div>

                  {submitError ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{submitError}</p> : null}
                  {submitted ? <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Received. An estimator can review this AI packet before final pricing.</p> : null}

                  <button type="submit" disabled={submitting} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-display text-xs font-black uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-50">
                    {submitting ? 'Sending Review' : 'Request Scan Review'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <ScoreRing score={conditionScore} />
                    <div>
                      <p className="font-display text-primary text-xs tracking-[0.18em] uppercase">AI Pavement Health</p>
                      <h3 className="font-display font-black text-foreground text-2xl uppercase tracking-tight leading-none mt-1">{conditionLabel(conditionScore)}</h3>
                      <p className="text-xs text-muted-foreground mt-2">Estimator review confidence: {confidence}%</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CircleDollarSign className="h-4 w-4 text-primary" />
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Draft price range</p>
                    </div>
                    <p className="font-display text-3xl font-black text-foreground">{price ? `${price.lowFmt} - ${price.highFmt}` : 'Pending'}</p>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{price?.disclaimer}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                    {[
                      'Human-approved final bid before release',
                      'Photos and walkaround attached to lead review',
                      'Potholes, drainage, seepage, base, and edge risks flagged',
                      'Drone scan recommended for shopping centers and industrial lots when a full accurate assessment is needed',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 max-w-4xl">
              <p className="font-display text-primary text-xs tracking-[0.24em] uppercase mb-2">Paid assessment products</p>
              <h2 className="font-display font-black text-foreground text-3xl md:text-4xl uppercase tracking-tight leading-none">
                Free Intake Starts The Conversation. Paid Scan Packets Create Better Decisions.
              </h2>
              <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                The public tool collects the first layer. The paid review turns photos, video, sketches, drainage clues, and owner goals into a professional decision packet before anyone commits to a major paving bill.
              </p>
            </div>
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {PAID_SCAN_PACKAGES.map((item) => (
                <article key={item.name} className="rounded-2xl border border-border bg-background p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display font-black text-foreground text-2xl uppercase tracking-tight leading-none">{item.name}</h3>
                    <span className="rounded-lg bg-primary/10 px-3 py-1.5 font-display text-sm font-black text-primary">{item.price}</span>
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Best for</p>
                  <p className="mt-1 text-sm text-foreground/85 leading-relaxed">{item.bestFor}</p>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Customer receives</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.deliverable}</p>
                </article>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: PenLine, title: 'Draw Edges', text: 'Customer-created driveway or parking-lot outline for faster square-foot review.' },
                { icon: Sparkles, title: 'AI Review Packet', text: 'Condition score, risk flags, uploads, and price range in one lead.' },
                { icon: ShieldCheck, title: 'Estimator Control', text: 'The system drafts. A human approves final scope and number.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-background p-5">
                  <item.icon className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-display font-black text-foreground text-xl uppercase tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/residential" className="rounded-xl border border-border px-4 py-3 text-sm font-bold text-foreground hover:bg-background">Residential Paving</Link>
              <Link to="/paving" className="rounded-xl border border-border px-4 py-3 text-sm font-bold text-foreground hover:bg-background">Parking Lot Paving</Link>
              <Link to="/jwordenai" className="rounded-xl border border-border px-4 py-3 text-sm font-bold text-foreground hover:bg-background">How JWORDENAI Helps</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}