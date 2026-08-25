#!/usr/bin/env node
/**
 * geocode-stores.mjs — turns store addresses into counties and coordinates.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Two things need it.
 *
 * The map. Pins need coordinates, and coordinates typed from memory are
 * fabricated data wearing six decimal places. These come from the address.
 *
 * The county pages. Georgia has 159 counties and this company has documented
 * work in a fraction of them. Building all 159 would be the doorway-page
 * pattern — a page per county because the county exists, not because there is
 * anything true to say about working there. So the page set is decided by
 * where the paid and invoiced jobs actually are, and that means resolving an
 * address to its county rather than guessing from the city name.
 *
 * The city name is not good enough, and Atlanta is the reason. Atlanta spans
 * Fulton and DeKalb. Guessing "Atlanta is Fulton" files DeKalb jobs under the
 * wrong county — and a county page is read by people who know which county
 * they live in.
 *
 * SOURCE
 * ──────
 * The Census Bureau's own geocoder. No key, no billing account, and it is the
 * authority on which county an address falls in rather than a third party's
 * opinion of it. An address it cannot match is recorded as unmatched; nothing
 * is filled in from knowledge.
 *
 * GRADE IS CARRIED THROUGH, NOT DISCARDED
 * ───────────────────────────────────────
 * Every row keeps the evidence grade it had in kbpStoreMap.js. A `listed`
 * store is geocoded too — knowing where it is costs nothing — but the grade
 * travels with it so nothing downstream can mistake a roster entry for a job.
 *
 * Usage:  node scripts/geocode-stores.mjs [outFile]
 */

import { writeFileSync, existsSync, readFileSync } from 'node:fs'

import { KBP_STORES } from '../src/data/kbpStoreMap.js'

const UA = 'JWordenSonsPaving-StoreGeocode/1.0 (https://jwordenasphaltpaving.com)'
const PAUSE_MS = 400
// OpenStreetMap's published condition for anonymous use: one request a second.
const OSM_PAUSE_MS = 1100
const OUT = process.argv[2] ?? 'src/data/kbpStoreCounties.json'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const ENDPOINT = 'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress'
const STATE_CODES_URL = 'https://www2.census.gov/geo/docs/reference/state.txt'

/** Postal abbreviation to state name, fetched rather than typed out. */
async function stateNames() {
  const res = await fetch(STATE_CODES_URL, { headers: { 'User-Agent': UA } })
  if (!res.ok) return new Map()
  const [, ...lines] = (await res.text()).trim().split(/\r?\n/)
  return new Map(lines.map((l) => l.split('|')).map(([, ab, name]) => [ab, name]))
}

/**
 * ADDRESS SPELLINGS THE CENSUS GEOCODER WANTS
 * ───────────────────────────────────────────
 * Eight addresses came back unmatched on the first run, and every one of them
 * was a highway address: "675 Georgia Highway 120", "1120 W Hwy 77",
 * "2411 S US Highway 281". The geocoder holds those routes under shorter
 * names, so the query is retried in the spellings it recognises before the
 * address is called unmatchable.
 *
 * These are rewrites of the same address, not guesses at a different one. A
 * store that still does not match is recorded null — an address without a
 * street number ("Highway 5, Douglasville, GA") cannot resolve to a point, and
 * inventing one would put a pin on a map where no job was done.
 */
function spellings(oneLine) {
  const variants = new Set([oneLine])
  const add = (s) => s !== oneLine && variants.add(s)
  add(oneLine.replace(/\bGeorgia Highway\b/gi, 'GA'))
  add(oneLine.replace(/\bGeorgia Highway\b/gi, 'Highway'))
  add(oneLine.replace(/\bUS Highway\b/gi, 'US'))
  add(oneLine.replace(/\bBusiness\b/gi, 'BUS'))
  add(oneLine.replace(/\bHighway\b/gi, 'Hwy'))
  add(oneLine.replace(/\bHwy\b/gi, 'Highway'))
  add(oneLine.replace(/\bState Route\b/gi, 'SR'))
  return [...variants]
}

/**
 * A SECOND SOURCE, BECAUSE THE FIRST ONE HAS A BLIND SPOT
 * ──────────────────────────────────────────────────────
 * The Census geocoder holds highway addresses under the local street name.
 * It matches "675 Grayson Hwy" but not "675 Georgia Highway 120" — the same
 * road, the same building. Supplying "Grayson Hwy" myself would mean sourcing
 * the answer from my own recollection of Gwinnett County road names, which is
 * the guessing this repository does not do.
 *
 * OpenStreetMap knows those addresses under the highway name, so it is asked
 * second. It returned the KFC itself for two of them — "KFC, 5290, Stone
 * Mountain Highway" — which is a stronger confirmation than a rooftop match:
 * the feature at that address is the restaurant the invoice was for.
 *
 * Every row records which of the two answered, so a reader can tell a federal
 * match from a community one. Rate limit is one request per second, which is
 * OpenStreetMap's published condition for anonymous use, not a guess at one.
 */
async function locate(oneLine, stateName) {
  for (const variant of spellings(oneLine)) {
    const hit = await locateExact(variant)
    if (hit) return { ...hit, source: 'census' }
    await sleep(PAUSE_MS)
  }
  const osm = await locateOsm(oneLine, stateName)
  return osm ? { ...osm, source: 'openstreetmap' } : null
}

async function locateOsm(oneLine, stateName) {
  // The state is spelled out and the country named: the short form returns
  // nothing, and a bare "GA" is ambiguous outside the US.
  const q = stateName ? oneLine.replace(/, [A-Z]{2}$/, `, ${stateName}, USA`) : oneLine
  const url =
    'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({ q, format: 'jsonv2', addressdetails: '1', limit: '1' })
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    await sleep(OSM_PAUSE_MS)
    if (!res.ok) return null
    const [hit] = await res.json()
    if (!hit?.address?.county) return null
    return {
      matched_address: hit.display_name ?? null,
      lat: Number(hit.lat),
      lng: Number(hit.lon),
      county: hit.address.county.replace(/ County$/, ''),
      // OpenStreetMap does not carry the FIPS code. Left null rather than
      // derived, so nothing downstream joins on a number nobody supplied.
      county_fips: null,
    }
  } catch {
    return null
  }
}

async function locateExact(oneLine) {
  const url =
    `${ENDPOINT}?` +
    new URLSearchParams({
      address: oneLine,
      benchmark: 'Public_AR_Current',
      vintage: 'Current_Current',
      format: 'json',
    })

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (!res.ok) {
        await sleep(PAUSE_MS * attempt * 2)
        continue
      }
      const d = await res.json()
      const hit = d?.result?.addressMatches?.[0]
      if (!hit) return null
      const county = hit.geographies?.Counties?.[0]
      return {
        matched_address: hit.matchedAddress ?? null,
        lat: hit.coordinates?.y ?? null,
        lng: hit.coordinates?.x ?? null,
        // "DeKalb County" as the Census writes it; the bare name is what the
        // landmark files and page slugs use.
        county: county?.NAME?.replace(/ County$/, '') ?? null,
        county_fips: county ? `${county.STATE}${county.COUNTY}` : null,
      }
    } catch {
      await sleep(PAUSE_MS * attempt * 2)
    }
  }
  return null
}

// Resumable, keyed on the store's address rather than its number, so the file
// stays useful even where a store number is withheld.
const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { stores: [] }
// Only successful matches are reused. Caching a null would mean an improved
// address spelling never gets retried, which is how a fixable failure becomes
// a permanent one.
const done = new Map(
  existing.stores
    .filter((s) => s.county)
    // Re-shaped to look like a fresh answer, `geocoder` included. A cached row
    // that loses which service answered leaves the file unable to say whether
    // a county came from the federal geocoder or the community one.
    .map((s) => [s.address_queried, { ...s, source: s.geocoder }]),
)

const STATE_NAMES = await stateNames()

const out = []
let matched = 0
let unmatched = 0

function save() {
  writeFileSync(
    OUT,
    JSON.stringify(
      {
        _comment:
          'Generated by scripts/geocode-stores.mjs from the US Census Bureau geocoder. Coordinates and counties are resolved from the address, never authored. Do not hand-edit.',
        _source: 'https://geocoding.geo.census.gov — Public_AR_Current / Current_Current',
        _generated_utc: new Date().toISOString(),
        stores_total: KBP_STORES.length,
        stores_matched: out.filter((s) => s.county).length,
        stores_unmatched: out.filter((s) => !s.county).length,
        stores: out,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  )
}

for (const store of KBP_STORES) {
  const query = `${store.address}, ${store.city}, ${store.state}`
  const cached = done.get(query)
  const hit = cached ?? (await locate(query, STATE_NAMES.get(store.state)))
  if (!cached) await sleep(PAUSE_MS)

  const row = {
    // The store number stays out of this file for the same reason it stays out
    // of the CSVs: it is KBP's internal identifier and the join key to this
    // company's invoices, not something for a public map.
    address_queried: query,
    city: store.city,
    state: store.state,
    grade: store.grade,
    matched_address: hit?.matched_address ?? null,
    geocoder: hit?.source ?? null,
    county: hit?.county ?? null,
    county_fips: hit?.county_fips ?? null,
    lat: hit?.lat ?? null,
    lng: hit?.lng ?? null,
  }
  out.push(row)
  if (row.county) matched += 1
  else unmatched += 1
  if ((matched + unmatched) % 10 === 0) {
    console.log(`  ${matched + unmatched}/${KBP_STORES.length}`)
    save()
  }
}

save()
console.log(`\n${matched} matched, ${unmatched} unmatched → ${OUT}`)

const publishable = out.filter((s) => s.grade !== 'listed' && s.county)
const byState = {}
for (const s of publishable) (byState[s.state] ??= new Set()).add(s.county)
for (const [st, counties] of Object.entries(byState).sort()) {
  console.log(`${st}: ${counties.size} counties — ${[...counties].sort().join(', ')}`)
}
