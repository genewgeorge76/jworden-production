/**
 * Retired hosts, and the one that was leaking pricing.
 *
 * WHAT WAS ACTUALLY BEING SERVED
 * ──────────────────────────────
 * carolinapavementgroup.com and nationalpavmentgroup.com were both serving an
 * internal "Competitive Intelligence Dossier" — unit rates at $1.35 and $4.80
 * per linear foot, job values, margin figures. That is this company's own
 * pricing on a public, indexable domain, readable by any competitor who found
 * it. It is not a duplicate-content problem. It is a disclosure problem, and it
 * is the reason these redirects exist.
 *
 * atlantapavingandsealing.com is the milder case: a second Atlanta domain
 * serving Atlanta paving content, which is cross-domain duplicate content and
 * splits whatever authority either domain has.
 *
 * WHY THESE TESTS ARE NARROW AND STRICT
 * ─────────────────────────────────────
 * A redirect map is one typo away from sending a working money domain
 * somewhere else. So these assert both directions: the retired hosts redirect,
 * and the live ones emphatically do not.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

const middleware = (await import('../../middleware.js')).default

const req = (host, path = '/') =>
  new Request(`https://example.invalid${path}`, { headers: { host } })

const RETIRED = {
  'carolinapavementgroup.com': 'carolinablacktop.com',
  'nationalpavmentgroup.com': 'www.jwordenasphaltpaving.com',
  'atlantapavingandsealing.com': 'atlantaasphaltpavingpros.com',
}

test('every retired host answers 301, not 200', () => {
  for (const host of Object.keys(RETIRED)) {
    const res = middleware(req(host))
    assert.equal(res.status, 301, `${host} did not redirect — it is still serving something`)
  }
})

test('each retired host points at the right canonical', () => {
  for (const [host, target] of Object.entries(RETIRED)) {
    const res = middleware(req(host))
    assert.equal(new URL(res.headers.get('location')).host, target, `${host} redirects to the wrong place`)
  }
})

test('the path is preserved, because a redirect to the homepage passes nothing', () => {
  /**
   * Google treats a deep link redirected to a homepage as a soft 404 and
   * passes no signal through it. The whole point of a 301 over a 404 here is
   * to keep the value of inbound links, so the path has to survive.
   */
  const res = middleware(req('nationalpavmentgroup.com', '/services'))
  const url = new URL(res.headers.get('location'))
  assert.equal(url.pathname, '/services')
})

test('the query string survives too', () => {
  const res = middleware(
    new Request('https://example.invalid/contact?utm_source=gbp', {
      headers: { host: 'carolinapavementgroup.com' },
    }),
  )
  const url = new URL(res.headers.get('location'))
  assert.equal(url.pathname, '/contact')
  assert.equal(url.searchParams.get('utm_source'), 'gbp')
})

test('www variants of the retired hosts redirect as well', () => {
  for (const host of Object.keys(RETIRED)) {
    const res = middleware(req(`www.${host}`))
    assert.equal(res.status, 301, `www.${host} still serves its own content`)
  }
})

test('the redirect runs before the homepage rewrite', () => {
  /**
   * The regression this guards. Ordering matters: a redirect placed after the
   * homepage rewrite never runs for `/`, and `/` is the one path these domains
   * actually receive traffic on. atlantapavingandsealing.com would have gone on
   * serving Atlanta content indefinitely with a test suite that looked green.
   */
  const res = middleware(req('atlantapavingandsealing.com', '/'))
  assert.equal(res.status, 301)
})

// ── The money domains must be untouched ──────────────────────────────────────

test('no live brand domain is caught by the redirect map', () => {
  const live = [
    'atlantaasphaltpavingpros.com',
    'carolinablacktop.com',
    'texaspavementgroup.com',
    'richmondasphaltpaving.com',
    'savannahasphaltpaving.com',
    'asphaltpavingkansascity.com',
    'obxpaving.com',
    'www.jwordenasphaltpaving.com',
  ]
  for (const host of live) {
    const res = middleware(req(host, '/'))
    assert.notEqual(res.status, 301, `${host} is a live money domain and must not redirect`)
  }
})

test('the Atlanta canonical still serves its own Georgia pages', () => {
  const res = middleware(req('atlantaasphaltpavingpros.com', '/kennesaw'))
  assert.notEqual(res.status, 301)
  const rewritten = res.headers.get('x-middleware-rewrite')
  assert.ok(
    rewritten && rewritten.includes('/brands/atlantaasphaltpavingpros.com/kennesaw'),
    'the canonical Atlanta host stopped serving its city pages',
  )
})

test('the Atlanta alternate redirects deep paths to the matching path, not the homepage', () => {
  const res = middleware(req('atlantapavingandsealing.com', '/big-chicken'))
  const url = new URL(res.headers.get('location'))
  assert.equal(url.host, 'atlantaasphaltpavingpros.com')
  assert.equal(url.pathname, '/big-chicken')
})
