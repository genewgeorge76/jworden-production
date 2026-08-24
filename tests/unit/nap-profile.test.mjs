/**
 * The NAP profile — Name, Address, Phone, and why a wrong one costs rankings.
 *
 * WHAT WENT WRONG
 * ───────────────
 * src/data/napProfile.json was hand-maintained beside src/lib/businessInfo.
 * canonical.js, and every field in it had drifted into fiction:
 *
 *   street    "123 Paving Way"        not an address
 *   phone     "+1-804-555-0199"       the 555 range is reserved for fiction
 *   founded   "since 1999"            the company was founded in 1984
 *   postcode  "23831"                 Chester VA, but the wrong one
 *
 * The canonical file was kept current — its address carries a "verified
 * 2026-05-10" note. This one was not, because nothing forced them to agree.
 *
 * WHY IT MATTERED MORE THAN A TYPO
 * ────────────────────────────────
 * NAP's entire value to local ranking is CONSISTENCY. Google resolves a
 * business entity by seeing the same three facts agree across the site, the
 * Business Profile and every directory. A citation that disagrees does not
 * count for nothing — it counts against, because it is evidence the engine
 * cannot tell which business this is. The site was supplying a conflicting
 * citation about its own company, in schema.org markup, from the most
 * authoritative source Google has for it.
 *
 * So these tests do two things: assert the generated file matches canonical,
 * and refuse any value that looks like it was never filled in.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const NAP = JSON.parse(readFileSync(new URL('../../src/data/napProfile.json', import.meta.url), 'utf8'))
const C = await import('../../src/lib/businessInfo.canonical.js')

/**
 * Values that mean "nobody filled this in".
 *
 * 555-01xx is the range reserved for fiction, which is exactly why it ends up
 * in placeholder data and exactly why it must never ship. The sequential
 * digit runs are what a person types when inventing a bank account.
 */
const PLACEHOLDER = [
  /\b555-?01\d\d\b/,
  /\b123 [A-Z][a-z]+ (Way|St|Street|Rd|Road|Ave|Avenue)\b/i,
  /\b(123456789|987654321|000000000|1234567890)\b/,
  /\b(your company|example\.com|placeholder|lorem ipsum|tbd)\b/i,
]

test('the NAP profile contains no placeholder values', () => {
  const flat = JSON.stringify(NAP)
  for (const pattern of PLACEHOLDER) {
    assert.equal(pattern.test(flat), false, `placeholder still in napProfile.json: ${flat.match(pattern)?.[0]}`)
  }
})

test('the address matches the canonical record, field for field', () => {
  assert.equal(NAP.address.street, C.ADDRESS.streetAddress)
  assert.equal(NAP.address.city, C.ADDRESS.addressLocality)
  assert.equal(NAP.address.state, C.ADDRESS.addressRegion)
  assert.equal(NAP.address.zipCode, C.ADDRESS.postalCode)
})

test('the phone matches the canonical record and is the current number', () => {
  assert.equal(NAP.phone, C.PHONE_SCHEMA)
  // 804-822-7715 was retired years ago and must not reappear in a citation.
  assert.ok(!JSON.stringify(NAP).includes('822-7715'), 'the retired number is back in the NAP')
})

test('the phone is in the form directories expect', () => {
  assert.match(NAP.phone, /^\+1-\d{3}-\d{3}-\d{4}$/)
})

test('the founding year is 1984, not the placeholder 1999', () => {
  assert.equal(NAP.foundingYear, C.BUSINESS_FOUNDING_YEAR)
  assert.equal(NAP.foundingYear, '1984')
  assert.ok(!/since 1999/i.test(NAP.description))
})

test('the name and website match canonical', () => {
  assert.equal(NAP.businessName, C.BUSINESS_NAME)
  assert.equal(NAP.website, C.SITE_URL)
})

test('hours match canonical, including the Saturday open', () => {
  // The hand-written file said Saturday opened at 08:00. Canonical, verified
  // on site, says 07:00. An hour's disagreement is still a disagreement.
  assert.equal(NAP.hours.Saturday, '07:00-14:00')
  assert.equal(NAP.hours.Sunday, 'Closed')
  assert.equal(NAP.hours.Monday, '07:00-18:00')
})

test('the file says it is generated, so nobody hand-edits it back into drift', () => {
  assert.match(NAP._generated, /build-nap-profile\.mjs/)
  assert.match(NAP._generated, /businessInfo\.canonical\.js/)
})

test('coordinates are present and are in Virginia', () => {
  assert.equal(NAP.geo.latitude, C.GEO.latitude)
  assert.equal(NAP.geo.longitude, C.GEO.longitude)
  assert.ok(NAP.geo.latitude > 36.5 && NAP.geo.latitude < 39.5, 'latitude is not in Virginia')
  assert.ok(NAP.geo.longitude < -75 && NAP.geo.longitude > -84, 'longitude is not in Virginia')
})
