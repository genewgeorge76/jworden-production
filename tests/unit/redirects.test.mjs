import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

const config = JSON.parse(readFileSync('vercel.json', 'utf8'))
const redirects = config.redirects || []

function hostOf(rule) {
  for (const h of rule.has || []) if (h.type === 'host') return h.value
  return null
}

/**
 * A PERMANENT REDIRECT INTO A PARKING PAGE IS A DOMAIN DELETED
 * ───────────────────────────────────────────────────────────
 * Five Michigan domains carried `permanent: true` redirects to
 * www.jwordenasphaltpaving.com, which does not serve this company's site — it
 * serves a Sedo parking page with ads on it.
 *
 * A 308 is a promise to Google that the move is permanent. Google honours it:
 * it drops the source domain from the index and consolidates whatever
 * reputation it had onto the destination. So five real domains, in a state
 * where this company has documented work — two Detroit-area sites with
 * photographs — were quietly handing their entire search presence to a domain
 * parker.
 *
 * Nothing about this was visible on any page. It only shows up if you follow
 * the redirect, which is why it survived: every check that stopped at "the
 * domain resolves and returns 200" passed it.
 *
 * The parked flagship is named explicitly rather than checked generically,
 * because the day it stops being parked is the day this rule should be
 * revisited deliberately — not silently satisfied.
 */
const PARKED = 'jwordenasphaltpaving.com'

test('no redirect sends a domain to the parked flagship', () => {
  const offenders = redirects
    .filter((r) => (r.destination || '').includes(PARKED))
    .map((r) => `${hostOf(r) || r.source} -> ${r.destination}`)
  assert.deepEqual(
    offenders,
    [],
    'domains permanently redirected into a parking page:\n  ' + offenders.join('\n  '),
  )
})

/**
 * A HOST THAT REDIRECTS TO ITSELF IS A LOOP, AND A LOOP IS UNCRAWLABLE
 * Google gives up after a handful of hops and indexes nothing at all.
 */
test('no host redirects to itself', () => {
  const loops = []
  for (const r of redirects) {
    const host = hostOf(r)
    if (!host) continue
    const dest = r.destination || ''
    const destHost = (dest.match(/^https?:\/\/([^/]+)/) || [])[1]
    if (destHost && destHost === host) loops.push(`${host} -> ${dest}`)
  }
  assert.deepEqual(loops, [], 'self-redirecting hosts:\n  ' + loops.join('\n  '))
})

/**
 * ALIASES MUST LAND ON A HOST THAT SERVES SOMETHING
 * An alias pointing at another alias chains hops for no reason and risks the
 * destination itself being a redirect into somewhere unintended — which is
 * exactly how the Michigan set ended up at a parking page.
 */
test('no alias redirects to another redirecting host', () => {
  const redirectingHosts = new Set(redirects.map(hostOf).filter(Boolean))
  const chained = []
  for (const r of redirects) {
    const host = hostOf(r)
    if (!host) continue
    const destHost = ((r.destination || '').match(/^https?:\/\/([^/]+)/) || [])[1]
    if (destHost && redirectingHosts.has(destHost)) chained.push(`${host} -> ${destHost}`)
  }
  assert.deepEqual(chained, [], 'redirect chains:\n  ' + chained.join('\n  '))
})

/** Every host-level alias should be a permanent redirect, so signals consolidate. */
test('host aliases redirect permanently', () => {
  const temporary = redirects
    .filter((r) => hostOf(r) && r.permanent !== true)
    .map((r) => hostOf(r))
  assert.deepEqual(temporary, [], 'host aliases not marked permanent: ' + temporary.join(', '))
})
