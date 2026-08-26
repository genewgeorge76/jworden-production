import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { CLIENT_DOCUMENTS, KFC_RESPONSIBILITY_MATRIX, JEFFERSON_CITY_CIVIL_SET, SULPHUR_SPRINGS_BUDGET,
  SULPHUR_SPRINGS_STATE_RESOLVED, NEW_BUILD_PROGRAMME_CROSSCHECK, LEESVILLE_CM_INVOICE, ARCHIVE_COVERAGE }
  from '../../src/data/clientProgramDocuments.js'
import { STATE_EVIDENCE, WORK } from '../../src/data/stateEvidence.js'
import { JEFFERSON_CITY_EPA_MATTER } from '../../src/data/publicRecordsWithheld.js'
import { publishableFor, BRAND_JWORDEN, recordById } from '../../src/data/publicRecords.js'

const PAGE_DIRS = ['src/pages', 'src/components']

function sourceFiles(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name)
    if (e.isDirectory()) sourceFiles(full, out)
    else if (/\.(jsx?|mjs)$/.test(e.name)) out.push(full)
  }
  return out
}

/**
 * A BUNDLER SHIPS WHOLE MODULES, WHICH IS THE LESSON THIS REPOSITORY KEEPS
 * RELEARNING
 * ───────────────────────────────────────────────────────────────────────
 * Twice already a number that never rendered on any page still travelled to
 * every browser, because "not rendered" is a statement about pixels and a
 * bundle is a statement about imports. This file carries a client's internal
 * coordination document, an engineer's project number, and the structure of a
 * budget containing margin. None of it may cross into page code.
 */
test('no page-facing module imports the client documents', () => {
  const offenders = []
  for (const dir of PAGE_DIRS) {
    for (const file of sourceFiles(dir)) {
      if (/clientProgramDocuments/.test(readFileSync(file, 'utf8'))) offenders.push(file)
    }
  }
  assert.deepEqual(offenders, [], 'client documents reachable from page code:\n  ' + offenders.join('\n  '))
})

/** Nothing in the file may claim to be publishable. */
test('every client document is marked unpublishable', () => {
  for (const doc of CLIENT_DOCUMENTS) {
    assert.equal(doc.publishable, false, `${doc.document} is not marked unpublishable`)
  }
})

/**
 * THE MERGED-HEADER TRAP, PINNED
 * ──────────────────────────────
 * Read by column position the matrix appears to give Worden an Approve column
 * and a scope covering roofing, signage and facade. It does not — the header
 * spans are uneven and that column belongs to the GC. The eight-item sitework
 * scope is the true reading, and it is recorded here so a future edit that
 * inflates it has to argue with a test.
 */
test('the KFC matrix scope is the eight sitework items and nothing more', () => {
  assert.equal(KFC_RESPONSIBILITY_MATRIX.scope.length, 8)
  assert.equal(KFC_RESPONSIBILITY_MATRIX.totalLineItems, 8)
  assert.equal(KFC_RESPONSIBILITY_MATRIX.everyItemIsSitework, true)
  for (const inflated of ['Roofing', 'Building Signage', 'Awnings', 'Façade', 'Tower Roof Element']) {
    assert.equal(
      KFC_RESPONSIBILITY_MATRIX.scope.some((s) => s.includes(inflated)),
      false,
      `${inflated} is the GC's column, not Worden's`,
    )
  }
})

/** Possession of a permit set is not participation in the project. */
test('the Jefferson City set does not claim a role it cannot support', () => {
  // The DOCUMENT still names no contractor. The build is established by the
  // owner, which is a different and weaker grade of evidence than an invoice,
  // and the record must not quietly upgrade one into the other.
  assert.equal(JEFFERSON_CITY_CIVIL_SET.namesWorden, false)
  assert.equal(JEFFERSON_CITY_CIVIL_SET.ownerConfirmed.built, true)
  assert.equal(JEFFERSON_CITY_CIVIL_SET.status, 'owner-confirmed')
  assert.match(JEFFERSON_CITY_CIVIL_SET.whatItDoesNotProve, /owner-stated/i)
  assert.equal(JEFFERSON_CITY_CIVIL_SET.publishable, false)
})

/**
 * THE FIGURE THAT MUST NOT ESCAPE
 * ───────────────────────────────
 * $948,716 proposed and $786,001.80 "actual" against one invoice on file for
 * $113,904.14. Until that is settled, neither large figure may appear as a
 * project value — and $430,000 of the "actual" column is annotated WAG, so it
 * is not an actual-cost record either.
 */
test('the Sulphur Springs totals stay unreconciled and unpublished', () => {
  assert.equal(SULPHUR_SPRINGS_BUDGET.publishable, false)
  assert.equal(SULPHUR_SPRINGS_BUDGET.actualColumnIsPartEstimate, true)
  assert.ok(SULPHUR_SPRINGS_BUDGET.wagCoverageUsd > 0)
  assert.equal(SULPHUR_SPRINGS_BUDGET.unreconciled.invoiceOnFile.amountUsd, 113904.14)
  assert.ok(SULPHUR_SPRINGS_BUDGET.unreconciled.note.length > 40)
})

/** Third-party contact details are not copied into this repository. */
test('no subcontractor personal contact details were carried across', () => {
  const raw = readFileSync('src/data/clientProgramDocuments.js', 'utf8')
  assert.equal(/@(gmail|yahoo|hotmail|outlook)\.com/i.test(raw), false, 'a personal email address was copied in')
  assert.equal(/\(\d{3}\)[\s-]?\d{3}-\d{4}/.test(raw), false, 'a personal phone number was copied in')
  assert.equal(SULPHUR_SPRINGS_BUDGET.piiAndMarginDeliberatelyOmitted, true)
})

/**
 * THE AURORA BOND IS A DIFFERENT CLAIM FROM THE 2016 LICENCE BONDS, AND THE
 * PAGE MUST NOT MERGE THEM
 * A licence bond buys permission to work. A performance and maintenance bond
 * stakes money on the work being finished, accepted and still sound a year
 * later. Presenting the 2017 bond as a renewal of the 2016 licences would be an
 * invention, so the record says plainly that it is neither.
 */
test('the Aurora bond publishes as its own dated event', () => {
  const aurora = recordById('aurora-performance-bond-2017')
  assert.ok(aurora, 'the Aurora bond is not in the record')
  assert.equal(aurora.year, 2017)
  assert.equal(aurora.bonds[0].penalSum, 20000)
  assert.match(aurora.tenseNote, /[Nn]ot a renewal/)
  assert.match(aurora.scopeNote, /[Nn]ot a state contractor licence/)
  assert.equal(aurora.addressWithheld, true)
  // It must reach the Virginia-brand pages alongside the other records.
  assert.ok(publishableFor(BRAND_JWORDEN).some((r) => r.id === 'aurora-performance-bond-2017'))
})

/**
 * ONE JOB CANNOT BE IN TWO STATES
 * ───────────────────────────────
 * Sulphur Springs was recorded as Tennessee with a TDOT permit while its own
 * budget workbook is Texan. The owner confirmed one job only, so both records
 * were corrected. These assertions exist because a single mis-keyed letter had
 * been holding up an entire state's evidence grade, and the same slip would be
 * easy to reintroduce.
 */
test('Sulphur Springs is recorded in Texas and nowhere else', () => {
  assert.equal(SULPHUR_SPRINGS_STATE_RESOLVED.state, 'TX')
  const projects = JSON.parse(readFileSync('src/data/nationalProjects.json', 'utf8'))
  const found = []
  const walk = (o) => {
    if (Array.isArray(o)) return o.forEach(walk)
    if (o && typeof o === 'object') {
      if (typeof o.city === 'string' && /sulph?[ue]r springs/i.test(o.city)) found.push(o)
      Object.values(o).forEach(walk)
    }
  }
  walk(projects)
  assert.ok(found.length > 0, 'Sulphur Springs vanished from the project record')
  for (const site of found) {
    assert.equal(site.state, 'TX', 'a Sulphur Springs site is recorded outside Texas')
  }
})

/** Tennessee may not silently regain a grade it lost with that permit. */
test('Tennessee is not presented as a market served', () => {
  assert.notEqual(STATE_EVIDENCE.TN.grade, WORK)
  assert.equal(/TDOT/.test(STATE_EVIDENCE.TN.detail), false, 'the Texan permit is back on Tennessee')
  assert.match(STATE_EVIDENCE.TN.detail, /Smyrna/)
})

/**
 * The $670,039 reconciles to the cent against one file. Sulphur Springs is not
 * one of its rows, and folding it in would break a clean derivation.
 */
test('the Texas total is not inflated by the new build', () => {
  assert.match(STATE_EVIDENCE.TX.detail, /\$670,039/)
  assert.match(STATE_EVIDENCE.TX.valueNote, /separate job/i)
  assert.equal(
    /\$948,716|\$786,001|\$783,943/.test(STATE_EVIDENCE.TX.detail + STATE_EVIDENCE.TX.valueNote),
    false,
    'an unreconciled workbook total reached the state evidence',
  )
})

/** The cross-check corroborates the programme, never this company's role. */
test('the Jefferson City cross-check does not overreach', () => {
  assert.match(NEW_BUILD_PROGRAMME_CROSSCHECK.doesNotCorroborate, /names no contractor/i)
  assert.equal(JEFFERSON_CITY_CIVIL_SET.namesWorden, false)
})

/**
 * AN ENFORCEMENT ACTION IS RECORDED, NEVER RENDERED
 * ────────────────────────────────────────────────
 * The EPA matter is in the withheld register because it is already public at
 * EPA ECHO and the company should not be the last to know what a stranger can
 * read. That is precisely the kind of entry a bundler would happily ship to
 * every browser if a page-facing module ever imported the file, which is the
 * mistake this repository has already made twice with lesser material.
 */
test('the EPA matter is held, unpublishable, and out of page reach', () => {
  assert.equal(JEFFERSON_CITY_EPA_MATTER.publishable, false)
  assert.equal(JEFFERSON_CITY_EPA_MATTER.publiclySearchable, true)
  assert.ok(JEFFERSON_CITY_EPA_MATTER.whyWithheld.length > 40)
  // Particulars were not supplied and must not be invented later.
  assert.ok(JEFFERSON_CITY_EPA_MATTER.particularsNotSupplied.includes('amount'))

  const offenders = []
  for (const dir of PAGE_DIRS) {
    for (const file of sourceFiles(dir)) {
      const src = readFileSync(file, 'utf8')
      if (/publicRecordsWithheld|asbestos|EPA ECHO/i.test(src)) offenders.push(file)
    }
  }
  assert.deepEqual(offenders, [], 'enforcement material reachable from page code:\n  ' + offenders.join('\n  '))
})

/**
 * THE STANDARD THAT CAME OUT OF IT MUST STAY IN THE PROMPT
 * A lesson held in one person's memory protects one job. In WORDEN_STANDARDS it
 * reaches every answer the assistant gives about a demolition.
 */
test('the demolition standard is in the canonical standards block', () => {
  const jarvis = readFileSync('app/services/jarvis.py', 'utf8')
  const block = jarvis.slice(jarvis.indexOf('WORDEN_STANDARDS = ('), jarvis.indexOf('number ends up in a bid.'))
  assert.match(block, /asbestos survey/i, 'the demolition standard is missing')
  assert.match(block, /10-working-day|10 working day/i, 'the NESHAP notification period is missing')
  assert.match(block, /Subpart M/, 'the governing rule is not cited')
  assert.match(block, /Never on a developer|not.*developer/i, 'the standard does not say whose word is worthless here')
})

/**
 * AN OUTGOING PAYMENT IS NOT A PROJECT VALUE
 * ──────────────────────────────────────────
 * The Leesville invoice was issued BY the construction manager TO this company.
 * Its $31,143.75 is money paid out. Every amount in stateEvidence.js is money
 * received, so letting this one drift into that file would silently convert a
 * cost into a contract value — the same class of error as the unreconciled
 * Sulphur Springs totals, and easier to make because the figure looks like all
 * the others.
 */
test('the Leesville cost never becomes a project value', () => {
  assert.equal(LEESVILLE_CM_INVOICE.amountIsACostNotRevenue, true)
  assert.equal(LEESVILLE_CM_INVOICE.directionOfPayment, 'outgoing — this company was the payer')
  assert.equal(LEESVILLE_CM_INVOICE.publishable, false)
  const evidence = readFileSync('src/data/stateEvidence.js', 'utf8')
  assert.equal(
    /31,143|31143/.test(evidence),
    false,
    'an outgoing payment reached the file where every figure is money received',
  )
})

/**
 * IT ESTABLISHES WHO HELD THE CONTRACT, WHICH IS THE POINT
 * ───────────────────────────────────────────────────────
 * Owner-confirmed and independently corroborated: IBS was a subcontractor to
 * this company, not a construction manager sitting above it. Two sources that
 * were not derived from each other — a third party's invoice and the owner's
 * account — agreeing on the direction of the relationship.
 *
 * The project team list in nationalProjects.json is asserted here too, because
 * a flat list of firms reads as peers and is exactly how a reader would reach
 * the opposite conclusion.
 */
test('the Leesville invoice establishes the prime position', () => {
  assert.equal(LEESVILLE_CM_INVOICE.issuedTo, 'J Worden & Sons Paving LLC')
  assert.match(LEESVILLE_CM_INVOICE.whatItProves, /prime/i)
  assert.match(LEESVILLE_CM_INVOICE.relationship, /subcontractor to this company/i)
  assert.ok(LEESVILLE_CM_INVOICE.relationshipOwnerConfirmed)
  assert.match(LEESVILLE_CM_INVOICE.whatItDoesNotProve, /contract value|was paid/i)

  const projects = JSON.parse(readFileSync('src/data/nationalProjects.json', 'utf8'))
  const programme = projects.programs[0].newBuildProgram
  assert.equal(programme.role, 'General contractor')
  assert.match(programme.contractingRelationship, /prime contract/i)
  const ibs = programme.projectTeam.find((t) => /Innovative Building/.test(t))
  assert.match(ibs, /subcontractor/i, 'the team list still reads as peers')
})

/**
 * SILENCE IS NOT ABSENCE
 * ──────────────────────
 * The 2018 new-build programme was run from a mailbox this system cannot
 * search, so every empty search result for that programme means "not here",
 * never "does not exist". Recording the gap is what makes the difference
 * legible to whoever reads a nothing-found result next — including a future
 * reader who might otherwise conclude the asbestos correspondence or a
 * Jefferson City contract was never real.
 */
test('the archive gap is recorded so empty results are not read as absence', () => {
  assert.match(ARCHIVE_COVERAGE.howToRead, /does not mean the document does not exist/i)
  assert.ok(ARCHIVE_COVERAGE.searchesThatReturnedNothingBecauseOfThis.length >= 3)
  assert.ok(ARCHIVE_COVERAGE.ownerConfirmed)
  assert.ok(ARCHIVE_COVERAGE.howToClose.length > 30)
})

/**
 * A relative's personal address gets the same protection the Sulphur Springs
 * subcontractors got, and more readily. The role makes the gap actionable; the
 * address adds nothing the owner does not already have.
 */
test('the officer mailbox address is not written into the repository', () => {
  assert.equal(ARCHIVE_COVERAGE.addressWithheld, true)
  const raw = readFileSync('src/data/clientProgramDocuments.js', 'utf8')
  assert.equal(/@yahoo\.com/i.test(raw), false, 'a personal mailbox address was copied in')
  assert.equal(/mdg\d/i.test(raw), false, 'a personal mailbox handle was copied in')
})
