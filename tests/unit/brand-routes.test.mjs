/**
 * Brand-directory host routing.
 *
 * Two live faults are pinned here, both found after texaspavementgroup.com was
 * moved onto this project:
 *
 *   1. /residential, /services, /service-areas and /contact are prerendered by
 *      the SPA into the deploy root. Vercel checks the filesystem before
 *      applying vercel.json rewrites, so those four served VIRGINIA pages on the
 *      Texas domain. Middleware must rewrite explicitly to beat the filesystem.
 *
 *   2. An unknown path fell through to the SPA catch-all and returned 200 with
 *      the software storefront — a soft 404 on a domain whose whole purpose is
 *      to rank.
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
execFileSync('node', [path.join(ROOT, 'scripts/generate-brand-routes.mjs')], { cwd: ROOT })
const { default: BRAND_ROUTES } = await import(path.join(ROOT, 'brand-routes.generated.js'))
const { texasCityPages } = await import(path.join(ROOT, 'src/data/texasCityPages.js'))

const HOST = 'texaspavementgroup.com'

test('the brand carries its six routes and every city page', () => {
  const paths = BRAND_ROUTES[HOST]
  for (const p of ['/', '/commercial', '/residential', '/services', '/service-areas', '/contact']) {
    assert.ok(paths.includes(p), `${p} missing from the brand route list`)
  }
  for (const c of texasCityPages()) {
    assert.ok(paths.includes(c.path), `${c.path} missing from the brand route list`)
  }
  assert.equal(paths.length, 6 + texasCityPages().length)
})

test('the four SPA-prerendered paths are claimed by the brand', () => {
  // These are the ones that were serving Virginia content on the Texas domain.
  for (const p of ['/residential', '/services', '/service-areas', '/contact']) {
    assert.ok(BRAND_ROUTES[HOST].includes(p), `${p} must be claimed or it serves the SPA`)
  }
})

test('nothing else is claimed — an unknown path must 404, not soft-404', () => {
  for (const p of ['/nonsense-page', '/texas', '/texas/dallas', '/admin', '/blog/whatever']) {
    assert.ok(!BRAND_ROUTES[HOST].includes(p), `${p} must not resolve on the brand host`)
  }
})

test('only cities with invoiced work get a page', () => {
  // Dallas, Houston, Austin and San Antonio have no invoiced job, so they get
  // no page. A "we serve Dallas" landing page is a claim dressed as a route.
  for (const city of ['dallas', 'houston', 'austin', 'san-antonio', 'el-paso']) {
    assert.ok(!BRAND_ROUTES[HOST].includes(`/texas/${city}`), `/texas/${city} is not invoiced work`)
  }
})

test('the generated file is deterministic', () => {
  execFileSync('node', [path.join(ROOT, 'scripts/generate-brand-routes.mjs')], { cwd: ROOT })
  const again = execFileSync('node', ['-e',
    `import('${path.join(ROOT, 'brand-routes.generated.js')}').then(m=>console.log(JSON.stringify(m.default)))`,
  ], { cwd: ROOT }).toString().trim()
  assert.equal(again, JSON.stringify(BRAND_ROUTES))
})
