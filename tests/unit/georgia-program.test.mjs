/**
 * The Georgia programme, and the line between what is stated and what is proven.
 *
 * "100+ KFC locations paved across Georgia" is the OWNER'S statement, given
 * directly when asked. The Big Chicken's facts — 56 feet, 1963, KFC since 1974,
 * $2m renovation in 2017 — are PUBLIC RECORD, checkable against Wikipedia, the
 * AJC and Explore Georgia.
 *
 * Those two kinds of claim must not be blended into each other. A reader who
 * checks the landmark facts and finds them exact should not then discover that
 * a number beside them was softer. This file asserts they stay in separate
 * fields.
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const {
  BIG_CHICKEN, bigChickenSchema, GA_EXPERIENCE_LINE, GA_QSR_COUNT_STATED,
} = await import(path.join(ROOT, 'src/data/georgiaProgram.js'))

const ATLANTA = path.join(ROOT, 'atlanta-paving')

test('the landmark carries real coordinates and a checkable address', () => {
  assert.equal(BIG_CHICKEN.address, '12 Cobb Pkwy N')
  assert.equal(BIG_CHICKEN.city, 'Marietta')
  assert.equal(BIG_CHICKEN.state, 'GA')
  // Marietta sits near 33.95, -84.55. A coordinate outside Georgia would put
  // the landmark schema on the wrong side of the country.
  assert.ok(BIG_CHICKEN.latitude > 33 && BIG_CHICKEN.latitude < 35, 'latitude not in Georgia')
  assert.ok(BIG_CHICKEN.longitude < -84 && BIG_CHICKEN.longitude > -85, 'longitude not in Georgia')
  assert.ok(BIG_CHICKEN.sources.length >= 3, 'a landmark claim needs public sources')
})

test('public structure facts and the owner claim live in separate fields', () => {
  const facts = BIG_CHICKEN.structureFacts.join(' ')
  // Structure facts describe the STRUCTURE, not this company's work.
  assert.ok(!/we |our |paved by/i.test(facts),
    'a work claim leaked into the public-record facts')
  assert.match(BIG_CHICKEN.ourWork, /this company has paved/i)
})

test('the schema resolves to a real Place a search engine can match', () => {
  const s = bigChickenSchema()
  assert.equal(s['@type'], 'LandmarksOrHistoricalBuildings')
  assert.equal(s.geo['@type'], 'GeoCoordinates')
  assert.ok(s.sameAs.some((u) => u.includes('wikipedia.org')))
  assert.equal(s.address.addressRegion, 'GA')
})

test('the experience line separates trade years from Georgia work', () => {
  // The bug: 25 pages said "40+ years of GEORGIA paving experience". The
  // company has traded since 1984, but not all of it in Georgia.
  assert.ok(!/years of Georgia paving experience/i.test(GA_EXPERIENCE_LINE))
  assert.match(GA_EXPERIENCE_LINE, /40\+ years in the trade/)
  assert.match(GA_EXPERIENCE_LINE, /100\+ KFC locations paved across Georgia/)
  assert.equal(GA_QSR_COUNT_STATED, '100+')
})

test('no city page still claims 40+ years of Georgia experience', () => {
  if (!fs.existsSync(ATLANTA)) return
  const offenders = []
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.name.endsWith('.html')) {
        const t = fs.readFileSync(full, 'utf-8')
        if (/years of Georgia paving experience/i.test(t)) {
          offenders.push(path.relative(ROOT, full))
        }
      }
    }
  }
  walk(ATLANTA)
  assert.deepEqual(offenders, [], `still claiming Georgia-specific years:\n${offenders.join('\n')}`)
})

test('every Atlanta page carries the Georgia number, never another market\'s', () => {
  if (!fs.existsSync(ATLANTA)) return
  const wrong = []
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.name.endsWith('.html')) {
        const t = fs.readFileSync(full, 'utf-8').replace(/\D/g, '')
        // 843 is South Carolina, 804 is Virginia. Neither belongs here.
        if (t.includes('8436108935') || t.includes('8048227715')) {
          wrong.push(path.relative(ROOT, full))
        }
      }
    }
  }
  walk(ATLANTA)
  assert.deepEqual(wrong, [], `out-of-market number on Georgia pages:\n${wrong.join('\n')}`)
})

test('the Big Chicken page is built and names the landmark', () => {
  const f = path.join(ATLANTA, 'the-big-chicken/index.html')
  if (!fs.existsSync(f)) return
  const h = fs.readFileSync(f, 'utf-8')
  assert.ok(h.includes('LandmarksOrHistoricalBuildings'))
  assert.ok(h.includes('12 Cobb Pkwy N'))
  assert.ok(h.includes('470-485-7715'))
  assert.ok(!h.includes('843-610-8935'), 'the SC number reached a Georgia page')
})
