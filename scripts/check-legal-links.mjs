#!/usr/bin/env node
/**
 * check-legal-links.mjs — are the citations in src/data/legal/ still there?
 *
 * WHY THIS EXISTS
 * ───────────────
 * The advisory pages' entire claim is that they cite the real source. Fifty-nine
 * of the 251 government URLs in those files were returning 404 — nearly one in
 * four. A dead citation is worse than no citation: it says "check for yourself"
 * and then wastes the reader's time proving the page wrong.
 *
 * Nothing was watching, so the rot was found years late. This makes it a
 * one-command check.
 *
 * THREE ANSWERS, AND ONLY ONE OF THEM MEANS BROKEN
 * ────────────────────────────────────────────────
 *   404          The server answered and said the page is gone. Real breakage.
 *   403          A web application firewall refused an automated request.
 *                mass.gov, michigan.gov and nevadadot.com all do this. The site
 *                is fine; the checker is not a browser.
 *   000          No HTTP answer at all — a TLS failure or a blocked CONNECT.
 *                From a sandboxed network this says more about the network than
 *                the site. Twenty-eight state 811 centres and agency sites land
 *                here and are all reachable from an ordinary browser.
 *
 * Treating 403 and 000 as dead would mean "fixing" working links by replacing
 * them with guesses, which is how a link checker makes a dataset worse. Only
 * 404 and 410 fail this script.
 *
 * Usage:  node scripts/check-legal-links.mjs [--all]
 *           --all also lists the blocked and unreachable URLs
 */

import { readFileSync, readdirSync } from 'node:fs'

// A plain fetch is refused by several state firewalls; this identifies the
// checker rather than pretending to be nobody.
const UA =
  'Mozilla/5.0 (compatible; JWordenSonsPaving-LinkCheck/1.0; +https://jwordenasphaltpaving.com)'
const CONCURRENCY = 12
const TIMEOUT_MS = 25000
const DIR = 'src/data/legal'
const showAll = process.argv.includes('--all')

const urls = new Set()
for (const file of readdirSync(DIR).filter((f) => f.endsWith('.js'))) {
  const src = readFileSync(`${DIR}/${file}`, 'utf8')
  for (const m of src.matchAll(/https?:\/\/[^"'\s)]+/g)) urls.add(m[0].replace(/[.,;]$/, ''))
}

async function status(url) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: ctrl.signal,
    })
    return res.status
  } catch {
    return 0
  } finally {
    clearTimeout(t)
  }
}

const list = [...urls].sort()
const results = []
for (let i = 0; i < list.length; i += CONCURRENCY) {
  const batch = list.slice(i, i + CONCURRENCY)
  const codes = await Promise.all(batch.map(status))
  batch.forEach((url, k) => results.push({ url, code: codes[k] }))
}

const dead = results.filter((r) => r.code === 404 || r.code === 410)
const blocked = results.filter((r) => r.code === 403)
const unreachable = results.filter((r) => r.code === 0)
const ok = results.length - dead.length - blocked.length - unreachable.length

console.log(`${results.length} URLs in ${DIR}`)
console.log(`  ${ok} answered`)
console.log(`  ${blocked.length} refused an automated request (403) — not broken`)
console.log(`  ${unreachable.length} gave no HTTP answer — network, not necessarily the site`)
console.log(`  ${dead.length} gone (404/410)`)

if (showAll) {
  for (const r of [...blocked, ...unreachable]) console.log(`  ${r.code || 'n/a'}  ${r.url}`)
}

if (dead.length) {
  console.log('\nDead citations:')
  for (const r of dead) console.log(`  ${r.code}  ${r.url}`)
  process.exit(1)
}
