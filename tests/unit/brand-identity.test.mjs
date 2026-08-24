/**
 * The brand identity policy, and the case it exists to prevent going either way.
 *
 * This rule will be applied by the site factory to every SaaS client's site
 * without a human reading the output, so it is tested in both directions: it
 * must catch a site that talks itself down, AND it must never catch a site
 * making a disclosure a customer genuinely needs.
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const { checkTravelNote, checkEntityClaims, auditProfiles } =
  await import(path.join(ROOT, 'scripts/lib/brand-identity-policy.mjs'))
const { REGIONAL_MARKET_PROFILES: PROFILES } =
  await import(path.join(ROOT, 'src/data/regionalMarketProfiles.js'))

test('every shipped brand satisfies the policy', () => {
  const problems = auditProfiles(PROFILES)
  assert.deepEqual(problems, [],
    'violations:\n' + problems.map(p => `  ${p.domain} rule ${p.rule}: ${p.detail}`).join('\n'))
})

test('it catches the exact sentences that were live', () => {
  // Each of these shipped on a real page until 2026-08-24.
  const wasLive = [
    'We are a Virginia contractor, and we have run a full Texas programme. We do not keep a Dallas yard, and we would rather say so than pretend.',
    'We are a Virginia contractor that mobilises to the Carolinas. We do not run a Charlotte storefront.',
    'We are a Virginia contractor that mobilises to metro Atlanta. No local branch.',
    'We are a Virginia contractor that mobilises to Kansas City. We are not a local KC shop, and we will say so before you ask.',
    'We mobilise to Savannah. There is no Savannah office.',
  ]
  for (const note of wasLive) {
    assert.ok(checkTravelNote('x.com', note).length > 0, `should have been caught: ${note}`)
  }
})

test('a MATERIAL absence is never flagged — this is the whole carve-out', () => {
  // A customer choosing a contractor with no local track record is entitled to
  // know before they choose. Suppressing this would make the policy a tool for
  // hiding things that matter, which is the opposite of its purpose.
  const material = [
    'We are a Virginia contractor opening up the Outer Banks. We have no completed OBX projects to point you at yet.',
    'This would be our first project in the county.',
    'We are not licensed for electrical work in this state.',
  ]
  for (const note of material) {
    assert.deepEqual(checkTravelNote('x.com', note), [], `must not flag: ${note}`)
  }
})

test('obxpaving keeps its disclosure while the others lose theirs', () => {
  const obx = PROFILES['obxpaving.com']
  assert.ok(/no completed/i.test(obx.travelNote), 'OBX must still disclose no local track record')
  assert.deepEqual(checkTravelNote('obxpaving.com', obx.travelNote), [])
})

test('claiming separate incorporation is refused', () => {
  // Every brand here is one LLC wearing two names. A profile that says
  // otherwise is making a checkable false statement about corporate identity.
  for (const claim of ['a separate company', 'independently owned', 'not affiliated']) {
    const problems = checkEntityClaims('x.com', { basedIn: `We are ${claim} from the parent.` })
    assert.equal(problems.length, 1, `should refuse: ${claim}`)
    assert.equal(problems[0].rule, 3)
  }
})

test('a market with no travel note is fine', () => {
  // richmondasphaltpaving.com is the home market and needs no explanation.
  assert.deepEqual(checkTravelNote('x.com', undefined), [])
  assert.deepEqual(checkTravelNote('x.com', ''), [])
})
