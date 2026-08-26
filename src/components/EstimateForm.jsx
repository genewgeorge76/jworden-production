import { useState } from 'react'
import { CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react'
import { trackEvent } from '../api/client'
import { submitLead } from '../lib/leadCapture'

const SERVICE_OPTIONS = [
  { value: '', label: 'Select a service…' },
  { value: 'Residential Driveway Paving', label: 'Residential Driveway Paving' },
  { value: 'Driveway Resurfacing / Overlay', label: 'Driveway Resurfacing / Overlay' },
  { value: 'Commercial Parking Lot', label: 'Commercial Parking Lot' },
  { value: 'Sealcoating', label: 'Sealcoating' },
  { value: 'Crack Repair', label: 'Crack Repair' },
  { value: 'Tar and Chip', label: 'Tar and Chip' },
  { value: 'Asphalt Milling', label: 'Asphalt Milling' },
  { value: 'Other / Not Sure', label: 'Other / Not Sure' },
]

export default function EstimateForm({ source = 'homepage' }) {
  const [fields, setFields] = useState({ name: '', phone: '', email: '', service: '', message: '' })
  const [busy, setBusy]   = useState(false)
  const [done, setDone]   = useState(false)
  const [err, setErr]     = useState('')

  function update(key) {
    return (e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function submit(e) {
    e.preventDefault()
    setErr('')

    if (!fields.name.trim()) { setErr('Please enter your name.'); return }
    if (!fields.phone.trim()) { setErr('Please enter your phone number.'); return }

    setBusy(true)
    try {
      // POST to the live backend website-lead endpoint (proxied to the Fly API
      // via the /api/* rewrite). It persists the lead, notifies the office, and
      // syncs to the leads sheet — email optional, matching this form. The
      // previous target (/api/estimate-request) was a dead Netlify function, so
      // every estimate request through this form was silently lost.
      const [firstName, ...restName] = fields.name.trim().split(/\s+/)
      const jobDescription =
        [fields.service, fields.message].map((s) => s && s.trim()).filter(Boolean).join(' — ') ||
        'Free estimate request'
      // Shares the retry, absolute-URL fallback and durable localStorage queue
      // in lib/leadCapture rather than hand-rolling a bare fetch. A live site
      // was returning 404 for every /api path and losing leads silently.
      const { status } = await submitLead({
        firstName: firstName || fields.name.trim(),
        lastName: restName.join(' ') || undefined,
        phone: fields.phone.trim(),
        email: fields.email.trim() || undefined,
        jobDescription,
        source: `estimate-form:${source}`,
      }, '/api/v1/leads/website')

      trackEvent('estimate_form_submit', { source, service: fields.service, status })
      setDone(true)
    } catch (error) {
      console.error('[EstimateForm] submit error', error)
      // The previous copy said "your request was not lost". When both attempts
      // fail it IS lost, and telling someone otherwise is how a customer sits
      // waiting for a call that is never coming.
      setErr(
        'We could not send that just now. Please call or text (804) 446-1296 so your request is not missed.',
      )
      trackEvent('estimate_form_error', { source, error: String(error?.message || error) })
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-none border border-gray-200 bg-white p-8 md:p-12 text-center">
        <CheckCircle className="w-12 h-12 text-[#ff7a00] mx-auto mb-4" />
        <h3 className="font-display text-gray-900 text-2xl uppercase tracking-wide mb-2">
          Request Received
        </h3>
        <p className="text-gray-600 text-base">
          We'll follow up within 1 business hour. For urgent projects, call or text us directly.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={submit}
      aria-label="Free estimate request"
      className="border border-gray-200 bg-white"
    >
      <div className="bg-[#0f0f0f] px-8 py-6">
        <h3 className="font-display text-white text-xl uppercase tracking-[0.12em]">
          Request a Free Estimate
        </h3>
        <p className="text-gray-400 text-sm mt-1">
          We respond within 1 business hour, 7 days a week.
        </p>
      </div>

      <div className="p-8 md:p-10 space-y-5">
        {/* Row 1 — Name + Phone */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="ef-name" className="block font-display text-xs uppercase tracking-[0.14em] text-gray-600 mb-1.5">
              Name <span className="text-[#ff7a00]">*</span>
            </label>
            <input
              id="ef-name"
              type="text"
              autoComplete="name"
              required
              placeholder="John Smith"
              value={fields.name}
              onChange={update('name')}
              className="w-full border border-gray-200 bg-white px-4 py-3 text-gray-900 text-sm focus:border-[#ff7a00] focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label htmlFor="ef-phone" className="block font-display text-xs uppercase tracking-[0.14em] text-gray-600 mb-1.5">
              Phone <span className="text-[#ff7a00]">*</span>
            </label>
            <input
              id="ef-phone"
              type="tel"
              autoComplete="tel"
              inputMode="numeric"
              required
              placeholder="(804) 555-1234"
              value={fields.phone}
              onChange={update('phone')}
              className="w-full border border-gray-200 bg-white px-4 py-3 text-gray-900 text-sm focus:border-[#ff7a00] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Row 2 — Email + Service */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="ef-email" className="block font-display text-xs uppercase tracking-[0.14em] text-gray-600 mb-1.5">
              Email
            </label>
            <input
              id="ef-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={fields.email}
              onChange={update('email')}
              className="w-full border border-gray-200 bg-white px-4 py-3 text-gray-900 text-sm focus:border-[#ff7a00] focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label htmlFor="ef-service" className="block font-display text-xs uppercase tracking-[0.14em] text-gray-600 mb-1.5">
              Service Needed
            </label>
            <select
              id="ef-service"
              value={fields.service}
              onChange={update('service')}
              className="w-full border border-gray-200 bg-white px-4 py-3 text-gray-900 text-sm focus:border-[#ff7a00] focus:outline-none transition-colors appearance-none"
            >
              {SERVICE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3 — Message */}
        <div>
          <label htmlFor="ef-message" className="block font-display text-xs uppercase tracking-[0.14em] text-gray-600 mb-1.5">
            Project Details
          </label>
          <textarea
            id="ef-message"
            rows={4}
            placeholder="Square footage estimate, current surface condition, address, anything helpful…"
            value={fields.message}
            onChange={update('message')}
            className="w-full border border-gray-200 bg-white px-4 py-3 text-gray-900 text-sm focus:border-[#ff7a00] focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Error */}
        {err && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 px-4 py-3" role="alert">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{err}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-3 bg-[#ff7a00] text-black font-display font-bold text-sm uppercase tracking-[0.14em] px-8 py-4 hover:bg-[#ff9a30] disabled:opacity-60 transition-colors"
        >
          {busy ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
          ) : (
            <><Send className="w-4 h-4" /> Send Estimate Request</>
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          No spam. No deposit until materials are ordered.
        </p>
      </div>
    </form>
  )
}
