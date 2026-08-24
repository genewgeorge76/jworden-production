/**
 * carolinaRegions.js — the two Carolinas, which are not one market.
 *
 * WHAT THIS IS AND IS NOT
 * ───────────────────────
 * This file carries SERVICE-AREA and GROUND-CONDITION content. It carries no
 * job counts, no dollar figures and no project list, because none exist in this
 * repository for the Carolinas.
 *
 * That distinction is deliberate and it is the whole reason this file can be
 * written at all. There are two different kinds of claim on a contractor's site:
 *
 *   "We work in South Carolina"     — a service-area statement. It rests on the
 *                                     owner's word, which is how every
 *                                     contractor's site in the world works.
 *
 *   "We completed 40 jobs there
 *    worth $600,000"                — a proof claim. It needs records, because
 *                                     it is a specific checkable number.
 *
 * The owner is from South Carolina and reports years of work there, heavily in
 * the last three. That is enough for the first kind and not for the second. So
 * this file makes the first kind only. When the InvoiceFly export or the
 * carolinablacktop@gmail.com archive turns up, a proof block gets added the way
 * texasProgram.js does it — from invoices, not from assertion.
 *
 * WHY TWO PAGES RATHER THAN ONE
 * ─────────────────────────────
 * carolinablacktop.com was written entirely for the Piedmont — "Asphalt Paving
 * Built For the Piedmont", Charlotte metro, red clay. Meanwhile the brand's
 * phone number is 843: Charleston, Myrtle Beach, Hilton Head. A South Carolina
 * customer landing on that page is being told about a different state.
 *
 * The North Carolina material is accurate and stays. South Carolina is added
 * beside it rather than replacing it, because the ground genuinely differs and
 * a single page cannot speak to both:
 *
 *   Piedmont red clay   shrinks in drought, swells when saturated, moves
 *                       seasonally. Base thickness and drainage carry it.
 *   Coastal SC          sandy subgrade over a high water table, with salt.
 *                       Drains beautifully; washes out without grading. The
 *                       failure mode is undermining, not heaving.
 *
 * Two pages that say genuinely different things are not duplicate content. Two
 * pages that swap a place name are, and that is the thing the owner has said
 * repeatedly he does not want.
 */

export const CAROLINA_REGIONS = [
  {
    slug: 'north-carolina',
    state: 'NC',
    name: 'North Carolina',
    dot: 'NCDOT Standard Specifications for Roads and Structures',
    metro: 'Charlotte',
    // Kept verbatim from the existing profile. This content was already correct
    // for North Carolina; nothing here is being replaced.
    subgrade:
      'Piedmont red clay shrinks in drought and swells when saturated, so pavement built straight on it moves seasonally. The fix is a properly thick stone base with drainage that actually leaves the site, not a heavier mat.',
    climate:
      'Milder winters than Virginia but real summer heat. Rutting and shoving under truck traffic is the failure to design against here — binder grade and compaction matter more than thickness alone.',
    cities: [
      'Charlotte', 'Raleigh', 'Durham', 'Greensboro', 'Winston-Salem',
      'Fayetteville', 'Concord', 'Gastonia', 'Huntersville', 'Mooresville',
      'Cary', 'Apex',
    ],
    headline: 'Asphalt Paving Across North Carolina',
    lede:
      'Commercial lots, drive lanes and residential work through the Piedmont and the Triangle, built on a base sized for clay that moves. Restaurant sites in High Point and Burlington are documented below.',
    // Proof lives in src/data/carolinaProgram.js — three KFC sites with
    // after-photographs on file, each checkable by store number. Charlotte is
    // the brand's heaviest market by the owner's account, but no Charlotte
    // records are in this repository, so it appears as a service area and
    // carries no count.
    hasQsrProof: true,
  },
  {
    slug: 'south-carolina',
    state: 'SC',
    name: 'South Carolina',
    dot: 'SCDOT Standard Specifications for Highway Construction',
    metro: 'Charleston',
    subgrade:
      'The Lowcountry is sandy subgrade sitting on a water table close to the surface. It drains far better than Piedmont clay and fails in the opposite way: not heaving, but undermining. Water moving under a lot carries the base out from beneath a surface that still looks sound, and the lot goes at the edges and the low corners first. Grading that moves water off the site does more here than any extra inch of mat.',
    climate:
      'Humid, hot, and salt-laden near the coast. Effectively no freeze-thaw, so the enemy is oxidation and salt rather than ice — which makes sealcoating on a real maintenance cycle worth more in Charleston or Myrtle Beach than almost anything done at construction time.',
    // The 843 footprint — Lowcountry and Grand Strand — plus the Upstate and
    // Midlands cities the brand already listed. Grouped rather than merged
    // because a Charleston lot and a Spartanburg lot are different problems.
    cities: [
      'Charleston', 'North Charleston', 'Mount Pleasant', 'Summerville',
      'Goose Creek', 'Myrtle Beach', 'Hilton Head Island', 'Bluffton',
      // Hardeeville sits twenty minutes from Savannah and is the crossover
      // point between this brand and savannahasphaltpaving.com. Florence is the
      // Pee Dee, inland from the Grand Strand.
      'Hardeeville', 'Florence',
      'Beaufort', 'Columbia', 'Greenville', 'Spartanburg', 'Rock Hill',
    ],
    headline: 'Asphalt Paving Across South Carolina',
    lede:
      'Commercial lots, driveways, chip-and-tar and sealcoating from the Lowcountry through Columbia and Rock Hill to the Upstate — built for sand, salt and a water table that never gets far from the surface.',
    // Chip-and-tar is named because it is what this brand demonstrably sold:
    // a 2019 quote from Carolina Blacktop carries the subject "Chip and tar".
    services: [
      'Commercial lots, drive lanes and loading approaches',
      'Trailer and equipment parking built for standing axle loads',
      'Driveway paving, widening and resurfacing',
      'Chip-and-tar surfacing for long rural and coastal drives',
      'Sealcoating and crack repair on a maintenance cycle',
      'Grading and drainage correction where water undermines the base',
      'Line striping, ADA layout and fire-lane marking',
    ],
  },
]

export const regionSlugs = () => CAROLINA_REGIONS.map((r) => r.slug)
export const regionPath = (slug) => `/${slug}`

export function regionBySlug(slug) {
  return CAROLINA_REGIONS.find((r) => r.slug === slug) || null
}

/** Every city across both states, for the brand's own serviceAreas list. */
export function allCarolinaCities() {
  return CAROLINA_REGIONS.flatMap((r) => r.cities)
}
