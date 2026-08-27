#!/usr/bin/env node
/**
 * build-local-climate.mjs — re-measure src/data/localClimate.js.
 *
 * WHY A SCRIPT RATHER THAN A ONE-OFF
 * ──────────────────────────────────
 * The numbers this replaced — "40+ cycles per winter", "asphaltMonths: 8" —
 * were not wrong because somebody was careless. They were wrong because they
 * were typed once, by hand, and then had no way of ever being checked. A figure
 * with no method behind it cannot be re-derived, so it cannot be corrected, so
 * it survives.
 *
 * This exists so the climate figures never become that. Run it and every number
 * in localClimate.js is recomputed from source by the same method, against
 * whatever baseline is current.
 *
 * Reads coordinates from src/data/serviceAreas.js, so adding a service area
 * with a lat/lng is all it takes for that city to get real numbers.
 *
 *   node scripts/build-local-climate.mjs            # 1995-2024, the shipped baseline
 *   node scripts/build-local-climate.mjs --start 2000-01-01 --end 2029-12-31
 *
 * Open-Meteo's archive is free and needs no key. It is rate limited, hence the
 * pause between cities; a full run is about a minute.
 */
import { writeFileSync } from 'node:fs'
import { SERVICE_AREAS } from '../src/data/serviceAreas.js'

const arg = (flag, dflt) => {
  const i = process.argv.indexOf(flag)
  return i === -1 ? dflt : process.argv[i + 1]
}
const START = arg('--start', '1995-01-01')
const END = arg('--end', '2024-12-31')
const LAYDOWN_F = 50
const PAUSE_MS = 1200

async function fetchDaily(lat, lng) {
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}` +
    `&start_date=${START}&end_date=${END}&daily=temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=fahrenheit&timezone=America%2FNew_York`
  let lastErr
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      lastErr = err
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)))
    }
  }
  throw lastErr
}

const rows = []
for (const [i, area] of SERVICE_AREAS.entries()) {
  if (typeof area.lat !== 'number' || typeof area.lng !== 'number') {
    console.error(`  SKIP ${area.city} — no coordinates`)
    continue
  }
  const d = await fetchDaily(area.lat, area.lng)
  const { time, temperature_2m_max: max, temperature_2m_min: min } = d.daily
  const ft = new Map()
  const work = new Map()
  for (let k = 0; k < time.length; k++) {
    const hi = max[k]
    const lo = min[k]
    if (hi == null || lo == null) continue
    const year = time[k].slice(0, 4)
    // A freeze-thaw cycle: crossed 32F in both directions on the same day.
    if (lo < 32 && hi > 32) ft.set(year, (ft.get(year) || 0) + 1)
    if (hi >= LAYDOWN_F) work.set(year, (work.get(year) || 0) + 1)
  }
  const years = [...ft.keys()].filter((y) => work.has(y)).sort()
  if (!years.length) continue
  const fv = years.map((y) => ft.get(y))
  const wv = years.map((y) => work.get(y))
  const mean = (a) => a.reduce((s, n) => s + n, 0) / a.length
  rows.push({
    slug: area.slug,
    city: area.city,
    county: area.county,
    stateCode: area.stateCode,
    freezeThawAvg: Math.round(mean(fv) * 10) / 10,
    freezeThawMin: Math.min(...fv),
    freezeThawMax: Math.max(...fv),
    workableDaysAvg: Math.round(mean(wv)),
    years: years.length,
  })
  console.log(`  [${i + 1}/${SERVICE_AREAS.length}] ${area.city.padEnd(18)} ft/yr ${rows.at(-1).freezeThawAvg}`)
  await new Promise((r) => setTimeout(r, PAUSE_MS))
}

rows.sort((a, b) => b.freezeThawAvg - a.freezeThawAvg)
writeFileSync('/tmp/local-climate-rows.json', JSON.stringify(rows, null, 2))
console.log(
  `\n${rows.length} areas measured, ${START.slice(0, 4)}-${END.slice(0, 4)}.\n` +
    `Spread: ${rows[0].city} ${rows[0].freezeThawAvg} vs ${rows.at(-1).city} ${rows.at(-1).freezeThawAvg} ` +
    `(${(rows[0].freezeThawAvg / rows.at(-1).freezeThawAvg).toFixed(1)}x)\n` +
    `Rows written to /tmp/local-climate-rows.json — fold into src/data/localClimate.js, ` +
    `updating CLIMATE_SOURCE.retrieved and the baseline dates with them.`,
)
