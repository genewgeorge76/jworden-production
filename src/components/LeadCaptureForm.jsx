import { useState } from 'react';

const SERVICE_OPTIONS = [
  'Asphalt Driveway (Residential)',
  'Parking Lot (Commercial)',
  'Sealcoating',
  'Crack Repair',
  'Asphalt Overlay / Repaving',
  'Concrete Work',
  'Hardscapes / Pavers',
  'General Contracting',
  'Other',
];

const TIMING_OPTIONS = [
  'ASAP',
  'Within 1 week',
  'Within 1 month',
  'Flexible',
];

// Map the friendly form values onto the backend QuoteRequest schema
// (POST /api/v1/leads/quote). service_type / property_type / urgency are
// required strings on the backend, so every submission must carry them.
const URGENCY_MAP = {
  'ASAP': 'asap',
  'Within 1 week': 'within_1_week',
  'Within 1 month': 'within_1_month',
  'Flexible': 'flexible',
};

function toQuotePayload(form) {
  const service = String(form.service || '').trim();
  const isCommercial = /commercial|parking lot|general contracting/i.test(service);
  return {
    name: String(form.name || '').trim(),
    email: String(form.email || '').trim(),
    phone: String(form.phone || '').trim(),
    service_type: service || 'General',
    property_type: isCommercial ? 'commercial' : 'residential',
    urgency: URGENCY_MAP[form.timing] || 'flexible',
    message: String(form.projectDetails || '').trim() || undefined,
  };
}

export default function LeadCaptureForm() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');

    const formData = new FormData(e.currentTarget);
    const payload = toQuotePayload(Object.fromEntries(formData.entries()));

    try {
      // POST to the live backend quote endpoint (proxied to the Fly API via
      // the /api/* rewrite in vercel.json). This scores the lead, stores it,
      // and fires the confirmation + admin notification. The previous target
      // (/api/chat-lead-capture) was a dead Netlify function — every lead
      // submitted through this form was silently dropped.
      const response = await fetch('/api/v1/leads/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const detail = Array.isArray(data?.detail)
          ? data.detail.map((d) => d?.msg).filter(Boolean).join(', ')
          : data?.detail || data?.error;
        throw new Error(detail || 'Submission failed');
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Something went wrong. Please call us at (804) 446-1296.');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-12">
        <p className="font-display font-black text-primary text-4xl uppercase tracking-tighter mb-4">Request Received.</p>
        <p className="text-muted-foreground text-lg mb-2">We'll be in touch within one business day.</p>
        <p className="text-muted-foreground">
          Need it faster?{' '}
          <a href="tel:8044461296" className="text-primary font-bold hover:underline">
            Call (804) 446-1296
          </a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className="block text-xs font-display uppercase tracking-widest text-muted-foreground mb-1">
            Full Name *
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Your name"
            className="w-full bg-card border border-border rounded px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-xs font-display uppercase tracking-widest text-muted-foreground mb-1">
            Phone *
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="(804) 555-0100"
            className="w-full bg-card border border-border rounded px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-xs font-display uppercase tracking-widest text-muted-foreground mb-1">
          Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full bg-card border border-border rounded px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div>
        <label htmlFor="service" className="block text-xs font-display uppercase tracking-widest text-muted-foreground mb-1">
          Service Needed *
        </label>
        <select
          id="service"
          name="service"
          required
          defaultValue=""
          className="w-full bg-card border border-border rounded px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
        >
          <option value="" disabled>Select a service…</option>
          {SERVICE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="projectDetails" className="block text-xs font-display uppercase tracking-widest text-muted-foreground mb-1">
          Project Details
        </label>
        <textarea
          id="projectDetails"
          name="projectDetails"
          rows={4}
          placeholder="Approximate size, current condition, location — anything that helps us scope the job."
          className="w-full bg-card border border-border rounded px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      <div>
        <label htmlFor="timing" className="block text-xs font-display uppercase tracking-widest text-muted-foreground mb-1">
          Timeline
        </label>
        <select
          id="timing"
          name="timing"
          defaultValue=""
          className="w-full bg-card border border-border rounded px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
        >
          <option value="">Select timeline…</option>
          {TIMING_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full bg-primary text-primary-foreground font-display font-black uppercase tracking-widest py-4 rounded hover:bg-primary/90 disabled:opacity-60 transition-all text-sm"
      >
        {status === 'submitting' ? 'Sending…' : 'Submit Request'}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        No obligation. We respond within one business day.{' '}
        <a href="tel:8044461296" className="text-primary hover:underline">
          Prefer to call? (804) 446-1296
        </a>
      </p>
    </form>
  );
}
