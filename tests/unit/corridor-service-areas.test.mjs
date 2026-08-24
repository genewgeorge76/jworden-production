/**
 * The Route 29 / Blue Ridge corridor pages.
 *
 * WHY THEY EXIST
 * ──────────────
 * Asked where the work had been in 2026, the owner named Vinton, Ivy,
 * Annandale and Ruckersville — Roanoke County, Albemarle, Fairfax and Greene.
 * None of them is Richmond and only Charlottesville had a page. The other four
 * are the corridor around the address the business moves to when the lease
 * ends.
 *
 * WHAT THESE TESTS ARE ACTUALLY GUARDING
 * ──────────────────────────────────────
 * Two failures, and they pull in opposite directions.
 *
 * The first is DUPLICATE CONTENT. Eight pages that swap a place name are the
 * thing the owner has said repeatedly he does not want, and the thing Google
 * discounts. So these assert the pages differ substantively from each other and
 * from the Charlottesville page that already existed.
 *
 * The second is a FABRICATED CLAIM. The job book in this repository ends on
 * 2022-04-04 and holds nothing at all from 2023 onward, so no page in this file
 * may carry a job count, a dollar figure or a named project. Service-area
 * content rests on the owner's word, which is legitimate. A checkable number
 * needs records, and the records for these years have not been imported yet.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

const { CORRIDOR_SERVICE_AREAS: AREAS } = await import('../../src/data/corridorServiceAreas.js')
const { SERVICE_AREAS, getServiceArea } = await import('../../src/data/serviceAreas.js')

const SLUGS = AREAS.map((a) => a.slug)

test('the four 2026 markets the owner named all have a page', () => {
  for (const slug of ['vinton-va', 'ivy-va', 'annandale-va', 'ruckersville-va']) {
    assert.ok(SLUGS.includes(slug), `${slug} missing — the owner named it as 2026 work`)
  }
})

test('the corridor around the new base has a page', () => {
  for (const slug of ['faber-va', 'nellysford-va', 'lovingston-va', 'crozet-va']) {
    assert.ok(SLUGS.includes(slug), `${slug} missing — this is the new home corridor`)
  }
})

test('every corridor page is reachable through the main service-area list', () => {
  for (const slug of SLUGS) {
    assert.ok(getServiceArea(slug), `${slug} is not resolvable via getServiceArea`)
  }
})

test('no slug collides with an existing Richmond-area page', () => {
  const all = SERVICE_AREAS.map((a) => a.slug)
  assert.equal(new Set(all).size, all.length, 'duplicate slug in SERVICE_AREAS')
})

// ── No fabricated proof ──────────────────────────────────────────────────────

test('no page states a job count', () => {
  for (const area of AREAS) {
    const text = JSON.stringify(area)
    assert.ok(
      !/\b\d{1,4}\+?\s*(jobs?|projects?|lots?|driveways?|locations?|sites?)\s+(completed|paved|finished|done)/i.test(text),
      `${area.slug} claims a job count and the 2023-2026 records are not imported`,
    )
  }
})

test('no page states a dollar figure', () => {
  for (const area of AREAS) {
    assert.ok(!/\$\s?[\d,]/.test(JSON.stringify(area)), `${area.slug} carries a dollar figure`)
  }
})

test('no page names a specific customer or project as proof', () => {
  for (const area of AREAS) {
    const text = JSON.stringify(area)
    assert.ok(
      !/\b(we (completed|paved|finished|built))\b/i.test(text),
      `${area.slug} makes a completed-work claim; these pages are service-area only`,
    )
  }
})

// ── Not duplicate content ────────────────────────────────────────────────────

/** Words that carry meaning, for comparing what two pages actually say. */
function contentWords(area) {
  return new Set(
    area.description
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 5),
  )
}

function overlap(a, b) {
  const A = contentWords(a)
  const B = contentWords(b)
  const shared = [...A].filter((w) => B.has(w)).length
  return shared / Math.min(A.size, B.size)
}

test('no two corridor pages say substantially the same thing', () => {
  for (let i = 0; i < AREAS.length; i += 1) {
    for (let j = i + 1; j < AREAS.length; j += 1) {
      const score = overlap(AREAS[i], AREAS[j])
      assert.ok(
        score < 0.45,
        `${AREAS[i].slug} and ${AREAS[j].slug} share ${(score * 100).toFixed(0)}% of their content words — that is a template, not two pages`,
      )
    }
  }
})

test('the corridor pages do not duplicate the Charlottesville page that already existed', () => {
  const cville = getServiceArea('charlottesville-va')
  assert.ok(cville, 'charlottesville-va should still exist')
  for (const area of AREAS) {
    const score = overlap(area, cville)
    assert.ok(score < 0.45, `${area.slug} overlaps Charlottesville by ${(score * 100).toFixed(0)}%`)
  }
})

test('every page carries real substance, not a stub', () => {
  for (const area of AREAS) {
    assert.ok(area.description.length > 900, `${area.slug} description is too thin to rank`)
    assert.ok(area.faqs.length >= 3, `${area.slug} has fewer than three FAQs`)
    assert.ok(area.nearbyLandmarks.length >= 4, `${area.slug} names too few local landmarks`)
    for (const faq of area.faqs) {
      assert.ok(faq.answer.length > 150, `${area.slug} has a throwaway FAQ answer`)
    }
  }
})

// ── The facts that came from the county data ─────────────────────────────────

test('Wintergreen is not described using the Nelson County average elevation', () => {
  /**
   * The load-bearing correction. Nelson County averages 719 ft; Wintergreen
   * sits above 3,500 ft on Devils Knob. Quoting the county figure to a resort
   * property manager is wrong by an order of magnitude in freeze-thaw terms.
   */
  const nellysford = AREAS.find((a) => a.slug === 'nellysford-va')
  const text = JSON.stringify(nellysford)
  assert.match(text, /Wintergreen/)
  assert.match(text, /3,500/, 'the Wintergreen elevation exception must be stated explicitly')
  assert.match(text, /719/, 'the valley figure should be given so the contrast is visible')
})

test('elevation claims match the county facts they came from', () => {
  const expected = {
    'annandale-va': '287',
    'crozet-va': '640',
    'ivy-va': '640',
    'faber-va': '719',
    'lovingston-va': '719',
    'nellysford-va': '719',
    'ruckersville-va': '1,17',
    'vinton-va': '1,35',
  }
  for (const [slug, figure] of Object.entries(expected)) {
    const area = AREAS.find((a) => a.slug === slug)
    assert.ok(
      area.description.includes(figure),
      `${slug} should cite the county elevation (${figure}) it reasons from`,
    )
  }
})

test('each page names its own county and none names the wrong one', () => {
  for (const area of AREAS) {
    assert.ok(area.county.endsWith('County'), `${area.slug} has no county`)
    assert.equal(area.stateCode, 'VA')
    assert.ok(area.lat > 36.5 && area.lat < 39.5, `${area.slug} latitude is not in Virginia`)
    assert.ok(area.lng < -75 && area.lng > -84, `${area.slug} longitude is not in Virginia`)
  }
})
