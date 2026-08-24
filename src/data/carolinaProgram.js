/**
 * carolinaProgram.js — the Carolina work that carries its own evidence.
 *
 * WHERE THESE CAME FROM
 * ─────────────────────
 * Not from a spreadsheet and not from anybody's memory. These are jobsite photo
 * emails the crew sent to KBP Foods at the time, parsed by
 * app/services/photo_email.py. The crew wrote the whole record into the subject
 * line before pressing send:
 *
 *   KFC(195) 2722 S Main St, High Point NC (After Pictures)
 *   KFC(184) 2304 Maple Ave, Burlington NC During-After Pics
 *   KFC(186) N Church St, Burlington NC During-After Pictures
 *
 * Store number, street, city, state, and which phase the attachments show.
 * Anyone can take a store number to the client and check it.
 *
 * WHY ONLY THREE, WHEN THE ARCHIVE HOLDS FIVE
 * ───────────────────────────────────────────
 * Two more North Carolina sites appear in the same archive and are NOT listed
 * here:
 *
 *   KFC #189, 4623 W Market St, Greensboro   — "Before Pictures"
 *   2340 Randleman Rd, Greensboro            — "before pictures"
 *
 * A before-pictures email is evidence the company stood on the site with a
 * camera. It is not evidence the work was finished. photo_email.py grades those
 * `listed`, and `listed` is not publishable. If the after-photographs for
 * Greensboro turn up, they move here; until then Greensboro is a service area
 * and nothing more.
 *
 * That distinction is the whole point. It is what lets the three below be
 * stated flatly, without hedging.
 *
 * WHAT IS DELIBERATELY ABSENT
 * ───────────────────────────
 * No dollar figures. The photo emails carry addresses and phases, not amounts —
 * unlike the Texas invoice tracker, which is why the Texas pages can show a
 * value per store and these cannot. An invented figure here would be worth less
 * than saying nothing, because the store numbers are checkable and a wrong
 * number next to a real one poisons both.
 *
 * The owner also reports substantial work in Charlotte, Rock Hill, Columbia and
 * throughout the Lowcountry of South Carolina and Georgia. That is recorded as
 * service area, which rests on his word the way every contractor's site does.
 * It is not recorded as a count, because a count is checkable and no records
 * for it are in this repository yet.
 */

/** The client these were run for, already named with the owner's authorisation. */
export const NC_CLIENT = 'KBP Foods'
export const NC_BRAND = 'KFC'

/**
 * North Carolina restaurant sites with after-photographs on file.
 *
 * `evidence: 'completed'` throughout — assigned by photo_email.py from the
 * phase named in the subject line, not by hand.
 */
export const NC_QSR_SITES = [
  {
    store: 'KFC 195',
    address: '2722 S Main St',
    city: 'High Point',
    state: 'NC',
    evidence: 'completed',
    source: 'photo-email: "KFC(195) 2722 S Main St, High Point NC (After Pictures)"',
  },
  {
    store: 'KFC 184',
    address: '2304 Maple Ave',
    city: 'Burlington',
    state: 'NC',
    evidence: 'completed',
    source: 'photo-email: "KFC(184) 2304 Maple Ave, Burlington NC During-After Pics"',
  },
  {
    store: 'KFC 186',
    // N Church St has no street number in the archive. Producing one would file
    // the job against an address the company never wrote down.
    address: null,
    city: 'Burlington',
    state: 'NC',
    evidence: 'completed',
    source: 'photo-email: "KFC(186) N Church St, Burlington NC During-After Pictures"',
  },
]

/** Sites seen in the archive with BEFORE photographs only. Not publishable. */
export const NC_QSR_UNCONFIRMED = [
  { store: 'KFC 189', address: '4623 W Market St', city: 'Greensboro', state: 'NC' },
  { store: null, address: '2340 Randleman Rd', city: 'Greensboro', state: 'NC' },
]

export const PUBLISHABLE_GRADES = new Set(['completed', 'invoiced'])

/** Only what may be shown. Guards against a `listed` row ever slipping in. */
export function publishableNcSites(sites = NC_QSR_SITES) {
  return sites.filter((s) => PUBLISHABLE_GRADES.has(s.evidence))
}

export function ncSiteCount() {
  return publishableNcSites().length
}

/** The cities those sites are in, deduplicated, for the page copy. */
export function ncSiteCities() {
  return [...new Set(publishableNcSites().map((s) => s.city))]
}
