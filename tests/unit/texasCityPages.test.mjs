/**
 * The Texas city pages, and the two rules they exist to satisfy.
 *
 * 1. Every figure reconciles to the invoice tracker. If these pages and
 *    texasProgram.js ever disagree, one of them is lying to a customer.
 * 2. No two pages carry the same content. Nineteen near-identical pages with
 *    the place name swapped are doorway pages: they do not rank, and at scale
 *    they drag down the pages that would have.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  texasCityPages,
  texasCityTotals,
  citySlug,
  cityPath,
} from '../../src/data/texasCityPages.js'
import {
  TX_SITES,
  TX_CITIES,
  TX_INVOICED_JOBS,
  TX_INVOICED_VALUE_USD,
} from '../../src/data/texasProgram.js'
import { TEXAS_PHOTOS, publishablePhotos, photosForCity } from '../../src/data/texasPhotos.js'

describe('the figures reconcile to the invoice tracker', () => {
  const pages = texasCityPages()
  const totals = texasCityTotals(pages)

  it('covers every city with invoiced work, and only those', () => {
    assert.equal((pages).length, TX_CITIES.length)
    assert.deepEqual(pages.map((p) => p.city).sort(), [...TX_CITIES].sort())
  })

  it('accounts for every invoiced site exactly once', () => {
    assert.equal(totals.sites, TX_INVOICED_JOBS)
    assert.equal(totals.sites, TX_SITES.length)
  })

  it('sums to the declared programme value to the cent', () => {
    assert.equal(totals.value, TX_INVOICED_VALUE_USD)
  })

  it('carries the real store numbers, not invented ones', () => {
    const onPages = pages.flatMap((p) => p.sites.map((s) => s.store)).sort()
    const inTracker = TX_SITES.map((s) => s.store).sort()
    assert.deepEqual(onPages, inTracker)
  })

  it('gives every city a region, so no page falls back to generic ground', () => {
    for (const page of pages) {
      assert.ok(page.region, `${page.city} has no region`)
      assert.ok(page.subgrade, `${page.city} has no subgrade note`)
      assert.ok(page.climate, `${page.city} has no climate note`)
    }
  })
})

describe('no two pages say the same thing', () => {
  const pages = texasCityPages()
  const uniq = (values) => new Set(values).size

  it('has a distinct title, description, summary and path per city', () => {
    assert.equal(uniq(pages.map((p) => p.title)), pages.length)
    assert.equal(uniq(pages.map((p) => p.description)), pages.length)
    assert.equal(uniq(pages.map((p) => p.summary)), pages.length)
    assert.equal(uniq(pages.map((p) => p.path)), pages.length)
  })

  it('says something different about a city the programme returned to', () => {
    const returned = pages.filter((p) => p.returned)
    const once = pages.filter((p) => !p.returned)
    assert.ok((returned.length) > (0))
    assert.ok((once.length) > (0))
    for (const page of returned) {
      assert.ok((page.siteCount) > (1))
      assert.ok(String(page.summary).includes('came back'))
    }
    for (const page of once) {
      assert.equal(page.siteCount, 1)
      assert.ok(!String(page.summary).includes('came back'))
    }
  })

  it('keeps descriptions inside the length Google will show', () => {
    for (const page of pages) {
      assert.ok(page.description.length <= 160, `${page.city}: ${page.description}`)
    }
  })
})

describe('slugs', () => {
  it('handles multi-word cities', () => {
    assert.equal(citySlug('Rio Grande City'), 'rio-grande-city')
    assert.equal(citySlug('South Padre Island'), 'south-padre-island')
    assert.equal(cityPath('Del Rio'), '/texas/del-rio')
  })

  it('produces a unique slug per city', () => {
    const slugs = texasCityPages().map((p) => p.slug)
    assert.equal(new Set(slugs).size, slugs.length)
    for (const slug of slugs) assert.match(slug, /^[a-z0-9-]+$/)
  })
})

describe('the photo slot stays empty until there are real Texas photographs', () => {
  it('is empty right now, and that is the correct state', () => {
    assert.deepEqual(TEXAS_PHOTOS, [])
    assert.deepEqual(publishablePhotos(), [])
    assert.deepEqual(photosForCity('Waco'), [])
  })

  it('drops an entry missing any field that would make it evidence', () => {
    const complete = {
      file: 'waco-after-01.jpg', city: 'Waco', store: 'G135216', phase: 'after',
      taken: '2016-08', alt: 'Finished lane', width: 1600, height: 1200,
    }
    assert.equal((publishablePhotos([complete])).length, 1)

    for (const field of ['file', 'city', 'store', 'taken', 'alt']) {
      const broken = { ...complete, [field]: '' }
      assert.equal(publishablePhotos([broken]).length, 0, `missing ${field} was published`)
    }
    assert.equal((publishablePhotos([{ ...complete, width: 0 }])).length, 0)
  })

  it('never publishes a before or during photograph as finished work', () => {
    const base = {
      file: 'x.jpg', city: 'Waco', store: 'G135216', taken: '2016-08',
      alt: 'Lot', width: 1600, height: 1200,
    }
    assert.equal((publishablePhotos([{ ...base, phase: 'before' }])).length, 0)
    assert.equal((publishablePhotos([{ ...base, phase: 'during' }])).length, 0)
    assert.equal((publishablePhotos([{ ...base, phase: 'after' }])).length, 1)
  })

  it('matches a city case-insensitively but does not match a different one', () => {
    const photo = {
      file: 'x.jpg', city: 'Waco', store: 'G135216', phase: 'after',
      taken: '2016-08', alt: 'Lot', width: 1600, height: 1200,
    }
    assert.equal((photosForCity('waco', [photo])).length, 1)
    assert.equal((photosForCity('Tyler', [photo])).length, 0)
  })
})
