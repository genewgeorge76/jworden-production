#!/usr/bin/env node
/**
 * build-county-landmarks.mjs — landmarks and local facts, fetched not written.
 *
 * WHY THIS EXISTS ALONGSIDE build-county-facts.mjs
 * ────────────────────────────────────────────────
 * That script produced virginiaCountyFacts.json — VDOT district, elevation, a
 * freeze-thaw band derived from the elevation, and VDOT road references. Its
 * header states the rule this one inherits: "Every field is fetched, never
 * authored."
 *
 * It also refuses to run without GOOGLE_MAPS_API_KEY and EXA_API_KEY. This one
 * needs no key at all, which matters: county pages should not be blocked on a
 * billing account, and a source anyone can check is worth more on a page than
 * one only the author can.
 *
 * THE MISTAKE THAT COST AN HOUR, RECORDED SO IT IS NOT REPEATED
 * ────────────────────────────────────────────────────────────
 * A first attempt concluded Wikipedia was unreachable and reported that to the
 * owner. It was not. Wikimedia rejects anonymous traffic that sends no
 * descriptive User-Agent, and the request had none. With the UA below it
 * answers immediately.
 *
 * "The API is down" and "I called it wrong" look identical from the outside.
 * When a fetch fails, check the request before reporting the source is dead.
 *
 * RATE LIMITS ARE REAL AND THE DELAY IS NOT OPTIONAL
 * ─────────────────────────────────────────────────
 * Three rapid calls got the first answered and the next two throttled. At
 * roughly 1.2s between requests the whole of Virginia takes about four
 * minutes. Removing the delay does not make it faster; it makes it fail.
 *
 * WHAT IS COLLECTED, AND WHY EACH EARNS ITS PLACE
 * ──────────────────────────────────────────────
 *   seat, population, coordinates   Orientation. Verifiable, and the county
 *                                   seat is what locals actually say.
 *   summary                         One fetched paragraph. Never rewritten
 *                                   here — a paraphrase is authorship.
 *   landmarks                       National Register of Historic Places
 *                                   listings for that county. Places a
 *                                   resident recognises, from a federal
 *                                   register, with a page anyone can open.
 *
 * Every county records the URLs it came from and when. A field that could not
 * be fetched is null. Nothing is filled in from knowledge, because a plausible
 * landmark in the wrong county is exactly the failure this repository has
 * already had once, and it is invisible to anyone who does not live there.
 *
 * Usage:  node scripts/build-county-landmarks.mjs <state> [outFile]
 *   e.g.  node scripts/build-county-landmarks.mjs Virginia
 */

import { writeFileSync, existsSync, readFileSync } from 'node:fs'

const UA = 'JWordenSonsPaving-CountyFacts/1.0 (https://jwordenasphaltpaving.com)'
const PAUSE_MS = 1200
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const state = process.argv[2] ?? 'Virginia'
const outFile = process.argv[3] ?? `src/data/countyLandmarks.${state.toLowerCase()}.json`

async function getJson(url) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
    if (res.ok) return res.json()
    // 429 is the throttle. Back off rather than hammering it.
    if (res.status === 429 || res.status >= 500) {
      await sleep(PAUSE_MS * attempt * 2)
      continue
    }
    return null
  }
  return null
}

const api = (params) =>
  `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ format: 'json', ...params })}`

async function summaryFor(county) {
  const title = `${county} County, ${state}`
  const d = await getJson(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
  )
  if (!d || d.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') return null
  const extract = d.extract ?? null
  return {
    summary: extract,
    // The seat is stated in the summary sentence; taken from there rather than
    // guessed, and left null when the sentence does not say.
    seat: extract?.match(/[Ii]ts county seat is ([^.,]+)/)?.[1]?.trim() ?? null,
    population: extract?.match(/population was ([\d,]+)/)?.[1] ?? null,
    lat: d.coordinates?.lat ?? null,
    lng: d.coordinates?.lon ?? null,
    source: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  }
}

async function landmarksFor(county) {
  const title = `National Register of Historic Places listings in ${county} County, ${state}`
  const d = await getJson(api({ action: 'parse', page: title, prop: 'wikitext' }))
  const wt = d?.parse?.wikitext?.['*']
  if (!wt) return { landmarks: [], source: null }
  const names = [...wt.matchAll(/\|\s*name\s*=\s*([^|\n}]+)/g)]
    .map((m) => m[1].trim())
    .filter((n) => n && !/^\s*$/.test(n) && n.length < 90)
  return {
    landmarks: [...new Set(names)],
    source: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  }
}

// Counties come from the existing dataset so the two files stay in step.
const { VA_COUNTIES } = await import('../src/data/virginia_counties.js')
const counties = VA_COUNTIES.map((c) => c.name.replace(/ County$/, ''))

// Resumable: a throttled run of 95 counties is long enough to be interrupted.
const existing = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : { counties: [] }
const done = new Set(existing.counties.map((c) => c.county))

const out = existing.counties.slice()
let fetched = 0

for (const county of counties) {
  if (done.has(county)) continue
  const s = await summaryFor(county)
  await sleep(PAUSE_MS)
  const l = await landmarksFor(county)
  await sleep(PAUSE_MS)

  out.push({
    county,
    state,
    seat: s?.seat ?? null,
    population: s?.population ?? null,
    lat: s?.lat ?? null,
    lng: s?.lng ?? null,
    summary: s?.summary ?? null,
    landmarks: l.landmarks,
    sources: [s?.source, l.source].filter(Boolean),
    fetched_utc: new Date().toISOString(),
  })
  fetched += 1

  const payload = {
    _comment:
      'Generated by scripts/build-county-landmarks.mjs from Wikipedia and the National Register of Historic Places. Every field is fetched, never authored. Do not hand-edit.',
    _source: 'en.wikipedia.org — page summaries and NRHP county listings',
    _generated_utc: new Date().toISOString(),
    counties_total: counties.length,
    counties_built: out.length,
    counties_with_landmarks: out.filter((c) => c.landmarks.length > 0).length,
    counties: out,
  }
  writeFileSync(outFile, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  if (fetched % 5 === 0) console.log(`  ${out.length}/${counties.length} — latest: ${county}`)
}

console.log(`\n${out.length}/${counties.length} counties → ${outFile}`)
console.log(`${out.filter((c) => c.landmarks.length > 0).length} carry landmarks`)
