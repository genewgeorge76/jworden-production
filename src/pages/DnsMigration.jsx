import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Copy, ExternalLink, Printer, RotateCcw } from 'lucide-react';

const DOMAINS = [
  { domain: 'jwordenasphaltpaving.com', target: '/', priority: 'PRIMARY', notes: 'Root domain — must go live FIRST' },
  { domain: 'jwordensons.com', target: '/', priority: 'Brand Alias', notes: 'Redirects to root' },
  { domain: 'jwordenpaving.com', target: '/', priority: 'Brand Alias', notes: 'Redirects to root' },
  { domain: 'richmondvapaving.com', target: '/locations/richmond-va', priority: 'Geo — VA', notes: 'Richmond market' },
  { domain: 'chestervapaving.com', target: '/locations/chester-va', priority: 'Geo — VA', notes: 'HQ market' },
  { domain: 'midlothianpaving.com', target: '/locations/midlothian-va', priority: 'Geo — VA', notes: 'Midlothian market' },
  { domain: 'mechanicsvillepaving.com', target: '/locations/mechanicsville-va', priority: 'Geo — VA', notes: 'Mechanicsville market' },
  { domain: 'savannahpaving.com', target: '/locations/savannah-ga', priority: 'Geo — GA', notes: 'Savannah market' },
  { domain: 'atlantapavingpros.com', target: '/locations/atlanta-ga', priority: 'Geo — GA', notes: 'Atlanta market' },
  { domain: 'augustapaving.com', target: '/locations/augusta-ga', priority: 'Geo — GA', notes: 'Augusta market' },
  { domain: 'charlottepavingpros.com', target: '/locations/charlotte-nc', priority: 'Geo — NC', notes: 'Charlotte market' },
  { domain: 'raleighpavingpros.com', target: '/locations/raleigh-nc', priority: 'Geo — NC', notes: 'Raleigh market' },
  { domain: 'greensboropaving.com', target: '/locations/greensboro-nc', priority: 'Geo — NC', notes: 'Greensboro market' },
  { domain: 'charlestonpavingpros.com', target: '/locations/charleston-sc', priority: 'Geo — SC', notes: 'Charleston market' },
  { domain: 'columbiapavingpros.com', target: '/locations/columbia-sc', priority: 'Geo — SC', notes: 'Columbia market' },
  { domain: 'kansascitypavingpros.com', target: '/locations/kansas-city-mo', priority: 'Geo — MO', notes: 'Kansas City market' },
];

const STEPS = [
  { key: 'netlify_alias', label: 'Added as domain alias in Netlify' },
  { key: 'dns_updated', label: 'DNS records updated at registrar' },
  { key: 'dns_propagated', label: 'DNS resolves to Netlify (dig check)' },
  { key: 'ssl_issued', label: 'SSL certificate issued (green ✅)' },
  { key: 'redirect_tested', label: '301 redirect verified via curl' },
  { key: 'live_verified', label: 'Loads correctly in browser' },
];

const STORAGE_KEY = 'jworden-dns-migration-v1';

export default function DnsMigration() {
  const [progress, setProgress] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setProgress(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const toggle = (domain, step) => {
    setProgress((p) => ({
      ...p,
      [domain]: { ...(p[domain] || {}), [step]: !(p[domain]?.[step]) },
    }));
  };

  const resetAll = () => {
    if (confirm('Reset all progress? This cannot be undone.')) {
      setProgress({});
    }
  };

  const copyCurl = (domain) => {
    const cmd = `curl -IL https://${domain}/`;
    navigator.clipboard.writeText(cmd);
  };

  const domainCompletion = (domain) => {
    const p = progress[domain] || {};
    const done = STEPS.filter((s) => p[s.key]).length;
    return { done, total: STEPS.length, pct: Math.round((done / STEPS.length) * 100) };
  };

  const overallDone = DOMAINS.reduce((sum, d) => sum + domainCompletion(d.domain).done, 0);
  const overallTotal = DOMAINS.length * STEPS.length;
  const overallPct = Math.round((overallDone / overallTotal) * 100);

  return (
    <div className="min-h-screen bg-background font-body p-6 lg:p-10 print:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="border-b border-border pb-8 mb-8 print:pb-4 print:mb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">
                // DNS Migration Control Center
              </p>
              <h1 className="font-display font-black text-foreground text-3xl md:text-5xl uppercase tracking-tight leading-[0.95]">
                16 Domains → Netlify
              </h1>
              <p className="font-body text-muted-foreground text-base mt-4 max-w-2xl">
                Per-domain checklist for migrating all vanity domains to the `doooone` Netlify project. Progress auto-saves to this browser.
              </p>
            </div>

            <div className="flex gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 border border-border px-4 py-2 font-display text-xs tracking-wider uppercase text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={resetAll}
                className="flex items-center gap-2 border border-border px-4 py-2 font-display text-xs tracking-wider uppercase text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>

          {/* Overall progress */}
          <div className="mt-8 bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-display text-xs tracking-[0.2em] uppercase text-muted-foreground">
                Overall Progress
              </p>
              <p className="font-display font-bold text-primary text-sm">
                {overallDone} / {overallTotal} steps · {overallPct}%
              </p>
            </div>
            <div className="h-2 bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick reference */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
          <div className="bg-card border border-border p-5">
            <p className="font-display text-primary text-xs tracking-[0.2em] uppercase mb-3">
              Netlify A Record (apex)
            </p>
            <code className="font-mono text-foreground text-sm block bg-muted p-3">75.2.60.5</code>
          </div>
          <div className="bg-card border border-border p-5">
            <p className="font-display text-primary text-xs tracking-[0.2em] uppercase mb-3">
              Netlify CNAME (www)
            </p>
            <code className="font-mono text-foreground text-sm block bg-muted p-3">doooone.netlify.app</code>
          </div>
        </div>

        {/* Domain cards */}
        <div className="space-y-4">
          {DOMAINS.map((d) => {
            const { done, total, pct } = domainCompletion(d.domain);
            const isPrimary = d.priority === 'PRIMARY';
            const isComplete = done === total;

            return (
              <div
                key={d.domain}
                className={`border ${
                  isPrimary
                    ? 'border-primary/60 bg-primary/5'
                    : isComplete
                    ? 'border-green-500/40 bg-green-500/5'
                    : 'border-border bg-card'
                } p-5 print:break-inside-avoid`}
              >
                {/* Domain header */}
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h2 className="font-display font-black text-foreground text-lg md:text-xl tracking-tight">
                        {d.domain}
                      </h2>
                      <span
                        className={`font-display text-[10px] tracking-[0.2em] uppercase px-2 py-1 ${
                          isPrimary
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {d.priority}
                      </span>
                      {isComplete && (
                        <span className="font-display text-[10px] tracking-[0.2em] uppercase px-2 py-1 bg-green-500 text-white">
                          ✓ Complete
                        </span>
                      )}
                    </div>
                    <p className="font-body text-muted-foreground text-sm">
                      Redirects to: <span className="font-mono text-foreground">{d.target}</span>
                    </p>
                    <p className="font-body text-muted-foreground text-xs mt-1">{d.notes}</p>
                  </div>

                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      onClick={() => copyCurl(d.domain)}
                      title="Copy curl test command"
                      className="flex items-center gap-1.5 border border-border px-3 py-1.5 font-display text-[10px] tracking-wider uppercase text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                    >
                      <Copy className="w-3 h-3" /> curl
                    </button>
                    <a
                      href={`https://${d.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 border border-border px-3 py-1.5 font-display text-[10px] tracking-wider uppercase text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Open
                    </a>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-display text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                      {done} / {total}
                    </p>
                    <p className="font-display text-[10px] tracking-wider text-muted-foreground">
                      {pct}%
                    </p>
                  </div>
                  <div className="h-1 bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isComplete ? 'bg-green-500' : 'bg-primary'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {STEPS.map((s) => {
                    const checked = progress[d.domain]?.[s.key] || false;
                    return (
                      <button
                        key={s.key}
                        onClick={() => toggle(d.domain, s.key)}
                        className={`flex items-start gap-2 text-left p-2.5 border transition-colors ${
                          checked
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        {checked ? (
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`font-body text-xs leading-snug ${
                            checked ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {s.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer notes */}
        <div className="mt-10 border-t border-border pt-6 print:hidden">
          <p className="font-display text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">
            Migration Order
          </p>
          <ol className="space-y-2 text-sm text-muted-foreground font-body list-decimal list-inside">
            <li>Start with <span className="text-primary font-bold">jwordenasphaltpaving.com</span> (PRIMARY) — must be fully live before anything else.</li>
            <li>Once primary resolves + SSL green, test ONE vanity domain end-to-end.</li>
            <li>Only after vanity #1 fully works, batch-migrate the remaining 15.</li>
            <li>Run <code className="text-foreground font-mono">curl -IL https://[domain]/</code> to verify each 301 before marking complete.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
