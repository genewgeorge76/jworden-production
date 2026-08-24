/**
 * The North Carolina restaurant proof, and the two sites held back from it.
 *
 * These came from jobsite photo emails the crew sent to KBP at the time, parsed
 * by app/services/photo_email.py. Five North Carolina sites appear in that
 * archive; three carry after-photographs and two carry before-photographs only.
 *
 * A before-pictures email is evidence the company stood on the site with a
 * camera. It is not evidence the work was finished. If the two Greensboro sites
 * ever appear as completed work without after-photographs turning up, this test
 * is the thing that should have stopped it.
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const {
  NC_QSR_SITES, NC_QSR_UNCONFIRMED, publishableNcSites, ncSiteCities, PUBLISHABLE_GRADES,
} = await import(path.join(ROOT, 'src/data/carolinaProgram.js'))

const NC_PAGE = path.join(ROOT, 'dist/brands/carolinablacktop.com/north-carolina/index.html')

test('three sites are publishable and every one is graded completed', () => {
  const sites = publishableNcSites()
  assert.equal(sites.length, 3)
  for (const s of sites) {
    assert.ok(PUBLISHABLE_GRADES.has(s.evidence), `${s.store} is ${s.evidence}`)
    assert.ok(s.store, 'a publishable site must carry a store number')
    assert.ok(s.city, 'a publishable site must carry a city')
    assert.ok(s.source.startsWith('photo-email:'), 'each must name the email it came from')
  }
  assert.deepEqual(ncSiteCities(), ['High Point', 'Burlington'])
})

test('a site with no street number in the archive gets no address', () => {
  // "KFC(186) N Church St" has no number. Inventing one would file the job
  // against an address the company never wrote down.
  const s = NC_QSR_SITES.find((x) => x.store === 'KFC 186')
  assert.equal(s.address, null)
  assert.equal(s.city, 'Burlington')
})

test('the two before-only sites are held back', () => {
  assert.equal(NC_QSR_UNCONFIRMED.length, 2)
  const publishableStores = publishableNcSites().map((s) => s.store)
  for (const held of NC_QSR_UNCONFIRMED) {
    assert.ok(!publishableStores.includes(held.store),
      `${held.store} has before-pictures only and must not be publishable`)
  }
  assert.ok(NC_QSR_UNCONFIRMED.every((s) => s.city === 'Greensboro'))
})

test('no dollar figure is claimed — the photo emails carry no amounts', () => {
  // Unlike the Texas invoice tracker. An invented figure beside a checkable
  // store number would poison both.
  const blob = JSON.stringify(NC_QSR_SITES)
  assert.ok(!/\$\s?\d/.test(blob), 'a dollar figure appeared in the NC program')
})

test('the built page shows the three and never the two', () => {
  if (!fs.existsSync(NC_PAGE)) return
  const html = fs.readFileSync(NC_PAGE, 'utf-8')

  for (const s of publishableNcSites()) {
    assert.ok(html.includes(s.store), `${s.store} missing from the page`)
  }
  // Greensboro may appear as a SERVICE AREA. It must never appear inside the
  // finished-work list.
  const proof = html.slice(
    html.indexOf('Restaurant sites we finished'),
    html.indexOf('What we do in'),
  )
  assert.ok(proof.length > 0, 'the proof block should be present')
  assert.ok(!proof.includes('Greensboro'), 'Greensboro is in the finished-work block')
  assert.ok(!proof.includes('KFC 189'), 'a before-only store is in the finished-work block')
  assert.ok(!proof.includes('Randleman'), 'a before-only site is in the finished-work block')
})

test('the South Carolina page carries no restaurant proof block', () => {
  // No SC records exist. The page must not borrow North Carolina's.
  const scPage = path.join(ROOT, 'dist/brands/carolinablacktop.com/south-carolina/index.html')
  if (!fs.existsSync(scPage)) return
  const html = fs.readFileSync(scPage, 'utf-8')
  assert.ok(!html.includes('Restaurant sites we finished'),
    'South Carolina must not show a proof block it has no records for')
  assert.ok(!html.includes('KFC 195'), 'a North Carolina store appeared on the SC page')
})
