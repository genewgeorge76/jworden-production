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

/**
 * THE SEAT AND THE POPULATION ARE READ OUT OF THE SUMMARY, NOT KNOWN
 * ─────────────────────────────────────────────────────────────────
 * Both are pulled from the fetched paragraph and left null when it does not
 * say. Nothing here supplies a value the sentence did not contain.
 *
 * The first version matched only "Its county seat is X". That is one of at
 * least four ways Wikipedia writes the sentence, and it left 27 of Virginia's
 * 95 counties with no seat on the page — including Fairfax, Loudoun, Henrico
 * and Prince William, four of the largest markets in the state. The county
 * seat is what a local actually says when naming where something is, so a
 * blank there is a real loss on a page written for locals.
 *
 * The patterns below are ordered most specific first. Each one still requires
 * the summary to state the seat outright; a county whose paragraph does not
 * mention it stays null, as before.
 */
function seatFrom(extract) {
  if (!extract) return null
  const patterns = [
    /county seat (?:and (?:its )?largest city )?is ([^.,;]+)/i,
    /seat (?:of (?:the )?county )?is ([^.,;]+)/i,
  ]
  for (const re of patterns) {
    const hit = extract.match(re)?.[1]?.trim()
    if (!hit) continue
    // Wikipedia qualifies the place before naming it — "the town of Bowling
    // Green", "the small town of Dinwiddie", "the independent city of
    // Manassas". The place name is what belongs in the field; the qualifier is
    // prose, and printing it whole put "the small town of Dinwiddie" where a
    // county seat should be.
    const name = hit
      .replace(/^(?:traditionally\s+)?identified as\s+/i, '')
      .replace(
        /^the\s+(?:[a-z-]+\s+){0,3}(?:town|city|village|community|borough|area|place)\s+of\s+/i,
        '',
      )
      .replace(/\s+\(.*$/, '')
      .trim()
    if (name) return name
  }
  return null
}

/**
 * Trimmed of trailing punctuation. "the population was 2,876, up from..."
 * matched through the comma and printed "2,876," on the page — which reached
 * three live Virginia county pages before it was caught.
 */
function populationFrom(extract) {
  if (!extract) return null
  const hit = extract.match(/population (?:was|of) ([\d,]+)/i)?.[1]
  return hit ? hit.replace(/[^\d]+$/, '') : null
}

async function summaryFor(county) {
  const title = `${county} County, ${state}`
  const d = await getJson(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
  )
  if (!d || d.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') return null
  const extract = d.extract ?? null
  return {
    summary: extract,
    seat: seatFrom(extract),
    population: populationFrom(extract),
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

/**
 * WHERE THE COUNTY LIST COMES FROM, AND THE TWO BUGS THAT SHAPED IT
 * ────────────────────────────────────────────────────────────────
 * This block used to read VA_COUNTIES unconditionally, whatever state was
 * passed on the command line. Running it for Georgia asked Wikipedia for
 * "Chesterfield County, Georgia" and "Powhatan County, Georgia" — pages that
 * do not exist — and wrote six counties with every field null.
 *
 * That failure was loud. The dangerous version is quiet: a name that exists in
 * both states. Georgia and Virginia share Warren, Franklin, Greene, Madison and
 * others. Those would have fetched cleanly and filed Georgia's Franklin County
 * facts under a Virginia page, or the reverse — a real county, real landmarks,
 * wrong state, and nothing in the output to show it.
 *
 * The obvious fix was Wikipedia's own county category. It was tried and
 * rejected: "Category:South Carolina counties" returns 47 members for a state
 * with 46 counties. The extra is Birch County, a county authorised in the 1970s
 * and never organised. A county page for a place that does not exist is exactly
 * the fabricated-service-area failure this repository has already had once.
 *
 * So the list comes from the Census Bureau's own county code file. It needs no
 * key, it is the federal register of what a county is, and it carries the two
 * fields that answer the Birch County question:
 *
 *   CLASSFP   H* — a county or county equivalent
 *   FUNCSTAT  A active, B partly consolidated, C consolidated with a city
 *
 * FUNCSTAT C is kept deliberately. Georgia's eight consolidated city-counties
 * are filed that way — Bibb (Macon), Muscogee (Columbus), Clarke (Athens) and
 * Richmond (Augusta) among them. Dropping C would drop four of the largest
 * markets in the state and quietly return 151 counties for a state with 159.
 * What is excluded is FUNCSTAT N (nonfunctioning), S (statistical) and F
 * (fictitious), which is where Birch County and its equivalents live.
 *
 * Checked against the four states in scope: Georgia 159, North Carolina 100,
 * South Carolina 46, Virginia 95. Those are the real counts.
 *
 * Virginia stays on VA_COUNTIES anyway. The Virginia pages are built from that
 * file, and a landmark file listing counties the page set does not have — or
 * missing ones it does — puts the two out of step.
 */
const COUNTY_CODES_URL =
  'https://www2.census.gov/geo/docs/reference/codes2020/national_county2020.txt'
const STATE_CODES_URL = 'https://www2.census.gov/geo/docs/reference/state.txt'

async function getText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${res.status} from ${url}`)
  return res.text()
}

/** Rows of a pipe-delimited Census file, keyed by its own header line. */
function parsePipe(text) {
  const [header, ...lines] = text.trim().split(/\r?\n/)
  const keys = header.split('|')
  return lines.map((line) => Object.fromEntries(line.split('|').map((v, k) => [keys[k], v])))
}

async function countiesFor(stateName) {
  if (stateName === 'Virginia') {
    const { VA_COUNTIES } = await import('../src/data/virginia_counties.js')
    // Deduplicated: VA_COUNTIES holds 94 entries for 85 counties — Prince
    // Edward, Prince William, Dickenson, Isle of Wight, Essex, Orange, Clarke,
    // Charlotte and Highland each appear twice. Left alone that produces two
    // identical county pages per duplicate, which is duplicate content aimed at
    // exactly the audience the page is for. The upstream duplication in
    // virginia_counties.js is a separate defect and is not fixed here.
    return [...new Set(VA_COUNTIES.map((c) => c.name.replace(/ County$/, '')))]
  }

  // The postal abbreviation is looked up rather than typed, so a state name is
  // the only thing this script needs to be told.
  const stateRow = parsePipe(await getText(STATE_CODES_URL)).find(
    (r) => r.STATE_NAME?.toLowerCase() === stateName.toLowerCase(),
  )
  if (!stateRow) throw new Error(`"${stateName}" is not a state in ${STATE_CODES_URL}`)

  const rows = parsePipe(await getText(COUNTY_CODES_URL)).filter(
    (r) =>
      r.STATE === stateRow.STUSAB &&
      r.CLASSFP?.startsWith('H') &&
      ['A', 'B', 'C'].includes(r.FUNCSTAT),
  )

  // Wikipedia titles them "<Name> County, <State>". A state whose subdivisions
  // are parishes or boroughs would need that title built differently, so it
  // stops here rather than fetching a page that cannot exist.
  const odd = rows.filter((r) => !r.COUNTYNAME?.endsWith(' County'))
  if (odd.length) {
    throw new Error(
      `${stateName} has subdivisions this script cannot title: ` +
        odd.map((r) => r.COUNTYNAME).join(', '),
    )
  }

  return [...new Set(rows.map((r) => r.COUNTYNAME.replace(/ County$/, '')))].sort()
}

const counties = await countiesFor(state)
if (!counties.length) {
  console.error(`No counties found for "${state}". Nothing written.`)
  process.exit(1)
}
console.log(`${counties.length} counties in ${state}`)

// Resumable: a throttled run of 95 counties is long enough to be interrupted.
const existing = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : { counties: [] }
const done = new Set(existing.counties.map((c) => c.county))

/**
 * Derived fields are recomputed from the summary already on disk, so fixing an
 * extractor does not mean re-fetching the state. The summary is the fetched
 * artefact; seat and population are read out of it, and re-reading them costs
 * nothing and touches no network.
 *
 * This is how the seat-pattern fix reached the Virginia file: 20 counties that
 * had been left blank — Fairfax, Loudoun, Prince William among them — and 7
 * populations printing a trailing comma, all corrected from text that had been
 * sitting in the file the whole time.
 */
const out = existing.counties.map((c) => ({
  ...c,
  seat: seatFrom(c.summary),
  population: populationFrom(c.summary),
}))
let fetched = 0

function save() {
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
}

for (const county of counties) {
  if (done.has(county)) continue
  const s = await summaryFor(county)
  await sleep(PAUSE_MS)
  const l = await landmarksFor(county)
  await sleep(PAUSE_MS)

  // Marked done immediately. Computing `done` only at startup let a repeated
  // name through on the same run — which is how the duplicates above reached
  // the output file before the input was deduplicated.
  done.add(county)
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

  save()
  if (fetched % 5 === 0) console.log(`  ${out.length}/${counties.length} — latest: ${county}`)
}

// Written once more after the loop so a run with nothing left to fetch still
// persists recomputed fields. Without this, an extractor fix on an already
// complete state is a no-op.
save()

console.log(`\n${out.length}/${counties.length} counties → ${outFile}`)
console.log(`${out.filter((c) => c.landmarks.length > 0).length} carry landmarks`)
