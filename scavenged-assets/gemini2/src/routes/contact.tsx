import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useSeo } from '../lib/useSeo';
import SectionBackdrop from '../components/SectionBackdrop';
import { PHONE_DISPLAY as PHONE, PHONE_HREF, ADDRESS, HOURS_DISPLAY } from '../lib/businessInfo';

export const Route = createFileRoute('/contact')({
  component: ContactPage,
});

/** FastAPI lead webhook (standalone repo). Empty string = disabled. */
const LEADS_API_URL = (import.meta.env.VITE_LEADS_API_URL as string | undefined) ?? '';

type Status = 'idle' | 'sending' | 'sent' | 'error';

function ContactPage() {
  useSeo({
    title: 'Contact J. Worden & Sons',
    description:
      'Request an asphalt paving estimate in Virginia, Maryland, or the Mid-Atlantic. Call 804-446-1296 or use the form. A J. Worden picks up.',
    path: '/contact',
  });

  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = new FormData(form);

    const firstName = String(data.get('firstName') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const jobDescription = String(data.get('jobDescription') || '').trim();

    if (!firstName || !phone || !jobDescription) {
      setStatus('error');
      setErrorMsg('Please include at least your first name, phone, and a short description.');
      return;
    }

    // Honeypot — bots fill this; humans don't see it.
    if (data.get('bot-field')) {
      setStatus('sent');
      return;
    }

    // Encode for Netlify Forms (application/x-www-form-urlencoded).
    const params = new URLSearchParams();
    params.append('form-name', 'contact');
    for (const [k, v] of data.entries()) {
      params.append(k, typeof v === 'string' ? v : '');
    }

    try {
      // 1) Netlify Forms (always on — customer-safe persistent log)
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      // 2) Mirror the lead to the FastAPI ops backend (best-effort, non-blocking)
      if (LEADS_API_URL) {
        const payload: Record<string, string> = {};
        for (const [k, v] of data.entries()) payload[k] = typeof v === 'string' ? v : '';
        payload.source = 'gemni-investigate';
        payload.path = '/contact';
        // Fire-and-forget; if backend is down the customer's lead is still safe in Netlify Forms.
        void fetch(LEADS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => undefined);
      }

      setStatus('sent');
      const w = window as unknown as { gtag?: (...args: unknown[]) => void };
      if (w.gtag) {
        w.gtag('event', 'generate_lead', { event_category: 'contact_form', event_label: 'netlify_forms' });
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please call us instead.');
    }
  }

  return (
    <main className="bg-premium-black grain text-white antialiased">
      <section className="relative isolate overflow-hidden border-b border-white/[0.04]">
        <SectionBackdrop video="/video/bg-reviews.mp4" opacity={0.6} />
        <div className="relative mx-auto max-w-7xl px-6 py-32 md:py-40">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-white/80">Contact</p>
          <h1 className="max-w-4xl text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl">
            Tell us about the job.
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-white/60 md:text-xl">
            Fastest way to a real number is a phone call. If after-hours, leave details below and we&rsquo;ll respond
            the next business day.
          </p>
        </div>
      </section>

      <section className="border-b border-white/[0.04]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 py-24 lg:grid-cols-[1fr_1.4fr]">
          {/* LEFT: contact details */}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">Direct line</p>
            <a
              href={PHONE_HREF}
              className="mt-3 block text-3xl font-medium tracking-tight text-white hover:text-white/80 md:text-4xl"
            >
              {PHONE}
            </a>
            <p className="mt-2 text-sm text-white/80">{HOURS_DISPLAY}</p>

            <div className="mt-12 border-t border-white/10 pt-10">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">Headquarters</p>
              <p className="mt-3 text-base text-white">{ADDRESS.streetAddress}</p>
              <p className="text-base text-white">{ADDRESS.addressLocality}, {ADDRESS.addressRegion} {ADDRESS.postalCode}</p>
            </div>

            <div className="mt-10 border-t border-white/10 pt-10">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">Credentials</p>
              <ul className="mt-4 space-y-2 text-sm text-white/60">
                <li>Class A Virginia Contractor</li>
                <li>BBB Accredited &middot; A+ Rating</li>
                <li>NASCLA Certified</li>
                <li>4-Time Best of Houzz</li>
              </ul>
            </div>
          </div>

          {/* RIGHT: form */}
          <div>
            {status === 'sent' ? (
              <div className="rounded-lg border border-white/15 bg-white/[0.02] p-10">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">Received</p>
                <h2 className="mt-3 text-3xl font-medium tracking-tight">Thank you. We&rsquo;ll be in touch.</h2>
                <p className="mt-4 text-white/60">
                  If it&rsquo;s urgent, please call <a href={PHONE_HREF} className="text-white underline">{PHONE}</a>.
                </p>
                <Link
                  to="/"
                  className="mt-8 inline-block rounded-full border border-white/20 px-5 py-2 text-sm hover:bg-white/5"
                >
                  &larr; Back to home
                </Link>
              </div>
            ) : (
              <form
                name="contact"
                method="POST"
                data-netlify="true"
                data-netlify-honeypot="bot-field"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <input type="hidden" name="form-name" value="contact" />
                <p hidden>
                  <label>
                    Don&rsquo;t fill this out: <input name="bot-field" />
                  </label>
                </p>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Field name="firstName" label="First name" required autoComplete="given-name" />
                  <Field name="lastName" label="Last name" autoComplete="family-name" />
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Field name="phone" label="Phone" required type="tel" autoComplete="tel" />
                  <Field name="email" label="Email" type="email" autoComplete="email" />
                </div>
                <Field name="serviceAddress" label="Service address" autoComplete="street-address" />
                <FieldArea name="jobDescription" label="Job description" required rows={5} placeholder="Driveway, parking lot, sealcoat, square footage, timing…" />

                {status === 'error' && (
                  <p className="text-sm text-red-400">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-50"
                >
                  {status === 'sending' ? 'Sending…' : 'Request estimate'}
                </button>
                <p className="text-xs text-white/75">
                  Or call {PHONE} for the fastest response.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  name,
  label,
  required,
  type = 'text',
  autoComplete,
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/80">
        {label}
        {required && <span className="ml-1 text-white/70">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="mt-2 block w-full rounded-md border border-white/15 bg-black px-4 py-3 text-base text-white placeholder-white/30 outline-none transition focus:border-white/40"
      />
    </label>
  );
}

function FieldArea({
  name,
  label,
  required,
  rows = 4,
  placeholder,
}: {
  name: string;
  label: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/80">
        {label}
        {required && <span className="ml-1 text-white/70">*</span>}
      </span>
      <textarea
        name={name}
        required={required}
        rows={rows}
        placeholder={placeholder}
        className="mt-2 block w-full rounded-md border border-white/15 bg-black px-4 py-3 text-base text-white placeholder-white/30 outline-none transition focus:border-white/40"
      />
    </label>
  );
}
