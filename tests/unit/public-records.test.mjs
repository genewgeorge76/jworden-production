import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { sourceWithoutComments } from '../helpers/source.mjs'

import {
  PUBLIC_RECORDS,
  VERIFIABLE,
  HELD,
  UNCONFIRMED,
  LAPSED,
  PUBLISHABLE,
  BRAND_JWORDEN,
  BRAND_CAROLINA,
  BRAND_SHARED,
  publishableFor,
  recordById,
} from '../../src/data/publicRecords.js'
import {
  FOURTH_ILLINOIS_BOND,
  WITHHELD_RECORDS,
  USDOT_UNPUBLISHED,
  SAFETY_AUDIT_2015,
  LICENSING_POLICY,
  withheldById,
} from '../../src/data/publicRecordsWithheld.js'

test('every record carries a status the vocabulary recognises', () => {
  for (const r of [...PUBLIC_RECORDS, ...WITHHELD_RECORDS]) {
    assert.ok([VERIFIABLE, HELD, UNCONFIRMED, LAPSED].includes(r.status), `${r.id}: ${r.status}`)
    assert.ok([BRAND_JWORDEN, BRAND_CAROLINA, BRAND_SHARED].includes(r.brand), `${r.id} brand`)
    assert.ok(r.authority && r.kind && r.source, `${r.id} is missing provenance`)
    assert.match(r.sourceVerified, /^\d{4}-\d{2}-\d{2}$/, `${r.id} verification date`)
  }
})

/**
 * The load-bearing one. Only VERIFIABLE reaches a page, and VERIFIABLE means
 * a stranger can confirm it at the issuing authority — not that we hold a copy.
 */
test('only verifiable records are publishable', () => {
  assert.equal(PUBLISHABLE.has(HELD), false)
  assert.equal(PUBLISHABLE.has(UNCONFIRMED), false)
  assert.equal(PUBLISHABLE.has(LAPSED), false)
  for (const brand of [BRAND_JWORDEN, BRAND_CAROLINA]) {
    for (const r of publishableFor(brand)) {
      assert.equal(r.status, VERIFIABLE, `${r.id} reached a page at ${r.status}`)
      assert.ok(r.howToCheck, `${r.id} is publishable but says nothing about how to check it`)
      assert.ok(r.whyItMatters, `${r.id} is publishable with no reason to care`)
    }
  }
  assert.ok(WITHHELD_RECORDS.length > 0, 'nothing is withheld, which cannot be right')
  // The page-facing module must hold nothing but publishable rows.
  for (const r of PUBLIC_RECORDS) assert.equal(r.status, VERIFIABLE, `${r.id} sits in the bundled module`)
  for (const r of WITHHELD_RECORDS) {
    assert.equal(PUBLISHABLE.has(r.status), false, `${r.id} is withheld but publishable`)
    assert.ok(r.whyNotPublished, `${r.id} is withheld with no reason recorded`)
  }
})

/**
 * SCDOT belongs to the Carolina brand and Richmond belongs to J. Worden. Two
 * reasons, either sufficient: the sites must not run identical text, and the
 * permit says where the work was done.
 */
test('brand-specific records stay on their own site', () => {
  const carolina = publishableFor(BRAND_CAROLINA).map((r) => r.id)
  const jworden = publishableFor(BRAND_JWORDEN).map((r) => r.id)

  assert.ok(carolina.includes('scdot-211746'))
  assert.equal(jworden.includes('scdot-211746'), false, 'the SCDOT permit leaked onto the Virginia site')

  assert.ok(jworden.includes('richmond-encroachment-1360'))
  assert.equal(
    carolina.includes('richmond-encroachment-1360'),
    false,
    'the Richmond permit leaked onto the Carolina site',
  )

  // The federal number is one fact about one legal entity, so it is shared by
  // design — that is not the duplication the rule is about.
  assert.ok(carolina.includes('usdot-2568168'))
  assert.ok(jworden.includes('usdot-2568168'))
})

/**
 * STATE REGISTRATIONS ARE PERISHABLE AND PERMITS ARE NOT
 * ─────────────────────────────────────────────────────
 * A permit approved in 2016 records something that happened; it cannot lapse.
 * A company registration is a present-tense status that expires quietly every
 * year the fee goes unpaid, and Georgia proved the point — dissolution and
 * revocation notices in July 2021, no cure in the archive.
 *
 * So no state entity registration may sit in the published module unless its
 * register has actually been read. The Virginia row shipped as VERIFIABLE on
 * the strength of filings that stop in 2016; it was demoted on 2026-08-26.
 */
test('no state entity registration is published without a live status', () => {
  for (const r of PUBLIC_RECORDS) {
    assert.notEqual(r.kind, 'Registered Entity', `${r.id} publishes a registration status that was never read`)
  }
  // The Illinois bond is a licence and therefore perishable in principle, so
  // it carries its tense on the record rather than in a reviewer's memory.
  const bond = recordById('illinois-municipal-licences-2016')
  assert.match(bond.tenseNote, /dated|not a current/i)
  assert.match(bond.scopeNote, /[Nn]ot a state contractor licence/)
  const va = withheldById('va-scc-s1800053')
  assert.equal(va.status, UNCONFIRMED)
  assert.equal(va.demotedFromPublished, '2026-08-26')
  assert.match(va.lastFilingInArchive, /^2016/)
  assert.equal(recordById('va-scc-s1800053'), null)

  const ga = withheldById('ga-sos-16031980')
  assert.equal(ga.status, UNCONFIRMED)
  assert.equal(ga.reference, '16031980')
  // Assert the substance, not the wording. This test first pinned the phrase
  // "Dissolve|Revoke" from the 2021 notices, and then broke the moment the
  // owner confirmed the lapse and the field was rewritten to say so — a test
  // failing on better information rather than on a regression.
  assert.equal(ga.ownerConfirmed.status, 'not renewed')
  assert.match(ga.ownerConfirmed.basis, /owner-stated/)
  assert.match(ga.whyNotPublished, /not current|not renewed/i)
  assert.ok(ga.ownerShouldReview, 'Georgia carries paid work and needs an explicit owner action')
  assert.equal(recordById('ga-sos-16031980'), null)

  // The past Georgia work is NOT collateral damage of the lapsed registration.
  // It was performed while the registration was live, and the record says so
  // rather than leaving a later reader to assume the whole state is tainted.
  assert.match(ga.ownerConfirmed.consequence, /[Pp]ast Georgia work is unaffected/)
})

/**
 * NO CLAIM WITHOUT A NUMBER OR AN AUTHORITY THAT HOLDS IT
 * A record with no reference must at least say who to ask.
 */
test('published records are checkable', () => {
  for (const r of PUBLIC_RECORDS.filter((x) => x.status === VERIFIABLE)) {
    assert.ok(r.reference || r.verifyUrl, `${r.id} is published with nothing to look up`)
  }
})

/**
 * THE FMCSA SAFETY FIGURES MUST NEVER BE PUBLISHED
 * ────────────────────────────────────────────────
 * The SAFER snapshot reports 0 crashes, 0 out-of-service orders and a 0%
 * out-of-service rate. All true, all meaningless: the same record reports 0
 * inspections in the past two years. A 0% rate over an empty set is not a
 * safety record, and SAFER prints the national averages right beside it, so
 * publishing ours would read as outperformance where none has been measured.
 *
 * This test exists because those numbers are genuinely flattering and the
 * temptation to use them will recur.
 */
test('the FMCSA safety figures stay off the site', () => {
  const usdot = recordById('usdot-2568168')
  assert.equal(USDOT_UNPUBLISHED.usdot, usdot.reference)
  assert.equal(USDOT_UNPUBLISHED.inspectionsTwoYear, 0)
  assert.equal(USDOT_UNPUBLISHED.safetyRating, 'None')
  assert.match(USDOT_UNPUBLISHED.reason, /measures nothing|0 inspections/)

  // None of it may appear in what the component renders.
  const rendered = [usdot.plain, usdot.whyItMatters, usdot.howToCheck, usdot.headline].join(' ')
  assert.doesNotMatch(rendered, /out.of.service rate/i)
  assert.doesNotMatch(rendered, /0%/)
  assert.doesNotMatch(rendered, /crash/i)
  assert.doesNotMatch(rendered, /satisfactory/i)
  // For-hire authority is NOT held and must never be implied.
  assert.doesNotMatch(rendered, /for.hire|operating authority/i)
})

/**
 * The licence lapsed because the qualifying individual took out his own.
 * The remedy is in motion and that is still not a current licence.
 */
test('the DPOR licence is recorded lapsed and never published', () => {
  const dpor = withheldById('dpor-2705105644')
  assert.equal(dpor.status, LAPSED)
  assert.equal(PUBLISHABLE.has(dpor.status), false)
  assert.equal(dpor.remedyInMotion, true)
  assert.ok(dpor.whyNotPublished)
  assert.equal(publishableFor(BRAND_JWORDEN).some((r) => r.id === dpor.id), false)
  assert.equal(recordById('dpor-2705105644'), null, 'the lapsed licence is in the bundled module')
})

/**
 * The pages must not carry a present-tense Class A claim while the register
 * does not support one. Checked against the built source, not intentions.
 */
test('no page claims a current Class A licence', () => {
  for (const page of ['src/pages/Home.jsx', 'src/pages/MarketLanding.jsx']) {
    const src = readFileSync(page, 'utf8')
      // Strip comments — the reasoning quotes the phrase it forbids, and a
      // naive grep would fail on the explanation rather than on a claim.
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    // The first version of this assertion required the words to be ADJACENT
    // ("Class A licensed"), and the homepage evaded it by layout: a stats band
    // with value 'Class A' in one string and label 'VA Licensed Contractor' in
    // the next. A claim split across two strings is still the claim. So: the
    // phrase "Class A" is banned from these pages outright, in any position,
    // unless the register comes to support it again — at which point loosening
    // this line is a deliberate act with a citation, not a formatting accident.
    assert.doesNotMatch(src, /Class A/, `${page} carries a Class A claim the register does not support`)
    // The same page carried "$5M Liability Coverage" (documented COI: $1M/$2M),
    // "5,000+ Projects" (the record: 2,263 customers, 920 completed jobs) and
    // a no-deposit promise contradicted by actual practice. Ban the shapes.
    assert.doesNotMatch(src, /\$5M|5,000\+|No deposit/i, `${page} carries an unevidenced marketing figure`)
  }
})

/**
 * A private customer's street address does not become publishable because a
 * permit number is attached to it.
 */
test('the Richmond permit withholds the residential address', () => {
  const r = recordById('richmond-encroachment-1360')
  assert.equal(r.addressWithheld, true)
  assert.ok(r.addressWithheldReason)
  const rendered = [r.plain, r.whyItMatters, r.howToCheck, r.headline].join(' ')
  assert.doesNotMatch(rendered, /\d+\s+Maple/i, 'the street address reached the page')
})

/** The component may not widen what the data module allows. */
test('the component publishes only what publishableFor returns', () => {
  const src = readFileSync('src/components/PublicRecords.jsx', 'utf8')
  assert.match(src, /publishableFor\(brand\)/)
  assert.equal(/PUBLIC_RECORDS/.test(src), false, 'the component reads the unfiltered list')
  assert.equal(/unpublishedFields/.test(src), false, 'the component reaches into the withheld block')
})

/**
 * THE FILE BOUNDARY IS THE SECURITY BOUNDARY
 * ──────────────────────────────────────────
 * This started as a status flag in one module. The component honoured it and
 * the built bundle still contained the lapsed licence number and the sentence
 * explaining the lapse, because a bundler ships whole modules. "Not rendered"
 * is a claim about pixels, not about what leaves the server.
 *
 * So no page-facing file may import the withheld module, and that is checked
 * here rather than remembered.
 */
test('no page-facing code imports the withheld records', () => {
  const roots = ['src/pages', 'src/components', 'src/lib', 'src/data']
  const offenders = []
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (/\.(jsx?|mjs)$/.test(e.name) && full !== 'src/data/publicRecordsWithheld.js') {
        // Comments name the module on purpose — the boundary is explained
        // where it is enforced. Strip them; an import is what matters. This is
        // the fifth time in this repository a text check has been fooled by
        // the comment describing the rule it enforces.
        if (/publicRecordsWithheld/.test(sourceWithoutComments(full))) offenders.push(full)
      }
    }
  }
  for (const r of roots) walk(r)
  assert.deepEqual(offenders, [], `withheld records reachable from page code: ${offenders.join(', ')}`)
})


/**
 * THE 2015 SAFETY AUDIT IS NOT A PUBLISHABLE CREDENTIAL, AND THE REASON IS
 * REGULATORY RATHER THAN ARCHIVAL
 * ────────────────────────────────────────────────────────────────────────
 * 49 CFR 385.319: a safety audit produces no safety fitness determination, and
 * the result reaches the carrier as written notice rather than a public field.
 * SAFER showing "Rating: None" is therefore expected and says nothing either
 * way.
 *
 * The owner's account — a trooper reviewed the findings on site and approved
 * the company — matches 385.319(a) exactly. It is still a recollection of
 * something said aloud, and "we passed our FMCSA safety audit" needs the
 * letter. This test keeps that distinction from eroding.
 */
test('the 2015 safety audit stays unpublished until the notice is in hand', () => {
  assert.equal(SAFETY_AUDIT_2015.resultInArchive, false)
  assert.equal(SAFETY_AUDIT_2015.publiclyRetrievable, false)
  assert.match(SAFETY_AUDIT_2015.whyNotPublic, /385\.319/)
  assert.ok(SAFETY_AUDIT_2015.publicSystemsChecked.length >= 4)

  // The on-site approval is owner-stated and must never be graded as the result.
  assert.equal(SAFETY_AUDIT_2015.onSiteReview.publishable, false)
  assert.match(SAFETY_AUDIT_2015.onSiteReview.basis, /owner-stated/)
  assert.match(SAFETY_AUDIT_2015.handedToDmv.basis, /owner-stated/)
  // The DMV date sequence is suggestive, and the caution against reading it as
  // proof is part of the record rather than left to the next reader.
  assert.ok(SAFETY_AUDIT_2015.handedToDmv.caution)

  // It is not a record in the publishable module under any id.
  assert.equal(PUBLIC_RECORDS.some((r) => /audit/i.test(r.kind)), false)

  // The mailbox sweep is a result in its own right: a negative that stops the
  // next reader spending an hour re-running it.
  assert.equal(SAFETY_AUDIT_2015.mailboxSwept.found, false)
  assert.equal(SAFETY_AUDIT_2015.mailboxSwept.coveredTrashAndSpam, true)
  assert.ok(SAFETY_AUDIT_2015.mailboxSwept.nextMailbox)
})

/**
 * The MCS-150 fleet figure was flagged as possibly stale and is not: the owner
 * sold trucks during the pandemic and runs one dump truck. The correction is
 * pinned so the earlier advice cannot be acted on by a later reader.
 */
test('the MCS-150 fleet figure is recorded as current, not stale', () => {
  assert.equal(USDOT_UNPUBLISHED.fleetFigureIsCurrent, true)
  assert.equal(USDOT_UNPUBLISHED.powerUnits, 1)
  assert.match(USDOT_UNPUBLISHED.fleetFigureBasis, /owner-stated/)
  assert.equal('ownerShouldReview' in USDOT_UNPUBLISHED, false, 'the retracted MCS-150 advice is still present')
})


/**
 * MARKETING A LOCATION IS NOT CLAIMING A CREDENTIAL IN IT
 * ──────────────────────────────────────────────────────
 * The owner's policy is to obtain licences per market when work is secured
 * there rather than carry them speculatively. That is ordinary contracting
 * practice and it means the sites market many markets in which no licence is
 * currently held — so no page may state or imply one.
 *
 * The first pass at this test checked two files for one exact casing and
 * passed while ten claims sat elsewhere, including a hasCredential node in the
 * JSON-LD. It now sweeps every page and component.
 */
test('no page or component claims a contractor licence', () => {
  const roots = ['src/pages', 'src/components']
  const offenders = []
  const claim = /class\s+a\s+(contractor\s+)?licen[cs]e|fully licensed|licensed and insured|licensed in virginia|nascla/i
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (/\.jsx?$/.test(e.name)) {
        // Comments explain the rule and must not trip it. Same trap, sixth time.
        const src = sourceWithoutComments(full)
        if (claim.test(src)) offenders.push(full)
      }
    }
  }
  for (const r of roots) walk(r)
  // Generated blog prose is a separate register — advice about vetting a
  // contractor's licensing is not a claim about ours — and is tracked in
  // LICENSING_POLICY.stillToReview rather than silently exempted.
  const unexpected = offenders.filter((f) => !f.includes('generated-blogs'))
  assert.deepEqual(unexpected, [], `licence claims still on pages: ${unexpected.join(', ')}`)
})

/** The JSON-LD must not assert the credential its own canonical file forbids. */
test('the structured data carries no contractor credential', () => {
  const src = sourceWithoutComments('src/lib/schemas.js')
  assert.equal(/hasCredential/.test(src), false, 'schemas.js emits a credential node again')
  assert.equal(/Class A/i.test(src), false)
})

/** The policy and the sweep are recorded together, so neither drifts alone. */
test('the licensing policy is on the record with what it removed', () => {
  assert.match(LICENSING_POLICY.basis, /owner-stated/)
  assert.match(LICENSING_POLICY.siteRule, /may not state or imply a licence/i)
  assert.ok(LICENSING_POLICY.claimsRemoved.length >= 9)
  assert.ok(LICENSING_POLICY.insuranceUnaffected, 'insurance is a separate claim and must stay distinguished')
  // NASCLA came off with the rest and is chaseable, not discarded.
  const n = withheldById('nascla-accredited-exam')
  assert.equal(n.status, UNCONFIRMED)
  assert.equal(n.removedFromSite, '2026-08-26')
  assert.match(n.resolvedBy, /registry|score report/i)
})


/**
 * THE ILLINOIS BOND IS THE STRONGEST DOCUMENT IN THE RECORD, AND THE EASIEST
 * TO OVERSTATE
 * ────────────────────────────────────────────────────────────────────────
 * Every other published row rests on correspondence describing a thing. This
 * one is the instrument: a bond number, a named surety executing under seal, a
 * named municipal obligee, a penal sum and an effective date, read directly.
 *
 * Which is exactly why it needs guarding. It is a MUNICIPAL licence, it is
 * dated 2016, and the bond is "continuous" — no expiry on its face — so the
 * page must not slide into the present tense or into sounding like a state
 * credential. That would rebuild, in one row, the problem this session spent
 * ten commits removing.
 */
test('the Illinois bond stays a dated municipal fact', () => {
  const b = recordById('illinois-municipal-licences-2016')
  assert.equal(b.status, VERIFIABLE)
  // Three bonds read from the instruments, each with an obligee and a number.
  assert.equal(b.bonds.length, 3)
  for (const x of b.bonds) {
    assert.match(x.number, /^LSM\d+$/)
    assert.ok(x.obligee && x.effective && x.penalSum === 10000)
  }
  // The fourth bond is invoiced but unnamed. Its number lives in the withheld
  // module, never in this one: publicRecords.js ships to the browser, and the
  // first build after it was added put LSM0900110 straight into the bundle.
  assert.equal('fourthBondUnidentified' in b, false)
  assert.doesNotMatch(JSON.stringify(b), /LSM0900110/)
  assert.doesNotMatch(b.plain, /four/i)
  assert.equal(b.state, 'IL')
  assert.equal(b.year, 2016)

  const rendered = [b.plain, b.whyItMatters, b.howToCheck, b.headline].join(' ')
  // The year must be visible on the page, so no reader mistakes it for current.
  assert.match(rendered, /2016/)
  // And it must never read as a state licence.
  assert.doesNotMatch(rendered, /state licen[cs]e|state.licensed|Illinois state/i)
  assert.doesNotMatch(rendered, /Class A/i)
  // The former company address on the instrument stays off the page.
  assert.equal(b.addressWithheld, true)
  assert.doesNotMatch(rendered, /Evelake|\d{4}\s+\w+\s+Road/i)

  // It belongs to the J. Worden brand, not Carolina.
  assert.ok(publishableFor(BRAND_JWORDEN).some((r) => r.id === b.id))
  assert.equal(publishableFor(BRAND_CAROLINA).some((r) => r.id === b.id), false)
})


/** The fourth bond is chaseable, unnamed, and off the public bundle. */
test('the fourth Illinois bond stays out of the published module', () => {
  assert.equal(FOURTH_ILLINOIS_BOND.number, 'LSM0900110')
  assert.equal(FOURTH_ILLINOIS_BOND.obligee, null)
  assert.equal(FOURTH_ILLINOIS_BOND.publishable, false)
  assert.match(FOURTH_ILLINOIS_BOND.resolvedBy, /surety|Contractors Bonding/i)
  // The inference is labelled as an inference.
  assert.match(FOURTH_ILLINOIS_BOND.likelyObligee, /not evidence/i)
  // And the chase is recorded so nobody repeats it.
  assert.ok(FOURTH_ILLINOIS_BOND.faxChased)
  assert.ok(FOURTH_ILLINOIS_BOND.mailboxSearched)
  assert.equal(recordById('illinois-municipal-licences-2016').bonds.length, 3)
})

/**
 * A DOCUMENT FOR A LAPSED THING IS STILL A LAPSED THING
 * ────────────────────────────────────────────────────
 * A Georgia Secretary of State confirmation turned up for the 2018 annual
 * registration. Georgia registration is annual, so it evidences 2018 and
 * nothing later, and the owner confirms it was never renewed. The temptation a
 * new document creates is to promote the record because there is finally paper
 * behind it — which is the Virginia SCC tense error run in reverse.
 */
test('the Georgia 2018 registration cannot be published as current', async () => {
  const { GEORGIA_REGISTRATION_2018 } = await import('../../src/data/publicRecordsWithheld.js')
  // LAPSED is defined in publicRecords.js; the withheld module consumes it.
  const { LAPSED } = await import('../../src/data/publicRecords.js')
  assert.equal(GEORGIA_REGISTRATION_2018.isCurrent, false)
  assert.equal(GEORGIA_REGISTRATION_2018.publishable, false)
  assert.equal(GEORGIA_REGISTRATION_2018.status, LAPSED)
  assert.match(GEORGIA_REGISTRATION_2018.whyNotCurrent, /annual/i)

  const { PUBLIC_RECORDS } = await import('../../src/data/publicRecords.js')
  assert.equal(
    PUBLIC_RECORDS.some((r) => /georgia secretary/i.test(r.authority || '')),
    false,
    'the Georgia registration reached the published record',
  )
})

/**
 * Illinois looked like unexplained paperwork in a state with no other entry.
 * The covering email that delivered the Oak Forest bond is titled "Kfc bond",
 * which places it inside the national restaurant programme.
 */
test('the Illinois licences say what the work was', async () => {
  const { recordById } = await import('../../src/data/publicRecords.js')
  const il = recordById('illinois-municipal-licences-2016')
  assert.match(il.programme, /KFC/)
  assert.ok(il.programmeSourceVerified)
})

/** Roles are recorded to navigate the archive; addresses are not. */
test('record custody names roles without carrying personal addresses', async () => {
  const { RECORD_CUSTODY } = await import('../../src/data/publicRecordsWithheld.js')
  assert.equal(RECORD_CUSTODY.addressesWithheld, true)
  assert.match(RECORD_CUSTODY.officeManager.whyItMatters, /Jefferson City/)
  const raw = readFileSync('src/data/publicRecordsWithheld.js', 'utf8')
  assert.equal(/@yahoo\.com/i.test(raw), false, 'a personal mailbox address was copied in')
  assert.equal(/wordenpaving@gmail/i.test(raw), false, 'a personal mailbox address was copied in')
})
