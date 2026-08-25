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
    name: 'NOT THIS COMPANY — see DOMAIN_LOSSES',
    market: 'Sarasota, Bradenton, Punta Gorda',
    status: 'lost — lapsed, then re-registered by a third party',
    identityClaim: null,
    googleProfile: null,
    note: 'The website at this domain is operated by someone else. Nothing on it describes this company and none of its content may be cited as evidence here.',
  },
  {
    domain: null,
    name: 'Mid Florida Asphalt Paving',
    market: 'Sarasota / Bradenton / Punta Gorda',
    status: 'Google Business Profile only — no company-controlled website',
    identityClaim: '25+ years in business (profile)',
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
      linkedWebsite: 'SET but unread — the profile renders a Website button, so a URL is configured. Where it points is still unknown.',
      webrootClassification: 'yellow — the owner\u2019s browser extension rates the linked destination as suspicious. Not proof, but consistent with the domain having changed hands.',
      services: [
        'Asphalt Driveways', 'Asphalt Resurfacing', 'Chip & Tar', 'Driveway Sealing',
        'Line Striping', 'New Asphalt Driveways', 'Parking Lot', 'Parking Lot Paving',
        'Patching And Repairs',
      ],
      hasPhotos: true,
    },
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
    conflict: 'The Google profile may point at a competitor’s website',
    values: [
      'Profile phone 804-446-1296',
      'midfloridaasphaltpaving.com is operated by a third party since the domain lapsed',
    ],
    severity: 'critical',
    why:
      'This was first recorded as a phone mismatch to be resolved by choosing a number. That was wrong, and the correction matters more than the original finding. The website is not this company’s. If the profile’s website field still points there, every visitor who clicks through from a profile this company manages is being handed to the operator who took the domain — and the 941 number and contact address on that site are theirs, so the calls are theirs too.',
    resolution:
      'Open the profile and read its website field. If it points at midfloridaasphaltpaving.com, clear it or repoint it the same day. A profile with no website outperforms one that sends its traffic to a competitor.',
  },
  {
    id: 'IC-006',
    conflict: 'Tenure claim, fourth variant',
    values: [
      '4th generation, founded 1984 (canonical)',
      '25+ years in business (mid-Florida Google profile)',
      'over 40 years serving Atlanta (Atlanta website)',
    ],
    corrected:
      'A fourth value, "five generations", was recorded here from midfloridaasphaltpaving.com before that site was known to belong to someone else. It was never this company’s claim and has been removed.',
    severity: 'high',
    why:
      'Three owned properties state three different company ages. 25+ years, 40+ years and a 1984 founding cannot all describe the same business.',
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

/**
 * A mailbox was recorded here from the mid-Florida site before that site was
 * known to belong to a third party. It has been removed rather than corrected:
 * it is a stranger's contact address, it was never this company's, and it does
 * not belong in this repository in any form.
 */
export const NEWLY_FOUND_MAILBOX = null

/**
 * THE PHOTOGRAPHS ON THAT PROFILE ARE EVIDENCE, AND THEY ARE NOT BACKED UP
 * ───────────────────────────────────────────────────────────────────────
 * The mid-Florida profile carries a photo gallery. Those images were uploaded
 * by this company, they are dated by Google, and they show Florida work. That
 * is the completion evidence stateEvidence.js says Florida is one document
 * short of — not a contract, not a customer record, but pictures of finished
 * jobs held on a platform this company does not control.
 *
 * The last clause is the problem.
 *
 * The Savannah profile is suspended. Whatever photographs and reviews it held
 * are behind that suspension now, unreachable without an appeal, and that
 * happened without warning. There is no reason to believe the Florida profile
 * is safer than the Savannah one was — the same operator, the same platform,
 * the same exposure.
 *
 * So the photographs should be pulled down and stored while they can be. This
 * repository already has the machinery: media_store.py writes to a private
 * intake bucket, and mailbox_attachments.py records provenance by SHA-256 of
 * the bytes rather than by filename. Evidence that exists in exactly one place,
 * on someone else's server, is one suspension away from the Savannah problem.
 *
 * The reviews deserve the same treatment. Two customer statements about
 * completed work are the only such statements anywhere in this project, and
 * they live entirely inside a profile that could be suspended tomorrow.
 */
export const PROFILE_EVIDENCE_AT_RISK = {
  profile: 'Mid Florida Asphalt Paving',
  holds: ['jobsite photographs', '2 customer reviews at 5.0'],
  backedUp: false,
  precedent: 'The Savannah profile is suspended and its contents are already unreachable.',
  action: 'Download the photographs and capture the review text, then store them through media_store.py with provenance.',
  couldEvidence: 'FL completion — the one document Florida is short of.',
}

/**
 * DOMAINS LOST TO NON-RENEWAL, AND WHAT HAPPENS NEXT TO THEM
 * ─────────────────────────────────────────────────────────
 * Webador issued ICANN expiry notices through 2025 for three domains, and its
 * support reply of 22 April 2025 states the condition plainly: open invoices
 * must be paid before a domain can renew. The domains were not lost to a
 * decision. They were lost to an unpaid bill.
 *
 * midfloridaasphaltpaving.com shows what follows. It lapsed, someone else
 * registered it, and there is now a paving website on it trading under a name
 * this company still holds the Google profile for. That is not a coincidence
 * of naming — an expired domain in a local trade carries residual search
 * authority and inbound links, and picking one up is a known tactic.
 *
 * Checked 2026-08-25:
 *   atlantaasphaltpavingpros.com   LIVE and serving this company's own content
 *   beaufortasphaltpaving.com      DOES NOT RESOLVE — unregistered, available
 *   charlotteasphaltpavingpros.com DOES NOT RESOLVE — unregistered, available
 *
 * The two that do not resolve are the exposure. They are free for anyone to
 * take, exactly as mid-Florida was, and beaufortasphaltpaving.com is not a
 * spare: it produced the Holiday Inn enquiry recorded in the Carolina
 * footprint. Re-registering a lapsed domain costs a few dollars a year and is
 * cheaper than any other item in this file.
 */
export const DOMAIN_LOSSES = [
  {
    domain: 'midfloridaasphaltpaving.com',
    lostTo: 'non-renewal',
    nowOperatedBy: 'a third party',
    /**
     * Registry data, not inference. A renewal keeps the original creation
     * date; only a domain that was released and taken afresh gets a new one.
     */
    rdap: {
      registered: '2025-12-03',
      expires: '2026-12-03',
      registrar: 'GoDaddy.com, LLC',
      nameservers: ['NS35.DOMAINCONTROL.COM', 'NS36.DOMAINCONTROL.COM'],
      checked: '2026-08-25',
      registrantVisible: false,
    },
    stillHeld: 'the Google Business Profile for the same business name',
    urgentQuestion: 'Does that profile’s website field still point at this domain?',
  },
  {
    domain: 'beaufortasphaltpaving.com',
    lostTo: 'non-renewal, terminated 2025-05-19',
    nowOperatedBy: null,
    dnsResolves: false,
    rdap: { status: 'not registered', evidence: 'Verisign RDAP returns 404', checked: '2026-08-25' },
    note: 'Produced the Holiday Inn / HMV Hotels enquiry. Owner is re-registering at GoDaddy directly, 2026-08-25.',
    recovery: 'owner-handled at GoDaddy',
  },
  {
    domain: 'charlotteasphaltpavingpros.com',
    lostTo: 'non-renewal, terminated 2025-06-06',
    nowOperatedBy: null,
    dnsResolves: false,
    rdap: { status: 'not registered', evidence: 'Verisign RDAP returns 404', checked: '2026-08-25' },
    note: 'Owner is re-registering at GoDaddy directly, 2026-08-25.',
    recovery: 'owner-handled at GoDaddy',
  },
]

/**
 * HOW THE REGISTRY SETTLES IT, AND THE PRECEDENT THAT ALREADY WORKED
 * ─────────────────────────────────────────────────────────────────
 * Two facts from Verisign RDAP on 2026-08-25 do the work.
 *
 * midfloridaasphaltpaving.com was REGISTERED on 2025-12-03. That is a creation
 * date. Renewing a domain does not reset it — only releasing one and having it
 * taken again does. Whoever holds it now began holding it that day, and the
 * registrant is behind a privacy service so the registry will not name them.
 *
 * The nameservers finish the argument. That domain answers to
 * NS35/NS36.DOMAINCONTROL.COM, which is GoDaddy's own hosting. Every domain
 * this company runs answers to Vercel. Different infrastructure, different
 * operator.
 *
 * The precedent matters more than either. atlantaasphaltpavingpros.com was
 * terminated by Webador on 2025-07-06 — and it was re-registered on
 * 2026-05-18, on GoDaddy, pointed at NS1/NS2.VERCEL-DNS.COM, and it serves
 * this company's content today. That recovery has already been carried out
 * once, successfully, by this owner.
 *
 * Which is why Beaufort and Charlotte are not a warning so much as an open
 * door. Both return 404 at the registry — unregistered, held by nobody. The
 * same play that recovered Atlanta works on them for the cost of a
 * registration, and only until someone else notices.
 */
/**
 * WHAT A RECOVERED DOMAIN STILL NEEDS AFTER IT IS BOUGHT
 * ─────────────────────────────────────────────────────
 * Registration alone gets a parking page, which is worth nothing and can be
 * worse than nothing — a lapsed domain that returns as a GoDaddy placeholder
 * looks abandoned to the crawler that used to index a real site.
 *
 * atlantaasphaltpavingpros.com is the working template: registered at GoDaddy,
 * nameservers pointed at NS1/NS2.VERCEL-DNS.COM, and serving this company's
 * content. Two of the four settings that matter are the ones that caused the
 * loss in the first place — auto-renew, and a billing card that is not blocked
 * by an unpaid invoice.
 *
 * Once DNS is delegated, each domain needs a destination decided in
 * middleware.js. Beaufort is not a redirect candidate by default: it generated
 * a real hotel enquiry, so it earned a page rather than a 301 to somewhere
 * else. That is a decision for when the domain is back, not before.
 */
export const RECOVERY_CHECKLIST = [
  'Register at GoDaddy (owner-handled).',
  'Nameservers to NS1.VERCEL-DNS.COM and NS2.VERCEL-DNS.COM, matching atlantaasphaltpavingpros.com.',
  'Auto-renew ON — non-renewal is what lost all three.',
  'WHOIS privacy ON, and registrant details reachable; ICANN suspends on failed verification.',
  'Then decide the destination in middleware.js. Beaufort earned a page, not a redirect.',
]

export const REGISTRY_CHECK = {
  checked: '2026-08-25',
  source: 'Verisign RDAP',
  findings: {
    'midfloridaasphaltpaving.com': 'taken by a third party, registered 2025-12-03, GoDaddy nameservers',
    'atlantaasphaltpavingpros.com': 'recovered by this company, registered 2026-05-18, Vercel nameservers',
    'beaufortasphaltpaving.com': 'unregistered — 404',
    'charlotteasphaltpavingpros.com': 'unregistered — 404',
  },
  precedent: 'atlantaasphaltpavingpros.com proves the recovery works; it was terminated in July 2025 and re-registered in May 2026.',
}

/** Verified live and still this company's, despite a 2025 expiry notice. */
export const RECOVERED_DOMAINS = ['atlantaasphaltpavingpros.com']
