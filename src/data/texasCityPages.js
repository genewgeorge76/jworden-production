/**
 * texasCityPages.js — one page per Texas city, built from the invoiced work.
 *
 * WHY EACH PAGE IS DIFFERENT
 * ──────────────────────────
 * The owner's standing rule is that no two sites — and no two pages — carry the
 * same content. Nineteen city pages spun from one template with the place name
 * swapped is exactly what that rule forbids, and it is also what Google treats
 * as doorway pages: near-duplicates whose only variable is a location. They do
 * not rank, and at scale they drag down the pages that would have.
 *
 * So every page here is differentiated by facts that are actually different:
 *
 *   - the STORES invoiced in that city, by number, and what each was worth
 *   - the REGION, which carries its own subgrade and climate problem — Valley
 *     saline soil and a high water table is not Blackland Prairie clay, and
 *     neither is East Texas
 *   - whether the programme RETURNED to that city, which four of them did
 *
 * A city with two stores reads differently from a city with one because it IS
 * different. Where there is nothing more to say about a city than its name and
 * its invoice, the page says that much and stops rather than padding.
 *
 * EVERY FIGURE COMES FROM texasProgram.js
 * ───────────────────────────────────────
 * Which in turn comes from the Project Red invoice tracker, read by
 * app/services/job_ledger.py. Nothing on these pages is generated, inferred or
 * rounded up. If a city is not in TX_SITES it gets no page — there is no
 * "coming soon" or "we serve" page for a city the company has not invoiced,
 * because that is a claim dressed as a landing page.
 */

import { TX_SITES, TX_REGIONS, TX_CLIENT, TX_BRAND } from './texasProgram.js'

/** URL slug for a city name. "Rio Grande City" -> "rio-grande-city". */
export function citySlug(city) {
  return String(city || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function cityPath(city) {
  return `/texas/${citySlug(city)}`
}

/**
 * The engineering problem each region actually presents.
 *
 * These are not decorative. A Valley lot and a Waco lot fail in different ways
 * and the fix is different, which is the substance that makes a city page worth
 * reading instead of a name swap.
 */
const REGION_GROUND = {
  'Rio Grande Valley': {
    subgrade:
      'The Valley problem comes from below: a high water table and saline soils that attack a base from underneath while the surface still looks sound. Drainage and a base built to shed water decide the life of the lot, not mat thickness.',
    climate:
      'Heat and humidity, effectively no freeze. Binder grade and compaction carry the pavement here — an under-specified binder ruts and shoves under standing drive-thru traffic long before anything cracks.',
  },
  Border: {
    subgrade:
      'Border sites sit on caliche and gravelly subgrade that compacts well when it is dry and behaves very differently when it is not. The work is in the moisture control during placement, not in the spec sheet.',
    climate:
      'Extreme summer surface temperatures with a wide day-to-night swing. That cycling is hard on joints and on any seam that was not rolled while the mat was still hot.',
  },
  'Central Texas': {
    subgrade:
      'Central Texas is Blackland Prairie clay with a plasticity index high enough to lift and drop a slab through one wet-dry cycle. Thickening the mat does not fix that. Lime or cement treatment of the subgrade, and a base that drains, does.',
    climate:
      'Long, hot summers that push sustained surface temperatures into the range where an under-specified binder ruts under loaded traffic.',
  },
  'East & North Texas': {
    subgrade:
      'East Texas trades the Blackland clay for sandier ground and more of it — better drainage, less movement, but a base that will wash out if the site was never graded to carry water away from the pavement.',
    climate:
      'More rainfall than the rest of the state and occasional hard freezes at the northern end. Water in a joint becomes a pothole in one season, so joint sealing earns its keep here.',
  },
  'Gulf Coast': {
    subgrade:
      'Coastal sites take salt spray and a water table close to the surface. Sand infiltration and a base that stays wet are the failure modes, and both are drainage problems before they are paving problems.',
    climate:
      'Humid, hot, and corrosive. Sealcoating on a real maintenance cycle does more for a coastal lot than any single construction decision.',
  },
}

function regionFor(city) {
  const found = TX_REGIONS.find((region) => region.cities.includes(city))
  return found ? found.name : null
}

const usd = (value) =>
  `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

/**
 * Every Texas city with invoiced work, with the facts that make its page its
 * own. Sorted by value so the strongest pages are built and linked first.
 */
export function texasCityPages() {
  const byCity = new Map()

  for (const site of TX_SITES) {
    const existing = byCity.get(site.city) || { city: site.city, sites: [], value: 0 }
    existing.sites.push({ store: site.store, value: site.value })
    existing.value += site.value
    byCity.set(site.city, existing)
  }

  return [...byCity.values()]
    .map((entry) => {
      const region = regionFor(entry.city)
      const ground = REGION_GROUND[region] || {}
      const returned = entry.sites.length > 1

      return {
        city: entry.city,
        slug: citySlug(entry.city),
        path: cityPath(entry.city),
        region,
        sites: entry.sites.sort((a, b) => b.value - a.value),
        siteCount: entry.sites.length,
        value: entry.value,
        valueLabel: usd(entry.value),
        subgrade: ground.subgrade || null,
        climate: ground.climate || null,
        returned,

        // The one-line summary, written from what is true of THIS city rather
        // than from a template. A city with two stores says so, because a
        // client who brought us back is a stronger fact than one who did not.
        summary: returned
          ? `${entry.sites.length} invoiced ${TX_BRAND} restaurant sites in ${entry.city} for ${TX_CLIENT} — the programme came back to this city.`
          : `An invoiced ${TX_BRAND} restaurant site in ${entry.city} for ${TX_CLIENT}, run as part of a ${TX_SITES.length}-site Texas programme.`,

        title: `Asphalt Paving in ${entry.city}, TX — Commercial & Estate | Texas Pavement Group`,

        // Kept under 160 characters, which is roughly what Google will show.
        // "South Padre Island" is long enough to push the wordier draft of
        // this to 169 and get it truncated mid-sentence, so the phrasing is
        // deliberately tight rather than as tight as it happens to fit.
        description: returned
          ? `Commercial asphalt paving in ${entry.city}, TX. ${entry.sites.length} invoiced ${TX_BRAND} sites for ${TX_CLIENT} — TxDOT Item 341 mix, 96% compaction floor. Request an estimate.`
          : `Commercial asphalt paving in ${entry.city}, TX. Invoiced ${TX_BRAND} work for ${TX_CLIENT} — TxDOT Item 341 mix, 96% compaction floor. Request an estimate.`,
      }
    })
    .sort((a, b) => b.value - a.value)
}

/** Sanity check used by the build and by the tests. */
export function texasCityTotals(pages = texasCityPages()) {
  return {
    cities: pages.length,
    sites: pages.reduce((sum, page) => sum + page.siteCount, 0),
    value: pages.reduce((sum, page) => sum + page.value, 0),
  }
}
