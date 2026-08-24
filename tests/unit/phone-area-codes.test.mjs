/**
 * A brand's phone number must belong to the state it sells in.
 *
 * Two real cases this caught on 2026-08-24:
 *
 *   savannahasphaltpaving.com carried 843-610-8935 — a CHARLESTON, SOUTH
 *   CAROLINA number on a Georgia market page.
 *
 *   atlantaasphaltpavingpros.com carried the Virginia number.
 *
 * The area code is the first thing a local customer reads, and NAP consistency
 * (name, address, phone) is load-bearing for local search. A number from the
 * wrong state is a signal to both the customer and to Google that the business
 * is not really there.
 *
 * A brand with no number of its own inherits the canonical Virginia line. That
 * is allowed — it is honest, and better than an invented local presence — but
 * it is asserted explicitly here so it stays a decision rather than an
 * oversight.
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const { REGIONAL_MARKET_PROFILES: PROFILES } =
  await import(path.join(ROOT, 'src/data/regionalMarketProfiles.js'))
const { PHONE_DISPLAY } = await import(path.join(ROOT, 'src/lib/businessInfo.canonical.js'))

/** NANP area codes by state, for the states this network sells in. */
const AREA_CODES = {
  VA: ['804', '757', '703', '540', '571', '276', '434'],
  NC: ['252', '336', '704', '743', '828', '910', '919', '980', '984'],
  SC: ['803', '843', '854', '864', '839'],
  GA: ['229', '404', '470', '478', '678', '706', '762', '770', '912', '943'],
  TX: ['210', '214', '254', '281', '325', '346', '361', '409', '430', '432',
       '469', '512', '682', '713', '726', '737', '806', '817', '830', '832',
       '903', '915', '936', '940', '956', '972', '979'],
  MO: ['314', '417', '573', '636', '660', '816', '975'],
}

const CANONICAL = PHONE_DISPLAY.replace(/\D/g, '')

/** Brands that deliberately inherit the Virginia line for now. */
const INHERITS_CANONICAL = new Set(['obxpaving.com', 'texaspavementgroup.com'])

test('every brand number is either local to its market or the canonical line', () => {
  for (const [domain, profile] of Object.entries(PROFILES)) {
    const digits = String(profile.phoneDisplay || PHONE_DISPLAY).replace(/\D/g, '')
    assert.equal(digits.length, 10, `${domain}: ${digits} is not 10 digits`)

    const primary = profile.geo?.region?.replace('US-', '')
    assert.ok(primary, `${domain} has no geo.region to check the area code against`)

    // A brand may legitimately span a state line — carolinablacktop.com serves
    // both Carolinas. It declares that with statesServed rather than having the
    // check quietly widened for it.
    const states = profile.statesServed?.length ? profile.statesServed : [primary]
    assert.ok(states.includes(primary),
      `${domain}: statesServed must include its own geo.region (${primary})`)

    const area = digits.slice(0, 3)
    const local = states.some((st) => (AREA_CODES[st] || []).includes(area))
    const state = states.join('/')

    if (local) continue
    assert.ok(
      digits === CANONICAL,
      `${domain} (${state}) uses ${area}, which is neither a ${state} area code `
      + `nor the canonical ${PHONE_DISPLAY}`,
    )
    assert.ok(
      INHERITS_CANONICAL.has(domain),
      `${domain} falls back to the Virginia number but is not listed as `
      + `deliberately inheriting it — add it to INHERITS_CANONICAL or give it a local number`,
    )
  }
})

test('the two markets that had out-of-state numbers now have local ones', () => {
  assert.equal(PROFILES['savannahasphaltpaving.com'].phoneDisplay.slice(0, 3), '470')
  assert.equal(PROFILES['atlantaasphaltpavingpros.com'].phoneDisplay.slice(0, 3), '470')
  assert.equal(PROFILES['carolinablacktop.com'].phoneDisplay.slice(0, 3), '843')
  assert.equal(PROFILES['asphaltpavingkansascity.com'].phoneDisplay.slice(0, 3), '816')
})

test('a South Carolina number on a Georgia page is refused', () => {
  // The exact defect that shipped. Guards the guard.
  const state = 'GA'
  assert.ok(!AREA_CODES[state].includes('843'),
    '843 must not be considered a Georgia area code')
})
