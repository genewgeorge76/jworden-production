/**
 * clientProgramDocuments.js — the client-side and project documents, and what
 * each one is actually capable of proving.
 *
 * WHY THIS FILE IS WALLED OFF FROM EVERY PAGE
 * ───────────────────────────────────────────
 * Nothing here is a public record. A brand's internal responsibility matrix, a
 * general contractor's budget workbook and an engineer's permit drawing set are
 * all real, all held, and all unverifiable by a stranger — there is no counter
 * anywhere that a sceptical buyer can walk up to and confirm them. Under the
 * vocabulary this repository already uses, that makes them HELD, not
 * VERIFIABLE, and HELD never reaches a page.
 *
 * Two of them are worse than merely unpublishable. The budget carries
 * subcontractor mobile numbers and personal email addresses belonging to people
 * who are not this company, and it carries margin: proposed against actual,
 * line by line, plus the fee. Publishing the first would be a disclosure of
 * other people's contact details; publishing the second would hand every
 * competitor in Texas the exact number to undercut. Neither is reproduced here
 * even in an operator file — the counts and the categories are, the names and
 * the phone numbers are not.
 *
 * So this module records what each document establishes, what it does NOT
 * establish, and where the corroboration would have to come from. Page code
 * must not import it; a test enforces that, the same way it does for
 * publicRecordsWithheld.js and searchPresence.js.
 */

/**
 * KFC'S OWN CONSTRUCTION RESPONSIBILITY MATRIX, WITH WORDEN AS A NAMED COLUMN
 * ──────────────────────────────────────────────────────────────────────────
 * This is the strongest client-side document in the archive, and the reason is
 * structural rather than flattering. It is not a letter to us, an invoice from
 * us, or a photograph taken by us. It is the brand's own coordination document,
 * the one every trade on the job works from, and the trade partners are named
 * across the top: KFC, KBP, GC, Worden, Champion, RSCS, Davidson, Fullerton.
 *
 * Being a column in that header is a different kind of fact from being a
 * supplier who sent an invoice. It means the brand's construction department
 * modelled the job with this company as one of the parties.
 *
 * READ THE MERGED HEADERS BEFORE READING THE MARKS
 * The header spans are uneven — KFC covers two columns, KBP three, GC three,
 * Worden two — so column position is NOT a reliable guide to ownership. Read
 * naively, column L looks like a Worden "Approve" and the scope appears to
 * cover roofing, signage, awnings and facade. It does not. L is the GC's
 * Approve column. Worden is M:N and nothing else: Procure and Install, with no
 * approval authority anywhere on the sheet.
 *
 * The true scope is smaller than the careless reading and considerably more
 * credible: eight line items, every one of them sitework.
 */
export const KFC_RESPONSIBILITY_MATRIX = {
  document: 'KFC Construction Responsibility Matrix',
  dated: '2018-02-13',
  updatedBy: 'Bret Elliott',
  tradePartnersNamed: ['KFC', 'KBP', 'GC', 'Worden', 'Champion', 'RSCS', 'Davidson', 'Fullerton'],
  wordenColumns: 'Procure and Install. No approval column anywhere on the sheet.',
  scope: [
    'Site Pavement & Markings',
    'Site Underground Utilities',
    'Site Demo & Earthwork',
    'Building Subgrade Prep',
    'Slab on Grade',
    'Grease trap',
    'Pavement repairs and striping',
    'Dumpster Enclosure',
  ],
  totalLineItems: 8,
  everyItemIsSitework: true,
  whatItProves:
    'That the brand’s construction department listed this company as a named trade partner with a defined procure-and-install scope across the sitework package.',
  whatItDoesNotProve:
    'That any particular store was built. A responsibility matrix is a plan for how work is divided, not a record that work happened. The invoice archive is what evidences delivery.',
  status: 'held',
  publishable: false,
  whyNotPublishable:
    'A brand’s internal coordination document. No member of the public can confirm it at any authority, and it is KFC’s document rather than ours to publish.',
  sourceVerified: '2026-08-26',
}

/**
 * THE JEFFERSON CITY DRAWING SET, AND WHY IT PROVES LESS THAN IT LOOKS
 * ───────────────────────────────────────────────────────────────────
 * An eighteen-sheet civil set for a KFC at 1209 Missouri Blvd, Jefferson City,
 * Missouri, engineered by Burns & McDonnell of Kansas City, issued for permit
 * in January 2018 and sealed by a Missouri professional engineer.
 *
 * It is a serious document and it establishes that the project was real,
 * engineered and permitted. What it does not do is name this company. Every
 * responsibility on the general notes sheet is assigned to "the Subcontractor"
 * generically. Holding a permit set is what happens when you are invited to
 * price a job; it is equally what happens when you are awarded one, and the
 * document cannot tell the two apart.
 *
 * Recorded here so that nobody later mistakes possession for participation.
 * Missouri currently has one entry in nationalProjects.json — Excelsior
 * Springs, evidence "Project information on file" — and Jefferson City is not
 * in the record at all.
 */
export const JEFFERSON_CITY_CIVIL_SET = {
  document: 'Civil drawing set, issued for permit',
  project: 'KFC — Jefferson City, Missouri',
  address: '1209 Missouri Blvd, Jefferson City, MO 65109',
  engineer: 'Burns & McDonnell, 9400 Ward Parkway, Kansas City, MO 64114',
  engineerProjectNo: '102780',
  sheets: 18,
  revisions: [
    { rev: 'A', date: '2017-12-08', description: 'Issued for review' },
    { rev: '0', date: '2018-01-15', description: 'Issued for permit' },
  ],
  sealed: 'Missouri professional engineer seal on the general notes sheet.',
  namesWorden: false,
  // RESOLVED BY THE OWNER, 2026-08-26
  // This record previously said the set could not establish any role for this
  // company, because it assigns every duty to "the Subcontractor" generically.
  // That remains true of the DOCUMENT. It is no longer the state of knowledge:
  // the owner confirms the company built this restaurant, demolishing an
  // existing building on the site to do it.
  ownerConfirmed: {
    built: true,
    confirmedOn: '2026-08-26',
    scope: 'Ground-up KFC including demolition of an existing building on the site.',
  },
  whatItProves: 'The project existed, was engineered by a national firm and reached permit stage.',
  whatItDoesNotProve:
    'On its own, any role for this company — it names no contractor. The build is established by owner confirmation, which is owner-stated evidence and not the same grade as an invoice.',
  corroborationNeeded:
    'An invoice, contract or purchase order naming Jefferson City would raise this from owner-stated to documented. Nothing in the invoice archive currently does.',
  status: 'owner-confirmed',
  publishable: false,
  whyNotPublishable:
    'Owner-stated work with no invoice behind it in this archive, on a site where a demolition drew an EPA enforcement action. Neither half belongs on a marketing page.',
  sourceVerified: '2026-08-26',
}

/**
 * THE SULPHUR SPRINGS BUDGET, AND A DISCREPANCY THAT MUST NOT BE SMOOTHED OVER
 * ───────────────────────────────────────────────────────────────────────────
 * A full general-contractor budget workbook for a ground-up KFC in Sulphur
 * Springs, Texas: twenty-four schedule-of-value lines, a subcontractor contact
 * sheet, a vendor sheet, an on-screen takeoff, a 749-row material list and a
 * CSI division cost-coding sheet.
 *
 * It is the clearest evidence in the archive that this company has acted as a
 * general contractor on a ground-up commercial build rather than as a paving
 * subcontractor — the contact sheet marks several trades "self perform", which
 * is language only the GC writes.
 *
 * THE NUMBERS DO NOT RECONCILE, AND THAT IS THE POINT
 * The workbook totals $948,716 proposed against $786,001.80 "actual".
 * invoiceRecord.js already carries invoice 2472, "KFC-Sulphur Springs", KFC NEW
 * BUILD, 2018-08-13, for $113,904.14.
 *
 * Those two figures cannot both be the value of the same thing, and there are
 * at least three innocent explanations: the invoice is one progress billing of
 * several; this company's contracted scope was a portion of the whole; or the
 * workbook is a budget prepared for someone else. Nothing in hand distinguishes
 * them, so nothing here picks one. The eight-hundred-thousand-dollar figure
 * must not appear anywhere as a project value on that basis.
 *
 * AND THE "ACTUAL" COLUMN IS PART ESTIMATE
 * Six lines are annotated "WAG" in the notes column — General Conditions,
 * Roofing, Concrete, Earthwork, Exterior Improvements and Utilities — covering
 * $430,000 of the $786,001.80. A column headed ACTUAL that contains $430,000 of
 * admitted guesses is not an actual-cost record, and treating it as one would
 * be exactly the kind of false precision this repository exists to prevent.
 */
export const SULPHUR_SPRINGS_BUDGET = {
  document: 'General contractor budget workbook',
  project: 'KFC new build — Sulphur Springs, Texas',
  sheets: ['VARIANCE', 'CONTACT', 'VENDOR', 'ON SCREEN TAKEOFF', 'MATERIAL LIST', 'DIVISIONS'],
  scheduleOfValueLines: 24,
  materialListRows: 749,
  proposedTotalUsd: 948716.0,
  actualColumnTotalUsd: 786001.8,
  actualColumnIsPartEstimate: true,
  wagLines: ['General Conditions', 'Roofing', 'Concrete', 'Earthwork', 'Exterior Improvements', 'Utilities'],
  wagCoverageUsd: 430000.0,
  selfPerformedTrades: ['Rough Carpentry', 'Misc. Caulking', 'Insulation', 'Drywall, FRP, Acoustical Ceiling', 'Painting'],
  whatItProves:
    'This company prepared and ran a general-contractor budget for a ground-up commercial build, self-performing several trades — a materially different capability from paving subcontracting.',
  unreconciled: {
    invoiceOnFile: { invoice: '2472', customer: 'KFC-Sulphur Springs', date: '2018-08-13', amountUsd: 113904.14 },
    workbookTotalUsd: 948716.0,
    note:
      'One progress billing, a partial scope, or a budget prepared for another party. Nothing in hand distinguishes these. No project value may be published from this document until it is settled.',
  },
  // WHAT IS DELIBERATELY ABSENT FROM THIS RECORD
  // The workbook names roughly fifteen subcontractors with personal mobile
  // numbers and personal email addresses, and it carries proposed-against-
  // actual margin on every line plus the fee. The people are not this company
  // and their details are not ours to hold in a repository; the margin is the
  // single most valuable thing a competitor could be handed.
  containsThirdPartyPii: true,
  containsMarginData: true,
  piiAndMarginDeliberatelyOmitted: true,
  status: 'held',
  publishable: false,
  sourceVerified: '2026-08-26',
}

/**
 * THE SULPHUR SPRINGS STATE QUESTION, SETTLED BY THE OWNER
 * ───────────────────────────────────────────────────────
 * This file first recorded an unresolved conflict: stateEvidence.js and
 * nationalProjects.json placed a Sulphur Springs against a Tennessee DOT
 * permit, while this workbook is unambiguously Texas.
 *
 * The owner settled it on 2026-08-26 — only one Sulphur Springs job was ever
 * done. One job cannot be in two states, and this workbook says which one:
 * 903 area codes, Hopkins County contacts, and TX DOT named on the project's
 * own city-officials sheet. TDOT was TxDOT mis-keyed, and both records have
 * been corrected to Texas.
 *
 * WHY A SINGLE WRONG LETTER MATTERED THIS MUCH
 * Tennessee's entire evidence grade rested on that one line. Correcting it
 * left the state standing on a single 2017 correspondence entry for Smyrna
 * with no store number, no address and no scope.
 *
 * And the citation had never been checked. The Tennessee entry sourced itself
 * to kbp-correspondence; that file contains neither "Sulphur Springs" nor
 * "TDOT". A claim can cite a file that does not support it indefinitely, as
 * long as nobody follows the reference.
 */
export const SULPHUR_SPRINGS_STATE_RESOLVED = {
  state: 'TX',
  resolvedOn: '2026-08-26',
  resolvedBy: 'Owner confirmation that only one Sulphur Springs job was ever performed.',
  texasEvidence: 'This budget workbook: 903 area codes, Hopkins County contacts, TX DOT on the officials sheet.',
  formerlyRecordedAs: 'Sulphur Springs, TN, with a TDOT entrance permit.',
  recordsCorrected: ['src/data/nationalProjects.json', 'src/data/stateEvidence.js'],
  knockOnEffect:
    'Tennessee’s grade had rested entirely on that permit. It now rests on one 2017 Smyrna correspondence entry with no store number, address or scope.',
  unsupportedCitationFound:
    'The Tennessee entry cited kbp-correspondence, which contains neither "Sulphur Springs" nor "TDOT".',
}

/**
 * THE JEFFERSON CITY SET FITS A PROGRAMME THIS REPOSITORY ALREADY DOCUMENTS
 * ────────────────────────────────────────────────────────────────────────
 * nationalProjects.json records a 2018 KFC new-build programme whose project
 * team is Plaza Street Partners as developer, Davidson AE as architect, Burns
 * & McDonnell as engineering, and Innovative Building Solutions as
 * construction management.
 *
 * Burns & McDonnell engineered the Jefferson City set. "Davidson" is one of
 * the eight trade-partner columns in the KFC responsibility matrix. The set is
 * dated January 2018 and the programme's year is 2018.
 *
 * Three documents that arrived separately — a drawing set, a brand matrix and
 * a programme record already in the repository — naming the same firms in the
 * same year. That is real corroboration, and it is corroboration of the
 * PROGRAMME, not of this company's role in Jefferson City specifically. The
 * drawing set still names no contractor and still needs an invoice.
 */
export const NEW_BUILD_PROGRAMME_CROSSCHECK = {
  programmeYear: '2018',
  namedInRepositoryAlready: ['Plaza Street Partners', 'Davidson AE', 'Burns & McDonnell', 'Innovative Building Solutions LLC'],
  jeffersonCityEngineer: 'Burns & McDonnell',
  matrixTradePartnerColumns: ['KFC', 'KBP', 'GC', 'Worden', 'Champion', 'RSCS', 'Davidson', 'Fullerton'],
  corroborates: 'That the drawing set belongs to the 2018 new-build programme already recorded, engineered by the firm already named.',
  doesNotCorroborate:
    'Any role for this company at Jefferson City. The set names no contractor and the invoice archive has no Jefferson City entry.',
}

/**
 * THE LEESVILLE INVOICE, AND WHICH WAY THE MONEY WAS FLOWING
 * ─────────────────────────────────────────────────────────
 * Found in the archive on 2026-08-26 while looking for something else. An
 * invoice dated 15 October 2018 for KFC-618 at 1102 S. 5th Street, Leesville,
 * Louisiana, work order WO-7170336, described as "Final payment".
 *
 * READ THE ADDRESSEE BEFORE READING THE AMOUNT
 * This is not an invoice this company issued. Innovative Building Solutions of
 * Fairhope, Alabama — the construction manager named in the 2018 new-build
 * programme — invoiced J Worden & Sons Paving. The money was flowing OUT.
 *
 * That inversion is the whole value of the document, and it would be easy to
 * get backwards. A contractor who PAYS the construction manager is the party
 * holding the contract. The owner confirms the relationship directly: IBS was
 * a SUBCONTRACTOR to this company, engaged by it to provide construction
 * management on a job this company held as general contractor.
 *
 * The billing direction and the owner's account agree, which is worth stating
 * because they are independent of each other — one is a document from a third
 * party, the other is testimony, and neither was derived from the other.
 *
 * It corroborates the same capability the Sulphur Springs workbook shows —
 * this company running ground-up KFC builds as the responsible party, engaging
 * and paying its own trades — and it does so on a third party's letterhead
 * rather than our own.
 *
 * WHY THE FIGURE IS RECORDED BUT MUST NEVER BE A PROJECT VALUE
 * $31,143.75 is a COST this company paid, not revenue it earned and not the
 * contract value of the restaurant. stateEvidence.js carries amounts like
 * "Brukner Boulevard invoiced at $27,170", and every one of those is money
 * received. Dropping this number into that company would silently convert an
 * outgoing payment into a project value. It stays here instead.
 */
export const LEESVILLE_CM_INVOICE = {
  document: 'Invoice from the construction manager to this company',
  invoiceNumber: 'D1015006',
  issuedBy: 'Innovative Building Solutions, Fairhope, Alabama',
  issuedTo: 'J Worden & Sons Paving LLC',
  directionOfPayment: 'outgoing — this company was the payer',
  relationship: 'Innovative Building Solutions was a subcontractor to this company, engaged to provide construction management.',
  relationshipOwnerConfirmed: '2026-08-26',
  relationshipCorroboratedBy: 'The invoice runs from IBS to this company, which is only consistent with IBS being the party engaged.',
  store: 'KFC-618',
  workOrder: 'WO-7170336',
  site: '1102 S. 5th Street, Leesville, Louisiana 71446',
  date: '2018-10-15',
  description: 'Final payment',
  amountUsd: 31143.75,
  amountIsACostNotRevenue: true,
  whatItProves:
    'This company held the prime contract on a ground-up KFC build as general contractor, engaging and paying its own construction manager as a subcontractor.',
  whatItDoesNotProve:
    'What this company was paid for the project, or the contract value of the restaurant. It is an outgoing cost and must never be presented as either.',
  status: 'held',
  publishable: false,
  sourceVerified: '2026-08-26',
}

/**
 * WHAT THIS ARCHIVE CANNOT SEE, AND WHY THAT CHANGES HOW TO READ IT
 * ────────────────────────────────────────────────────────────────
 * Every "nothing found" in this repository has been recorded as though it
 * meant "no such document exists". For one whole body of work that is wrong,
 * and the difference matters enough to write down.
 *
 * The 2018 KFC new-build programme was not run from the company mailbox. It
 * was run from the personal mailbox of the owner's brother — a company officer
 * appointed in the 2015 succession — and that account is not connected to this
 * system and cannot be searched from it.
 *
 * THE EVIDENCE FOR THAT IS STRUCTURAL, NOT ANECDOTAL
 * The construction manager's final invoice for Leesville was addressed solely
 * to that mailbox, with the company Gmail merely copied. It is the ONLY thread
 * from that construction manager anywhere in the connected archive, on a
 * programme spanning at least three ground-up restaurants in three states.
 * One copied email out of an entire programme is not a filing accident; it is
 * where the work was actually conducted.
 *
 * WHAT THIS EXPLAINS
 * Searches run on 2026-08-26 for the developer, its principal, Jefferson City,
 * Missouri Blvd, asbestos, NESHAP and the engineer's project number all
 * returned nothing across the whole connected archive. That silence has been
 * read correctly as "not here", and must NOT be read as "does not exist" —
 * including the asbestos correspondence, and including any contract or
 * purchase order that would raise Jefferson City from owner-confirmed to
 * documented.
 *
 * THE ADDRESS IS DELIBERATELY NOT WRITTEN HERE
 * It is a family member's personal email account. The owner knows it; this
 * repository does not need it, and the same rule that kept fifteen
 * subcontractors' mobile numbers out of the Sulphur Springs record applies
 * with more force to a relative. The role is what makes the gap actionable.
 */
export const ARCHIVE_COVERAGE = {
  connected: 'The company Gmail account.',
  notConnected: 'A company officer’s personal mailbox, on a provider with no connector available here.',
  officerRole: 'Brother of the owner; appointed an officer in the April 2015 shareholders’ minutes.',
  ownerConfirmed: '2026-08-26',
  programmeRunFromIt: '2018 KFC ground-up new-build programme',
  structuralEvidence:
    'The construction manager’s final Leesville invoice was addressed solely to that mailbox with the company Gmail copied, and it is the only thread from that construction manager in the entire connected archive.',
  searchesThatReturnedNothingBecauseOfThis: [
    'the developer and its principal',
    'Jefferson City and the site address',
    'asbestos and NESHAP',
    'the engineer’s project number',
  ],
  howToRead:
    'For this programme, an empty search result means "not in the connected mailbox". It does not mean the document does not exist.',
  howToClose:
    'Forward or export the programme threads from that mailbox into the company account. The asbestos correspondence and any Jefferson City contract or purchase order would both arrive that way.',
  addressWithheld: true,
  addressWithheldReason:
    'A family member’s personal email account. The owner knows it; the record does not need it.',
}

/**
 * VIRGINIA KFC WORK — BREACLAW CONSTRUCTION (owner-stated, 2026-08-27)
 *
 * The owner, in his own words the night the imagery rebuild ran: "alot of
 * virginia kfcs were done too remember for breaclaw contruction". Two facts
 * are asserted: KFC work was performed in Virginia, and the engaging party
 * was a construction company the owner names phonetically as "Breaclaw"
 * (spelling unverified — could be Braeclaw / Breclaw / similar).
 *
 * GRADE: OWNER-CONFIRMED. No invoice, PO, or email in the indexed archive
 * mentions this name yet (grepped 2026-08-27: zero hits under any spelling
 * tried). The documented KFC programme spans eleven states via KBP Foods —
 * Virginia sites under a different GC would EXTEND the programme's footprint,
 * which is why this stays out of published copy until the email archive
 * (task: index the archive) or a document surfaces the company's real name.
 * When it does: correct the spelling here, attach the document reference,
 * and only then consider it for the national-programme pages.
 */
export const VIRGINIA_KFC_BREACLAW = {
  id: 'virginia-kfc-breaclaw',
  assertedBy: 'owner',
  assertedOn: '2026-08-27',
  claim: 'Multiple Virginia KFC locations serviced; engaged by a GC the owner names as "Breaclaw Construction" (spelling unverified)',
  evidence: 'owner-confirmed',
  publishable: false,
  corroboration: 'none yet — search the email archive for the company name once indexed',
}

/**
 * MASTER CONSTRUCTION AGREEMENT — PLAZA STREET PARTNERS, FEBRUARY 2018
 *
 * Source: DOCX supplied by the owner from his Dropbox, 2026-08-27, filename
 * carrying document id 62201347-v1. The Jefferson City KFC relationship,
 * previously owner-confirmed only, now has its contractual backbone.
 *
 * WHAT THE DOCUMENT IS: a Master Construction Agreement dated 2 February
 * 2018 between Plaza Street Partners, LLC of Kansas City, Missouri as OWNER
 * and J. Worden and Sons Paving, LLC (Chester, VA) as CONTRACTOR —
 * non-exclusive, with a separate "Project Amendment" per project defining
 * scope, contract sum, and schedule. The copy includes an embedded Project
 * Amendment schedule: commencement 5 Feb 2018, substantial completion
 * 5 Mar 2018, final completion 16 May 2018, liquidated damages $250/day.
 * Insurance terms required a $3,000,000 umbrella per occurrence per project,
 * maintained three years past final completion.
 *
 * GRADE CAVEAT: this copy's signature blocks are BLANK — it is the v1 draft
 * as circulated, not evidence of execution. Execution is separately supported
 * by the fact the work happened (Jefferson City build, owner-confirmed; Bret
 * Elliot / Plaza Street Partners correspondence in the family mailbox). The
 * agreement upgrades the relationship from remembered to contractual-form
 * documented; a signed copy or the countersigned email would complete it.
 */
export const MASTER_CONSTRUCTION_AGREEMENT_2018 = {
  id: 'master-construction-agreement-2018',
  date: '2018-02-02',
  owner: 'Plaza Street Partners, LLC (Kansas City, MO)',
  contractor: 'J. Worden and Sons Paving, LLC',
  structure: 'master agreement + per-project Project Amendments',
  embeddedSchedule: { commence: '2018-02-05', substantial: '2018-03-05', final: '2018-05-16', liquidatedDamagesPerDay: 250 },
  umbrellaRequirement: 3000000,
  evidence: 'unsigned v1 draft in owner custody',
  publishable: false,
  custody: "owner's Dropbox",
}

/**
 * NEW-BUILD SITE DUE-DILIGENCE ARCHIVE (Dropbox folder, indexed 2026-08-27)
 *
 * A 769-file archive supplied by the owner: per-site folders of geotechnical
 * reports, environmental site assessments (ESA/Phase 1), ALTA surveys, title
 * work, and permit drawings — the development due-diligence set a builder
 * holds, consistent with the general-contractor role the Leesville CM
 * invoice and the 2018 Plaza Street Partners master agreement document.
 * Zip timestamps run through Feb 2019.
 *
 * TEN SITES: Jefferson City (MO), Sulphur Springs (TX), Ennis (TX),
 * Killeen (TX), Crowley (LA), DeRidder (LA), Jennings (LA), Leesville (LA),
 * Toledo, and Gate City Blvd, Greensboro (NC).
 *
 * Jefferson City, Sulphur Springs, and Leesville were already in the record;
 * the other seven EXTEND the documented programme. Greensboro NC is the
 * first North Carolina new-build site in any document — relevant to the
 * Carolina brand's state evidence once a work-performed document surfaces
 * (due diligence proves the programme reached the site, not that our crews
 * built it; grade accordingly).
 *
 * CUSTODY: owner's Dropbox. The files are not in this repository.
 */
export const SITE_ARCHIVE_2019 = {
  id: 'site-archive-2019',
  fileCount: 769,
  sites: ['Jefferson City MO', 'Sulphur Springs TX', 'Ennis TX', 'Killeen TX', 'Crowley LA', 'DeRidder LA', 'Jennings LA', 'Leesville LA', 'Toledo', 'Greensboro NC (Gate City Blvd)'],
  contents: 'geotech, ESA/Phase 1, ALTA surveys, title, permit drawings per site',
  evidence: 'document archive in owner custody',
  publishable: false,
  custody: "owner's Dropbox",
}

/**
 * TYSON CHICKEN PLANT, VIRGINIA — PARKING LOT (owner-stated, 2026-08-27)
 * Owner's words: "tysons chick plant in virgnia contract should be in there
 * too we did the parking lot". The contract is NOT in the site archive
 * indexed above (searched all 864 zip entries). Stays owner-confirmed and
 * unpublished until the contract or an invoice surfaces.
 */
export const TYSON_PLANT_PARKING_LOT = {
  id: 'tyson-plant-parking-lot',
  assertedBy: 'owner',
  assertedOn: '2026-08-27',
  claim: 'Parking lot work at a Tyson chicken plant in Virginia; contract exists but not yet located',
  evidence: 'email-corroborated (onboarding level)',
  publishable: false,
  // Mailbox corroboration located 2026-08-27: thread "Tyson Plant / Coastal
  // Maintenance" (2016-03-01) — the office sends the company W9 to Coastal
  // Maintenance LLC ("Tammy") for the Tyson job, COIs to follow. That is
  // onboarding-level proof of the engagement. The owner also describes DOT
  // scale tickets picked up near the job that were later dismissed. Per the
  // owner: a LOCAL attorney close to the chicken plant handled them, and
  // Sarah Solomon was his office manager at the time — which matches her
  // "Office Manager" signature across the 2016-2017 mailbox. The ticket
  // paperwork lives in scanned email attachments; the local attorney is not
  // named in any readable email body. Dismissal stays owner-confirmed.
  corroboration: 'W9 onboarding email to Coastal Maintenance LLC, 2016-03-01; ticket dismissal owner-confirmed',
  engagedThrough: 'Coastal Maintenance LLC',
}

/**
 * RICHMOND COMMERCIAL JOB, SPRING 2026 (owner-stated, 2026-08-27)
 * Owner's words: "I PAVED PLAN PARENTHOOD THIS SPRING ON 201 N HAMLITON
 * STREET RICHMOND 23221". The address matches the Planned Parenthood health
 * center at 201 N Hamilton St, Richmond. Recent, local, commercial — exactly
 * the proof the Richmond brand wants.
 *
 * PUBLICATION HELD PENDING OWNER DECISION: naming this client on a marketing
 * page is a business decision, not an evidence question — the organization is
 * politically charged in both directions. If the owner wants it published,
 * an invoice or Kickserv entry should also be located first so it publishes
 * at document grade like the other named clients.
 */
export const RICHMOND_HAMILTON_ST_2026 = {
  id: 'richmond-hamilton-st-2026',
  assertedBy: 'owner',
  assertedOn: '2026-08-27',
  claim: 'Paved the lot at the N Hamilton St site, Richmond, VA 23221 in spring 2026',
  evidence: 'quotation + COI documented',
  // QUOTATION SUPPLIED 2026-08-27 (screenshot from the owner's phone):
  // QUOT3099, dated 2026-02-24, to the organization at 201 N Hamilton St —
  // confirming the owner's address over the COI's "210" typo. Scope: lot
  // prep with tree removal and crush-and-run base (18 units @ $100), tack
  // coat over 11,540 sq ft, wedge paving on 2,100 sq ft of alligatored
  // area, 11,480 sq ft resurfaced with 12.5mm plant mix at 2.5", and
  // ADA-compliant striping. Total $43,919; half deposit, balance on
  // completion; one-year warranty; work supervised by the owner. The
  // facility contact's name, email, and phone stay out of the repository.
  // Evidence chain: quotation (Feb 24) -> COI naming them holder (Apr 3)
  // -> owner-confirmed completion in spring. Contract amount is NOT
  // published on the card - scope only.
  quotation: { number: 'QUOT3099', date: '2026-02-24', total: 43919, resurfaceSqFt: 11480 },
  // 2026-08-27, morning: the owner answered the publication question with
  // "Planned parenthood" — publish the name. Now on the commercial client
  // authority card, first position.
  publishedAt: 'CommercialClientAuthority card',
  publishable: true,
  // UPGRADED 2026-08-27, same night: the owner produced an ACORD 25 COI
  // dated 2026-04-03 naming "planned parenthood, 210 north hamelton ave,
  // richmond, VA 23221" as certificate holder — vendor onboarding for the
  // spring job (the owner said 201 N Hamilton; the certificate reads 210).
  // Document custody: owner's files. Publication remains the owner's call.
  evidenceUpgrade: 'COI dated 2026-04-03 names the organization as certificate holder',
  publicationNote: 'held for owner decision on naming the client',
}

/**
 * SUMMER 2026 DIAMOND SOLUTIONS JOBS — FOUND IN THE MAILBOX 2026-08-27
 *
 * Located while searching for other documents; neither was in the record.
 * Both are the owner's own invoice emails to accounting@thediamondsolutions
 * .com with the accountant's written receipt confirmation, followed by four
 * remittance advices from Diamond Solutions (PT009520, PT009669, PT010007,
 * PT010014; 31 Jul - 13 Aug 2026) — remittance means money moved. Which
 * invoices each remittance covers sits in PDF attachments not yet read, so
 * the per-job grade stops at invoiced-and-acknowledged with payments
 * evidenced at the account level.
 */
export const HOBBY_LOBBY_DANVILLE_2026 = {
  id: 'hobby-lobby-danville-2026',
  client: 'Diamond Solutions (GC)',
  site: 'Hobby Lobby, Danville, VA',
  completed: '2026-07-01',
  invoiced: '2026-07-27',
  evidence: 'owner invoice email + accounting receipt confirmation',
  paymentEvidence: 'account-level remittance advices, details unread',
  publishable: false,
}

export const TRACTOR_SUPPLY_RUCKERSVILLE_2026 = {
  id: 'tractor-supply-ruckersville-2026',
  client: 'Diamond Solutions (GC)',
  site: 'Tractor Supply, Ruckersville, VA',
  completed: '2026-06-15',
  invoiced: '2026-07-27',
  evidence: 'owner invoice email + accounting receipt confirmation',
  paymentEvidence: 'account-level remittance advices, details unread',
  publishable: false,
}

/**
 * DIAMOND SOLUTIONS INVOICE PACKAGE — 27 AUGUST 2026
 *
 * Found in the sent mail the same day it went out: four invoices to
 * accounting@thediamondsolutions.com, each against a Diamond Solutions
 * subcontract PO, itemized in the email body and attached as PDFs. Rick
 * Lapinsky (Senior PM) replied within five minutes confirming PO 26607 for
 * Charleston ("that was a typo on my end"). Evidence grade:
 * invoice-with-PO, acknowledged by the GC in writing — one step below
 * remittance. Rick's reconciliation emails of 8/18-8/19 carry the
 * deposit/cost breakdowns these net against.
 */
export const CAPITAL_ONE_ANNANDALE_2026 = {
  id: 'capital-one-annandale-2026',
  client: 'Diamond Solutions (GC)',
  site: 'Capital One Bank #61458, Annandale, VA',
  po: '26566 (+ change order 26566CO3)',
  invoiced: '2026-08-27',
  amount: 28300,
  evidence: 'invoice with GC purchase order, receipt acknowledged',
  publishable: true,
}

export const TARGET_STUARTS_DRAFT_2026 = {
  id: 'target-stuarts-draft-2026',
  client: 'Diamond Solutions (GC)',
  site: 'Target, Stuarts Draft, VA',
  po: '26581',
  invoiced: '2026-08-27',
  amount: 1500,
  evidence: 'invoice with GC purchase order, receipt acknowledged',
  publishable: true,
}

export const DOLLAR_TREE_CHARLESTON_2026 = {
  id: 'dollar-tree-charleston-2026',
  client: 'Diamond Solutions (GC)',
  site: 'Dollar Tree #07604, Charleston, WV',
  po: '26607',
  invoiced: '2026-08-27',
  amount: 1500,
  evidence: 'invoice with GC purchase order; PO number confirmed by the GC in writing',
  // FIRST WEST VIRGINIA JOB IN THE RECORD. West Virginia has no published
  // pages and gets none from one store visit — but the state evidence is
  // now documented at invoice grade.
  publishable: true,
}

export const CLIENT_DOCUMENTS = [
  KFC_RESPONSIBILITY_MATRIX,
  LEESVILLE_CM_INVOICE,
  JEFFERSON_CITY_CIVIL_SET,
  SULPHUR_SPRINGS_BUDGET,
]
