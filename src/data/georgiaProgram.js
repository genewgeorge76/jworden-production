/**
 * georgiaProgram.js — the Georgia restaurant work, and one landmark.
 *
 * THE FIGURE AND WHERE IT COMES FROM
 * ──────────────────────────────────
 * "100+ KFC locations paved across Georgia" is stated on the owner's direct
 * authority, given 2026-08-24 when asked about it specifically. It is not
 * derived from a tracker the way the Texas figures are, and this file says so
 * rather than dressing it up.
 *
 * That distinction matters and it is not a hedge. There are two honest kinds of
 * claim on a contractor's site:
 *
 *   OWNER-STATED   rests on the word of the man who ran the crews. This is how
 *                  every contractor's site in the world works, and it is
 *                  legitimate. It is what "100+" is.
 *   RECORD-BACKED  each item checkable against an invoice or a dated
 *                  photograph. This is what the 23 Texas sites and the 3 North
 *                  Carolina sites are.
 *
 * The site should not present the first as though it were the second. So the
 * Georgia pages carry the count as a statement of experience, and the ONE
 * named, verifiable item — the Big Chicken — carries its own public facts.
 *
 * THE BIG CHICKEN
 * ───────────────
 * Not another store number. A 56-foot steel rooster at the corner of Cobb
 * Parkway and Roswell Road in Marietta, up since 1963, KFC since 1974, and one
 * of the most recognised structures in metropolitan Atlanta. Colonel Sanders
 * reportedly wanted it taken down until he saw what it did for trade.
 *
 * Every fact below about the STRUCTURE is public and independently checkable —
 * Wikipedia, the Atlanta Journal-Constitution, Explore Georgia. The claim that
 * this company paved it is the owner's.
 *
 * Its $2m renovation ran in 2017, which sits inside the same window as the KBP
 * programme documented elsewhere in this repo. That is corroboration of
 * timing, not proof of the job, and it is recorded here as exactly that.
 *
 * WHY A LANDMARK IS WORTH MORE THAN A COUNT
 * ─────────────────────────────────────────
 * "100+ locations" is a number a reader has to take on trust. "The Big Chicken"
 * is a place they have driven past. One is a claim; the other is a memory. A
 * single named landmark does more for belief than three digits, and it is the
 * kind of thing Google's local and entity systems can actually resolve.
 */

/** Stated by the owner, 2026-08-24. Not derived from a tracker. */
export const GA_QSR_COUNT_STATED = '100+'
export const GA_QSR_BRAND = 'KFC'
export const GA_CLIENT = 'KBP Foods'

/**
 * How the count may be described. The wording is fixed here so twenty-seven
 * city pages cannot drift into twenty-seven different claims.
 *
 * Note what it does NOT say: not "40+ years of Georgia paving experience".
 * The company has been trading since 1984, and that experience is real, but it
 * was not all accumulated in Georgia. The corrected line separates the two.
 */
export const GA_EXPERIENCE_LINE =
  'Licensed, insured, and backed by 40+ years in the trade — including 100+ KFC locations paved across Georgia.'

/**
 * A named, publicly verifiable landmark.
 *
 * `structureFacts` are public record. `ourWork` is the owner's statement. They
 * are kept in separate fields on purpose so nobody later reads the second as
 * carrying the authority of the first.
 */
export const BIG_CHICKEN = {
  name: 'The Big Chicken',
  operator: 'KFC',
  address: '12 Cobb Pkwy N',
  city: 'Marietta',
  state: 'GA',
  postalCode: '30062',
  // Corner of Cobb Parkway (US-41) and Roswell Road (GA-120).
  latitude: 33.9526,
  longitude: -84.5197,
  structureFacts: [
    'A 56-foot steel-sided rooster, with a moving beak and eyes',
    'Designed by Hubert Puckett, a Georgia Tech architecture student, and erected in 1963',
    'Built for Johnny Reb’s Chick, Chuck and Shake; a KFC since 1974',
    'Rebuilt after storm damage in 1993 and given a $2 million renovation in 2017',
  ],
  sources: [
    'https://en.wikipedia.org/wiki/Big_Chicken',
    'https://www.ajc.com/news/local/marietta-big-chicken-through-the-years/9HY7irt0ZzDRGuMVSaWLSK/',
    'https://exploregeorgia.org/marietta/food-drink/casual-full-service/the-big-chicken',
  ],
  /** The owner's statement. Deliberately separate from structureFacts. */
  ourWork: 'Among the Georgia KFC locations this company has paved.',
}

/**
 * Schema.org for the landmark — a real Place with coordinates, which is what
 * "local landmark schema" actually means. A search engine can resolve this to
 * the same entity it already knows from a dozen other sources.
 */
export function bigChickenSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LandmarksOrHistoricalBuildings',
    name: BIG_CHICKEN.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BIG_CHICKEN.address,
      addressLocality: BIG_CHICKEN.city,
      addressRegion: BIG_CHICKEN.state,
      postalCode: BIG_CHICKEN.postalCode,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BIG_CHICKEN.latitude,
      longitude: BIG_CHICKEN.longitude,
    },
    sameAs: BIG_CHICKEN.sources,
  }
}
