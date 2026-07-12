import { useState } from 'react';

// Netlify Function proxy — forwards leads to Kickserv server-side to avoid browser CORS
const KICKSERV_PROXY = '/.netlify/functions/kickserv-lead';

// GA4 Measurement ID — set VITE_GA4_MEASUREMENT_ID in Netlify dashboard environment variables
const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;

// Simple validation helpers
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s().+\-]{7,20}$/;

function validateForm(
  fullName: string,
  phone: string,
  email: string,
  address: string,
): string | null {
  if (!fullName.trim() || fullName.trim().length < 2) return 'Please enter your full name.';
  if (fullName.length > 120) return 'Name is too long (max 120 characters).';
  if (!PHONE_RE.test(phone)) return 'Please enter a valid phone number.';
  if (!EMAIL_RE.test(email)) return 'Please enter a valid email address.';
  if (email.length > 254) return 'Email address is too long.';
  if (!address.trim() || address.trim().length < 5) return 'Please enter a project site address.';
  if (address.length > 300) return 'Address is too long (max 300 characters).';
  return null;
}

interface BidMetrics {
  asphaltTons: number;
  stoneTons: number;
  totalProjected: number;
}

interface BidResult {
  estimate: string;
  metrics: BidMetrics;
}

export default function ContactForm() {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const [submitted, setSubmitted] = useState(false);
  const [city, setCity] = useState('');
  const [kickservLoading, setKickservLoading] = useState(false);
  const [kickservError, setKickservError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [bidLoading, setBidLoading] = useState(false);
  const [bidResult, setBidResult] = useState<BidResult | null>(null);
  const [bidError, setBidError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    // Read all form values
    const fullName = (form.elements.namedItem('name') as HTMLInputElement)?.value || '';
    const phone = (form.elements.namedItem('phone') as HTMLInputElement)?.value || '';
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value || '';
    const addressVal = (form.elements.namedItem('address') as HTMLInputElement)?.value || '';
    const service = (form.elements.namedItem('service') as HTMLSelectElement)?.value || '';
    const sqftVal = Number((form.elements.namedItem('sqft') as HTMLInputElement)?.value || 0);
    const soilTypeVal = (form.elements.namedItem('soilType') as HTMLSelectElement)?.value || '';
    const regionVal = (form.elements.namedItem('region') as HTMLInputElement)?.value || '';
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement)?.value || '';

    // Split full name into first / last (best-effort)
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Client-side validation — fast feedback before any network call
    const validErr = validateForm(fullName, phone, email, addressVal);
    if (validErr) {
      setValidationError(validErr);
      return;
    }
    setValidationError(null);

    // Detect city for analytics
    const cityMatch = addressVal.match(/,\s*([^,]+),?\s*VA/i);
    const detectedCity = cityMatch ? cityMatch[1].trim() : (regionVal || 'Richmond');
    setCity(detectedCity);

    // Build a human-readable job description combining all extra fields
    const jobParts = [
      service && `Service: ${service}`,
      sqftVal > 0 && `Area: ${sqftVal} sq ft`,
      soilTypeVal && `Soil: ${soilTypeVal}`,
      regionVal && `Region: ${regionVal}`,
      message && `Notes: ${message}`,
    ].filter(Boolean);
    const jobDescription = jobParts.join(' | ');

    const win = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof window !== 'undefined' && win.gtag) {
      win.gtag('event', 'estimate_intent', {
        event_category: 'demand_heatmap',
        event_label: detectedCity,
      });
      win.gtag('event', 'generate_lead', {
        event_category: 'contact',
        event_label: detectedCity,
        value: 1,
      });
    }

    // Submit lead to Kickserv via Netlify proxy (avoids browser CORS)
    setKickservLoading(true);
    setKickservError(null);
    let kickservOk = false;
    try {
      const res = await fetch(KICKSERV_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone, email, serviceAddress: addressVal, jobDescription }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || `Server error ${res.status}`);
      }
      kickservOk = true;
      // Fire GA conversion event on successful dispatch
      if (typeof window !== 'undefined' && win.gtag && GA4_MEASUREMENT_ID) {
        win.gtag('event', 'conversion', { event_category: 'kickserv_dispatch', send_to: GA4_MEASUREMENT_ID });
      }
      setSubmitted(true);
    } catch (err) {
      setKickservError(err instanceof Error ? err.message : 'Submission failed. Please call us at 804-446-1296.');
    } finally {
      setKickservLoading(false);
    }

    // Call the Worden Brain AI bidder if sqft is provided and Kickserv succeeded
    if (kickservOk && sqftVal > 0) {
      setBidLoading(true);
      setBidError(null);
      setBidResult(null);
      try {
        const response = await fetch('/.netlify/functions/worden-bidder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: addressVal,
            sqft: sqftVal,
            soilType: soilTypeVal,
            region: regionVal || detectedCity,
          }),
        });
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        const data: BidResult = await response.json();
        setBidResult(data);
      } catch (err) {
        setBidError(err instanceof Error ? err.message : 'Unable to generate AI estimate at this time.');
      } finally {
        setBidLoading(false);
      }
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#ffcc00] text-black px-8 py-5 text-center mb-0 shadow-[0_0_30px_rgba(255,204,0,0.4)]">
          <p className="text-xl md:text-2xl font-black uppercase tracking-tight leading-tight">
            ✅ Dispatch Submitted to Kickserv!
          </p>
          <p className="text-sm font-bold mt-1 opacity-80">
            Confirmed for {today}{city ? ` · ${city}` : ''} · We'll contact you shortly ·{' '}
            <a href="tel:+18044461296" className="underline hover:opacity-70">804-446-1296</a>
          </p>
        </div>
        <div className="bg-[#1a1a1a] p-10 border border-zinc-800 text-center shadow-2xl font-sans">
          <p className="text-white font-bold text-lg mb-6">
            Your lead has been received by our dispatch team. A 4th-generation estimator will reach out within one business day. Need immediate help?{' '}
            <a href="tel:+18044461296" className="text-[#ffcc00] underline hover:opacity-80">Call 804-446-1296</a>.
          </p>

          {/* Worden Brain AI Estimate */}
          {bidLoading && (
            <div className="mb-8 p-6 border border-[#ffcc00]/30 bg-black/40">
              <p className="text-[#ffcc00] font-black uppercase tracking-widest text-sm animate-pulse">
                ⚙️ Worden Brain Generating Your AI Estimate...
              </p>
            </div>
          )}
          {bidError && (
            <div className="mb-8 p-6 border border-red-500/40 bg-red-900/10 text-left">
              <p className="text-red-400 font-bold text-sm">{bidError}</p>
            </div>
          )}
          {bidResult && (
            <div className="mb-8 text-left">
              <div className="bg-[#ffcc00] text-black px-6 py-3 mb-0">
                <h4 className="font-black uppercase tracking-widest text-xs">🧠 Worden Brain — AI-Generated Estimate</h4>
              </div>
              <div className="bg-black/60 border border-[#ffcc00]/20 p-6 mb-4">
                <p className="text-white font-medium text-sm leading-relaxed whitespace-pre-line">{bidResult.estimate}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-900 border border-zinc-700 p-4 text-center">
                  <p className="text-[#ffcc00] font-black text-lg">{bidResult.metrics.asphaltTons.toFixed(1)}</p>
                  <p className="text-zinc-200 text-xs uppercase tracking-widest font-bold mt-1">Asphalt Tons</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-700 p-4 text-center">
                  <p className="text-[#ffcc00] font-black text-lg">{bidResult.metrics.stoneTons.toFixed(1)}</p>
                  <p className="text-zinc-200 text-xs uppercase tracking-widest font-bold mt-1">Stone Base Tons</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-700 p-4 text-center">
                  <p className="text-[#ffcc00] font-black text-lg">${bidResult.metrics.totalProjected.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                  <p className="text-zinc-200 text-xs uppercase tracking-widest font-bold mt-1">Est. Materials</p>
                </div>
              </div>
            </div>
          )}

          <p className="mt-6 text-xs text-zinc-300 italic font-medium">
            Secured by Kickserv · Same-day response · We respect your privacy.
          </p>
          <button
            onClick={() => { setSubmitted(false); setBidResult(null); setBidError(null); setKickservError(null); setValidationError(null); }}
            className="mt-4 text-zinc-200 hover:text-zinc-200 text-xs uppercase tracking-widest font-bold transition-colors"
          >
            ← Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* AUTHORITY HEADER — Stop Waiting */}
      <div className="bg-[#ffcc00] text-black p-6 text-center shadow-[0_0_30px_rgba(255,204,0,0.4)]">
        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
          Stop Waiting for "No-Show" Paving Companies
        </h3>
        <p className="font-bold uppercase text-xs mt-1 tracking-widest opacity-80">
          Dispatch a 4th-Generation Estimator Immediately
        </p>
        <p className="text-sm font-bold mt-1 opacity-70">
          High-Capacity Dispatch Available for {today} · Chester HQ ·{' '}
          <a href="tel:+18044461296" className="underline hover:opacity-70">804-446-1296</a>
        </p>
      </div>

      <form
        className="bg-[#1a1a1a] p-10 border border-zinc-800 text-left shadow-2xl font-sans"
        onSubmit={handleSubmit}
      >
        {/* KICKSERV INTEGRATION TAGS (Hidden) */}
        <input type="hidden" name="_subject" value="New J. Worden & Sons Dispatch Request" />
        <input type="hidden" name="source" value="Website - Kickserv Sync" />

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <label htmlFor="name" className="block text-xs font-black uppercase tracking-widest text-[#ffcc00] mb-3">Full Name</label>
            <input type="text" id="name" name="name" className="w-full bg-black border border-zinc-800 text-white p-4 focus:border-[#ffcc00] outline-none transition-colors shadow-inner font-bold" placeholder="John Doe" required />
          </div>
          <div>
            <label htmlFor="phone" className="block text-xs font-black uppercase tracking-widest text-[#ffcc00] mb-3">Dispatch Phone</label>
            <input type="tel" id="phone" name="phone" className="w-full bg-black border border-zinc-800 text-white p-4 focus:border-[#ffcc00] outline-none transition-colors shadow-inner font-bold" placeholder="(804) 000-0000" required />
          </div>
        </div>
        <div className="mb-8">
          <label htmlFor="email" className="block text-xs font-black uppercase tracking-widest text-[#ffcc00] mb-3">Email Address</label>
          <input type="email" id="email" name="email" className="w-full bg-black border border-zinc-800 text-white p-4 focus:border-[#ffcc00] outline-none transition-colors shadow-inner" required />
        </div>
        <div className="mb-8">
          <label htmlFor="address" className="block text-xs font-black uppercase tracking-widest text-[#ffcc00] mb-3">Project Site Address</label>
          <input
            type="text"
            id="address"
            name="address"
            className="w-full bg-black border border-zinc-800 text-white p-4 focus:border-[#ffcc00] outline-none transition-colors shadow-inner font-bold"
            placeholder="123 Main St, Richmond, VA"
            required
          />
        </div>
        <div className="mb-8">
          <label htmlFor="service" className="block text-xs font-black uppercase tracking-widest text-[#ffcc00] mb-3">Structural Scope</label>
          <select id="service" name="service" className="w-full bg-black border border-zinc-800 text-[#ffcc00] p-4 focus:border-[#ffcc00] outline-none transition-colors appearance-none shadow-inner font-black uppercase text-sm">
            <option>Residential Driveway (6" Base Standard)</option>
            <option>Commercial Parking Lot (Industrial Grade)</option>
            <option>Premium Tar &amp; Chip (Macadam)</option>
            <option>Municipal-Grade Sealcoating</option>
            <option>Other / Not Sure</option>
          </select>
        </div>
        <div className="mb-8">
          <label htmlFor="sqft" className="block text-xs font-black uppercase tracking-widest text-[#ffcc00] mb-3">Estimated Square Footage</label>
          <input
            type="number"
            id="sqft"
            name="sqft"
            min="0"
            className="w-full bg-black border border-zinc-800 text-white p-4 focus:border-[#ffcc00] outline-none transition-colors shadow-inner"
            placeholder="e.g. 2500"
          />
        </div>
        <div className="mb-8">
          <label htmlFor="soilType" className="block text-xs font-black uppercase tracking-widest text-[#ffcc00] mb-3">Soil / Site Condition</label>
          <select id="soilType" name="soilType" className="w-full bg-black border border-zinc-800 text-[#ffcc00] p-4 focus:border-[#ffcc00] outline-none transition-colors appearance-none shadow-inner font-black uppercase text-sm">
            <option value="">Unknown / Standard</option>
            <option value="Clay">Clay (Worden Clay Stabilization Required)</option>
            <option value="Sandy">Sandy / Loose Fill</option>
            <option value="Rocky">Rocky / Hard Base</option>
            <option value="Gravel">Existing Gravel Base</option>
          </select>
        </div>
        <div className="mb-8">
          <label htmlFor="region" className="block text-xs font-black uppercase tracking-widest text-[#ffcc00] mb-3">Region / City or State</label>
          <input
            type="text"
            id="region"
            name="region"
            className="w-full bg-black border border-zinc-800 text-white p-4 focus:border-[#ffcc00] outline-none transition-colors shadow-inner font-bold"
            placeholder="e.g. Richmond, Chicago, Illinois, 23221"
          />
        </div>
        <div className="mb-10">
          <label htmlFor="message" className="block text-xs font-black uppercase tracking-widest text-[#ffcc00] mb-3">Project Details / Deadlines</label>
          <textarea id="message" name="message" rows={4} className="w-full bg-black border border-zinc-800 text-white p-4 focus:border-[#ffcc00] outline-none transition-colors shadow-inner font-medium" placeholder="Tell us about your project..."></textarea>
        </div>

        {/* Client-side validation error */}
        {validationError && (
          <div className="mb-6 p-4 border border-yellow-500/50 bg-yellow-900/10">
            <p className="text-yellow-400 font-bold text-sm">⚠️ {validationError}</p>
          </div>
        )}

        {/* Kickserv submission error */}
        {kickservError && (
          <div className="mb-6 p-5 border border-red-500/50 bg-red-900/10">
            <p className="text-red-400 font-bold text-sm mb-3">
              ⚠️ Submission error: {kickservError}
            </p>
            <a
              href="tel:+18044461296"
              className="inline-block bg-[#ffcc00] text-black font-black uppercase tracking-widest text-sm px-6 py-3 hover:bg-white transition-colors"
            >
              📞 Call Us Directly — 804-446-1296
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={kickservLoading}
          className="group relative w-full bg-[#ffcc00] text-black font-black uppercase tracking-tighter text-2xl md:text-3xl py-6 hover:bg-white transition-all duration-300 shadow-[0_10px_40px_rgba(255,204,0,0.3)] border-b-8 border-black/20 hover:border-black/10 active:border-b-0 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          {kickservLoading ? '⏳ Submitting to Dispatch...' : '🧠 Get AI Estimate — Worden Brain Dispatch'}
        </button>

        <p className="mt-8 text-xs text-zinc-300 text-center italic font-bold uppercase tracking-widest">
          Authorized Kickserv® Dispatch Point • 4th-Gen Integrity Guaranteed
        </p>
      </form>
    </div>
  );
}
