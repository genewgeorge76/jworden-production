import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { sourceWithoutComments } from '../helpers/source.mjs'

const QUOTE_BLOCK = 'src/components/QuoteBlock.jsx'

function pageFiles(dir = 'src/pages', out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name)
    if (e.isDirectory()) pageFiles(full, out)
    else if (e.name.endsWith('.jsx')) out.push(full)
  }
  return out
}

/**
 * AN ANCHOR THAT LANDS NOWHERE IS WORSE THAN A LINK THAT LEAVES
 * ────────────────────────────────────────────────────────────
 * Converting the CTAs from <Link to="/quote"> to href="#quote" is only an
 * improvement if the page actually contains an element with id="quote". If it
 * does not, the browser does nothing at all: no navigation, no scroll, no
 * error. The visitor presses the biggest button on the page and the page sits
 * there. That is a worse outcome than the redirect it replaced, and it is
 * completely silent — which is exactly the kind of fault that survives for
 * years.
 *
 * So: any page that offers #quote must render the section that defines it.
 */
test('every page whose CTA points at #quote renders the block that defines it', () => {
  const broken = []
  for (const file of pageFiles()) {
    const src = sourceWithoutComments(file)
    if (!/href="#quote"/.test(src)) continue
    if (/QuoteBlock/.test(src)) continue
    broken.push(file)
  }
  assert.deepEqual(
    broken,
    [],
    'pages linking to #quote with nothing on the page to scroll to:\n  ' + broken.join('\n  '),
  )
})

/** The anchor target itself. If this id moves, every CTA above dies quietly. */
test('the quote block defines the #quote anchor', () => {
  assert.match(sourceWithoutComments(QUOTE_BLOCK), /id="quote"/)
})

/**
 * THE MONEY PATH CARRIES ITS OWN GUARD
 * ────────────────────────────────────
 * Seventeen pages render this block. Requiring each of them to remember an
 * ErrorBoundary is a rule that will be broken the first time somebody adds the
 * eighteenth, and the failure mode is the conversion section vanishing from a
 * page with nobody noticing. The guard lives inside the component instead.
 *
 * It must not be a silent null: a blank section deletes the only way to make
 * contact. It falls back to the phone number, which always works.
 */
test('the quote block guards itself and fails over to a phone number', () => {
  const raw = readFileSync(QUOTE_BLOCK, 'utf8')
  assert.match(raw, /<ErrorBoundary[^>]*label="QuoteBlock"/s, 'the block carries no error boundary')
  assert.match(raw, /fallback=\{/, 'the boundary has no fallback')
  assert.match(raw, /tel:\+18044461296/, 'the fallback offers no way to make contact')
  // A silent null here would be the bug, not the guard.
  const fallbackFn = raw.slice(raw.indexOf('function QuoteBlockFallback'))
  assert.match(fallbackFn, /Call or text/, 'the fallback does not tell the visitor what to do')
})

/**
 * PROOF NEXT TO THE ASK, THROUGH THE SAME GATE AS EVERYWHERE ELSE
 * The block must not reach around publishableFor() to the raw list, and must
 * not import the withheld module at all — that file exists so a lapsed licence
 * number cannot reach a browser bundle, and a page-facing component importing
 * it would undo the whole arrangement.
 */
test('the quote block reads credentials only through the verified gate', () => {
  const src = sourceWithoutComments(QUOTE_BLOCK)
  assert.match(src, /publishableFor\(brand\)/)
  assert.equal(/PUBLIC_RECORDS/.test(src), false)
  assert.equal(/publicRecordsWithheld/.test(src), false)
  assert.equal(/Class A|fully licensed|NASCLA/i.test(src), false)
})

/**
 * NO TWO PAGES MAY SHIP THE SAME PARAGRAPH
 * ────────────────────────────────────────
 * The whole reason this section takes its wording as props rather than
 * hard-coding it is that seventeen pages carrying an identical paragraph is
 * thin content by any measure — and this repository's standing rule is that
 * each site and each page is built independently. Copy-pasting a call to
 * QuoteBlock and leaving the heading alone is the easy mistake, so it fails
 * here.
 */
test('no two pages give the quote block the same heading or intro', () => {
  const headings = new Map()
  const intros = new Map()
  for (const file of pageFiles()) {
    const raw = readFileSync(file, 'utf8')
    const at = raw.indexOf('<QuoteBlock')
    if (at === -1) continue
    const el = raw.slice(at, raw.indexOf('/>', at))
    for (const [attr, bag] of [['heading', headings], ['intro', intros]]) {
      const m = el.match(new RegExp(`${attr}="([^"]+)"`))
      if (!m) continue
      if (!bag.has(m[1])) bag.set(m[1], [])
      bag.get(m[1]).push(file)
    }
  }
  const dupes = []
  for (const [bag, what] of [[headings, 'heading'], [intros, 'intro']]) {
    for (const [text, files] of bag) {
      if (files.length > 1) dupes.push(`${what} "${text.slice(0, 48)}…" on ${files.join(', ')}`)
    }
  }
  assert.deepEqual(dupes, [], 'duplicated quote-block copy:\n  ' + dupes.join('\n  '))
})

/**
 * A RATCHET ON THE PAGES STILL SENDING PEOPLE AWAY
 * ────────────────────────────────────────────────
 * The pages below still carry a <Link to="/quote">. Most are blog posts and
 * index pages where the redirect is defensible; some are simply not converted
 * yet. They are named so the count can only fall: convert one and delete its
 * line, and adding a NEW page that links away fails immediately.
 */
const STILL_LINKING_AWAY = new Set([
  'src/pages/About.jsx',
  'src/pages/Blog.jsx',
  'src/pages/BlogPost.jsx',
  'src/pages/JwordenAI.jsx',
  'src/pages/PlansInbox.jsx',
  'src/pages/Projects.jsx',
  'src/pages/ServiceAreas.jsx',
  'src/pages/Services.jsx',
  'src/pages/StatePavingPage.jsx',
  'src/pages/Visualizer.jsx',
  'src/pages/advisory/AdvisoryHub.jsx',
  'src/pages/generated-blogs/AdaCompliancePavingBlog.jsx',
  'src/pages/generated-blogs/AsphaltMillingAndResurfacingBlog.jsx',
  'src/pages/generated-blogs/AsphaltVsConcreteVirginiaBlog.jsx',
  'src/pages/generated-blogs/CommercialAsphaltPavingBlog.jsx',
  'src/pages/generated-blogs/DrivewayCostVirginiaBlog.jsx',
  'src/pages/generated-blogs/DrivewaySurfacingVsReplacementBlog.jsx',
  'src/pages/generated-blogs/GravelVsAsphaltDrivewayBlog.jsx',
  'src/pages/generated-blogs/HeavyDutyConcreteFlatworkBlog.jsx',
  'src/pages/generated-blogs/IndustrialParkingLotRepairBlog.jsx',
  'src/pages/generated-blogs/NewConstructionDrivewayVirginiaBlog.jsx',
  'src/pages/generated-blogs/SealcoatingCostVirginiaBlog.jsx',
  'src/pages/generated-blogs/SignsDrivewayNeedsRepavingBlog.jsx',
  'src/pages/generated-blogs/TarAndChipVirginiaGuideBlog.jsx',
])

function linkingAway() {
  return pageFiles().filter((f) => /to="\/quote"/.test(sourceWithoutComments(f)))
}

test('no NEW page sends a quote CTA off the page', () => {
  const offenders = linkingAway().filter((f) => !STILL_LINKING_AWAY.has(f))
  assert.deepEqual(offenders, [], 'new pages linking away to /quote:\n  ' + offenders.join('\n  '))
})

test('the send-them-away list only shrinks', () => {
  const current = new Set(linkingAway())
  const stale = [...STILL_LINKING_AWAY].filter((f) => !current.has(f))
  assert.deepEqual(
    stale,
    [],
    'converted pages still listed - remove them from STILL_LINKING_AWAY:\n  ' + stale.join('\n  '),
  )
})
