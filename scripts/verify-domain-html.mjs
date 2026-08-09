/**
 * verify-domain-html.mjs — the guard that stops blank regional pages shipping.
 *
 * WHY THIS EXISTS
 *
 * The per-domain HTML files (dist/<domain>.html, served by vercel.json's
 * host-based rewrites) are produced by normalize-meta-quality.mjs, which copies
 * dist/index.html and swaps the meta. For a long stretch that step ran BEFORE
 * prerender.mjs, so it copied index.html while it was still an empty Vite
 * shell. Every regional domain shipped correct titles and schema wrapped around
 * an empty <body>, and Google was handed a blank page on each one. Measured
 * live: jwordenasphaltpaving.com served ~15,500 characters of readable text
 * while savannahasphaltpaving.com, richmondasphaltpaving.com and
 * carolinablacktop.com each served zero.
 *
 * Nothing failed. The build stayed green for weeks while the money sites were
 * invisible, which is exactly why it kept coming back after being "fixed".
 *
 * This script makes that failure loud. It runs after the generation step and
 * exits non-zero if any domain file is missing, empty-bodied, or still pointing
 * its og:url at another domain. A failed build is recoverable; silently
 * de-indexing the regional network is not.
 */

import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const distDir = path.join(root, 'dist')
const profilesPath = path.join(root, 'src', 'data', 'regionalMarketProfiles.js')

// A prerendered marketing page runs to thousands of characters. This floor is
// set low enough that a legitimately short page passes, high enough that an
// empty shell (0) or a bare loading state cannot.
const MIN_BODY_CHARS = 1500

/**
 * Readable text a crawler would see: body minus script/style/markup.
 *
 * Close tags are matched as `</name\b[^>]*>`, because an HTML end tag may carry
 * arbitrary text after the tag name — `</script\t\n bar>` is a valid end tag
 * and browsers ignore the junk. An earlier fix here allowed only whitespace
 * (`</script\s*>`), which CodeQL correctly flagged as still incomplete.
 *
 * That matters in this file specifically. bodyText() strips scripts to measure
 * how much readable text a crawler would see, and the result is compared
 * against MIN_BODY_CHARS to decide whether a domain would ship blank. Any
 * unmatched close tag leaves the script's own source in the "readable" text,
 * so the bundle is counted as page content and an empty shell clears the floor
 * on the strength of its own JavaScript — precisely the failure this file
 * exists to catch. Being strict is worth more than the input is unlikely.
 *
 * `\b` after each tag name keeps `<scriptish>` and `</scriptfoo>` out: a word
 * character there means no boundary, so they are left alone as ordinary markup.
 */
function bodyText(html) {
  const body = /<body[^>]*>([\s\S]*)<\/body\b[^>]*>/i.exec(html)
  let t = body ? body[1] : ''
  t = t.replace(/<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi, ' ')
  t = t.replace(/<style\b[^>]*>[\s\S]*?<\/style\b[^>]*>/gi, ' ')
  t = t.replace(/<[^>]+>/g, ' ')
  return t.replace(/\s+/g, ' ').trim()
}

function firstMatch(html, regex) {
  const m = regex.exec(html)
  return m ? m[1] : null
}

async function main() {
  if (!fs.existsSync(distDir)) {
    console.error('[verify-domains] dist/ not found — nothing to verify.')
    process.exit(1)
  }

  let profiles = {}
  try {
    const mod = await import(pathToFileURL(profilesPath).href)
    profiles = mod.REGIONAL_MARKET_PROFILES || {}
  } catch (err) {
    console.error('[verify-domains] could not load regionalMarketProfiles.js:', err.message)
    process.exit(1)
  }

  const domains = Object.keys(profiles)
  if (domains.length === 0) {
    console.error('[verify-domains] no regional profiles found — the generator had nothing to build.')
    process.exit(1)
  }

  const failures = []
  const passes = []

  for (const domain of domains) {
    const file = path.join(distDir, `${domain}.html`)

    if (!fs.existsSync(file)) {
      failures.push(`${domain}: file was never generated`)
      continue
    }

    const html = fs.readFileSync(file, 'utf8')
    const text = bodyText(html)
    const canonical = firstMatch(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    const ogUrl = firstMatch(html, /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i)

    const problems = []
    if (text.length < MIN_BODY_CHARS) {
      problems.push(`body is ${text.length} chars (needs ≥${MIN_BODY_CHARS}) — prerender did not reach this file`)
    }
    if (!canonical || !canonical.includes(domain)) {
      problems.push(`canonical points at ${canonical || 'nothing'}, not ${domain}`)
    }
    if (!ogUrl || !ogUrl.includes(domain)) {
      problems.push(`og:url points at ${ogUrl || 'nothing'}, not ${domain}`)
    }

    // Duplicate head tags are as damaging as wrong ones, and this check used to
    // miss them entirely because firstMatch() stops at the first hit.
    //
    // prerender runs the React app and react-helmet APPENDS its own canonical
    // and description (data-rh="true") rather than editing the static ones, so
    // every regional file carried two of each. The second canonical resolved
    // from SITE_URL, i.e. https://thewordenstandard.com/ — telling Google each
    // regional money domain was a duplicate of the SaaS site. Measured live on
    // 2026-08-09 across all five regional domains. Two conflicting canonicals
    // are worse than none: the crawler picks one, and it picked the wrong one.
    for (const [label, re] of [
      ['canonical', /<link[^>]+rel=["']canonical["'][^>]*>/gi],
      ['description', /<meta[^>]+name=["']description["'][^>]*>/gi],
      ['og:url', /<meta[^>]+property=["']og:url["'][^>]*>/gi],
    ]) {
      const found = html.match(re) || []
      if (found.length > 1) {
        problems.push(
          `${found.length} ${label} tags (needs exactly 1) — extras: ${found
            .slice(1)
            .map((t) => t.replace(/\s+/g, ' '))
            .join(' ')}`
        )
      }
    }

    if (problems.length) {
      failures.push(`${domain}: ${problems.join('; ')}`)
    } else {
      passes.push(`${domain} (${text.length} chars)`)
    }
  }

  for (const p of passes) console.log(`[verify-domains] ok   ${p}`)

  if (failures.length) {
    console.error('\n[verify-domains] FAILED — these domains would ship blank or mis-canonicalised to Google:\n')
    for (const f of failures) console.error(`  ✗ ${f}`)
    console.error(
      '\nMost likely cause: normalize-meta-quality.mjs ran before prerender.mjs, so it copied an empty ' +
        'dist/index.html. In package.json, postbuild must run prerender.mjs FIRST.\n'
    )
    process.exit(1)
  }

  console.log(`\n[verify-domains] All ${passes.length} regional domains carry real content and self-referencing tags.`)
}

main().catch((err) => {
  console.error('[verify-domains] unexpected error:', err)
  process.exit(1)
})
