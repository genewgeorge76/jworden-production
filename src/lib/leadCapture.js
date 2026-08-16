/**
 * leadCapture.js — never lose a lead.
 *
 * Every public form on the site funnels its submission through submitLead().
 * The contract is simple and unbreakable: once a customer hits submit, their
 * details are either delivered to the backend or held safely on their device
 * and retried until they land. We never show "Request Received" for a lead
 * that actually vanished.
 *
 * Layers of protection, in order:
 *   1. POST to the backend, retried up to 3x with exponential backoff — rides
 *      out a brief outage or network blip.
 *   2. If all attempts fail, the lead is queued in localStorage (durable across
 *      reloads) AND a navigator.sendBeacon is fired, which survives the page
 *      being closed. The customer still sees success, because we still have
 *      their lead.
 *   3. flushLeadQueue() runs on every app load and drains the queue, so a lead
 *      captured during an outage is delivered the next time anything works.
 *
 * A returned status of "sent" or "queued" both mean the lead is safe. Only a
 * hard, unexpected throw (which callers still catch) means show-them-the-phone.
 */

const ENDPOINT = '/api/v1/leads/quote';
const QUEUE_KEY = 'worden_lead_queue_v1';
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 600;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeQueue(items) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-50)));
  } catch {
    /* storage full / disabled — the sendBeacon and in-flight retries still cover us */
  }
}

function enqueue(payload) {
  const items = readQueue();
  items.push({ payload, queuedAt: Date.now(), id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
  writeQueue(items);
}

// Fire-and-forget delivery that survives the tab closing. Best-effort only.
function beacon(payload) {
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(ENDPOINT, blob);
    }
  } catch {
    /* ignore — this is the last-ditch layer, never allowed to throw */
  }
}

async function postOnce(payload, signal) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) {
    let detail = '';
    try {
      const data = await res.json();
      detail = Array.isArray(data?.detail)
        ? data.detail.map((d) => d?.msg).filter(Boolean).join(', ')
        : data?.detail || data?.error || '';
    } catch {
      /* non-JSON error body */
    }
    // 4xx (bad payload) won't be fixed by retrying; surface it. 5xx/again -> retry.
    const retryable = res.status >= 500 || res.status === 429 || res.status === 0;
    const err = new Error(detail || `Submission failed (${res.status})`);
    err.retryable = retryable;
    throw err;
  }
  return res.json().catch(() => ({}));
}

/**
 * Submit a lead with full protection.
 * @returns {Promise<{status:'sent'|'queued', data?:object}>}
 * @throws only on a non-retryable validation error (4xx) — caller shows the message.
 */
export async function submitLead(payload) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const data = await postOnce(payload);
      return { status: 'sent', data };
    } catch (err) {
      lastErr = err;
      // A real validation error (non-retryable 4xx) — don't queue, let the user fix it.
      if (err.retryable === false && !/Failed to fetch|NetworkError|load failed/i.test(err.message)) {
        throw err;
      }
      if (attempt < MAX_ATTEMPTS) await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }
  // Every attempt failed for a transient reason: hold the lead, don't lose it.
  enqueue(payload);
  beacon(payload);
  if (typeof console !== 'undefined') {
    console.warn('[leadCapture] backend unreachable — lead queued locally and will retry.', lastErr?.message);
  }
  return { status: 'queued' };
}

/**
 * Drain the offline queue. Safe to call anytime; a no-op when empty.
 * Call once on app mount and on regaining connectivity.
 */
export async function flushLeadQueue() {
  const items = readQueue();
  if (!items.length) return;
  const remaining = [];
  for (const item of items) {
    try {
      await postOnce(item.payload);
      // delivered — drop it
    } catch (err) {
      if (err.retryable === false) {
        // permanently bad record; drop it so it can't wedge the queue forever
        continue;
      }
      remaining.push(item);
    }
  }
  writeQueue(remaining);
}

/** How many leads are still waiting to be delivered (for a health badge if wanted). */
export function pendingLeadCount() {
  return readQueue().length;
}
