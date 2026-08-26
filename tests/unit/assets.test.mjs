import assert from 'node:assert/strict'
import { test } from 'node:test'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|svg|gif)$/i
const SRC_ROOTS = ['src']
const SKIP_DIRS = new Set(['generated', 'node_modules', '__pycache__'])

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue
    const full = join(dir, e.name)
    if (e.isDirectory()) walk(full, out)
    else if (/\.(jsx?|mjs|json)$/.test(e.name)) out.push(full)
  }
  return out
}

/** Every root-relative image path written anywhere in src/. */
function referencedImages() {
  const refs = new Map()
  for (const root of SRC_ROOTS) {
    for (const file of walk(root)) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/["'](\/[\w\-./]+\.(?:jpe?g|png|webp|avif|svg|gif))["']/gi)) {
        if (!refs.has(m[1])) refs.set(m[1], new Set())
        refs.get(m[1]).add(file)
      }
    }
  }
  return refs
}

/**
 * A MISSING IMAGE ON A SPA DOES NOT 404 — IT SERVES THE APP
 * ────────────────────────────────────────────────────────
 * This is why the fault survived: requesting a missing image from the live
 * site returned HTTP 200, because the SPA fallback happily serves index.html
 * for any unmatched path. Two og:image paths pointed at a directory that has
 * never existed in this repository, and both "worked" — returning 56KB of
 * HTML with an image content-type nowhere in sight.
 *
 * A broken og:image is invisible on the site itself and only shows up where it
 * matters most: the preview card when somebody shares the page in a text
 * message or on Facebook. Nothing renders, and the link looks like spam.
 *
 * So this cannot be checked by fetching the URL. It has to be checked against
 * the filesystem, which is what this does.
 */
test('every image referenced in src exists in public', () => {
  const missing = []
  for (const [path, files] of referencedImages()) {
    if (!existsSync(join('public', path))) {
      missing.push(`${path}  <- ${[...files].join(', ')}`)
    }
  }
  assert.deepEqual(missing, [], `images referenced but not present in public/:\n  ${missing.join('\n  ')}`)
})

/** Social preview images must be the size the platforms actually crop to. */
test('og:image defaults are real files at the right aspect', () => {
  for (const p of ['public/og-default.jpg', 'public/hero-paving.jpg']) {
    assert.ok(existsSync(p), `${p} is referenced as a default og:image and does not exist`)
    assert.ok(statSync(p).size > 5_000, `${p} is too small to be a real image`)
  }
})

/**
 * The two paths that were broken are named so a future edit that reintroduces
 * them fails here rather than in somebody's text message.
 */
test('the phantom Gallery directory is not referenced again', () => {
  const refs = referencedImages()
  for (const path of refs.keys()) {
    assert.equal(
      /\/work\/imported\/Gallery\//i.test(path),
      false,
      `${path} points into a directory that has never existed in this repository`,
    )
  }
})

/**
 * A RATCHET, NOT A CLIFF
 * ──────────────────────
 * Heavy hero images cost Core Web Vitals, and Core Web Vitals cost rankings on
 * exactly the mobile local searches this business lives on. The nine KFC store
 * photographs below ship at 0.5-2.9 MB each and sit on the proof gallery - the
 * page a buyer studies immediately before calling. On a phone they ARE the LCP.
 *
 * They are a pre-existing backlog, not a regression, and failing the suite over
 * a condition that predates the test helps nobody. So this is a ratchet: the
 * known set is named and frozen, and any NEW large JPEG without a modern
 * sibling fails immediately.
 *
 * To clear the backlog, run:  node scripts/optimize-images.mjs
 * It now walks public/images as well as public/work, and is idempotent. AVIF
 * encoding at this volume runs for a long while, which is why it is a
 * deliberate task rather than something wedged into a commit.
 */
const KNOWN_UNOPTIMISED = new Set([
  '/images/kfc_stores/set_01/kfc_store_01_photo_1.jpg',
  '/images/kfc_stores/set_02/kfc_store_02_photo_1.jpg',
  '/images/kfc_stores/set_03/kfc_store_03_photo_1.jpg',
  '/images/kfc_stores/set_04/kfc_store_04_photo_1.JPG',
  '/images/kfc_stores/set_05/kfc_store_05_photo_1.JPG',
  '/images/kfc_stores/set_06/kfc_store_06_photo_1.JPG',
  '/images/kfc_stores/set_07/kfc_store_07_photo_1.JPG',
  '/images/kfc_stores/set_08/kfc_store_08_photo_1.JPG',
])

function unoptimisedLargeJpegs() {
  const out = []
  for (const [path] of referencedImages()) {
    const file = join('public', path)
    if (!existsSync(file)) continue
    if (!/\.jpe?g$/i.test(path)) continue
    if (statSync(file).size < 400_000) continue
    const stem = file.slice(0, -extname(file).length)
    if (existsSync(stem + '.webp') || existsSync(stem + '.avif')) continue
    out.push(path)
  }
  return out
}

test('no NEW large image ships without a modern-format sibling', () => {
  const offenders = unoptimisedLargeJpegs().filter((p) => !KNOWN_UNOPTIMISED.has(p))
  assert.deepEqual(
    offenders,
    [],
    'new large JPEGs with no .webp/.avif sibling:\n  ' + offenders.join('\n  '),
  )
})

/** The ratchet must tighten. A cleared backlog entry may not linger. */
test('the unoptimised backlog only shrinks', () => {
  const current = new Set(unoptimisedLargeJpegs())
  const stale = [...KNOWN_UNOPTIMISED].filter((p) => !current.has(p))
  assert.deepEqual(
    stale,
    [],
    'backlog entries no longer true - remove them from KNOWN_UNOPTIMISED:\n  ' + stale.join('\n  '),
  )
})
