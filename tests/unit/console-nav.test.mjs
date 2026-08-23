import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// ConsoleNav is JSX and this runner has no transform, so the tab table is read
// out of the source rather than imported. Reading the file is also the point:
// the test is asserting a relationship between two files, and it should fail if
// either of them changes.
const NAV = readFileSync(new URL('../../src/components/ConsoleNav.jsx', import.meta.url), 'utf8');
const APP = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const PRICING = readFileSync(new URL('../../src/pages/MarketingHome.jsx', import.meta.url), 'utf8');

const tabs = [...NAV.matchAll(/\{\s*to:\s*'([^']+)',\s*label:\s*'([^']+)'[^}]*\}/g)].map(
  ([, to, label]) => ({ to, label, raw: sourceLineFor(to) }),
);

function sourceLineFor(to) {
  const line = NAV.split('\n').find((l) => l.includes(`to: '${to}'`));
  return line || '';
}

const declaredRoutes = new Set(
  [...APP.matchAll(/path="([^"]+)"/g)].map(([, path]) => path),
);

test('the nav is not empty', () => {
  assert.ok(tabs.length >= 20, `expected the full console, found ${tabs.length} tabs`);
});

test('every tab points at a route declared in App.jsx', () => {
  const broken = tabs.filter((tab) => !declaredRoutes.has(tab.to));
  assert.deepEqual(
    broken.map((t) => `${t.label} -> ${t.to}`),
    [],
    'these tabs lead nowhere. A tab that 404s is worse than a missing tab.',
  );
});

test('every tab is either owner-only or carries a subscription tier', () => {
  // No third state. A tab with neither would be shown to everyone signed in,
  // including customers who did not buy it.
  const unclassified = tabs.filter(
    (tab) => !/owner:\s*true/.test(tab.raw) && !/tier:\s*'(lite|pro|max)'/.test(tab.raw),
  );
  assert.deepEqual(unclassified.map((t) => t.label), []);
});

test('tier names match the ones the tenants table accepts', () => {
  const used = new Set([...NAV.matchAll(/tier:\s*'([a-z]+)'/g)].map(([, t]) => t));
  for (const tier of used) {
    assert.ok(['lite', 'pro', 'max'].includes(tier), `unknown tier ${tier}`);
  }
});

test('the price list still advertises the two tools gated to max', () => {
  // These are the only two nav entries assigned a tier above lite, and the
  // assignment is quoted from the published price list. If the pricing page
  // stops naming them, the gate here is no longer sourced from anything and
  // must be revisited rather than left to drift.
  assert.match(PRICING, /Drone AI Scanner/);
  assert.match(PRICING, /Predictive Weather Risk/);

  const maxTabs = tabs.filter((t) => /tier:\s*'max'/.test(t.raw)).map((t) => t.to);
  assert.deepEqual(maxTabs.sort(), ['/scanner', '/storm-tracker']);
});
