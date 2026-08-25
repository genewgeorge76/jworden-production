import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { CAROLINA_FOOTPRINT, PUBLISHABLE_BASES } from '../../src/data/carolinaBlacktopRecord.js'
import {
  UNRECOVERED_WORK,
  LOST_MAILBOX,
  UNREAD_DOCUMENTS,
  CROSSOVER,
  OPEN_LEADS,
} from '../../src/data/unrecoveredWork.js'

test('every entry declares itself owner-stated and nothing stronger', () => {
  assert.ok(UNRECOVERED_WORK.length > 0)
  for (const job of UNRECOVERED_WORK) {
    assert.equal(job.basis, 'owner-stated', `${job.id} claims a basis it does not have`)
    assert.ok(job.recovery, `${job.id} has no recovery route, so recording it is pointless`)
  }
})

test('no entry carries a dollar figure or a job count', () => {
  // The owner said invoices exist. He did not say how many or for how much,
  // and the difference between those two things is the whole discipline here.
  const blob = JSON.stringify(UNRECOVERED_WORK)
  assert.equal(/\$\s?[\d,]/.test(blob), false, 'a dollar figure appeared in unevidenced work')
  assert.equal(/\b\d+\s+(jobs?|invoices?|sites?)\b/i.test(blob), false, 'a count appeared in unevidenced work')
})

test('the unread document is not counted in either direction', () => {
  for (const doc of UNREAD_DOCUMENTS) {
    assert.equal(doc.direction, 'unknown')
    assert.equal('amount' in doc, false, 'an unopened document was given an amount')
  }
})

test('the confirmed mailbox cites what confirmed it', () => {
  assert.equal(LOST_MAILBOX.address, 'savannahpaving@gmail.com')
  assert.equal(LOST_MAILBOX.confirmed, true)
  assert.ok(LOST_MAILBOX.confirmedBy, 'an address was asserted without saying what confirmed it')
  assert.ok(LOST_MAILBOX.ruledOut.includes('savannahpavingandsealing@gmail.com'), 'the ruled-out candidate was dropped rather than recorded')
  assert.ok(OPEN_LEADS.length > 0)
})

test('the crossover finding names mailboxes still unswept', () => {
  assert.equal(CROSSOVER.proven, true)
  assert.ok(CROSSOVER.unsearchedMailboxes.length > 0, 'the crossover is claimed with nowhere left to look')
  assert.ok(CROSSOVER.constraint, 'no note of why the other mailboxes are unswept')
  assert.equal(
    CROSSOVER.unsearchedMailboxes.includes('carolinablacktop@gmail.com'),
    false,
    'the swept mailbox is listed as unswept',
  )
})

/**
 * The load-bearing one, and it took a wrong first draft to find its real shape.
 *
 * The first version banned these town names from src/data/ outright. It failed,
 * and it deserved to: Summerville already sits in CAROLINA_FOOTPRINT graded
 * `lead` — a 2026 flex-space enquiry, a different job from the one the owner
 * described — and Tybee Island is a legitimate service-area listing on the
 * Savannah profile. Naming a town you serve is owner-stated and allowed. The
 * repo has said so since the corridor pages.
 *
 * The thing that must never happen is narrower and worse: one of these towns
 * acquiring a PUBLISHABLE basis on the strength of an account nobody can open.
 * That is the shape every fabrication in this repo has taken — a true place
 * promoted one rung past its evidence.
 */
test('no unevidenced place is graded as documented work', () => {
  const towns = UNRECOVERED_WORK.map((j) => j.place.split(',')[0].trim()).filter((t) => t !== 'South Carolina')

  for (const entry of CAROLINA_FOOTPRINT) {
    if (!towns.some((t) => entry.place.startsWith(t))) continue
    assert.equal(
      PUBLISHABLE_BASES.has(entry.basis),
      false,
      `${entry.place} is graded '${entry.basis}' but its evidence is in a mailbox nobody can open`,
    )
  }
})

test('the register never asserts a basis the footprint would publish', () => {
  for (const job of UNRECOVERED_WORK) {
    assert.equal(PUBLISHABLE_BASES.has(job.basis), false, `${job.id} borrowed a publishable basis`)
  }
})

test('nothing imports the register into page-facing code', () => {
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
      else if (/\.(jsx?|tsx?|mjs)$/.test(e.name)) {
        if (readFileSync(full, 'utf8').includes('unrecoveredWork')) seen.push(full)
      }
    }
  }
  roots.forEach(walk)
  assert.deepEqual(seen, [], `the unevidenced register is reachable from ${seen.join(', ')}`)
})
