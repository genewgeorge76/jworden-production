/**
 * businessInfo.js — Single canonical source of truth for J. Worden & Sons NAP
 * SpaceX/Linear Foundation — ONE FILE. ONE TRUTH. No drift tolerated.
 * Verified address: 1601 Ware Bottom Spring Rd (NO trailing S)
 * Last verified: 2026-05-10
 */

// Vercel serves this site on www and 308-redirects the bare apex to it, so an
// apex value here is not a preference — it is a URL that resolves somewhere
// else, stamped onto every schema @id, canonical and og:url downstream.
// .env.example shipped the apex form for a long time and CI builds a .env from
// it, so the wrong value reached production. Normalising here means the deploy
// is correct regardless of what the environment variable happens to say.
const CONFIGURED_SITE_URL =
  import.meta.env?.VITE_SITE_URL || 'https://www.jwordenasphaltpaving.com'

// The lookahead terminates the hostname. Without it the pattern matches any
// host merely *starting* with jwordenasphaltpaving.com — including
// jwordenasphaltpaving.com.example.net — and would rewrite an unrelated domain
// into something that looks like ours. CodeQL flagged this as an incomplete
// hostname expression, correctly: a host ends at end-of-string, a path, a port,
// a query or a fragment, and nowhere else.
const APEX_HOST = /^(https?:\/\/)jwordenasphaltpaving\.com(?=$|[/:?#])/i

export const SITE_URL = CONFIGURED_SITE_URL.replace(
  APEX_HOST,
  '$1www.jwordenasphaltpaving.com',
).replace(/\/+$/, '')

export const SCHEMA_IDS = {
  organization:  `${SITE_URL}/#organization`,
  localBusiness: `${SITE_URL}/#localbusiness`,
  website:       `${SITE_URL}/#website`,
  founder:       `${SITE_URL}/about#founder`,
}

export const BUSINESS_NAME         = 'J. Worden & Sons Paving LLC'
export const BUSINESS_LEGAL_NAME   = 'J. Worden & Sons Paving LLC'
export const BUSINESS_DESCRIPTION  =
  '4th-generation family asphalt paving contractor est. 1984. ' +
  'Paved 100+ KFC locations across Georgia and the Southeast. ' +
  'Pavement Magazine Top Contractor (Paving 75). ' +
  'Best of Houzz Service Award 2014, 2015, 2016, 2023. ' +
  'Virginia Class A Contractor. ' +
  'Serving Virginia, Minnesota, the Carolinas, Georgia, and Florida.'
export const BUSINESS_FOUNDING_YEAR = '1984'

export const PHONE_E164    = '+18044461296'
export const PHONE_DISPLAY = '(804) 446-1296'
export const PHONE_SCHEMA  = '+1-804-446-1296'
export const SMS_E164      = '+18044461296'
export const SMS_PREFILL   = 'Hi, I saw your website and want a free quote.'
export const EMAIL         = 'j.wordenandsonspaving@gmail.com'

// HomeSchema.jsx publishes Object.values() of this as the homepage `sameAs`,
// so a dead URL here is an identity claim pointing at a 404. Every entry was
// checked on 2026-08-24 and two were wrong. The other schema path builds its
// sameAs from social.js, and the two files disagreed — which is how a site
// ends up naming two different Instagram accounts as itself.
export const SOCIAL_PROFILES = {
  // Trailing slash: the bare /jwordenpaving returns 400 to a crawler.
  facebook:  'https://www.facebook.com/jwordenpaving/',
  // Was /company/j-worden-sons-asphalt-paving-inc/ — 404. This showcase page
  // is the one that resolves, and the one social.js already used.
  linkedin:  'https://www.linkedin.com/showcase/j.-worden-%26-sons-paving-l.l.c./',
  // Was j.worden_paving, which social.js did not agree with. Instagram
  // rate-limits this check (429, never 404), so neither handle could be proved
  // dead — but jwordensons returns 200 and is what the more-maintained file
  // uses, so the site now names one account instead of two. If j.worden_paving
  // is the real one, change it here and in social.js together.
  instagram: 'https://www.instagram.com/jwordensons',
  houzz:     'https://www.houzz.com/professionals/stone-pavers-and-concrete/j-worden-and-sons-paving-l-l-c-pfvwus-pf~663227484',
}

// VERIFIED: "Ware Bottom Spring Rd" — NO trailing S
export const ADDRESS = {
  streetAddress:   '1601 Ware Bottom Spring Rd, Suite 214',
  addressLocality: 'Chester',
  addressRegion:   'VA',
  postalCode:      '23836',
  addressCountry:  'US',
}

export const ADDRESS_DISPLAY = `${ADDRESS.streetAddress}, ${ADDRESS.addressLocality}, ${ADDRESS.addressRegion} ${ADDRESS.postalCode}`

export const GEO = { latitude: 37.3529, longitude: -77.4326 }

export const PRICE_RANGE = '$$$'

export const OPENING_HOURS = [
  { dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '07:00', closes: '18:00' },
  { dayOfWeek: ['Saturday'], opens: '07:00', closes: '14:00' },
]
export const HOURS_DISPLAY     = 'Mon–Fri 7am–6pm · Sat 7am–2pm'
export const HOURS_DISPLAY_ALT = '24/7 Emergency Response Available'

// Review aggregate lives in reviews.js — one source across all platforms
// (Houzz + Angi + Facebook today; add Google when the GBP is reverified).
export { AGGREGATE_RATING, REVIEW_RATING, REVIEW_COUNT } from './reviews'

export const CREDENTIALS = {
  // ───────────────────────────────────────────────────────────────────────────
  // UNRESOLVED — READ THIS BEFORE RELYING ON vaLicense.
  //
  // Verified against the Virginia DPOR License Lookup on 2026-08-24
  // (http://dporweb.dpor.virginia.gov/LicenseLookup/AdvancedSearch), whose own
  // data stamp read "last updated Sun Aug 23":
  //
  //   Name        J WORDEN & SONS PAVING LLC
  //   Number      2705105644
  //   Rank        Class A                      <- the claim is real
  //   Specialty   Asphalt Paving and Seal Coating (PAV)
  //   Class A effective  2016-06-08
  //   Initial certification  2006-04-07
  //   EXPIRATION  2024-06-30                   <- more than two years ago
  //
  // So the rank is genuine and the record is the right company, but the licence
  // behind it shows lapsed. The string below is published in the present tense
  // in visible copy and in the LocalBusiness JSON-LD on every domain.
  //
  // It has NOT been removed, deliberately. DPOR's own disclaimer allows for
  // processing lag, a renewal may exist that the lookup has not posted, and
  // stripping the core credential off twenty-odd public sites on one reading of
  // one database is a bigger, less reversible act than leaving a flagged note
  // here. No second or current licence exists for the company: the only other
  // Worden contractor record (JOHN WORDEN, 2705010961, Class B, Highway/Heavy)
  // expired 2006-05-31.
  //
  // WHY IT LAPSED, WHICH THE DATE ALONE DOES NOT SAY (2026-08-25)
  //
  // A Virginia Class A licence requires a qualified individual — a named
  // person who has passed the trade exam and stands behind the company's
  // licence. That person for J. Worden & Sons was the owner's son.
  //
  // He has since taken out his own licence, which removed him as this
  // company's qualifier. The licence lapsed at the following renewal because
  // there was nobody left holding the exam credential, not because a renewal
  // notice was ignored.
  //
  // The owner is scheduling the exam himself to re-qualify the company.
  //
  // This matters to how the record reads. "EXPIRATION 2024-06-30" looks like
  // neglect. What actually happened is a son going independent and a father
  // sitting the exam to replace him — which is the same shape as the 2025 note
  // in recentWork.js, where the bare data read colder than the truth.
  //
  // It also removes the benign hypothesis the block above rested on. This is
  // not a DPOR posting lag. The licence is genuinely inactive, and the present
  // tense in BUSINESS_DESCRIPTION and in the LocalBusiness JSON-LD on every
  // domain is a claim the state's own register does not currently support.
  //
  // Not stripped here, because the remedy is already in motion and stripping a
  // core credential off twenty-odd sites days before an exam is a worse
  // outcome than a flagged note. But the decision now belongs to the owner
  // with the facts in front of him, not to a future reader guessing.
  //
  // Resolve one of two ways, then delete this block:
  //   - renewed  -> confirm the current expiration date and record it here
  //   - lapsed   -> the claim comes out of CREDENTIALS *and* out of
  //                 BUSINESS_DESCRIPTION above, which is what feeds the schema
  //
  // Note also that the licence number itself is published nowhere on the sites.
  // ───────────────────────────────────────────────────────────────────────────
  vaLicense:    'Virginia Class A Contractor',
  // BBB: profile is live but currently "Not Rated" and not accredited — no rating
  // claim is published. Restore only with documentation from BBB itself.
  pavementAward:'Pavement Magazine Top 75 Contractor (2018)',
  houzzAwards:  ['Best of Houzz Service 2014','Best of Houzz Service 2015','Best of Houzz Service 2016','Best of Houzz Service 2023'],
}

export const SERVICES_OFFERED = [
  { name: 'Asphalt Paving' },
  { name: 'Commercial Paving' },
  { name: 'Parking Lot Paving' },
  { name: 'Driveway Paving' },
  { name: 'Asphalt Sealcoating' },
  { name: 'Asphalt Repair & Crack Filling' },
  { name: 'Tar and Chip Paving' },
  { name: 'Asphalt Milling' },
  { name: 'Pavement Maintenance' },
  { name: 'Industrial Paving' },
  { name: 'QSR / Restaurant Parking Lots' },
  { name: 'Brick Pavers & Natural Stone' },
  { name: 'Hardscape Design' },
  { name: 'Concrete Flatwork' },
]

export const SERVICE_AREAS = [
  { type: 'State', name: 'Virginia' },
  { type: 'City',  name: 'Richmond' },
  { type: 'City',  name: 'Chester' },
  { type: 'City',  name: 'Midlothian' },
  { type: 'City',  name: 'Chesterfield' },
  { type: 'City',  name: 'Henrico' },
  { type: 'City',  name: 'Glen Allen' },
  { type: 'City',  name: 'Short Pump' },
  { type: 'City',  name: 'Mechanicsville' },
  { type: 'City',  name: 'Petersburg' },
  { type: 'City',  name: 'Colonial Heights' },
  { type: 'City',  name: 'Hopewell' },
  { type: 'City',  name: 'Fredericksburg' },
  { type: 'City',  name: 'Williamsburg' },
  { type: 'City',  name: 'Virginia Beach' },
  { type: 'City',  name: 'Chesapeake' },
  { type: 'City',  name: 'Norfolk' },
  { type: 'City',  name: 'Charlottesville' },
  { type: 'City',  name: 'Lynchburg' },
  { type: 'City',  name: 'Roanoke' },
  { type: 'City',  name: 'Harrisonburg' },
  { type: 'State', name: 'Minnesota' },
  { type: 'City',  name: 'Minneapolis' },
  { type: 'City',  name: 'St. Paul' },
  { type: 'City',  name: 'Brainerd' },
  { type: 'City',  name: 'Bemidji' },
  { type: 'State', name: 'Georgia' },
  { type: 'City',  name: 'Atlanta' },
  { type: 'City',  name: 'Savannah' },
  { type: 'State', name: 'North Carolina' },
  { type: 'State', name: 'South Carolina' },
  { type: 'City',  name: 'Charlotte' },
  { type: 'City',  name: 'Raleigh' },
  { type: 'City',  name: 'Wilmington' },
  { type: 'City',  name: 'Myrtle Beach' },
  { type: 'State', name: 'Florida' },
  { type: 'City',  name: 'Orlando' },
]

export const FOUNDER = {
  name:            'Gene W. George',
  brandName:       'Mr. Worden',
  jobTitle:        'Owner-Operator & 4th-Generation Master Paver',
  description:     'Started in the trade as a teenager working alongside family, carrying on a paving legacy established in 1984. Has personally managed residential, commercial, QSR (100+ KFC locations across Georgia and the Southeast), REIT, and municipal paving projects across more than a dozen states. Virginia Class A Contractor. Pavement Magazine Top 75. Best of Houzz 4x.',
  yearsExperience: Math.max(0, new Date().getFullYear() - 1984),
  states:          ['VA','MN','NC','SC','GA','FL'],
}

export const QSR_HISTORY = {
  kfc: {
    count:       100,
    regions:     ['Atlanta Metro','Georgia Statewide','Southeast'],
    description: '100+ KFC parking lot paving and resurfacing projects under KBP Foods franchise program.',
  },
  brands:          ['KFC',"Arby's",'Taco Bell'],
  notableProject:  '2017 Marietta, GA Big Chicken parking lot — landmark KFC location.',
}
