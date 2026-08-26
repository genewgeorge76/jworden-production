#!/usr/bin/env node
/**
 * verify-live-sites.mjs — check the LIVE sites, not the repository.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The same faults keep coming back, and the reason is not carelessness. It is
 * that "fixed" has meant "committed and tested", while the owner experiences
 * "fixed" as "the live site works". Everything lives in the gap between those.
 *
 * Task #17 in this project's own list — "Stop 3 domains canonicalizing to the
 * parked flagship" — is marked completed. An audit on 2026-08-26 found FIVE
 * domains canonicalizing to the parked flagship. It was never un-fixed. It was
 * fixed in the repository and never reached production.
 *
 * There are 440 tests in this repository. Every one of them reads source files.
 * Not one looks at a live site. So the suite can be entirely green while every
 * domain the company owns serves a canonical pointing at a parking page — which
 * is exactly the state it was in when this script was written.
 *
 * WHY THE EXISTING GUARDS DID NOT CATCH IT
 * ────────────────────────────────────────
 * They exist. .github/workflows/ contains seo-guardrails.yml and
 * reliability-synthetic-monitor.yml. They have never run: this repository's own
 * .gitlab-ci.yml records that GitHub Actions is dead on this account, every job
 * dying at steps=0. GitLab CI, which does run, only tests and deploys the API.
 *
 * A guard in a CI system that does not execute is indistinguishable from no
 * guard at all, except that it is more comforting.
 *
 * WHY PARKING IS DETECTED BY SIGNATURE RATHER THAN BY NAME
 * ───────────────────────────────────────────────────────
 * The obvious implementation hardcodes jwordenasphaltpaving.com as "the parked
 * one". That check goes stale the moment it stops being parked, and it is blind
 * the moment a DIFFERENT domain lapses into parking — which is the failure that
 * will actually happen next, because domains expire on their own schedule and
 * nobody is watching.
 *
 * So parking is detected from what a parking page actually looks like: a
 * Parking/1.0 server header, or Sedo's adblockkey attribute, or the
 * "Resources and Information" title template these pages ship with.
 */

const PARKED_SIGNATURES = [
  { where: 'header', key: 'server', match: /parking/i },
  { where: 'body', match: /data-adblockkey=/i },
  { where: 'body', match: /Resources and Information\./i },
  { where: 'body', match: /<title>[^<]*\b(?:buy|for sale)\s+this\s+domain/i },
]

/**
 * Sites that must be indexable. Each names the host its canonical is allowed to
 * point at — itself, or the primary it deliberately consolidates onto.
 */
const SITES = [
  { host: 'thewordenstandard.com', canonicalTo: 'thewordenstandard.com', minSitemapUrls: 1 },
  { host: 'savannahasphaltpaving.com', canonicalTo: 'savannahasphaltpaving.com', minSitemapUrls: 5 },
  { host: 'richmondasphaltpaving.com', canonicalTo: 'richmondasphaltpaving.com', minSitemapUrls: 50 },
  { host: 'jwordenuniversity.com', canonicalTo: 'jwordenuniversity.com', minSitemapUrls: 100 },
  { host: 'carolinablacktop.com', canonicalTo: 'carolinablacktop.com', minSitemapUrls: 5 },
  { host: 'asphaltpavingkansascity.com', canonicalTo: 'asphaltpavingkansascity.com', minSitemapUrls: 5 },
  { host: 'atlantaasphaltpavingpros.com', canonicalTo: 'atlantaasphaltpavingpros.com', minSitemapUrls: 5 },
  { host: 'texaspavementgroup.com', canonicalTo: 'texaspavementgroup.com', minSitemapUrls: 5 },
]

/**
 * The homepage is the page everyone checks and therefore the page that is
 * usually right. Every recurrence of the canonical fault has been on SUBPAGES,
 * so those are what this probes.
 */
const SUBPATHS = ['/about', '/services', '/contact']

const TIMEOUT_MS = 20000
const failures = []
const notes = []

async function get(url) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal })
    const body = await res.text()
    return { ok: true, status: res.status, headers: res.headers, body, url: res.url }
  } catch (err) {
    return { ok: false, error: String(err && err.message ? err.message : err) }
  } finally {
    clearTimeout(timer)
  }
}

function looksParked(res) {
  for (const sig of PARKED_SIGNATURES) {
    if (sig.where === 'header') {
      const v = res.headers?.get(sig.key) || ''
      if (sig.match.test(v)) return `${sig.key}: ${v}`
    } else if (sig.match.test(res.body || '')) {
      return String(sig.match)
    }
  }
  return null
}

function canonicalOf(html) {
  const m = String(html).match(/<link[^>]+rel=["']canonical["'][^>]*>/i)
  if (!m) return null
  const href = m[0].match(/href=["']([^"']+)["']/i)
  return href ? href[1] : null
}

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return null }
}

async function checkSite(site) {
  const base = `https://${site.host}`
  const home = await get(base)
  if (!home.ok) return failures.push(`${site.host} — unreachable: ${home.error}`)
  if (home.status !== 200) return failures.push(`${site.host} — homepage returned ${home.status}`)

  const parked = looksParked(home)
  if (parked) return failures.push(`${site.host} — SERVING A PARKING PAGE (${parked})`)

  // robots.txt must be a real robots file, not the SPA shell. On an SPA an
  // unmatched path returns 200 with index.html, so status alone proves nothing.
  const robots = await get(`${base}/robots.txt`)
  if (!robots.ok || robots.status !== 200 || !/^\s*(user-agent|sitemap)/im.test(robots.body)) {
    failures.push(`${site.host} — robots.txt missing or serving the app shell`)
  }

  const sitemap = await get(`${base}/sitemap.xml`)
  if (!sitemap.ok || sitemap.status !== 200 || !/<urlset|<sitemapindex/i.test(sitemap.body)) {
    failures.push(`${site.host} — sitemap.xml missing or not XML`)
  } else {
    const count = (sitemap.body.match(/<loc>/g) || []).length
    if (count < site.minSitemapUrls) {
      failures.push(`${site.host} — sitemap declares ${count} URLs, expected at least ${site.minSitemapUrls}`)
    } else {
      notes.push(`${site.host} — ${count} URLs in sitemap`)
    }
  }

  // THE FAULT THAT KEEPS COMING BACK
  for (const path of SUBPATHS) {
    const page = await get(base + path)
    if (!page.ok || page.status !== 200) continue // a 404 is a routing question, not an indexing lie
    const canon = canonicalOf(page.body)
    if (!canon) {
      notes.push(`${site.host}${path} — no canonical tag`)
      continue
    }
    const ch = hostOf(canon)
    if (!ch) {
      failures.push(`${site.host}${path} — unparseable canonical: ${canon}`)
      continue
    }
    if (ch !== site.canonicalTo.replace(/^www\./, '')) {
      // Follow it. A canonical pointing somewhere harmless is a warning; one
      // pointing at a parking page is the fault that deletes the site.
      const target = await get(`https://${ch}`)
      const targetParked = target.ok ? looksParked(target) : null
      if (targetParked) {
        failures.push(
          `${site.host}${path} — canonical points at ${ch}, WHICH IS A PARKING PAGE (${targetParked})`,
        )
      } else {
        failures.push(`${site.host}${path} — canonical points at ${ch}, expected ${site.canonicalTo}`)
      }
    }
  }
}

const results = []
for (const site of SITES) results.push(checkSite(site))
await Promise.all(results)

for (const n of notes.sort()) console.log(`  ok    ${n}`)
if (failures.length === 0) {
  console.log(`\n[live] ${SITES.length} sites checked, all indexable.`)
  process.exit(0)
}
console.error('\n[live] FAILURES:')
for (const f of failures.sort()) console.error(`  FAIL  ${f}`)
console.error(
  `\n${failures.length} problem(s) on live sites. These are not repository faults — ` +
    `the code may be correct and undeployed. Check what is actually serving before editing source.`,
)
process.exit(1)
