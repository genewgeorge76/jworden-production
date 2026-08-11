/**
 * The owner approves what gets published. These tests hold that line.
 *
 * The failure this guards against has happened four times: photo-derived
 * locations reaching the public site without the owner ever agreeing to them —
 * three of his own homes, then a family visit to the Outer Banks published as
 * ten job sites with coordinates on a public map.
 *
 * The single most important property is the first test below: a denied location
 * that reappears in jobSites.json must FAIL the build. Without it, the next
 * photo re-import silently restores everything that was removed, and nobody
 * finds out until the owner reads his own website again.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { siteId, evaluate } from '../../scripts/verify-photo-approvals.mjs'

const root = process.cwd()
const approvals = JSON.parse(
  fs.readFileSync(path.join(root, 'src', 'data', 'photoApprovals.json'), 'utf8')
)
const realSites = JSON.parse(
  fs.readFileSync(path.join(root, 'src', 'data', 'jobSites.json'), 'utf8')
).sites

// The Outer Banks cluster the owner identified as a family visit.
const OBX_KILL_DEVIL_HILLS = {
  city: 'Kill Devil Hills',
  state: 'North Carolina',
  lat: 36.048974,
  lon: -75.679666,
  photo_count: 92,
  kind: 'residential',
}

test('a denied location that reappears is caught', () => {
  const { violations } = evaluate([OBX_KILL_DEVIL_HILLS], approvals)
  assert.equal(violations.length, 1)
  assert.match(violations[0].entry.reason, /family visit/i)
})

test('every denied entry is actually catchable — no dead denials', () => {
  // A denial with a malformed id would sit in the file looking protective while
  // matching nothing, which is worse than no denial at all because it reads as
  // safe. Round-trip each one through the same identity function the guard uses.
  for (const entry of approvals.denied) {
    const [lat, lon] = entry.id.split(',').map(Number)
    assert.ok(
      Number.isFinite(lat) && Number.isFinite(lon),
      `denied entry ${entry.id} (${entry.label}) is not a usable coordinate pair`
    )
    const { violations } = evaluate([{ lat, lon, city: entry.label }], approvals)
    assert.equal(violations.length, 1, `denial for ${entry.label} matches nothing`)
  }
})

test('the owner\'s homes and the Outer Banks visit are all denied', () => {
  assert.equal(approvals.denied.length, 13, 'expected 3 homes + 10 Outer Banks locations')
  const homes = approvals.denied.filter((d) => /home/i.test(d.reason))
  const obx = approvals.denied.filter((d) => /outer banks/i.test(d.reason))
  assert.equal(homes.length, 3)
  assert.equal(obx.length, 10)
})

test('none of the denied locations are in the live data right now', () => {
  const { violations } = evaluate(realSites, approvals)
  assert.deepEqual(
    violations.map((v) => v.id),
    [],
    'a denied personal location is present in jobSites.json'
  )
})

test('strict mode refuses anything the owner has not approved', () => {
  const unknown = { city: 'Somewhere', state: 'Virginia', lat: 37.1234, lon: -77.5678 }
  const { unreviewed, violations } = evaluate([unknown], approvals)
  assert.equal(violations.length, 0, 'not denied — merely unreviewed')
  assert.equal(unreviewed.length, 1, 'must be reported so strict mode can stop it')
})

test('an approved location passes', () => {
  const site = { city: 'Chester', state: 'Virginia', lat: 37.3, lon: -77.4 }
  const withApproval = { ...approvals, approved: [siteId(site)] }
  const { unreviewed, violations } = evaluate([site], withApproval)
  assert.equal(violations.length, 0)
  assert.equal(unreviewed.length, 0)
})

test('a near-miss coordinate still matches a denial', () => {
  // EXIF rounding can shift a coordinate slightly between imports. If that let a
  // denied location back in under a new id the guard would be trivially
  // defeated, so identity is deliberately coarse enough to absorb it.
  const jittered = { ...OBX_KILL_DEVIL_HILLS, lat: 36.04897, lon: -75.67966 }
  const { violations } = evaluate([jittered], approvals)
  assert.equal(violations.length, 1, 'small EXIF drift must not bypass a denial')
})

test('a site with no coordinates is surfaced, not silently published', () => {
  const { noCoords, unreviewed } = evaluate([{ city: 'Nowhere', state: 'Virginia' }], approvals)
  assert.equal(noCoords.length, 1)
  assert.equal(unreviewed.length, 0, 'unidentifiable sites are reported separately')
})
