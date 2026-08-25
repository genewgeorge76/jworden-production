import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { SCOPE_CLAIMS, RECONCILED_TEMPLATE, PUBLISHABLE, KBP_CONTACT } from '../../src/data/programScope.js'
import { STATE_EVIDENCE, PUBLISHABLE as EVIDENCE_PUBLISHABLE } from '../../src/data/stateEvidence.js'

test('the whole file is marked unpublishable', () => {
  assert.equal(PUBLISHABLE, false)
  for (const c of SCOPE_CLAIMS) {
    assert.equal(c.basis, 'owner-stated', `${c.market} claims a basis it does not have`)
  }
})

/**
 * The load-bearing one. A scope claim sitting beside a grade is exactly the
 * adjacency that tempts someone to reconcile them. The grades must not move
 * because the owner said a number.
 */
test('no scope claim has moved the grade of the state it covers', () => {
  const before = { KS: 'work', MO: 'work', IA: 'surveyed', MI: 'work' }
  for (const [code, grade] of Object.entries(before)) {
    assert.equal(
      STATE_EVIDENCE[code].grade,
      grade,
      `${code} changed grade — check whether a document justified it or an assertion did`,
    )
  }
  // Iowa is the specific risk: an owner saying "4 built" against a bid-list grade.
  assert.equal(EVIDENCE_PUBLISHABLE.has(STATE_EVIDENCE.IA.grade), false)
})

test('every claim states both sides of the gap', () => {
  for (const c of SCOPE_CLAIMS) {
    assert.ok(c.claim, `${c.market} has no owner claim`)
    assert.ok(c.documented, `${c.market} has no documented count, so there is no gap to see`)
    assert.ok(c.states.length > 0)
  }
})

test('Iowa is flagged as the cheapest win and is genuinely at the floor', () => {
  const iowa = SCOPE_CLAIMS.find((c) => c.states.includes('IA'))
  assert.ok(iowa.cheapestWin, 'the cheapest evidence win lost its flag')
  // The claim rests on Iowa being at the bottom grade. If it ever is not, the
  // "two full grades" reasoning is stale and needs rewriting rather than rotting.
  assert.equal(STATE_EVIDENCE.IA.grade, 'surveyed')
})

test('the Texas template keeps its reconciliation source', () => {
  assert.equal(RECONCILED_TEMPLATE.toTheCent, true)
  assert.match(RECONCILED_TEMPLATE.reconciledAgainst, /client/i)
  assert.ok(RECONCILED_TEMPLATE.lesson.length > 0)
})

test('scope claims are not reachable from anything publishable', () => {
  const roots = ['src/components', 'src/app', 'src/lib', 'src/pages']
  const seen = []
  const walk = (d) => {
    let entries
    try {
      entries = readdirSync(d, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      const full = join(d, e.name)
      if (e.isDirectory()) walk(full)
      else if (/\.(jsx?|tsx?|mjs)$/.test(e.name) && readFileSync(full, 'utf8').includes('programScope')) {
        seen.push(full)
      }
    }
  }
  roots.forEach(walk)
  assert.deepEqual(seen, [], `owner-stated scope is reachable from ${seen.join(', ')}`)
})

test('a documented figure known to be partial says so', () => {
  // $8,777.50 does not buy all the concrete and asphalt on a multibrand
  // remodel. Recording that stops the figure being quoted as the job's total.
  const op = SCOPE_CLAIMS.find((c) => c.market.includes('Overland Park'))
  assert.ok(op, 'the Overland Park entry is gone')
  assert.equal(op.documentedFigureLikelyPartial, true)
  assert.match(op.documented, /8,777\.50/)
})

test('Florida scope does not disturb the Florida grade', () => {
  // The owner says "a lot of KFCs". The grade still needs a completion
  // document, and ownedProperties.js holds the candidate — unverified.
  const fl = SCOPE_CLAIMS.find((c) => c.states.includes('FL'))
  assert.ok(fl)
  assert.equal(STATE_EVIDENCE.FL.grade, 'pipeline')
  assert.equal(EVIDENCE_PUBLISHABLE.has(STATE_EVIDENCE.FL.grade), false)
})

test('the KBP contact is a route, and his address is not stored', () => {
  // A live person's work email. It is in the owner's mailbox and does not
  // need to be in a repository — the same rule that removed a stranger's
  // address from ownedProperties.js.
  assert.equal(KBP_CONTACT.addressRecordedHere, false)
  const text = readFileSync('src/data/programScope.js', 'utf8')
  assert.equal(/@kbp-foods/.test(text), false, 'a third party work address was committed')
  assert.ok(KBP_CONTACT.ask, 'a contact with no request to make of him')
})

test('the corroborating threads keep what they corroborate', () => {
  const bearing = KBP_CONTACT.threadsSeen.filter((t) => t.bearsOn)
  assert.ok(bearing.length >= 3, 'the threads that tie to recorded claims lost their links')
  const subjects = KBP_CONTACT.threadsSeen.map((t) => t.subject).join(' ')
  assert.match(subjects, /119th/, 'the Overland Park thread is the tie to G135020')
  assert.match(subjects, /Kentaco/, 'the multibrand corroboration must survive')
})

test('the Overland Park figure stays flagged partial, now for two reasons', () => {
  const op = SCOPE_CLAIMS.find((c) => c.market.includes('Overland Park'))
  assert.equal(op.documentedFigureLikelyPartial, true)
  const conduit = KBP_CONTACT.threadsSeen.find((t) => /119th/.test(t.subject))
  assert.ok(conduit, 'the conduit thread is the second independent reason')
  assert.ok(conduit.attachments > 0, 'the photographs on it are the point')
})
