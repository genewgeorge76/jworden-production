import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { sourceWithoutComments } from '../helpers/source.mjs'

const CITY_PAGE = 'src/pages/CityPage.jsx'
// CityQuoteBlock now supplies only the wording that is genuinely about a city.
// The form, the credentials gate, the #quote anchor and the error guard moved
// into the shared QuoteBlock when the same section was needed on service and
// regional pages, so the mechanics are asserted there and the city-specific
// attribution is asserted here.
const CITY_WORDING = 'src/components/CityQuoteBlock.jsx'
const QUOTE_BLOCK = 'src/components/QuoteBlock.jsx'
// sourceWithoutComments takes a PATH and reads the file itself. Passing it the
// contents makes every assertion silently meaningless.
const cityPage = () => sourceWithoutComments(CITY_PAGE)
const cityWording = () => sourceWithoutComments(CITY_WORDING)
const quoteBlock = () => sourceWithoutComments(QUOTE_BLOCK)

/**
 * A LINK TO A FORM IS NOT A FORM
 * ──────────────────────────────
 * CityPage is the template behind every location page — 87 URLs in the
 * Richmond sitemap alone — and until now its only two conversion paths both
 * left the page: a Link to /quote and a tel: link. Someone reading about their
 * own town at nine in the evening had nowhere to type.
 *
 * Google's Business Profile reports for this company recorded quote requests
 * as the conversion that mattered. The site now captures on the page.
 */
test('every city page carries an on-page quote form', () => {
  const src = cityPage()
  assert.match(src, /CityQuoteBlock/, 'the quote block is not rendered on city pages')
  assert.match(quoteBlock(), /EstimateForm/, 'the quote block renders no form')
  // The form must attribute the lead to the city it came from, or the whole
  // point of per-city pages is lost at the moment of conversion.
  assert.match(cityWording(), /source=\{`city_\$\{slug\}`\}/)
})

/** The CTAs should reach the form on the page, not navigate away from it. */
test('city CTAs point at the on-page form', () => {
  const src = cityPage()
  assert.equal(/to="\/quote"/.test(src), false, 'a CTA still navigates away to /quote')
  assert.match(src, /href="#quote"/)
  assert.match(readFileSync(QUOTE_BLOCK, 'utf8'), /id="quote"/)
})

/**
 * Phone clicks from city pages were invisible: the hero link was tracked and
 * the bottom one was not, so half the calls this template produced could never
 * be attributed to it.
 */
test('every phone link on a city page is tracked', () => {
  const src = cityPage()
  const telLinks = (src.match(/href="tel:/g) || []).length
  const phoneEvents = (src.match(/phone_click/g) || []).length
  assert.ok(telLinks > 0)
  assert.ok(
    phoneEvents >= telLinks - 1,
    `${telLinks} tel: links but only ${phoneEvents} tracked — an untracked call is an unattributable one`,
  )
})

/**
 * PROOF SITS NEXT TO THE ASK, AND ONLY VERIFIED PROOF
 * The credentials beside the form come through publishableFor(), the same gate
 * every other surface uses, so nothing unverified can reach a conversion point
 * even by accident. The component must not reach around it.
 */
test('the quote block draws credentials through the verified gate only', () => {
  const block = quoteBlock()
  assert.match(block, /publishableFor\(brand\)/)
  assert.equal(/PUBLIC_RECORDS/.test(block), false, 'the block reads the unfiltered list')
  assert.equal(/publicRecordsWithheld/.test(block), false, 'the block reaches into withheld records')
  // And it must not reintroduce the licence claim next to the strongest CTA.
  assert.equal(/Class A|fully licensed|NASCLA/i.test(block), false)
})

/**
 * A WIDGET FAILING MUST NEVER COST THE PAGE
 * ─────────────────────────────────────────
 * ChatWidget, AIConciergeBubble and MobileCallBar rendered at the app root
 * outside any boundary. React unmounts the whole tree when a render throws, so
 * any one of them failing white-screened the entire site — every page, on
 * every domain, over an optional floating bubble.
 *
 * They are now individually boundaried in silent mode: the widget disappears,
 * the site carries on. Routes keep the visible fallback; ancillary UI does not.
 */
test('root-level widgets are individually boundaried', () => {
  const app = sourceWithoutComments('src/App.jsx')
  for (const widget of ['MobileCallBar', 'ChatWidget', 'AIConciergeBubble']) {
    const re = new RegExp(`<ErrorBoundary[^>]*silent[^>]*label="${widget}"[^>]*>`, 's')
    assert.match(app, re, `${widget} renders without a silent error boundary`)
  }
})

/**
 * The quote block is the money path, so its fallback is NOT silent-null — a
 * blank section would delete the only conversion route on the page. It falls
 * back to the phone number.
 */
test('the quote block fails over to a phone number, not to nothing', () => {
  const page = sourceWithoutComments(CITY_PAGE)
  assert.match(page, /<ErrorBoundary[\s\S]*?label="CityQuoteBlock"/)
  assert.match(page, /fallback=\{/)
  const raw = readFileSync(CITY_PAGE, 'utf8')
  const start = raw.indexOf('label="CityQuoteBlock"')
  const region = raw.slice(start, start + 900)
  assert.match(region, /tel:\+18044461296/, 'the fallback offers no way to make contact')
})
