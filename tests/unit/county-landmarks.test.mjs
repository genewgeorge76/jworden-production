import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

const DATA = JSON.parse(readFileSync('src/data/countyLandmarks.virginia.json', 'utf8'))

const vaModule = await import('../../src/data/virginia_counties.js')
const require_va = () => vaModule

/**
 * The whole value of this file is that nothing in it was written by hand. A
 * landmark placed in the wrong county is invisible to everyone except the
 * people who live there — which is precisely the audience a county page is
 * for, and precisely how this repository got a Savannah KFC on Abercorn
 * Street.
 */
test('every county states where its facts came from', () => {
  assert.ok(DATA.counties.length > 0)
  for (const c of DATA.counties) {
    assert.ok(c.sources?.length > 0, `${c.county} has no source URL`)
    for (const s of c.sources) assert.match(s, /^https:\/\/en\.wikipedia\.org\//)
    assert.ok(c.fetched_utc, `${c.county} has no fetch timestamp`)
  }
})

test('a fact that could not be fetched is null, never invented', () => {
  // Chesterfield has no population in its summary sentence and Henrico has no
  // seat. Those must read null rather than being filled in from knowledge.
  for (const c of DATA.counties) {
    for (const field of ['seat', 'population', 'summary']) {
      const v = c[field]
      assert.ok(v === null || (typeof v === 'string' && v.length > 0), `${c.county}.${field} is neither a fact nor null`)
    }
    assert.ok(Array.isArray(c.landmarks), `${c.county}.landmarks is not a list`)
  }
})

test('the summary is quoted, not paraphrased', () => {
  // A rewritten extract is authorship wearing a citation. Fetched text keeps
  // the shape of an encyclopaedia sentence.
  const withSummary = DATA.counties.filter((c) => c.summary)
  assert.ok(withSummary.length > 0)
  for (const c of withSummary.slice(0, 20)) {
    assert.match(c.summary, /count(y|ies)/i, `${c.county} summary does not read like the source`)
  }
})

test('landmark names are plausible register entries, not prose', () => {
  for (const c of DATA.counties) {
    for (const l of c.landmarks) {
      assert.ok(l.length > 0 && l.length < 90, `${c.county}: "${l}" is not a name`)
      assert.equal(/\|\||\{\{|https?:/.test(l), false, `${c.county}: "${l}" is unparsed markup`)
    }
  }
})

test('the generator needs no API key, and says so', () => {
  const raw = readFileSync('scripts/build-county-landmarks.mjs', 'utf8')
  // Comments are stripped first. The doc comment names the OTHER script's keys
  // in order to explain why this one needs none — the same trap that caught
  // the DocumentedRecord test, which flagged its own explanation.
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  assert.equal(/API_KEY/.test(src), false, 'the keyless generator acquired a key dependency')
  // The rate-limit pause is load-bearing: without it the run fails, not slows.
  assert.match(src, /PAUSE_MS/)
  assert.match(src, /User-Agent/)
})

/**
 * Duplicate counties mean duplicate pages, which is cross-domain duplicate
 * content aimed at exactly the audience the page exists for. The source list
 * is not unique — VA_COUNTIES holds 94 entries for 85 counties — so this is
 * guarded at the output rather than trusted at the input.
 */
test('no county appears twice', () => {
  const names = DATA.counties.map((c) => c.county)
  assert.equal(new Set(names).size, names.length, 'a county is listed more than once')
})

test('every county in the source list was fetched exactly once', () => {
  const { VA_COUNTIES } = require_va()
  const want = new Set(VA_COUNTIES.map((c) => c.name.replace(/ County$/, '')))
  const got = new Set(DATA.counties.map((c) => c.county))
  assert.equal(got.size, want.size, 'the fetched set and the source set disagree')
  for (const n of want) assert.ok(got.has(n), `${n} was never fetched`)
})
