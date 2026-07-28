import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/client';
import {
  AlertTriangle,
  ExternalLink,
  Loader2,
  Radar,
  RefreshCw,
  Settings2,
} from 'lucide-react';

/**
 * Commercial Bid Hunter — federal paving solicitations by state.
 *
 * Backed by /api/v1/hunter/commercial-bids (app/services/commercial_bid_hunter.py).
 *
 * WHAT THIS PAGE DELIBERATELY DOES NOT DO
 *
 * It does not fill an empty result with anything. The backend queries exactly
 * one source — the SAM.gov opportunities API — and that requires a registered
 * API key. Without the key it returns zero bids and reports `reason:
 * "not_configured"` per state, which this page surfaces as a setup banner
 * naming the missing key.
 *
 * That distinction matters more than it looks. "No bids found" and "we never
 * managed to ask" are the same empty table on screen, and a contractor who
 * reads the first when the truth is the second concludes there is no work out
 * there. So the two states are rendered differently and the degraded one is
 * never silent.
 *
 * The service previously invented one plausible federal solicitation per state
 * whenever the API call failed — which, with no key configured and a 1.5s
 * timeout, was every time. Those records are gone from the backend.
 */

const CORE_STATES = ['VA', 'MD', 'NC', 'DC', 'WV', 'GA', 'FL', 'PA', 'OH', 'TX'];

const PRESETS = [
  { id: 'core', label: 'Core territory', value: CORE_STATES.join(',') },
  { id: 'va', label: 'Virginia only', value: 'VA' },
  { id: 'all', label: 'All 51 territories', value: 'ALL' },
];

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function Stat({ label, value, tone = 'text-foreground' }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="font-display text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`font-display text-2xl mt-1 ${tone}`}>{value}</p>
    </div>
  );
}

export default function BidHunter() {
  const [preset, setPreset] = useState('core');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runHunt = useCallback(async (statesValue) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.huntCommercialBids(statesValue);
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err.message || 'Bid hunt failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const active = PRESETS.find((p) => p.id === preset);
    runHunt(active ? active.value : '');
  }, [preset, runHunt]);

  // A "not_configured" failure is a setup problem, not a search result. Separate
  // it from genuine network/HTTP failures so the fix shown is the right one.
  const failures = result?.failures || [];
  const notConfigured = failures.filter((f) => f.reason === 'not_configured');
  const otherFailures = failures.filter((f) => f.reason !== 'not_configured');
  const setupRequired = notConfigured.length > 0;

  const bids = result?.bids || [];

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Radar className="h-7 w-7 text-primary" />
              <h1 className="font-display text-3xl uppercase tracking-wide">
                Commercial Bid Hunter
              </h1>
            </div>
            <p className="font-body mt-2 max-w-2xl text-sm text-muted-foreground">
              Federal paving solicitations from SAM.gov, filtered to asphalt and
              paving scopes by state.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const active = PRESETS.find((p) => p.id === preset);
              runHunt(active ? active.value : '');
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 font-display text-sm uppercase tracking-wider disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className={`rounded-md border px-4 py-2 font-display text-xs uppercase tracking-wider transition-colors ${
                preset === p.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="font-body text-sm text-red-500">{error}</p>
          </div>
        )}

        {setupRequired && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
            <Settings2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-display text-sm uppercase tracking-wider text-amber-500">
                Bid hunter is not connected yet
              </p>
              <p className="font-body mt-1 text-sm text-muted-foreground">
                No results were retrieved because{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">SAM_GOV_API_KEY</code>{' '}
                is not set on the backend. This is a configuration step, not an
                empty market — register for a free production key at sam.gov and
                set it on the Fly app.
              </p>
              <a
                href="https://sam.gov/content/api-keys"
                target="_blank"
                rel="noreferrer"
                className="font-body mt-2 inline-flex items-center gap-1.5 text-sm text-primary underline"
              >
                Get a SAM.gov API key
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}

        {result && (
          <div className="mb-6 grid gap-4 sm:grid-cols-4">
            <Stat label="Bids found" value={result.total_discovered ?? 0} />
            <Stat label="States requested" value={result.states_requested ?? 0} />
            <Stat
              label="States reached"
              value={result.states_reached ?? 0}
              tone={result.states_reached ? 'text-green-500' : 'text-red-500'}
            />
            <Stat
              label="States failed"
              value={result.states_failed ?? 0}
              tone={result.states_failed ? 'text-amber-500' : 'text-foreground'}
            />
          </div>
        )}

        {result && (
          <p className="font-body mb-6 text-xs text-muted-foreground">
            Sources queried: {(result.sources_queried || []).join(', ') || 'none'}.
            {Array.isArray(result.sources_not_implemented) &&
              result.sources_not_implemented.length > 0 && (
                <> Not yet integrated: {result.sources_not_implemented.join(', ')}.</>
              )}
          </p>
        )}

        {loading && !result && (
          <div className="flex items-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-body text-sm">Querying SAM.gov…</span>
          </div>
        )}

        {result && bids.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border">
                  {['Project', 'Agency', 'State', 'Solicitation', 'Response due', ''].map((h) => (
                    <th
                      key={h}
                      className="pb-2 font-display text-[11px] uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bids.map((bid, i) => (
                  <tr key={bid.solicitation_number || i} className="border-b border-border/50">
                    <td className="py-3 pr-4 font-body text-sm">{bid.project_title || '—'}</td>
                    <td className="py-3 pr-4 font-body text-sm text-muted-foreground">
                      {bid.agency || '—'}
                    </td>
                    <td className="py-3 pr-4 font-body text-sm">{bid.state}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                      {bid.solicitation_number || '—'}
                    </td>
                    <td className="py-3 pr-4 font-body text-sm">
                      {formatDate(bid.response_deadline) || '—'}
                    </td>
                    <td className="py-3">
                      {bid.url && (
                        <a
                          href={bid.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-body text-sm text-primary underline"
                        >
                          Open
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Only claim "nothing out there" when we actually reached the source. */}
        {result && bids.length === 0 && !setupRequired && result.states_reached > 0 && (
          <p className="font-body py-10 text-sm text-muted-foreground">
            SAM.gov returned no matching paving solicitations for the selected
            states right now.
          </p>
        )}

        {otherFailures.length > 0 && (
          <div className="mt-8 rounded-lg border border-border bg-muted/40 p-4">
            <p className="font-display text-[11px] uppercase tracking-wider text-muted-foreground">
              States that could not be reached
            </p>
            <ul className="mt-2 space-y-1">
              {otherFailures.map((f) => (
                <li key={f.state} className="font-body text-sm text-muted-foreground">
                  <span className="text-foreground">{f.state}</span> — {f.reason}
                  {f.error ? `: ${f.error}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
