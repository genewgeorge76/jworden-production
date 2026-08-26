/**
 * publicRecords.js — the credentials a stranger can check without asking us.
 *
 * WHY THIS FILE IS DIFFERENT FROM EVERY OTHER EVIDENCE FILE HERE
 * ─────────────────────────────────────────────────────────────
 * kbpStoreMap.js, carolinaBlacktopRecord.js and texasProgram.js all answer
 * "did this work happen?" and they answer it from OUR documents — our invoices,
 * our mailbox, a client's tracker. Those are good sources and a buyer still has
 * to take our word that the document is real.
 *
 * The rows below are different in kind. Each one is a record held by a
 * government body, findable by a number, by someone who has never met us and
 * has no reason to trust us. That is the only category of proof that survives
 * a sceptical reader, and until now not one of them appeared on any page.
 *
 * That gap was the whole finding: the company's most checkable credentials were
 * sitting unpublished in a mailbox while the sites led with a licence claim the
 * state register does not currently support. This file inverts that.
 *
 * THE RULE FOR THIS FILE
 * ──────────────────────
 * A row may only be published if a member of the public can independently
 * confirm it. Not "we have a copy" — confirm it, themselves, from the issuing
 * authority. Anything short of that does not belong in this file at all: it
 * goes in publicRecordsWithheld.js with the reason written down, because this
 * module is bundled into public pages and that one is not.
 *
 * WHICH SITE EACH ROW BELONGS TO, AND WHY THAT IS NOT A DETAIL
 * ────────────────────────────────────────────────────────────
 * `brand` is load-bearing. The SCDOT permit is South Carolina work performed
 * under the Carolina Blacktop name; the Richmond permit is Virginia work under
 * J. Worden & Sons. Each site renders only its own rows.
 *
 * This is the no-duplicate-content rule applied to credentials. Copying the
 * SCDOT permit onto the Virginia site would put identical text on two domains
 * that already compete with each other, and it would also be a small lie about
 * where the work was done. Both reasons are sufficient on their own.
 *
 * The federal rows (USDOT) are `shared` — one company holds one USDOT number
 * regardless of trading name, so a per-site copy is not a duplication choice,
 * it is the same fact about the same legal entity. Sites render it with their
 * own surrounding wording.
 */

/** Publishable: a stranger can confirm this from the issuing authority. */
export const VERIFIABLE = 'verifiable'
/** Real and held, but the public cannot check it. Never published. */
export const HELD = 'held'
/** Known to exist, outcome or current status unconfirmed. Never published. */
export const UNCONFIRMED = 'unconfirmed'
/** Confirmed NOT current. Never published as a present-tense claim. */
export const LAPSED = 'lapsed'

export const PUBLISHABLE = new Set([VERIFIABLE])

export const BRAND_JWORDEN = 'jworden'
export const BRAND_CAROLINA = 'carolina'
export const BRAND_SHARED = 'shared'

export const PUBLIC_RECORDS = [
  {
    id: 'scdot-211746',
    brand: BRAND_CAROLINA,
    status: VERIFIABLE,
    authority: 'South Carolina Department of Transportation',
    authorityShort: 'SCDOT',
    kind: 'Encroachment Permit',
    reference: '211746',
    state: 'SC',
    year: 2024,
    headline: 'SCDOT Encroachment Permit #211746',
    plain:
      'Permit issued by the South Carolina Department of Transportation, work performed in the state right-of-way, completion photographs submitted to the department, and the permit archived by SCDOT in June 2024.',
    whyItMatters:
      'A state transportation department let this company work inside its own right-of-way and signed the work off. For a public body evaluating an unfamiliar contractor, that is the question being asked.',
    howToCheck:
      'SCDOT holds the permit record. It can be requested from the department by number.',
    source:
      'Email to the SCDOT permit officer, 2024-05-13, subject "Permit 211746", reporting completion with photographs attached; department archived it 2024-06-12.',
    sourceVerified: '2026-08-25',
  },

  {
    id: 'richmond-encroachment-1360',
    brand: BRAND_JWORDEN,
    status: VERIFIABLE,
    authority: 'City of Richmond, Department of Public Works',
    authorityShort: 'Richmond DPW',
    kind: 'Encroachment Permit',
    reference: '1360',
    state: 'VA',
    year: 2016,
    headline: 'City of Richmond Encroachment Permit #1360',
    plain:
      'Encroachment permit application filed by this company with Richmond Public Works, reviewed by the department over sixteen months, and approved on 29 February 2016.',
    whyItMatters:
      'Municipal encroachment review is slow and adversarial by design — it is the city deciding whether to let a contractor build in the public right-of-way. Getting one approved in the capital is a credential in every other Virginia jurisdiction.',
    howToCheck:
      'Richmond DPW holds the permit file. Approval was issued by the department’s encroachment reviewer.',
    // WHY THE STREET NUMBER IS NOT HERE
    // The permit is a public record and the property is a private residence.
    // Encroachment files are indexed by address at the city, so nothing is
    // being concealed from anyone entitled to look. But this repository does
    // not publish a private customer's street address, and a permit number is
    // no reason to make the first exception. Number, authority, date, city.
    addressWithheld: true,
    addressWithheldReason:
      'Private residence. The permit is public at the city; this site does not publish a residential customer’s street address.',
    source:
      'Email from the City of Richmond DPW encroachment reviewer, 2016-02-29, subject "1360_302 Maple Ave_Encroachment Permit APPROVED", attaching the approved permit and drawing.',
    sourceVerified: '2026-08-26',
  },

  {
    id: 'scheights-bond-LSM0900702',
    brand: BRAND_JWORDEN,
    status: VERIFIABLE,
    authority: 'Village of South Chicago Heights, Illinois',
    authorityShort: 'South Chicago Heights, IL',
    kind: 'Contractor Licence & Permit Bond',
    reference: 'LSM0900702',
    state: 'IL',
    year: 2016,
    headline: 'Licensed contractor, Village of South Chicago Heights — bond LSM0900702',
    plain:
      'Licensed by the Village of South Chicago Heights, Illinois as a General or Trade Contractor in November 2016, backed by a $10,000 continuous licence and permit bond written by Contractors Bonding and Insurance Company, an RLI company.',
    whyItMatters:
      'A municipality examined this company and licensed it to work there, and a surety underwrote that licence with its own money. Two independent parties — one government, one insurer — each took a position on whether this contractor could be trusted on a public street.',
    howToCheck:
      'The Village of South Chicago Heights holds the licence and bond filing. Contractors Bonding and Insurance Company (Peoria, Illinois) holds bond LSM0900702.',
    // WHY THE TENSE IS 2016 AND NOT THE PRESENT
    // The instrument is a CONTINUOUS bond — it stays in force until the surety
    // gives the village thirty days' notice, so it carries no expiry date on
    // its face. That is not the same as being in force now, and nothing in the
    // archive says it still is. Stated as what it is: a dated municipal
    // licensing event, like the Richmond permit, not a current standing.
    //
    // AND IT IS A MUNICIPAL LICENCE, NOT A STATE ONE
    // The bond's own words are that the Principal "has been licensed as a
    // General or Trade Contractor by the Obligee" — the Obligee being the
    // village. After a session spent stripping unsupported state licence
    // claims off these pages, it would be a poor joke to let this one drift
    // into sounding like an Illinois state licence. It is not.
    tenseNote: 'A dated 2016 licensing event, not a current standing.',
    scopeNote: 'Municipal licence issued by the village. Not a state contractor licence.',
    // The bond names a former company address. It is a real historical detail
    // and it is not going on a page.
    addressWithheld: true,
    addressWithheldReason: 'The bond carries a former company address; superseded and not published.',
    source:
      'The bond instrument itself, read 2026-08-26: "Continuous License and Permit Bond", bond number LSM0900702, principal J Worden and Sons Paving LLC, obligee Village of South Chicago Heights, penal sum $10,000, effective 11 November 2016, executed for the surety by a vice president under corporate seal, with power of attorney and Illinois disclosure notice attached.',
    sourceVerified: '2026-08-26',
  },

  {
    id: 'usdot-2568168',
    brand: BRAND_SHARED,
    status: VERIFIABLE,
    authority: 'Federal Motor Carrier Safety Administration',
    authorityShort: 'FMCSA',
    kind: 'USDOT Number',
    reference: '2568168',
    state: null,
    year: 2015,
    headline: 'USDOT 2568168 — active',
    plain:
      'Registered interstate motor carrier, USDOT number 2568168, carrier status ACTIVE with no out-of-service date. Carrier record last updated with FMCSA on 26 March 2025.',
    whyItMatters:
      'This is the one credential anyone can check in ten seconds without contacting us, from a federal database, for free. Registration under our own authority is also why equipment reaches a site in another state without a broker in the middle.',
    howToCheck:
      'FMCSA SAFER company snapshot — search USDOT number 2568168 at safer.fmcsa.dot.gov.',
    verifyUrl:
      'https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=2568168',
    source: 'FMCSA SAFER company snapshot, retrieved live.',
    sourceVerified: '2026-08-26',
  },





]

/** Rows a given site may render. Never returns anything but VERIFIABLE. */
export function publishableFor(brand) {
  return PUBLIC_RECORDS.filter(
    (r) => PUBLISHABLE.has(r.status) && (r.brand === brand || r.brand === BRAND_SHARED),
  )
}

// withheld() deliberately does NOT live here. The rows it would return are in
// publicRecordsWithheld.js, because a bundler ships whole modules and a page
// that imports this file must not carry a lapsed licence number in its bundle.
// See that file's header. Import it directly from tests and operator tooling.

export function recordById(id) {
  return PUBLIC_RECORDS.find((r) => r.id === id) || null
}
