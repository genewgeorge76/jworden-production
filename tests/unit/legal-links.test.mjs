import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'

import { sourceWithoutComments } from '../helpers/source.mjs'

const DIR = 'src/data/legal'
const FILES = readdirSync(DIR).filter((f) => f.endsWith('.js'))

function urlsIn(file) {
  const src = readFileSync(`${DIR}/${file}`, 'utf8')
  return [...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0].replace(/[.,;]$/, ''))
}

const ALL = FILES.flatMap(urlsIn)

/**
 * These tests do not reach the network — a unit suite that fails because a
 * state website is having a bad morning is a suite people learn to ignore.
 * The network check is scripts/check-legal-links.mjs, run deliberately.
 *
 * What is checked here is the shape of what was written, and specifically the
 * URLs already known to be dead. Fifty-nine of 251 government citations were
 * returning 404 when this was written — nearly one in four — and a dead
 * citation is worse than none: it invites the reader to check, and wastes their
 * time proving the page wrong.
 */
const KNOWN_DEAD = [
  'https://www.txdot.gov/government/permits.html',
  'https://www.vdot.virginia.gov/business/it-services/oversize-overweight-permits.asp',
  'https://www.in.gov/indot/3483.htm',
  'https://www.maine.gov/mdot/heavyvehicles',
  'https://www.dot.nd.gov/divisions/maintenance/permits.htm',
  'https://vtrans.vermont.gov/highway/permits/size-weight',
  'https://www.dli.mn.gov/mnosha',
  'https://www.ncdoi.gov/engineering',
  'https://www.ok.gov/ubcc',
  'https://dca.ga.gov/safe-affordable-housing/codes-and-housing-development',
]

test('the URLs known to be dead are gone from the data', () => {
  for (const dead of KNOWN_DEAD) {
    for (const url of ALL) {
      assert.notEqual(url, dead, `${dead} is back in ${DIR}`)
    }
  }
})

/**
 * Several of these moved because the ISSUING AUTHORITY changed, not because a
 * page was renamed. Texas oversize permits are issued by TxDMV, not TxDOT.
 * Virginia's are DMV, not VDOT. Indiana's are the Department of Revenue, not
 * INDOT. Maine's are the Bureau of Motor Vehicles, not MaineDOT. Vermont's are
 * DMV, not VTrans. North Dakota's are the Highway Patrol, not NDDOT.
 *
 * Pointing those back at the highway department would be a live link to the
 * wrong agency, which is a worse failure than a 404 — the reader gets a working
 * page that cannot help them.
 */
test('permits point at the agency that actually issues them', () => {
  const roads = readFileSync(`${DIR}/roadsAndPavingRegulations.js`, 'utf8')
  const expected = [
    ['Texas', 'txdmv.gov'],
    ['Virginia', 'dmv.virginia.gov'],
    ['Indiana', 'in.gov/dor'],
    ['Maine', 'maine.gov/sos/bmv'],
    ['Vermont', 'dmv.vermont.gov'],
  ]
  for (const [, host] of expected) {
    assert.ok(roads.includes(host), `${host} is not cited anywhere in roadsAndPavingRegulations`)
  }
})

test('no URL points at a link shortener or an archive snapshot', () => {
  // A shortener hides where a citation goes, and a Wayback snapshot is a
  // record of what a page said, not what the agency currently requires.
  for (const url of ALL) {
    assert.equal(/bit\.ly|tinyurl|goo\.gl|t\.co\//.test(url), false, `${url} is shortened`)
    assert.equal(/web\.archive\.org/.test(url), false, `${url} is an archive snapshot`)
  }
})

test('every citation is https', () => {
  for (const url of ALL) {
    assert.ok(url.startsWith('https://'), `${url} is not https`)
  }
})

test('the link checker treats a firewall block as alive, not dead', () => {
  const src = sourceWithoutComments('scripts/check-legal-links.mjs')
  // Counting 403 and 000 as dead would mean replacing working links with
  // guesses, which is how a link checker makes a dataset worse.
  assert.match(src, /=== 404 \|\| r\.code === 410/)
  assert.match(src, /blocked/)
  assert.match(src, /unreachable/)
})
