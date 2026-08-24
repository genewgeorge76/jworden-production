/**
 * Per-state evidence, and the four grades that must never blur.
 *
 * trackRecord.js derives 18 states from one column of the Kickserv export. That
 * derivation stands, but a two-letter code cannot say WHAT was done in Ohio.
 * This file answers that from a second, independent source — the KBP email
 * archive — and grades each state by what the documents actually show.
 *
 * THE FAILURE THIS PREVENTS
 * Alabama appears in the archive exactly once: a licence application in
 * progress. A licence is permission to work, not work. Counting it as a market
 * served would be the fabricated store database again, assembled out of true
 * rows. Same for Tennessee (a permit) and Florida (permitting, explicitly NOT
 * complete).
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const { STATE_EVIDENCE, statesWithWork, statesByGrade, evidenceFor, PUBLISHABLE } =
  await import(path.join(ROOT, 'src/data/stateEvidence.js'))
const { COMMERCIAL_STATES } = await import(path.join(ROOT, 'src/data/trackRecord.js'))

test('only documented work is publishable', () => {
  assert.deepEqual([...PUBLISHABLE], ['work'])
  for (const s of statesWithWork()) {
    assert.equal(STATE_EVIDENCE[s].grade, 'work')
  }
})

test('a licence is never counted as a market served', () => {
  // Alabama: "How are we looking in Alabama and Florida on license
  // applications?" and nothing else in the archive.
  assert.equal(evidenceFor('AL').grade, 'licensing')
  assert.ok(!statesWithWork().includes('AL'))
  assert.match(evidenceFor('AL').detail, /licence application/i)
})

test('permitting is never counted as completed', () => {
  // Coral Springs was explicitly still awaiting city review.
  for (const s of ['FL', 'OH', 'TN']) {
    assert.equal(evidenceFor(s).grade, 'pipeline', `${s} should be pipeline`)
    assert.ok(!statesWithWork().includes(s))
  }
  assert.match(evidenceFor('FL').detail, /NOT complete/)
})

test('appearing in the 2015 bid survey proves nothing', () => {
  // 246 of the survey's 262 rows read "Not Started".
  for (const s of statesByGrade('surveyed')) {
    assert.ok(!statesWithWork().includes(s), `${s} is survey-only`)
    assert.match(evidenceFor(s).detail, /survey|Midwest market/i)
  }
})

test('every state with work names the documents behind it', () => {
  for (const s of statesWithWork()) {
    const e = STATE_EVIDENCE[s]
    assert.ok(e.sources.length > 0, `${s} cites no source`)
    assert.ok(e.detail.length > 60, `${s} detail is too thin to check`)
  }
})

test('nothing is claimed that the job book does not also carry', () => {
  // The two sources were never reconciled at the time, so agreement between
  // them is real corroboration. Anything in this file but NOT in the job book
  // would be a claim resting on one source while implying two.
  for (const s of Object.keys(STATE_EVIDENCE)) {
    assert.ok(COMMERCIAL_STATES.includes(s),
      `${s} is not in the Kickserv-derived state list`)
  }
})

test('South Carolina is work, and its absence from the KBP archive is explained', () => {
  // SC ran under Carolina Blacktop for other clients, so it was never going to
  // appear in a KFC franchise programme's mail.
  const sc = evidenceFor('SC')
  assert.equal(sc.grade, 'work')
  assert.ok(sc.grade_note, 'the one-source case must say so')
  assert.ok(!sc.sources.includes('kbp-2015-survey'))
})
