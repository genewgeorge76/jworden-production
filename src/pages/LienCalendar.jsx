import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Save,
} from 'lucide-react';

/**
 * Mechanics Lien Deadline Calendar.
 *
 * Backed by /api/v1/liens/* (app/services/lien_calendar.py on the Fly backend).
 *
 * WHAT THIS PAGE IS CAREFUL ABOUT
 *
 * A mechanics lien is a statutory right that expires. Miss the filing window by
 * one day and the claim is gone — there is no appeal for a late lien. So the one
 * thing this page must never do is show a confident date it cannot stand behind.
 *
 * The backend has researched statutes for 13 states. For the other 38 it applies
 * generic fallback timing and sets `used_default_rules: true` on the response.
 * That flag drives the prominent warning below. It is deliberately loud and
 * deliberately not dismissible: a contractor glancing at this screen has to be
 * able to tell "we know Virginia" from "we guessed Wyoming" without reading
 * anything else on the page.
 *
 * The covered-state list is fetched from the backend rather than hardcoded here,
 * so adding a state to lien_calendar.py updates this UI with no frontend change.
 * If that endpoint is unavailable the coverage strip simply hides — the
 * per-result `used_default_rules` flag is the authoritative signal either way.
 */

const STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID',
  'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO',
  'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA',
  'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Whole days from now until an ISO date, or null.
 *
 * Needed because the two backend endpoints do not agree on field names, and
 * neither returns a countdown for the preliminary notice on /calculate:
 *
 *   /liens/calculate  →  days_until_lien_deadline, days_until_foreclosure_deadline
 *                        (no preliminary-notice countdown at all)
 *   /liens/upcoming   →  days_until_lien, days_until_prelim
 *
 * Rather than guess a name and silently render "No deadline returned" over a
 * date that is right there, derive the countdown from the date when the server
 * did not supply one.
 */
function daysUntil(iso) {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((target.getTime() - Date.now()) / msPerDay);
}

/** Urgency banding for a countdown. Null days => unknown, styled neutral. */
function urgency(days) {
  if (days === null || days === undefined) {
    return { color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' };
  }
  if (days < 0) {
    return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/40' };
  }
  if (days <= 14) {
    return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/40' };
  }
  if (days <= 45) {
    return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/40' };
  }
  return { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/40' };
}

function countdownLabel(days) {
  if (days === null || days === undefined) return 'No deadline returned';
  if (days < 0) return `${Math.abs(days)} days PAST DUE`;
  if (days === 0) return 'Due today';
  return `${days} days remaining`;
}

function DeadlineCard({ label, date, days, hint }) {
  const tone = urgency(days);
  const pretty = formatDate(date);

  return (
    <div className={`rounded-lg border ${tone.border} ${tone.bg} p-4`}>
      <p className="font-display text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`font-display text-2xl mt-1 ${pretty ? tone.color : 'text-muted-foreground'}`}>
        {pretty || 'Not required'}
      </p>
      {pretty && (
        <p className={`font-body text-xs mt-1 ${tone.color}`}>{countdownLabel(days)}</p>
      )}
      {!pretty && hint && (
        <p className="font-body text-xs mt-1 text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export default function LienCalendar() {
  const [form, setForm] = useState({
    state_code: 'VA',
    project_start_date: todayISO(),
    last_furnishing_date: todayISO(),
    customer_name: '',
    project_address: '',
    notes: '',
  });

  const [result, setResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [error, setError] = useState(null);

  const [coveredStates, setCoveredStates] = useState(null);
  const [upcoming, setUpcoming] = useState(null);
  const [upcomingError, setUpcomingError] = useState(null);

  const setField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setSavedId(null);
  };

  // Coverage list is advisory only — hide the strip if the backend does not
  // expose it rather than falling back to a hardcoded copy that could drift.
  useEffect(() => {
    let cancelled = false;
    api
      .getLienStateCoverage()
      .then((data) => {
        if (!cancelled && Array.isArray(data?.researched_states)) {
          setCoveredStates(data.researched_states);
        }
      })
      .catch(() => {
        /* Coverage strip stays hidden; used_default_rules still governs. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadUpcoming = useCallback(async () => {
    try {
      const data = await api.getUpcomingLienDeadlines({ days_ahead: 60 });
      setUpcoming(data);
      setUpcomingError(null);
    } catch (err) {
      setUpcoming(null);
      setUpcomingError(err.message || 'Could not load tracked deadlines');
    }
  }, []);

  useEffect(() => {
    loadUpcoming();
  }, [loadUpcoming]);

  const handleCalculate = async (event) => {
    event.preventDefault();
    setCalculating(true);
    setError(null);
    setSavedId(null);
    try {
      const data = await api.calculateLienDeadlines({
        state_code: form.state_code,
        project_start_date: form.project_start_date,
        last_furnishing_date: form.last_furnishing_date,
      });
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err.message || 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  const handleTrack = async () => {
    if (!form.customer_name.trim() || !form.project_address.trim()) {
      setError('Customer name and project address are required to track a project.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const data = await api.trackLienProject({
        customer_name: form.customer_name.trim(),
        project_address: form.project_address.trim(),
        state_code: form.state_code,
        project_start_date: form.project_start_date,
        last_furnishing_date: form.last_furnishing_date,
        notes: form.notes.trim() || null,
      });
      setSavedId(data.id);
      setResult(data);
      loadUpcoming();
    } catch (err) {
      setError(err.message || 'Could not save this project');
    } finally {
      setSaving(false);
    }
  };

  const isDefaultRules = result?.used_default_rules === true;

  const stateIsResearched = useMemo(() => {
    if (!coveredStates) return null;
    return coveredStates.includes(form.state_code);
  }, [coveredStates, form.state_code]);

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-7 w-7 text-primary" />
            <h1 className="font-display text-3xl uppercase tracking-wide">
              Mechanics Lien Calendar
            </h1>
          </div>
          <p className="font-body mt-2 max-w-2xl text-sm text-muted-foreground">
            Enter the project dates and state to calculate preliminary notice, lien
            filing, and foreclosure deadlines. Save a project to keep its deadlines
            on the tracked list below.
          </p>
        </header>

        {coveredStates && (
          <div className="mb-6 rounded-lg border border-border bg-muted/40 p-4">
            <p className="font-display text-[11px] uppercase tracking-wider text-muted-foreground">
              Researched statutes on file ({coveredStates.length} states)
            </p>
            <p className="font-body mt-1 text-sm">{coveredStates.join(' · ')}</p>
            <p className="font-body mt-2 text-xs text-muted-foreground">
              Any state not listed uses generic fallback timing and is flagged on the
              result.
            </p>
          </div>
        )}

        <form
          onSubmit={handleCalculate}
          className="rounded-xl border border-border bg-card p-5 sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="font-display text-[11px] uppercase tracking-wider text-muted-foreground">
                State
              </span>
              <select
                value={form.state_code}
                onChange={setField('state_code')}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-body text-sm"
              >
                {STATE_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                    {coveredStates && !coveredStates.includes(code) ? '  (fallback rules)' : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="font-display text-[11px] uppercase tracking-wider text-muted-foreground">
                Project start date
              </span>
              <input
                type="date"
                required
                value={form.project_start_date}
                onChange={setField('project_start_date')}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-body text-sm"
              />
            </label>

            <label className="block">
              <span className="font-display text-[11px] uppercase tracking-wider text-muted-foreground">
                Last furnishing date
              </span>
              <input
                type="date"
                required
                value={form.last_furnishing_date}
                onChange={setField('last_furnishing_date')}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-body text-sm"
              />
            </label>
          </div>

          {stateIsResearched === false && (
            <p className="font-body mt-3 flex items-start gap-2 text-xs text-amber-500">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              No researched statute on file for {form.state_code}. The result will use
              generic fallback timing.
            </p>
          )}

          <button
            type="submit"
            disabled={calculating}
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 font-display text-sm uppercase tracking-wider text-primary-foreground disabled:opacity-60"
          >
            {calculating && <Loader2 className="h-4 w-4 animate-spin" />}
            Calculate deadlines
          </button>
        </form>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="font-body text-sm text-red-500">{error}</p>
          </div>
        )}

        {result && (
          <section className="mt-6">
            {isDefaultRules && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <p className="font-display text-sm uppercase tracking-wider text-amber-500">
                    Fallback rules — not {result.state_code} statute
                  </p>
                  <p className="font-body mt-1 text-sm text-muted-foreground">
                    We do not have {result.state_code} mechanics lien law on file. These
                    dates come from generic timing and may be wrong for this state. Confirm
                    with a licensed attorney in {result.state_code} before relying on them.
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <DeadlineCard
                label="Preliminary notice"
                date={result.preliminary_notice_deadline}
                days={daysUntil(result.preliminary_notice_deadline)}
                hint="No preliminary notice required in this state"
              />
              <DeadlineCard
                label="Lien filing"
                date={result.lien_filing_deadline}
                days={
                  result.days_until_lien_deadline ??
                  daysUntil(result.lien_filing_deadline)
                }
              />
              <DeadlineCard
                label="Foreclosure"
                date={result.foreclosure_deadline}
                days={
                  result.days_until_foreclosure_deadline ??
                  daysUntil(result.foreclosure_deadline)
                }
              />
            </div>

            {result.state_notes && (
              <p className="font-body mt-4 rounded-lg border border-border bg-muted/40 p-4 text-sm">
                {result.state_notes}
              </p>
            )}

            {result.disclaimer && (
              <p className="font-body mt-3 text-xs text-muted-foreground">
                {result.disclaimer}
              </p>
            )}

            <div className="mt-6 rounded-xl border border-border bg-card p-5">
              <p className="font-display text-[11px] uppercase tracking-wider text-muted-foreground">
                Track this project
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="font-body text-xs text-muted-foreground">Customer name</span>
                  <input
                    value={form.customer_name}
                    onChange={setField('customer_name')}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-body text-sm"
                  />
                </label>
                <label className="block">
                  <span className="font-body text-xs text-muted-foreground">Project address</span>
                  <input
                    value={form.project_address}
                    onChange={setField('project_address')}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-body text-sm"
                  />
                </label>
              </div>
              <label className="mt-4 block">
                <span className="font-body text-xs text-muted-foreground">Notes (optional)</span>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={setField('notes')}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-body text-sm"
                />
              </label>

              <button
                type="button"
                onClick={handleTrack}
                disabled={saving}
                className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 font-display text-sm uppercase tracking-wider disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save to calendar
              </button>

              {savedId && (
                <p className="font-body mt-3 flex items-center gap-2 text-sm text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  Tracked as entry #{savedId}.
                </p>
              )}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-display text-lg uppercase tracking-wide">
            Tracked deadlines — next 60 days
          </h2>

          {upcomingError && (
            <p className="font-body mt-3 text-sm text-muted-foreground">{upcomingError}</p>
          )}

          {!upcomingError && upcoming && upcoming.count === 0 && (
            <p className="font-body mt-3 text-sm text-muted-foreground">
              No tracked projects have deadlines in the next 60 days.
            </p>
          )}

          {!upcomingError && upcoming && upcoming.count > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border">
                    {['Customer', 'Project', 'State', 'Lien filing', 'Days'].map((h) => (
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
                  {upcoming.entries.map((entry) => {
                    // /liens/upcoming names this days_until_lien, not
                    // days_until_lien_deadline as /liens/calculate does.
                    const days = entry.days_until_lien ?? daysUntil(entry.lien_filing_deadline);
                    const tone = urgency(days);
                    return (
                      <tr key={entry.id} className="border-b border-border/50">
                        <td className="py-3 font-body text-sm">{entry.customer_name}</td>
                        <td className="py-3 font-body text-sm text-muted-foreground">
                          {entry.project_address}
                        </td>
                        <td className="py-3 font-body text-sm">{entry.state_code}</td>
                        <td className="py-3 font-body text-sm">
                          {formatDate(entry.lien_filing_deadline) || '—'}
                        </td>
                        <td className={`py-3 font-body text-sm ${tone.color}`}>
                          {countdownLabel(days)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
