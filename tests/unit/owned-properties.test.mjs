import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

const flModule = await import('../../src/data/stateEvidence.js')
const require_fl = () => flModule

import {
  OWNED_PROPERTIES,
  IDENTITY_CONFLICTS,
  SUSPENDED_PROFILE_LEAD,
  NEWLY_FOUND_MAILBOX,
  CUSTOMER_REVIEWS,
  DOMAIN_LOSSES,
  RECOVERED_DOMAINS,
  PROFILE_EVIDENCE_AT_RISK,
} from '../../src/data/ownedProperties.js'

test('every conflict names a resolution the owner can act on', () => {
  assert.ok(IDENTITY_CONFLICTS.length > 0)
  for (const c of IDENTITY_CONFLICTS) {
    assert.ok(c.values.length >= 1, `${c.id} states a conflict without its values`)
    assert.ok(c.why, `${c.id} does not say why it matters`)
    assert.ok(c.resolution, `${c.id} is a complaint rather than a finding`)
    // Ordered worst-first. 'critical' means it is costing something today,
    // not merely that it is wrong.
    assert.ok(['critical', 'high', 'medium', 'low'].includes(c.severity), `${c.id} has an unrecognised severity`)
  }
})

/**
 * The load-bearing one. The generation conflict must stay open until the owner
 * settles it — a repository that silently picks one has invented a family
 * history, which is the exact failure mode everything else here guards.
 */
test('the generation conflict is recorded, not silently resolved', () => {
  const gen = IDENTITY_CONFLICTS.find((c) => c.conflict === 'Generation count')
  assert.ok(gen, 'the generation conflict was dropped')
  assert.equal(gen.values.length, 2, 'one side of the conflict was deleted')
  assert.match(gen.resolution, /owner/i, 'the repository decided a fact only the owner knows')
})

test('no property claims a market tenure the record does not support', () => {
  // IC-002 exists precisely because one does. This asserts it stays flagged
  // until the copy is fixed, rather than the flag quietly disappearing.
  const atlanta = OWNED_PROPERTIES.find((p) => p.domain === 'atlantapavingandsealing.com')
  assert.ok(atlanta)
  const flagged = IDENTITY_CONFLICTS.some((c) => c.values.join(' ').includes(atlanta.domain))
  assert.equal(flagged, true, 'the Atlanta tenure claim lost its flag while still live')
})

test('the suspended profile is treated as a lead with a route', () => {
  assert.equal(SUSPENDED_PROFILE_LEAD.status, 'suspended')
  assert.ok(SUSPENDED_PROFILE_LEAD.route)
  assert.ok(
    SUSPENDED_PROFILE_LEAD.relatedTo.length > 0,
    'the suspended profile is not connected to the work it could evidence',
  )
})

/**
 * The correction guard. A third party's site was recorded here as this
 * company's before the owner said otherwise, and two of its details — a
 * generation claim and a contact mailbox — reached the register with it.
 * Nothing from that site may come back.
 */
test('nothing from the lost domain is cited as this company', () => {
  const text = readFileSync('src/data/ownedProperties.js', 'utf8')
  assert.equal(NEWLY_FOUND_MAILBOX, null, 'a stranger\'s mailbox was reinstated')
  assert.equal(/floridapavingco/.test(text), false, 'a third party\'s contact address is back in the register')
  assert.equal(/941-888-4245/.test(text), false, 'a third party\'s phone number is back in the register')

  const gen = IDENTITY_CONFLICTS.find((c) => c.id === 'IC-006')
  assert.equal(
    gen.values.some((v) => /five generations/i.test(v)),
    false,
    'a claim from a site this company does not own is being counted against it',
  )
  assert.ok(gen.corrected, 'the removal happened without a note saying why')
})

test('every lost domain records whether someone else now holds it', () => {
  assert.ok(DOMAIN_LOSSES.length > 0)
  for (const d of DOMAIN_LOSSES) {
    assert.ok(d.domain && d.lostTo, `${d.domain} is missing how it was lost`)
    assert.ok('nowOperatedBy' in d, `${d.domain} does not say whether it was taken`)
  }
  // Anything verified as still ours must not also be listed as taken.
  for (const r of RECOVERED_DOMAINS) {
    const taken = DOMAIN_LOSSES.find((d) => d.domain === r && d.nowOperatedBy)
    assert.equal(taken, undefined, `${r} is both recovered and recorded as taken`)
  }
})

test('the register carries no customer names or personal contact details', () => {
  const text = readFileSync('src/data/ownedProperties.js', 'utf8')
  // Business contact addresses published by the business itself are fine; a
  // named private customer is not. IC-004 describes the testimonial without
  // repeating the name.
  assert.equal(/Jim Johnson/.test(text), false, 'a testimonial name was copied into the register')
})

/**
 * The reviews are the best evidence in the project and the least verified.
 * These guard both halves of that sentence.
 */
test('relayed reviews are marked unverified until read at the source', () => {
  for (const r of CUSTOMER_REVIEWS) {
    assert.equal(r.thirdParty, true)
    assert.equal(
      r.verifiedAtSource,
      false,
      'a review was marked verified without anyone reading it at its source',
    )
  }
})

test('an unverified review has not been used to regrade a state', () => {
  // Florida stays pipeline until the review is read at the source. If this
  // ever fails, evidence relayed in conversation was promoted to a grade.
  const { STATE_EVIDENCE, PUBLISHABLE } = require_fl()
  assert.equal(STATE_EVIDENCE.FL.grade, 'pipeline')
  assert.equal(PUBLISHABLE.has(STATE_EVIDENCE.FL.grade), false)
})

test('the phone mismatch is carried as the most severe finding', () => {
  const nap = IDENTITY_CONFLICTS.find((c) => c.id === 'IC-005')
  assert.ok(nap, 'the profile/website phone mismatch was dropped')
  assert.equal(nap.severity, 'critical')
  assert.equal(nap.values.length, 2, 'a mismatch needs both numbers to stay legible')
})

test('evidence held only on a third-party platform is flagged as at risk', () => {
  const risk = PROFILE_EVIDENCE_AT_RISK
  assert.equal(risk.backedUp, false, 'if this is now true, the flag should be removed rather than flipped')
  assert.ok(risk.precedent, 'no reason given for treating the platform as unsafe')
  assert.ok(risk.holds.length > 0)
  // The precedent must reference a real loss, not a hypothetical one.
  assert.match(risk.precedent, /suspend/i)
})

test('the profile website field is recorded as unread, not assumed', () => {
  const mf = OWNED_PROPERTIES.find((p) => p.profile?.name === 'Mid Florida Asphalt Paving')
  assert.ok(mf, 'the mid-Florida profile entry is gone')
  assert.match(mf.profile.linkedWebsite, /unknown|unread/i, 'the website field was guessed at')
})
