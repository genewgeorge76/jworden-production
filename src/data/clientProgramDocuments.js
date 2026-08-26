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
  whatItProves: 'The project existed, was engineered by a national firm and reached permit stage.',
  whatItDoesNotProve:
    'Any role for this company. The set assigns every duty to "the Subcontractor" generically and names no contractor. Possession of a permit set is consistent with bidding and with being awarded the job alike.',
  corroborationNeeded:
    'An invoice, a contract or a purchase order naming Jefferson City. Nothing in the invoice archive currently does.',
  status: 'unconfirmed',
  publishable: false,
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

export const CLIENT_DOCUMENTS = [
  KFC_RESPONSIBILITY_MATRIX,
  JEFFERSON_CITY_CIVIL_SET,
  SULPHUR_SPRINGS_BUDGET,
]
