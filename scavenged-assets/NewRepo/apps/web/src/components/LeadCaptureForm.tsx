import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { BUSINESS_PHONE } from '@jworden/core';

interface FormData {
  name: string;
  phone: string;
  email: string;
  service: string;
  address: string;
  message: string;
}

const SERVICES = [
  'Asphalt Paving — Residential',
  'Asphalt Paving — Commercial',
  'Parking Lot Paving',
  'Sealcoating',
  'Crack Filling',
  'Line Striping',
  'Concrete Work',
  'Grading & Excavation',
  'Other',
];

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function LeadCaptureForm({ compact = false }: { compact?: boolean }) {
  const [form, setForm] = useState<FormData>({ name: '', phone: '', email: '', service: '', address: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setStatus('submitting');
    try {
      const res = await fetch('/.netlify/functions/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'web-form', submittedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle className="text-green-400" size={40} />
        <h3 className="text-white font-bold text-lg">Request received!</h3>
        <p className="text-zinc-400 text-sm">We'll call you within 1 business hour. Or reach us now at{' '}
          <a href={`tel:+1${BUSINESS_PHONE.replace(/\D/g, '')}`} className="text-yellow-400">{BUSINESS_PHONE}</a>.
        </p>
      </div>
    );
  }

  const inputCls = 'w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-yellow-500 transition-colors';
  const labelCls = 'block text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-1';

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <div>
          <label className={labelCls}>Name *</label>
          <input required type="text" placeholder="John Smith" value={form.name} onChange={set('name')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Phone *</label>
          <input required type="tel" placeholder="(804) 555-0100" value={form.phone} onChange={set('phone')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" placeholder="you@email.com" value={form.email} onChange={set('email')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Service needed</label>
          <select value={form.service} onChange={set('service')} className={inputCls + ' cursor-pointer'}>
            <option value="">Select a service…</option>
            {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {!compact && (
        <div>
          <label className={labelCls}>Project address</label>
          <input type="text" placeholder="123 Main St, Richmond, VA" value={form.address} onChange={set('address')} className={inputCls} />
        </div>
      )}

      <div>
        <label className={labelCls}>Project details</label>
        <textarea
          rows={compact ? 2 : 3}
          placeholder="Describe your project: size, current condition, timeline…"
          value={form.message}
          onChange={set('message')}
          className={inputCls + ' resize-none'}
        />
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={14} /> {error || 'Something went wrong. Please call us directly.'}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold px-6 py-3 rounded transition-colors text-sm"
      >
        {status === 'submitting' ? 'Sending…' : (
          <><Send size={14} /> Get My Free Estimate</>
        )}
      </button>
    </form>
  );
}
