/**
 * georgiaCityPages.js — a page per Georgia city with a completed restaurant.
 *
 * HOW THIS DIFFERS FROM THE TEXAS PAGES, AND WHY THAT MATTERS
 * ──────────────────────────────────────────────────────────
 * texasCityPages.js carries a dollar figure for every city, because the Texas
 * evidence is an invoice tracker that reconciles to the cent. The Georgia
 * evidence is different in kind: a punch list the owner worked from, and emails
 * the crew sent to KBP area coaches describing the work at named stores. Those
 * establish that the work was done. They do not establish what it was worth.
 *
 * So there are NO dollar figures on these pages, and that is not a gap to be
 * filled later with an estimate. A value invented next to a real store number
 * poisons the store number, which is the checkable thing and the whole point.
 *
 * WHY SEVENTEEN PAGES AND NOT ONE, AND WHY NOT TWENTY-SEVEN
 * ────────────────────────────────────────────────────────
 * Seventeen because that is how many Georgia cities have a store graded
 * `completed` in georgiaStores.js. Not one more. The 2017 KBP tracker holds 23
 * further Georgia stores at Design or Permitting, and those are pipeline, not
 * work — they get no page.
 *
 * Seventeen rather than one combined page because "asphalt paving kennesaw ga"
 * is a search someone actually makes and a page that mentions Kennesaw in a
 * list will not answer it. But seventeen pages that swap a place name are
 * duplicate content and worse than nothing, so each one has to say something
 * true and specific.
 *
 * WHAT MAKES THEM GENUINELY DIFFERENT
 * ───────────────────────────────────
 * Metropolitan Atlanta is not one paving market. It is at least five, and the
 * differences are physical rather than rhetorical:
 *
 *   SOUTH METRO      Clayton, Fulton south, Fayette. Hartsfield-Jackson and the
 *                    freight economy around it. Heavy, slow, repetitive axle
 *                    loads — the hardest thing you can ask of asphalt.
 *   WEST/INSIDE      East Point, Adamsville. Older inside-perimeter
 *                    infrastructure on tight urban parcels, frequently built
 *                    before the traffic it now carries.
 *   NORTHWEST I-75   Cobb and Bartow. Acworth, Kennesaw, Cartersville. Rising
 *                    ground toward the Piedmont edge, shallow granite bedrock
 *                    near Kennesaw Mountain, and an industrial corridor.
 *   NORTHEAST I-85   DeKalb and Gwinnett. Chamblee, Tucker, Stone Mountain,
 *                    Holcomb Bridge, Sugarloaf, Pleasant Hill. Dense retail on
 *                    ageing pavement, and at Stone Mountain the granite is not
 *                    a metaphor.
 *   OUTER EAST/WEST  Covington, Villa Rica. Beyond the perimeter, where the
 *                    lots are larger, the subgrade is undisturbed red clay and
 *                    the drainage runs to open ground rather than to a storm
 *                    system.
 *
 * The common substrate is Georgia Piedmont red clay — kaolin-rich, weathered
 * in place from bedrock, and notorious for shrinking in drought and swelling
 * when saturated. That is stated once per sector rather than seventeen times,
 * with the consequence that actually differs at each place.
 */

import { completedGeorgia } from './georgiaStores.js'

export const GA_CLIENT = 'KBP Foods'
export const GA_BRAND = 'KFC'

/**
 * Sector context. `subgrade` and `climate` are written per sector because the
 * ground genuinely is a sector-level fact; `angle` is per city.
 */
const SECTORS = {
  southMetro: {
    name: 'South Metro Atlanta',
    counties: 'Clayton, south Fulton and Fayette',
    subgrade:
      'South of the city the Piedmont red clay runs deep and undisturbed, and it moves with the season — shrinking through an August drought, swelling through a wet February. Pavement laid straight onto it tracks that movement and cracks. The answer is a stone base thick enough to bridge it and drainage that actually leaves the site, not a heavier surface course.',
    climate:
      'This is the freight side of the metro. Hartsfield-Jackson and the distribution economy around it put loaded vehicles on the same lines every day, slowly, often turning under load — which is the hardest thing you can ask of asphalt. The failure here is rutting and shoving in the drive aisles, not weathering.',
  },
  insidePerimeter: {
    name: 'Inside the Perimeter, Southwest Atlanta',
    counties: 'Fulton County',
    subgrade:
      'Inside the perimeter the ground has been built on, cut and filled for a century, so what is under a lot is rarely the clay the geological map promises. It is a mixture, and the mixture is not uniform across a single parcel. That makes proving the subgrade before laying anything worth more here than it is on open ground, because the soft spot is local and it will find you.',
    climate:
      'Older commercial parcels carrying modern delivery traffic on pavement that predates it. The characteristic failure is fatigue — interconnected cracking along the wheel paths, which means the base has stopped carrying rather than that the surface has worn out. Overlaying that without full-depth repair buys a season.',
  },
  northwest: {
    name: 'Northwest Corridor, I-75',
    counties: 'Cobb and Bartow',
    subgrade:
      'The ground rises northwest out of the city toward the Piedmont edge, and the clay thins as it goes. Near Kennesaw Mountain the granite bedrock sits close enough to the surface to matter: shallow rock means drainage cannot go down, so it has to go sideways, and a lot designed as though water will percolate will hold it instead.',
    climate:
      'The I-75 corridor is retail and industrial together, which means car traffic and truck traffic on the same pavement with very different demands. Entrances off the highway service roads take the worst of it — vehicles decelerating off a fast road and turning under load concentrate stress in the first thirty feet.',
  },
  northeast: {
    name: 'Northeast Corridor, I-85',
    counties: 'DeKalb and Gwinnett',
    subgrade:
      'Piedmont clay again, but under some of the densest retail development in the Southeast, most of it built in a thirty-year window and now ageing together. What is beneath a lot here is usually the original 1970s or 1980s base, which was designed for the traffic of the day and has been carrying more ever since.',
    climate:
      'Sun and age rather than frost. Georgia sees almost no meaningful freeze-thaw, so the enemy is oxidation and load — surfaces go brittle and grey, then crack, then let water into a base that was already working at its limit. Sealcoating on a real maintenance cycle is worth more in this corridor than almost anything done at construction time.',
  },
  outer: {
    name: 'Beyond the Perimeter',
    counties: 'Newton, Carroll and Douglas',
    subgrade:
      'Out here the red clay is undisturbed and the parcels are large enough that drainage runs to open ground rather than into a storm system. That is an advantage and a trap: water leaves the lot easily until the day the outfall silts up, and then it backs under the pavement with nowhere to go. Edge detail and a maintained outfall carry more weight than an extra inch of mat.',
    climate:
      'Longer runs, bigger lots, and fewer constraints on when work can happen — which makes proper base construction affordable in a way it often is not on a cramped urban parcel. The failure to design against is edge break on wide aprons and washout at the low corner.',
  },
}

/** City -> sector and the one thing that is true of that city and not the next. */
const CITY_CONTEXT = {
  Riverdale: { sector: 'southMetro', angle: 'Riverdale sits directly under the Hartsfield-Jackson approach in Clayton County, and the commercial traffic here is airport-economy traffic — shift workers, hotel shuttles and delivery vehicles running at hours when nothing else is moving.' },
  'Union City': { sector: 'southMetro', angle: 'Union City is where south Fulton meets the freight corridor along I-85 South, with distribution and big-box parcels whose loading approaches take standing axle loads rather than passing ones.' },
  Lovejoy: { sector: 'southMetro', angle: 'Lovejoy is the outer edge of Clayton County, where the metro thins into Henry County farmland and lots are built on undisturbed clay with room to grade properly.' },
  // Clarkston sat under `southMetro` until 2026-08-25, which put it in
  // "Clayton, south Fulton and Fayette" beneath a paragraph about the
  // Hartsfield freight economy. Clarkston is in DeKalb County, inside I-285 on
  // the northeast side, twenty-five miles from the airport — stated outright by
  // the Census place register, and now checked by a test rather than trusted.
  // The name looks like Clayton. That is the whole explanation.
  Clarkston: { sector: 'northeast', angle: 'Clarkston is one of the most densely settled square miles in Georgia, and the commercial parcels are small, tightly bounded and heavily used — phasing matters here more than volume does.' },
  'East Point': { sector: 'insidePerimeter', angle: 'East Point is old inside-perimeter Fulton, laid out around rail and airport ground, and its commercial parcels sit on fill whose history nobody recorded.' },
  Adamsville: { sector: 'insidePerimeter', angle: 'Adamsville, on the west side off Martin Luther King Jr Drive, carries the same century of cut-and-fill and the same requirement to prove what is under a lot before committing to a section.' },
  Acworth: { sector: 'northwest', angle: 'Acworth sits at the top of the Cobb County stretch of I-75 by Lake Allatoona, with weekend recreation traffic layered onto weekday commercial use.' },
  Kennesaw: { sector: 'northwest', angle: 'Kennesaw is where the bedrock gets shallow — the mountain is granite and so is much of what lies under the town, which changes drainage from a vertical problem into a lateral one.' },
  Cartersville: { sector: 'northwest', angle: 'Cartersville is Bartow County, forty miles out and genuinely industrial — manufacturing, aggregate and rail — where the lots carry heavier and more concentrated loads than metro retail ever does.' },
  Chamblee: { sector: 'northeast', angle: 'Chamblee is the Buford Highway corridor, dense international retail on older DeKalb parcels with high turnover and small lots that cannot be closed for long.' },
  Tucker: { sector: 'northeast', angle: 'Tucker sits between I-285 and Stone Mountain Freeway with a mix of light industrial and retail, much of it on pavement laid when the traffic was a fraction of today’s.' },
  'Stone Mountain': { sector: 'northeast', angle: 'At Stone Mountain the granite is not a figure of speech — the largest exposed mass of it in North America is the town’s neighbour, and shallow rock is a real constraint on how a lot drains.' },
  'Holcomb Bridge': { sector: 'northeast', angle: 'The Holcomb Bridge Road corridor runs through north Fulton and into Gwinnett, a long retail strip where every property shares the same entrance-loading problem off a fast arterial.' },
  Sugarloaf: { sector: 'northeast', angle: 'Sugarloaf Parkway is newer Gwinnett development — planned, wide and built to a standard, which means the work here is usually maintaining a sound surface rather than rescuing a failed one.' },
  'Pleasant Hill': { sector: 'northeast', angle: 'Pleasant Hill Road at I-85 is among the busiest retail intersections in Gwinnett County, and lots serving it turn over their entire traffic count several times a day.' },
  Covington: { sector: 'outer', angle: 'Covington is Newton County, thirty-five miles east, a courthouse town with large open parcels and drainage that runs to ground rather than to a storm system.' },
  'Villa Rica': { sector: 'outer', angle: 'Villa Rica straddles the Carroll and Douglas county line on I-20 west, far enough out that lots are built with room to grade and drain them properly.' },
}

const slugify = (city) => city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

/**
 * One page per city with a completed store. Derived from georgiaStores.js so a
 * store that is later re-graded cannot leave an orphan page behind it.
 */
export function georgiaCityPages() {
  const byCity = new Map()
  for (const store of completedGeorgia()) {
    if (!byCity.has(store.city)) byCity.set(store.city, [])
    byCity.get(store.city).push(store)
  }

  const pages = []
  for (const [city, stores] of byCity) {
    const context = CITY_CONTEXT[city]
    if (!context) continue // A city with no written context gets no page.
    const sector = SECTORS[context.sector]
    pages.push({
      city,
      path: `/${slugify(city)}`,
      sector: sector.name,
      counties: sector.counties,
      subgrade: sector.subgrade,
      climate: sector.climate,
      angle: context.angle,
      stores,
      storeCount: stores.length,
      title: `Asphalt Paving in ${city}, GA | Commercial Parking Lots`,
      summary: `${context.angle} We have completed ${GA_BRAND} restaurant work in ${city} for ${GA_CLIENT}.`,
      description:
        `Commercial asphalt paving, parking lot rehabilitation and sealcoating in ${city}, Georgia. ` +
        `${GA_BRAND} restaurant work completed here for ${GA_CLIENT}. Built for Piedmont red clay in ${sector.counties}.`,
    })
  }
  return pages.sort((a, b) => a.city.localeCompare(b.city))
}

export const georgiaCityPaths = () => georgiaCityPages().map((p) => p.path)
