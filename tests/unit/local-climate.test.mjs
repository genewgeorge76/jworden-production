import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { LOCAL_CLIMATE, CLIMATE_SOURCE, CLIMATE_SPREAD, climateFor, SUPERSEDED_CLAIMS }
  from '../../src/data/localClimate.js'
import { SERVICE_AREAS } from '../../src/data/serviceAreas.js'

/**
 * A MEASURED NUMBER WITHOUT ITS METHOD IS JUST A DIFFERENT UNSOURCED NUMBER
 * ────────────────────────────────────────────────────────────────────────
 * This dataset exists because two figures were published with nothing behind
 * them and therefore could never be checked or corrected. Replacing them with
 * figures that carry no method would reproduce the fault with better numbers.
 */
test('every figure carries its source, baseline and method', () => {
  assert.match(CLIMATE_SOURCE.provider, /Open-Meteo/)
  assert.equal(CLIMATE_SOURCE.years, 30)
  assert.ok(CLIMATE_SOURCE.retrieved)
  assert.match(CLIMATE_SOURCE.freezeThawDefinition, /below 32/)
  assert.equal(CLIMATE_SOURCE.laydownFloorF, 50)
})

/** Every service area with coordinates should have been measured. */
test('the dataset covers the service areas', () => {
  const withCoords = SERVICE_AREAS.filter((a) => typeof a.lat === 'number' && typeof a.lng === 'number')
  const missing = withCoords.filter((a) => !climateFor(a.slug)).map((a) => a.city)
  assert.deepEqual(missing, [], 'service areas with coordinates but no climate row: ' + missing.join(', '))
  assert.equal(LOCAL_CLIMATE.length, withCoords.length)
})

/** Internal consistency: a mean cannot sit outside its own observed range. */
test('each row is internally coherent', () => {
  for (const c of LOCAL_CLIMATE) {
    assert.ok(c.freezeThawMin <= c.freezeThawAvg, `${c.city}: mean below its minimum`)
    assert.ok(c.freezeThawAvg <= c.freezeThawMax, `${c.city}: mean above its maximum`)
    assert.ok(c.workableDaysAvg > 0 && c.workableDaysAvg <= 366, `${c.city}: impossible workable-day count`)
    assert.equal(c.years, 30)
  }
})

/**
 * THE CAVEAT IS LOad-BEARING AND MUST NOT BE QUIETLY DROPPED
 * workableDaysAvg counts days that merely REACHED 50°F. A day touching 50°F at
 * 3pm is not a day a crew lays surface course. Publishing it as "paving season"
 * would be exactly the kind of false precision this dataset was built to end,
 * and it is the most tempting misuse because the number looks like a season.
 */
test('workable days are not presented as a paving season', () => {
  assert.match(CLIMATE_SOURCE.workableDaysCaveat, /NOT the paving season/i)
  const src = readFileSync('src/data/localClimate.js', 'utf8')
  assert.match(src, /THIS IS NOT THE PAVING SEASON/)
  assert.equal(
    LOCAL_CLIMATE.some((c) => 'pavingSeasonMonths' in c || 'seasonMonths' in c),
    false,
    'a field named like a paving season appeared on a row',
  )
})

/**
 * The spread is the commercial argument — four times the freeze-thaw exposure
 * across markets two hours apart — and it must stay derived from the data
 * rather than becoming its own hand-typed constant.
 */
test('the spread matches the rows it claims to summarise', () => {
  const sorted = [...LOCAL_CLIMATE].sort((a, b) => b.freezeThawAvg - a.freezeThawAvg)
  assert.equal(CLIMATE_SPREAD.highest.city, sorted[0].city)
  assert.equal(CLIMATE_SPREAD.highest.freezeThawAvg, sorted[0].freezeThawAvg)
  assert.equal(CLIMATE_SPREAD.lowest.city, sorted.at(-1).city)
  assert.equal(CLIMATE_SPREAD.lowest.freezeThawAvg, sorted.at(-1).freezeThawAvg)
  const ratio = sorted[0].freezeThawAvg / sorted.at(-1).freezeThawAvg
  assert.ok(Math.abs(CLIMATE_SPREAD.ratio - ratio) < 0.1, 'stated ratio does not match the data')
})

/** The corrected claims stay recorded, so the correction is legible later. */
test('the superseded claims are kept with their verdicts', () => {
  assert.ok(SUPERSEDED_CLAIMS.length >= 2)
  const faq = SUPERSEDED_CLAIMS.find((c) => /LocationsFAQ/.test(c.where))
  assert.ok(faq, 'the freeze-thaw claim is not recorded')
  assert.match(faq.verdict, /[Uu]nderstated/)
  const season = SUPERSEDED_CLAIMS.find((c) => /states50/.test(c.where))
  assert.ok(season, 'the asphaltMonths claim is not recorded')
  assert.match(season.verdict, /not directly comparable/i)
})
