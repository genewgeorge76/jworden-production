/**
 * Guards for soft-404 suppression.
 *
 * Before this, every unknown URL returned 200 with the full homepage. With 217
 * real pages now prerendered, an unlimited supply of duplicate 200s actively
 * competes with them.
 *
 * The dangerous direction is the opposite one, and that is what most of these
 * tests defend: a false 404 on a live page removes it from Google. So the rule
 * is lopsided on purpose — 404 only when nothing matches, serve the SPA
 * whenever there is doubt.
 *
 * The load-bearing test here is `every_sitemap_path_still_resolves`: 45 of the
 * sitemap entries are prebuilt .html landing pages that are NOT React routes.
 * An earlier draft of the manifest would have 404'd all of them.
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// Regenerate before asserting so the test reflects the current router, not a
// stale committed artifact.
execFileSync('node', [path.join(ROOT, 'scripts/generate-route-manifest.mjs')], { cwd: ROOT })
const { default: ROUTES } = await import(path.join(ROOT, 'route-manifest.generated.js'))

// Mirrors isKnownRoute() in middleware.js.
function isKnownRoute(pathname) {
  const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1)
  if (lastSegment.includes('.')) return true
  const p = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  if (ROUTES.exact.includes(p)) return true
  return ROUTES.prefixes.some((prefix) => pathname.startsWith(prefix))
}

function sitemapPaths() {
  const dir = path.join(ROOT, 'public/sitemaps')
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter(f => f.endsWith('.xml')).map(f => path.join(dir, f))
    : []
  const root = path.join(ROOT, 'public/sitemap.xml')
  if (fs.existsSync(root)) files.push(root)

  const out = new Set()
  for (const file of files) {
    const xml = fs.readFileSync(file, 'utf-8')
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      out.add(m[1].replace(/^https?:\/\/[^/]+/, '') || '/')
    }
  }
  return [...out]
}

test('every sitemap path still resolves — no live page may 404', () => {
  const missing = sitemapPaths().filter(p => !isKnownRoute(p))
  assert.deepEqual(missing, [], `these indexed pages would return 404:\n${missing.join('\n')}`)
})

test('prebuilt .html landing pages pass through to the filesystem', () => {
  for (const p of ['/driveway-paving.html', '/commercial-paving.html', '/line-striping.html']) {
    assert.equal(isKnownRoute(p), true, `${p} must not be 404'd by middleware`)
  }
})

test('core money pages are known', () => {
  for (const p of ['/', '/services', '/crack-repair', '/contact', '/about']) {
    assert.equal(isKnownRoute(p), true, `${p} must never 404`)
  }
})

test('private app surfaces stay served even though they are never prerendered', () => {
  for (const p of ['/command-center', '/leads', '/portal', '/staff', '/dashboard', '/admin']) {
    assert.equal(isKnownRoute(p), true, `${p} is a real route the prerenderer skips`)
  }
})

test('dynamic segments resolve for any child', () => {
  for (const p of ['/blog/anything-here', '/states/virginia', '/locations/new-kent-va',
                   '/locations/richmond-va/23220', '/portal/some-public-token']) {
    assert.equal(isKnownRoute(p), true, `${p} is served by a :param route`)
  }
})

test('trailing slashes do not change the answer', () => {
  assert.equal(isKnownRoute('/services/'), true)
  assert.equal(isKnownRoute('/services'), true)
})

test('genuinely unknown paths are rejected — the actual fix', () => {
  for (const p of ['/zzz-nonsense-soft404', '/wp-admin', '/no-such-page',
                   '/services-typo', '/.env-lookalike-path']) {
    if (p.slice(p.lastIndexOf('/') + 1).includes('.')) continue // file-like, handled elsewhere
    assert.equal(isKnownRoute(p), false, `${p} should return 404, not the homepage`)
  }
})

test('manifest is derived from the router, not hand-maintained', () => {
  const app = fs.readFileSync(path.join(ROOT, 'src/App.jsx'), 'utf-8')
  const declared = [...app.matchAll(/path="([^"]+)"/g)]
    .map(m => m[1])
    .filter(p => p.startsWith('/') && !p.includes(':') && !p.includes('*'))
  const missing = declared.filter(p => !ROUTES.exact.includes(p))
  assert.deepEqual(missing, [], `router declares routes absent from the manifest: ${missing}`)
})

test('programmatically registered AI pages are in the manifest', () => {
  // These are rendered as <Route path={path}> from publicAIPages /
  // internalAIPages, so scanning App.jsx for literal path="..." never sees
  // them. They are also absent from the sitemaps, so the sitemap-coverage
  // guard above cannot catch them either — this is the only test standing
  // between /background-checks and a 404.
  const registry = path.join(ROOT, 'src/generated/aiPageRegistry.jsx')
  if (!fs.existsSync(registry)) return

  const declared = [...fs.readFileSync(registry, 'utf-8').matchAll(/path:\s*['"]([^'"]+)['"]/g)]
    .map(m => m[1])
  assert.ok(declared.length > 0, 'registry parsed as empty — the regex has drifted')

  const missing = declared.filter(p => !isKnownRoute(p))
  assert.deepEqual(missing, [], `these live pages would return 404:\n${missing.join('\n')}`)
})
