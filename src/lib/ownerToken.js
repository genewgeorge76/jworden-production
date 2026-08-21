/**
 * ownerToken.js — one place that knows where the operator token lives.
 *
 * THE BUG THIS EXISTS TO END
 *
 * Every write went to sessionStorage under 'OWNER_TOKEN'. sessionStorage is
 * cleared when the tab closes, so the operator session did not survive a
 * browser restart — log in today, and tomorrow you are a public visitor.
 *
 * There were localStorage fallbacks, and all of them were dead code:
 *
 *   api/client.js         read localStorage 'OWNER_TOKEN'   never written
 *   SiteFactoryPanel      read localStorage 'owner_token'   never written
 *   BlogGeneratorPanel    read localStorage 'owner_token'   never written
 *   CockpitHome           read localStorage 'owner_token'   never written
 *
 * Two storages and two spellings, and nothing wrote the ones being read. The
 * symptom was not an obvious logout: with the token gone, the backend resolves
 * the caller as public_concierge, /jarvis/command returns 403, and Jarvis
 * replies "task execution is available only in Command Center operator
 * sessions" — which reads as the assistant erroring rather than as a session
 * that quietly expired.
 *
 * So: write both storages, read both, accept the legacy lowercase key on read
 * and migrate it forward. Reading a legacy key costs one branch; leaving an
 * operator locked out costs a working day.
 */

const KEY = 'OWNER_TOKEN';
const LEGACY_KEYS = ['owner_token'];
const SESSION_KEY = 'OWNER_SESSION_ID';

function stores() {
  if (typeof window === 'undefined') return [];
  const out = [];
  // Private-mode browsers throw on access rather than returning null, so each
  // store is probed independently and a failure of one must not lose the other.
  try { if (window.localStorage) out.push(window.localStorage); } catch { /* blocked */ }
  try { if (window.sessionStorage) out.push(window.sessionStorage); } catch { /* blocked */ }
  return out;
}

/** The operator token, or ''. Checks both storages and the legacy key. */
export function getOwnerToken() {
  for (const store of stores()) {
    for (const key of [KEY, ...LEGACY_KEYS]) {
      let value = null;
      try { value = store.getItem(key); } catch { continue; }
      if (value) {
        // Found under the old spelling — move it forward so the next read is
        // a single hit and the legacy key can eventually be deleted.
        if (key !== KEY) setOwnerToken(value);
        return value;
      }
    }
  }
  return '';
}

/** Persist to every storage available, so a closed tab does not end the session. */
export function setOwnerToken(token) {
  const value = String(token || '');
  for (const store of stores()) {
    try {
      if (value) store.setItem(KEY, value);
      else store.removeItem(KEY);
    } catch { /* quota or private mode — try the next store */ }
  }
  return value;
}

/** Sign out: remove from both storages and under every spelling. */
export function clearOwnerToken() {
  for (const store of stores()) {
    for (const key of [KEY, ...LEGACY_KEYS]) {
      try { store.removeItem(key); } catch { /* ignore */ }
    }
  }
}

export function hasOwnerToken() {
  return Boolean(getOwnerToken());
}

export function getOwnerSessionId() {
  for (const store of stores()) {
    try {
      const v = store.getItem(SESSION_KEY);
      if (v) return v;
    } catch { /* ignore */ }
  }
  return '';
}

export function setOwnerSessionId(id) {
  const value = String(id || '');
  for (const store of stores()) {
    try {
      if (value) store.setItem(SESSION_KEY, value);
      else store.removeItem(SESSION_KEY);
    } catch { /* ignore */ }
  }
  return value;
}

export const OWNER_TOKEN_KEY = KEY;
