/**
 * localClimate.js — measured climate for every service area, and what it is
 * allowed to be used for.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Two numbers were published on this site with nothing behind them.
 *
 * LocationsFAQ.jsx told visitors that the Blue Ridge sees "40+ cycles per
 * winter". states50.js carried asphaltMonths: 8 for Virginia, documented in its
 * own header as "Industry consensus on good paving season length by climate" —
 * one figure for the entire Commonwealth, published on the state page as
 * "we strictly adhere to Virginia's 8-month seasonal paving window".
 *
 * Neither was invented maliciously; both are plausible trade figures. But both
 * are CHECKABLE, both appear on pages that sell engineering credibility, and
 * this repository's standing rule is that only measured or sourced facts reach
 * a page. So they were measured.
 *
 * THE CLAIM WAS UNDERSTATED, WHICH WAS NOT THE EXPECTED RESULT
 * ───────────────────────────────────────────────────────────
 * "40+ cycles" is low. Ruckersville averages 73. Charlottesville 69. Vinton 68.
 * Even Richmond, which nobody thinks of as freeze-thaw country, averages 53.
 *
 * The wider finding is the one worth selling: within a single service area the
 * spread runs from 18.4 cycles a year at Virginia Beach to 73.4 at
 * Ruckersville. FOUR TIMES, across markets a two-hour drive apart. That is the
 * strongest possible argument for region-specific specs, and it is measured
 * rather than asserted.
 *
 * WHAT EACH FIELD MEANS, PRECISELY
 * ────────────────────────────────
 * freezeThawAvg   Mean days per year where the low fell below 32°F AND the
 *                 high rose above it. That is the standard definition of a
 *                 freeze-thaw cycle and it is the mechanism that opens cracks:
 *                 water enters, freezes, expands, widens the crack, repeats.
 *
 * workableDaysAvg Mean days per year reaching 50°F, the industry floor for
 *                 surface-course laydown.
 *
 *                 THIS IS NOT THE PAVING SEASON AND MUST NEVER BE PUBLISHED AS
 *                 ONE. A day that touches 50°F at 3pm is not a day a crew can
 *                 lay surface course, which needs sustained temperature, a dry
 *                 base and no rain in the forecast. This is a temperature
 *                 ceiling on the season — the days that are not disqualified by
 *                 cold alone. The real number is materially lower and this file
 *                 does not know it.
 *
 * SOURCE AND METHOD
 * ─────────────────
 * ERA5 reanalysis via the Open-Meteo historical archive, daily maximum and
 * minimum 2m air temperature, 1995-01-01 to 2024-12-31, 30 full years, queried
 * against each service area's own stored latitude and longitude — not a city
 * centroid or a state average. Retrieved 2026-08-27.
 *
 * Committed as data rather than fetched at runtime, so pages stay fast, the
 * figures are auditable, and a page cannot silently change because an API did.
 * Re-run scripts/build-local-climate.mjs to refresh against a later baseline.
 */

export const CLIMATE_SOURCE = {
  dataset: 'ERA5 reanalysis, hourly 2m air temperature aggregated to daily extremes',
  provider: 'Open-Meteo historical archive (open-meteo.com)',
  baselineStart: '1995-01-01',
  baselineEnd: '2024-12-31',
  years: 30,
  retrieved: '2026-08-27',
  laydownFloorF: 50,
  freezeThawDefinition: 'A day whose minimum fell below 32°F and whose maximum rose above it.',
  workableDaysCaveat:
    'Days reaching the 50°F laydown floor. A ceiling on the season, NOT the paving season — sustained temperature, dry base and rainfall are not modelled and the real figure is lower.',
}

/** One row per service area, ordered by freeze-thaw exposure. */
export const LOCAL_CLIMATE = [
  { slug: 'ruckersville-va', city: 'Ruckersville', county: 'Greene County', stateCode: 'VA', freezeThawAvg: 73.4, freezeThawMin: 55, freezeThawMax: 95, workableDaysAvg: 285, years: 30 },
  { slug: 'ivy-va', city: 'Ivy', county: 'Albemarle County', stateCode: 'VA', freezeThawAvg: 69.6, freezeThawMin: 50, freezeThawMax: 90, workableDaysAvg: 289, years: 30 },
  { slug: 'charlottesville-va', city: 'Charlottesville', county: 'Albemarle County', stateCode: 'VA', freezeThawAvg: 69.0, freezeThawMin: 51, freezeThawMax: 87, workableDaysAvg: 291, years: 30 },
  { slug: 'faber-va', city: 'Faber', county: 'Nelson County', stateCode: 'VA', freezeThawAvg: 68.9, freezeThawMin: 51, freezeThawMax: 87, workableDaysAvg: 289, years: 30 },
  { slug: 'vinton-va', city: 'Vinton', county: 'Roanoke County', stateCode: 'VA', freezeThawAvg: 68.0, freezeThawMin: 51, freezeThawMax: 88, workableDaysAvg: 290, years: 30 },
  { slug: 'crozet-va', city: 'Crozet', county: 'Albemarle County', stateCode: 'VA', freezeThawAvg: 68.0, freezeThawMin: 48, freezeThawMax: 91, workableDaysAvg: 288, years: 30 },
  { slug: 'lovingston-va', city: 'Lovingston', county: 'Nelson County', stateCode: 'VA', freezeThawAvg: 67.3, freezeThawMin: 49, freezeThawMax: 85, workableDaysAvg: 288, years: 30 },
  { slug: 'roanoke-va', city: 'Roanoke', county: 'City of Roanoke', stateCode: 'VA', freezeThawAvg: 66.4, freezeThawMin: 51, freezeThawMax: 85, workableDaysAvg: 293, years: 30 },
  { slug: 'nellysford-va', city: 'Nellysford', county: 'Nelson County', stateCode: 'VA', freezeThawAvg: 62.4, freezeThawMin: 42, freezeThawMax: 81, workableDaysAvg: 291, years: 30 },
  { slug: 'annandale-va', city: 'Annandale', county: 'Fairfax County', stateCode: 'VA', freezeThawAvg: 59.3, freezeThawMin: 38, freezeThawMax: 73, workableDaysAvg: 277, years: 30 },
  { slug: 'mechanicsville-va', city: 'Mechanicsville', county: 'Hanover County', stateCode: 'VA', freezeThawAvg: 54.0, freezeThawMin: 31, freezeThawMax: 77, workableDaysAvg: 301, years: 30 },
  { slug: 'richmond-va', city: 'Richmond', county: 'City of Richmond', stateCode: 'VA', freezeThawAvg: 53.4, freezeThawMin: 32, freezeThawMax: 77, workableDaysAvg: 302, years: 30 },
  { slug: 'ashland-va', city: 'Ashland', county: 'Hanover County', stateCode: 'VA', freezeThawAvg: 53.4, freezeThawMin: 30, freezeThawMax: 73, workableDaysAvg: 299, years: 30 },
  { slug: 'glen-allen-va', city: 'Glen Allen', county: 'Henrico County', stateCode: 'VA', freezeThawAvg: 53.0, freezeThawMin: 28, freezeThawMax: 74, workableDaysAvg: 300, years: 30 },
  { slug: 'powhatan-va', city: 'Powhatan', county: 'Powhatan County', stateCode: 'VA', freezeThawAvg: 52.5, freezeThawMin: 29, freezeThawMax: 71, workableDaysAvg: 301, years: 30 },
  { slug: 'fredericksburg-va', city: 'Fredericksburg', county: 'Fredericksburg', stateCode: 'VA', freezeThawAvg: 51.6, freezeThawMin: 28, freezeThawMax: 69, workableDaysAvg: 293, years: 30 },
  { slug: 'midlothian-va', city: 'Midlothian', county: 'Chesterfield County', stateCode: 'VA', freezeThawAvg: 50.9, freezeThawMin: 28, freezeThawMax: 74, workableDaysAvg: 300, years: 30 },
  { slug: 'chester-va', city: 'Chester', county: 'Chesterfield County', stateCode: 'VA', freezeThawAvg: 50.7, freezeThawMin: 27, freezeThawMax: 75, workableDaysAvg: 303, years: 30 },
  { slug: 'henrico-va', city: 'Henrico', county: 'Henrico County', stateCode: 'VA', freezeThawAvg: 48.9, freezeThawMin: 24, freezeThawMax: 68, workableDaysAvg: 301, years: 30 },
  { slug: 'chesterfield-va', city: 'Chesterfield', county: 'Chesterfield County', stateCode: 'VA', freezeThawAvg: 48.2, freezeThawMin: 25, freezeThawMax: 71, workableDaysAvg: 302, years: 30 },
  { slug: 'colonial-heights-va', city: 'Colonial Heights', county: 'Colonial Heights', stateCode: 'VA', freezeThawAvg: 47.0, freezeThawMin: 23, freezeThawMax: 67, workableDaysAvg: 306, years: 30 },
  { slug: 'petersburg-va', city: 'Petersburg', county: 'Petersburg', stateCode: 'VA', freezeThawAvg: 46.5, freezeThawMin: 23, freezeThawMax: 67, workableDaysAvg: 307, years: 30 },
  { slug: 'dinwiddie-va', city: 'Dinwiddie', county: 'Dinwiddie County', stateCode: 'VA', freezeThawAvg: 46.1, freezeThawMin: 22, freezeThawMax: 69, workableDaysAvg: 307, years: 30 },
  { slug: 'hopewell-va', city: 'Hopewell', county: 'Hopewell', stateCode: 'VA', freezeThawAvg: 45.4, freezeThawMin: 23, freezeThawMax: 68, workableDaysAvg: 306, years: 30 },
  { slug: 'prince-george-va', city: 'Prince George', county: 'Prince George County', stateCode: 'VA', freezeThawAvg: 44.3, freezeThawMin: 20, freezeThawMax: 68, workableDaysAvg: 306, years: 30 },
  { slug: 'suffolk-va', city: 'Suffolk', county: 'Suffolk', stateCode: 'VA', freezeThawAvg: 35.3, freezeThawMin: 17, freezeThawMax: 65, workableDaysAvg: 315, years: 30 },
  { slug: 'williamsburg-va', city: 'Williamsburg', county: 'James City County', stateCode: 'VA', freezeThawAvg: 32.6, freezeThawMin: 12, freezeThawMax: 58, workableDaysAvg: 302, years: 30 },
  { slug: 'norfolk-va', city: 'Norfolk', county: 'Norfolk', stateCode: 'VA', freezeThawAvg: 28.0, freezeThawMin: 7, freezeThawMax: 58, workableDaysAvg: 308, years: 30 },
  { slug: 'virginia-beach-va', city: 'Virginia Beach', county: 'Virginia Beach', stateCode: 'VA', freezeThawAvg: 18.4, freezeThawMin: 3, freezeThawMax: 45, workableDaysAvg: 301, years: 30 },
]

/** Lookup by service-area slug. Returns null rather than a default. */
export function climateFor(slug) {
  return LOCAL_CLIMATE.find((c) => c.slug === slug) || null
}

/**
 * THE SPREAD, WHICH IS THE ARGUMENT
 * A buyer who is told "we use region-specific specs" hears marketing. A buyer
 * shown that one end of the service area sees four times the freeze-thaw
 * exposure of the other hears an engineering reason.
 */
export const CLIMATE_SPREAD = {
  highest: { city: 'Ruckersville', freezeThawAvg: 73.4 },
  lowest: { city: 'Virginia Beach', freezeThawAvg: 18.4 },
  ratio: 4.0,
  note:
    'Measured across this company’s own service areas, 30 years, same method for every location.',
}

/**
 * The claim this dataset was built to check, kept so the correction is legible.
 */
export const SUPERSEDED_CLAIMS = [
  {
    where: 'src/components/locations/LocationsFAQ.jsx',
    claimed: 'Blue Ridge freeze-thaw with 40+ cycles per winter',
    measured: 'Ruckersville 73.4, Charlottesville 69.0, Vinton 68.0, Crozet 68.0',
    verdict: 'Understated. The measured figures are higher than the published claim.',
  },
  {
    where: 'src/lib/states50.js + src/pages/StatePavingPage.jsx',
    claimed: 'Virginia asphaltMonths: 8 — "industry consensus", one number for the whole state',
    measured: 'Days reaching the 50°F laydown floor range from 277 (Annandale) to 315 (Suffolk) across the service area.',
    verdict:
      'Not directly comparable — workable days are a temperature ceiling, not a paving season. The state-wide single figure remains unsourced and should not be presented as a company standard.',
  },
]
