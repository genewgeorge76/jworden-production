/**
 * ownedProperties.js — the live properties, their Google profiles, and the
 * places they contradict each other.
 *
 * WHY THIS MATTERS MORE THAN ANY SINGLE PAGE
 * ──────────────────────────────────────────
 * Google does not read these sites in isolation. It cross-references business
 * identity across every property, profile and citation it can associate with
 * the same operator. Three owned sites making three different claims about the
 * same company is not three opinions — it is one entity contradicting itself
 * in public, and it damages exactly the credibility these sites exist to build.
 *
 * It is also a truth problem before it is a ranking problem. Two of these
 * cannot both be right.
 *
 * WHAT WAS FOUND, BY FETCHING THE LIVE PAGES ON 2026-08-25
 * ───────────────────────────────────────────────────────
 *   canonical    "4th-generation family asphalt paving contractor founded in
 *                Chester, Virginia in 1984"
 *   mid-Florida  "built on five generations of experience"
 *   Atlanta      "has been serving the Atlanta community for over 40 years"
 *
 * Four generations and five generations are not a matter of emphasis. One is
 * wrong, and the owner is the only person who can say which.
 *
 * The Atlanta claim is a different failure. Forty years of COMPANY history is
 * roughly consistent with a 1984 founding. Forty years of serving ATLANTA is
 * not supported by anything here — the Georgia record begins with the KBP
 * restaurant programme and the Big Chicken, and georgiaProgram.js says so.
 * Attaching the company's age to a market it entered decades later is the
 * precise move this repository exists to prevent.
 */

/** Verified by fetching the live page on 2026-08-25 unless noted otherwise. */
export const OWNED_PROPERTIES = [
  {
    domain: 'jwordenasphaltpaving.com',
    name: 'J. Worden & Sons Paving',
    market: 'Chester / Richmond, Virginia',
    status: 'live',
    identityClaim: '4th-generation, founded Chester VA 1984',
    googleProfile: 'owner-stated',
  },
  {
    domain: 'midfloridaasphaltpaving.com',
    name: 'Mid Florida Asphalt Paving LLC',
    market: 'Sarasota, Bradenton, Punta Gorda',
    status: 'live',
    phone: '941-888-4245',
    contactEmail: 'floridapavingco@gmail.com',
    identityClaim: 'five generations',
    googleProfile: 'active, owner-managed',
    profile: {
      name: 'Mid Florida Asphalt Paving',
      category: 'Asphalt contractor',
      rating: 5.0,
      reviewCount: 2,
      tenureClaim: '25+ years in business',
      hours: 'Open 24 hours',
      phone: '804-446-1296',
      source: 'relayed by the owner from the profile dashboard, 2026-08-25; not independently fetched',
    },
    note: 'The site phone is a 941 number, correctly in-market. The PROFILE carries the Virginia number. See IC-005.',
  },
  {
    domain: 'atlantapavingandsealing.com',
    name: 'Atlanta Paving & Sealing',
    market: 'Atlanta metro',
    status: 'live',
    phone: '843-610-8935',
    identityClaim: 'serving the Atlanta community for over 40 years',
    googleProfile: 'owner-stated, active',
    note: 'The phone is a South Carolina area code on a Georgia site. regionalMarketProfiles.js already caught and fixed this same number on the Savannah profile; it is still live here.',
  },
  {
    domain: 'savannahasphaltpaving.com',
    name: 'Savannah Paving & Sealing',
    market: 'Savannah / coastal Georgia',
    status: 'unknown — not reachable from the audit environment',
    identityClaim: null,
    googleProfile: 'owner-stated, SUSPENDED',
  },
  {
    domain: 'beaufortasphaltpaving.com',
    name: 'Beaufort Asphalt Paving',
    market: 'Beaufort, South Carolina',
    status: 'terminated at the registrar for non-renewal, 2025',
    identityClaim: null,
    googleProfile: 'unknown',
  },
]

/**
 * Claims that cannot all be true. Recorded, not resolved — resolving them is
 * the owner's call, because only he knows which is the fact.
 */
export const IDENTITY_CONFLICTS = [
  {
    id: 'IC-001',
    conflict: 'Generation count',
    values: ['4th generation (canonical, businessInfo)', 'five generations (mid-Florida)'],
    severity: 'high',
    why: 'Two owned properties state different family histories for the same operator. Both appear in page copy a search engine will read.',
    resolution: 'Owner decides which is correct; the other is corrected to match. Neither is evidenced in this repository — see ownershipRecord.js.',
  },
  {
    id: 'IC-002',
    conflict: 'Length of service in Atlanta',
    values: ['over 40 years serving Atlanta (atlantapavingandsealing.com)', 'Georgia record begins with the KBP programme (georgiaProgram.js)'],
    severity: 'high',
    why: 'Company age is being attached to a market entered much later. The company may be 40 years old; the Atlanta presence is not.',
    resolution: 'Rewrite to claim the company’s age, not the market’s. "A paving company trading since 1984, working the Atlanta metro since..." is both true and stronger.',
  },
  {
    id: 'IC-003',
    conflict: 'Out-of-market phone number',
    values: ['843-610-8935 on a Georgia site'],
    severity: 'medium',
    why: 'A South Carolina area code on an Atlanta page reads as an out-of-town operator to both a visitor and a local-search algorithm. This exact number was already replaced on the Savannah profile for this reason.',
    resolution: 'Replace with an in-market number, as was done for Savannah.',
  },
  {
    id: 'IC-004',
    conflict: 'Unattributed testimonial',
    values: ['A named testimonial on atlantapavingandsealing.com with no company, location or date'],
    severity: 'medium',
    why: 'Not evidence of anything either way, but this repository has already removed one fabricated dataset, and an unverifiable review on a live page is the shape that problem took. It needs a source or it needs to come down.',
    resolution: 'Confirm the customer and the job, or remove it.',
  },
  {
    id: 'IC-005',
    conflict: 'Phone number differs between the profile and its own website',
    values: ['804-446-1296 on the Google Business Profile', '941-888-4245 on midfloridaasphaltpaving.com'],
    severity: 'critical',
    why:
      'This is the one that costs money today. Google checks a profile against the website it points at, and a phone mismatch between them is among the strongest negative signals in local search — it is also a standing signal of an unverified or reused listing. Worse for the customer: a Sarasota caller reaching a Virginia number, or a profile whose number nobody in Florida answers.',
    resolution:
      'Decide which number the Florida market should reach, then make the profile, the website and every citation carry that one number. The 941 is the right answer for a Sarasota profile if it rings somewhere reliable.',
  },
  {
    id: 'IC-006',
    conflict: 'Tenure claim, fourth variant',
    values: [
      '4th generation, founded 1984 (canonical)',
      'five generations (mid-Florida website)',
      '25+ years in business (mid-Florida Google profile)',
      'over 40 years serving Atlanta (Atlanta website)',
    ],
    severity: 'high',
    why:
      'Four owned properties now state four different company ages. 25+ years, 40+ years and 1984 cannot all describe the same business, and the profile and the website it links to disagree with each other directly.',
    resolution:
      'One founding year, stated once, repeated identically everywhere. 1984 is the canonical claim; if it is right, everything else changes to match it.',
  },
]

/**
 * THE FIRST CUSTOMER REVIEWS FOUND ANYWHERE IN THIS PROJECT
 * ────────────────────────────────────────────────────────
 * The mid-Florida profile carries a 5.0 rating from 2 reviews, one of which
 * describes a completed driveway.
 *
 * That is a customer, on a platform the company does not control, stating that
 * work was performed and finished. Nothing else in this repository is that —
 * the Texas figures reconcile against a client's tracker, the Georgia stores
 * rest on a punch list, and every jobsite photograph rests on the crew that
 * took it. Only the SCDOT permit is comparable, and a permit says work was
 * allowed and closed out, not that a customer was pleased with it.
 *
 * WHY FLORIDA HAS NOT BEEN REGRADED ON THE STRENGTH OF IT
 * ──────────────────────────────────────────────────────
 * stateEvidence.js records that Florida is one completion document away from
 * publishable. This may be that document. It has not been treated as one
 * because it reached this repository as text relayed in conversation, and
 * every other grade here rests on something that was read at its source.
 *
 * Two reviews is also a thin profile, and neither is dated or located in what
 * was relayed. The claim "every KFC repaving KBP owned in Florida" is a much
 * larger one than two driveways, and is separately owner-stated.
 *
 * Verify at the source and Florida moves. That is a short errand with a
 * disproportionate payoff, and it is the single highest-value item outstanding.
 */
export const CUSTOMER_REVIEWS = [
  {
    market: 'mid-Florida',
    platform: 'Google Business Profile',
    rating: 5.0,
    count: 2,
    thirdParty: true,
    verifiedAtSource: false,
    note: 'One review describes a completed driveway. Relayed by the owner, not yet read at the source.',
    couldEvidence: 'FL completion — see stateEvidence.js, which puts Florida one document from publishable.',
  },
]

/**
 * THE SUSPENDED SAVANNAH PROFILE IS A RECOVERY ROUTE, NOT A DEAD END
 * ─────────────────────────────────────────────────────────────────
 * unrecoveredWork.js records that the Savannah invoices sit in a mailbox the
 * owner has lost. A suspended Google Business Profile changes that picture.
 *
 * Suspension does not delete a profile. Google retains it, including uploaded
 * photographs and any reviews customers left — and a customer review is a
 * third-party record of work performed, which is exactly what the Georgia
 * coastal work lacks. Reinstatement is an appeal, not a rebuild, and the
 * evidence it asks for is the ordinary evidence of a real business.
 *
 * That makes the appeal worth more than the profile: winning it returns a set
 * of dated photographs and customer statements about Savannah work that no
 * other route in this repository can reach.
 */
export const SUSPENDED_PROFILE_LEAD = {
  market: 'Savannah',
  status: 'suspended',
  whyItMatters:
    'Google retains suspended profiles including photographs and customer reviews. Reviews are third-party evidence of work performed, which the Georgia coastal record has none of.',
  route: 'Google Business Profile reinstatement appeal',
  relatedTo: ['UR-003', 'UR-004'],
}

/** A mailbox not previously known, found on the live mid-Florida site. */
export const NEWLY_FOUND_MAILBOX = {
  address: 'floridapavingco@gmail.com',
  foundOn: 'midfloridaasphaltpaving.com',
  significance:
    'The Florida operation’s own contact address, and not among the accounts listed so far. The Florida records may sit here rather than anywhere previously searched.',
}
