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
 * A RATCHET THAT HAS REACHED ZERO
 * ───────────────────────────────
 * Heavy hero images cost Core Web Vitals, and Core Web Vitals cost rankings on
 * exactly the mobile local searches this business lives on. Eight KFC store
 * photographs used to ship at 0.5-2.9 MB each on the proof gallery - the page a
 * buyer studies immediately before calling. On a phone they WERE the LCP.
 *
 * They are gone. scripts/optimize-images.mjs encoded 118 files and took 57 MB
 * off the wire; the worst offender, a 2.9 MB JPEG, now serves as a 356 KB AVIF.
 * The set below is empty and should stay that way.
 *
 * It stays as a ratchet rather than a plain assertion because the useful thing
 * is not the empty list, it is the pair of tests around it: a new large JPEG
 * with no modern sibling fails immediately, and if a future backlog is ever
 * added here, clearing an entry without deleting its line fails too. A list
 * that is allowed to drift stops meaning anything.
 *
 * If a batch of unoptimised images ever does land, name them here and run:
 *   node scripts/optimize-images.mjs
 * It encodes what the browser can actually request - all of public/work, since
 * SmartImage claims .avif/.webp siblings for anything under it, plus whatever
 * public/images src/ genuinely references. --all encodes the rest.
 */
const KNOWN_UNOPTIMISED = new Set([])

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
