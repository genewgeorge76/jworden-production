import React, { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X, Mail, Sparkles, Download } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { api } from '@/api/client';

/**
 * PlansInbox — drop civil/GC plans, blueprints, permits, or sketches and get
 * a priced estimate back. Built for backlogged plan emails — drag a batch in,
 * watch each one parse, then send the estimate to yourself or the customer.
 *
 * Pipeline:
 *   1. User drops 1–8 files (PDF or image)
 *   2. POST /api/v1/plan-estimator/from-files
 *   3. Backend parses each via document_intelligence, prices via cost catalog
 *   4. Display low/mid/high estimate + line-by-line breakdown
 */

const MAX_FILES = 8;
const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.webp,.gif,application/pdf,image/*';

const fmtMoney = (n) => `$${Math.round(Number(n) || 0).toLocaleString()}`;

export default function PlansInbox() {
  const [files, setFiles] = useState([]);
  const [contact, setContact] = useState({ name: '', email: '', address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const addFiles = useCallback((incoming) => {
    setError('');
    const arr = Array.from(incoming || []);
    const next = [...files];
    for (const f of arr) {
      if (next.length >= MAX_FILES) {
        setError(`Max ${MAX_FILES} files per batch.`);
        break;
      }
      if (f.size > MAX_BYTES) {
        setError(`${f.name} exceeds 20 MB.`);
        continue;
      }
      if (!next.some((existing) => existing.name === f.name && existing.size === f.size)) {
        next.push(f);
      }
    }
    setFiles(next);
  }, [files]);

  const removeFile = useCallback((idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!files.length) { setError('Add at least one plan file.'); return; }
    setSubmitting(true);
    setError('');
    setEstimate(null);
    try {
      const result = await api.estimateFromPlans(files, contact);
      setEstimate(result);
    } catch (ex) {
      setError(ex.message || 'Failed to process plans. Try again or email plans@jwordenasphaltpaving.com.');
    } finally {
      setSubmitting(false);
    }
  }, [files, contact]);

  const downloadEstimate = useCallback(() => {
    if (!estimate) return;
    const txt = [
      'J. WORDEN & SONS — PLAN ESTIMATE',
      '================================',
      `Date: ${new Date().toLocaleString()}`,
      contact.name && `Customer: ${contact.name}`,
      contact.email && `Email: ${contact.email}`,
      contact.address && `Project Address: ${contact.address}`,
      `Files parsed: ${estimate.files_parsed}`,
      `Total measured area: ${estimate.estimated_total_sqft.toLocaleString()} sqft`,
      '',
      'SCOPE SUMMARY',
      '-------------',
      estimate.scope_summary || '(none extracted)',
      '',
      'LINE ITEMS',
      '----------',
      ...estimate.line_items.map((l) =>
        `${l.label.padEnd(34)}${l.quantity.toString().padStart(8)} ${l.unit.padEnd(5)} @ ${fmtMoney(l.unit_price).padStart(10)} = ${fmtMoney(l.extended).padStart(12)}`
      ),
      '',
      `Subtotal: ${fmtMoney(estimate.subtotal)}`,
      `Range:    ${fmtMoney(estimate.low)}  —  ${fmtMoney(estimate.high)}`,
      `Mid:      ${fmtMoney(estimate.mid)} (with ${(estimate.contingency_pct * 100).toFixed(0)}% contingency)`,
      '',
      'NOTES',
      '-----',
      ...(estimate.notes || []),
      '',
      'Final price requires on-site walk. This estimate is auto-generated from',
      'the plans provided and is non-binding. Contact: (804) 555-PAVE.',
    ].filter(Boolean).join('\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estimate-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [estimate, contact]);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <SEO
        title="Plans Inbox — Email or Drop Your Plans for an Instant Estimate | J. Worden & Sons"
        description="Upload civil site plans, GC blueprints, permits, or hand sketches. Our AI parses the scope and returns a priced estimate covering asphalt, concrete, curb, drainage, and striping."
        canonicalPath="/plans-inbox"
      />
      <Navbar />

      <main className="bg-gradient-to-b from-slate-50 to-white">
        <section className="border-b border-slate-200 bg-brand-navy text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-brand-amber" />
              <span className="font-display text-xs uppercase tracking-[0.22em] text-brand-amber">Plans Inbox</span>
            </div>
            <h1 className="font-display font-black text-3xl md:text-5xl leading-tight">
              Email or drop your plans. Get a priced estimate in minutes.
            </h1>
            <p className="text-white/70 max-w-2xl mt-4 text-base md:text-lg">
              Civil site plans, GC blueprints, permit packets, or a phone photo of a sketch — drop them here. Our AI parses scope (asphalt, concrete, curb, drainage, ADA, striping) and returns a priced estimate against our live cost catalog.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1.5">Up to 8 files / batch</span>
              <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1.5">PDF, JPG, PNG, WebP</span>
              <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1.5">20 MB / file</span>
              <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1.5">No login required</span>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14 grid md:grid-cols-2 gap-8 items-start">
          {/* Left: uploader */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`rounded-3xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
                dragOver ? 'border-brand-amber bg-brand-amber/10' : 'border-slate-300 bg-white hover:border-slate-400'
              }`}
            >
              <Upload className="w-10 h-10 text-brand-amber mx-auto mb-3" />
              <p className="font-display font-bold text-brand-navy">Drop plan files here</p>
              <p className="text-sm text-slate-500 mt-1">or click to browse — PDF, JPG, PNG, WebP</p>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-brand-navy truncate">{f.name}</p>
                      <p className="text-xs text-slate-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Your name"
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                className="rounded-xl border border-slate-200 px-3 py-3 text-sm focus:ring-2 focus:ring-brand-amber outline-none"
              />
              <input
                type="email"
                placeholder="Email (for the estimate)"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                className="rounded-xl border border-slate-200 px-3 py-3 text-sm focus:ring-2 focus:ring-brand-amber outline-none"
              />
            </div>
            <input
              type="text"
              placeholder="Project address (optional)"
              value={contact.address}
              onChange={(e) => setContact({ ...contact, address: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm focus:ring-2 focus:ring-brand-amber outline-none"
            />
            <textarea
              placeholder="Notes for the estimator (deadlines, special access, anything not in the plans)"
              value={contact.notes}
              onChange={(e) => setContact({ ...contact, notes: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm focus:ring-2 focus:ring-brand-amber outline-none"
            />

            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || files.length === 0}
              className="w-full bg-brand-amber text-brand-navy font-black py-4 rounded-xl uppercase tracking-widest hover:bg-brand-amber/90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {submitting ? `Parsing ${files.length} file${files.length === 1 ? '' : 's'}…` : 'Generate priced estimate'}
            </button>

            <p className="text-xs text-slate-500 text-center">
              Or forward plans to <span className="font-bold text-brand-navy">plans@jwordenasphaltpaving.com</span> once inbound email is wired.
            </p>
          </form>

          {/* Right: results */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm min-h-[400px]">
            {!estimate && !submitting && (
              <div className="text-center text-slate-400 py-16">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-display font-bold text-slate-500">Drop plans on the left</p>
                <p className="text-sm mt-1">Your priced estimate will appear here.</p>
              </div>
            )}
            {submitting && (
              <div className="text-center py-16">
                <Loader2 className="w-12 h-12 mx-auto mb-3 text-brand-amber animate-spin" />
                <p className="font-display font-bold text-brand-navy">Reading your plans…</p>
                <p className="text-sm text-slate-500 mt-1">Vision parse + scope analysis + cost lookup. Up to ~30s per file.</p>
              </div>
            )}
            {estimate && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Estimate ready</span>
                    </div>
                    <h2 className="font-display font-black text-3xl text-brand-navy">
                      {fmtMoney(estimate.low)} – {fmtMoney(estimate.high)}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Mid: {fmtMoney(estimate.mid)} • {estimate.estimated_total_sqft.toLocaleString()} sqft
                    </p>
                  </div>
                  <button onClick={downloadEstimate} className="text-xs font-bold uppercase tracking-widest text-brand-navy bg-brand-amber/20 hover:bg-brand-amber/30 px-3 py-2 rounded-lg flex items-center gap-1">
                    <Download className="w-3 h-3" /> .txt
                  </button>
                </div>

                {estimate.scope_summary && (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Scope detected</p>
                    <p className="text-sm text-slate-700">{estimate.scope_summary}</p>
                  </div>
                )}

                {estimate.line_items?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Line items</p>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left px-3 py-2 font-bold text-slate-600">Item</th>
                            <th className="text-right px-3 py-2 font-bold text-slate-600">Qty</th>
                            <th className="text-right px-3 py-2 font-bold text-slate-600">Rate</th>
                            <th className="text-right px-3 py-2 font-bold text-slate-600">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estimate.line_items.map((l, i) => (
                            <tr key={`${l.sku}-${i}`} className="border-t border-slate-100">
                              <td className="px-3 py-2 text-slate-800">{l.label}</td>
                              <td className="px-3 py-2 text-right text-slate-600">{l.quantity.toLocaleString()} {l.unit}</td>
                              <td className="px-3 py-2 text-right text-slate-600">{fmtMoney(l.unit_price)}</td>
                              <td className="px-3 py-2 text-right font-bold text-brand-navy">{fmtMoney(l.extended)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50">
                          <tr>
                            <td colSpan={3} className="px-3 py-2 text-right font-bold text-slate-700">Subtotal</td>
                            <td className="px-3 py-2 text-right font-black text-brand-navy">{fmtMoney(estimate.subtotal)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {estimate.notes?.length > 0 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-1">Notes</p>
                    <ul className="text-xs text-amber-900 space-y-1 list-disc list-inside">
                      {estimate.notes.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Link to="/quote" className="flex-1 text-center bg-brand-navy text-white font-bold py-3 rounded-xl text-sm uppercase tracking-widest hover:bg-brand-navy/90">
                    Request site walk
                  </Link>
                  <button onClick={() => { setEstimate(null); setFiles([]); }} className="flex-1 text-center border border-slate-300 text-slate-700 font-bold py-3 rounded-xl text-sm uppercase tracking-widest hover:bg-slate-50">
                    New batch
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  Auto-generated from the plans provided. Final price requires an on-site walk. Non-binding.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
