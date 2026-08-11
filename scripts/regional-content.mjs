/**
 * regional-content.mjs — build the static body each regional domain serves.
 *
 * WHY THIS EXISTS
 *
 * The per-domain files (dist/<domain>.html) were copies of the Virginia
 * homepage with a rewritten <head>. Once prerendering was fixed they at least
 * carried content, but it was the SAME content on six domains — six near
 * identical pages, each canonicalising to itself. That is the shape Google
 * describes as a doorway network, and it is not what these domains should be.
 *
 * So each domain gets its own body, built from its entry in
 * src/data/regionalMarketProfiles.js — which already holds genuinely regional
 * material: the state DOT specification that governs the work, how the local
 * subgrade behaves, which failure mode the climate drives, and what commercial
 * work the market actually asks for.
 *
 * WHAT MAKES IT WORTH RANKING
 *
 * Two things, neither of which a competitor can copy from a template.
 *
 * First, engineering specifics. "Piedmont red clay shrinks in drought and
 * swells when saturated, so the fix is a thicker stone base with drainage that
 * leaves the site, not a heavier mat" is a sentence only somebody who has built
 * on that subgrade writes. Generic pages cannot produce it.
 *
 * Second, documented proof. Each page lists the job sites we hold dated,
 * GPS-tagged photographs for in that region, with street addresses. It is drawn
 * from src/data/jobSites.json, so a page claims a site only when the
 * photographs exist. A market with no documented sites shows no proof section
 * rather than a fabricated one.
 *
 * HONESTY IS PART OF THE PITCH
 *
 * Every profile carries a travelNote saying plainly that this is a Virginia
 * contractor that mobilises to the region, with no local storefront. That is
 * rendered prominently rather than buried. A commercial buyer who discovers a
 * fake local address stops reading; one who is told the truth up front and
 * shown documented multi-state work has a reason to keep going.
 */

import fs from 'fs'
import path from 'path'

/** Which states' documented job sites belong to which market. */
const MARKET_STATES = {
  'carolinablacktop.com': ['North Carolina', 'South Carolina'],
  'richmondasphaltpaving.com': ['Virginia'],
  'atlantaasphaltpavingpros.com': ['Georgia'],
  'savannahasphaltpaving.com': ['Georgia'],
  'asphaltpavingkansascity.com': ['Missouri', 'Kansas'],
  'obxpaving.com': ['North Carolina'],
}

/**
 * Towns of the Outer Banks / Dare County.
 *
 * obxpaving.com and carolinablacktop.com are both North Carolina domains, so a
 * state filter alone would put the same job sites on both — which is duplicate
 * content across two domains we own, working against the per-domain canonical
 * the rest of this pipeline exists to get right. It would also be misleading:
 * Oregon Inlet Road is not a Charlotte-metro reference.
 *
 * So these towns belong to OBX and are excluded from the Carolinas page.
 */
const OBX_CITIES = [
  'Kill Devil Hills',
  'Nags Head',
  'Kitty Hawk',
  'Manteo',
  'Duck',
  'Corolla',
  'Southern Shores',
  'Wanchese',
  'Manns Harbor',
  'Dare County',
]

/**
 * Domains restricted to a sub-state region rather than whole states. When a
 * domain appears here its sites must ALSO match one of these cities; when it
 * does not, the state filter alone applies as before.
 */
const MARKET_CITIES = {
  'obxpaving.com': OBX_CITIES,
}

/** Domains that must NOT claim a sub-region owned by a more specific domain. */
const MARKET_CITY_EXCLUDES = {
  'carolinablacktop.com': OBX_CITIES,
}

/**
 * Indefinite article for a region name, or none when the name already carries
 * one. "a the Outer Banks project" and "a Outer Banks project" are both wrong;
 * regions are author-supplied strings, so the template cannot assume "a ".
 */
function article(region) {
  const r = String(region || '').trim()
  if (!r) return ''
  if (/^(the|a|an)\s/i.test(r)) return ''
  return /^[aeiou]/i.test(r) ? 'an ' : 'a '
}

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** "2014:06:09 10:11:12" -> "June 2014" */
function fmtDate(raw) {
  const m = /^(\d{4}):(\d{2})/.exec(raw || '')
  if (!m) return null
  return new Date(`${m[1]}-${m[2]}-01`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function loadSites(rootDir) {
  try {
    const p = path.join(rootDir, 'src/data/jobSites.json')
    return JSON.parse(fs.readFileSync(p, 'utf8')).sites || []
  } catch {
    return []
  }
}

/**
 * Documented sites for a market. Commercial only — those carry a business name
 * and address that a reader can actually check. Residential pins stay off the
 * page for the same reason they carry no street address on the map: the
 * customer did not agree to be published.
 */
function sitesForMarket(domain, allSites) {
  const states = MARKET_STATES[domain]
  if (!states) return []
  const only = MARKET_CITIES[domain]
  const excluded = MARKET_CITY_EXCLUDES[domain]
  return allSites
    .filter((s) => states.includes(s.state) && s.kind === 'commercial')
    .filter((s) => (only ? only.includes(s.city) : true))
    .filter((s) => (excluded ? !excluded.includes(s.city) : true))
    .sort((a, b) => b.photo_count - a.photo_count)
    .slice(0, 12)
}

/**
 * Honest one-line summary of everything documented in a market, including the
 * residential work the proof list deliberately omits.
 *
 * On the Outer Banks the commercial/residential split is lopsided — two
 * commercial sites against eight residential — because that is what the market
 * is: rental cottages and private drives. Publishing only the commercial pair
 * would understate a decade of real work, and publishing the residential
 * addresses would break the privacy rule. Counting them does neither.
 *
 * Returns null when there is nothing beyond what the list already shows, so no
 * market gets a sentence restating its own bullet points.
 */
function coverageSummary(domain, allSites, listed) {
  const states = MARKET_STATES[domain]
  if (!states) return null
  const only = MARKET_CITIES[domain]
  const excluded = MARKET_CITY_EXCLUDES[domain]
  const all = allSites
    .filter((s) => states.includes(s.state))
    .filter((s) => (only ? only.includes(s.city) : true))
    .filter((s) => (excluded ? !excluded.includes(s.city) : true))
  if (all.length <= listed.length) return null

  const photos = all.reduce((n, s) => n + (s.photo_count || 0), 0)
  const years = all
    .flatMap((s) => [fmtDate(s.first_seen), fmtDate(s.last_seen)])
    .filter(Boolean)
    .sort((a, b) => new Date(a) - new Date(b))
  const span = years.length ? `${years[0]} and ${years[years.length - 1]}` : null
  const towns = [...new Set(all.map((s) => s.city).filter(Boolean))].sort()

  return `${all.length} documented job sites${
    span ? ` worked between ${span}` : ''
  }, carrying ${photos.toLocaleString('en-US')} GPS-tagged photographs across ${esc(
    towns.join(', ')
  )}. Most of it is residential — private drives do not get published with an address, so only the commercial sites are listed individually below.`
}

function proofSection(domain, profile, sites, summary) {
  if (!sites.length) return ''
  const states = MARKET_STATES[domain] || []
  const rows = sites
    .map((s) => {
      const name = esc(s.place || `${s.city}, ${s.state}`)
      const addr = [s.address, s.city, s.state].filter(Boolean).map(esc).join(', ')
      const when = fmtDate(s.first_seen)
      return `<li><strong>${name}</strong><br><span>${addr}</span>${
        when ? `<br><span>Documented ${esc(when)} — ${s.photo_count} photographs on file</span>` : ''
      }</li>`
    })
    .join('\n')

  return `
  <section id="documented-work">
    <h2>${esc(profile.proofHeadline || 'Documented Projects')}</h2>
    <p>These are job sites in ${esc(states.join(' and '))} where we hold dated,
    GPS-tagged photographs. Locations come from the photographs themselves, not
    from a coverage map, so each one can be checked against its address and the
    dates the work was done.</p>
${summary ? `    <p>${summary}</p>` : ''}
    <ul>
${rows}
    </ul>
    <p><a href="https://www.jwordenasphaltpaving.com/footprint">See every documented job site on the map</a></p>
  </section>`
}

function jsonLd(domain, profile, sites) {
  const states = MARKET_STATES[domain] || []
  const [lat, lon] = String(profile.geo?.position || ';').split(';')
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: profile.marketName,
    description: profile.heroBody,
    url: `https://www.${domain}/`,
    telephone: profile.phoneDisplay,
    areaServed: states.map((s) => ({ '@type': 'State', name: s })),
    // Per-market where declared. A market that also sells concrete and
    // striping should say so in its schema rather than inherit an
    // asphalt-only list that undersells it.
    serviceType: profile.serviceTypes || [
      'Asphalt Paving',
      'Sealcoating',
      'Asphalt Repair',
      'Parking Lot Construction',
    ],
    parentOrganization: {
      '@type': 'Organization',
      name: 'J. Worden & Sons Paving LLC',
      url: 'https://www.jwordenasphaltpaving.com/',
    },
  }
  if (lat && lon) {
    data.geo = { '@type': 'GeoCoordinates', latitude: Number(lat), longitude: Number(lon) }
  }
  if (sites.length) {
    data.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: `Documented projects in ${states.join(' and ')}`,
      numberOfItems: sites.length,
    }
  }
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`
}

/**
 * The full static body for a domain. Returned as markup only — no styling
 * assumptions, because React hydrates over this and owns the visual result.
 * What matters here is that a crawler, and a visitor whose JS has not run yet,
 * both get the real page.
 */
export function renderRegionalBody(domain, profile, rootDir) {
  const allSites = loadSites(rootDir)
  const sites = sitesForMarket(domain, allSites)
  const summary = coverageSummary(domain, allSites, sites)

  const focus = (profile.commercialFocus || [])
    .map((f) => `<li>${esc(f)}</li>`)
    .join('\n')
  const specs = (profile.localSpecs || []).map((s) => `<li>${esc(s)}</li>`).join('\n')

  return `
  <main>
    <section id="hero">
      <p>${esc(profile.heroKicker || '')}</p>
      <h1>${esc(profile.heroHeadline || profile.marketName)}</h1>
      <p>${esc(profile.heroBody || '')}</p>
      <p><a href="tel:${esc((profile.phoneDisplay || '').replace(/[^0-9]/g, ''))}">${esc(
        profile.ctaLabel || 'Call for an estimate',
      )} — ${esc(profile.phoneDisplay || '')}</a></p>
    </section>

    <section id="how-we-work-here">
      <h2>How we work in ${esc(profile.primaryRegion || profile.primaryMetro || '')}</h2>
      <p><strong>${esc(profile.basedIn || '')}</strong></p>
      <p>${esc(profile.travelNote || '')}</p>
    </section>

    <section id="engineering">
      <h2>Built for ${esc(profile.primaryMetro || profile.primaryRegion || '')} conditions</h2>
      <h3>Specification</h3>
      <p>Work is built to ${esc(profile.stateDot || 'the governing state DOT specification')}.</p>
      <h3>Subgrade</h3>
      <p>${esc(profile.subgrade || '')}</p>
      <h3>Climate</h3>
      <p>${esc(profile.climate || '')}</p>
      ${specs ? `<h3>Standards we hold to</h3>\n<ul>\n${specs}\n</ul>` : ''}
    </section>

    ${focus ? `<section id="commercial">\n<h2>Commercial work in this market</h2>\n<ul>\n${focus}\n</ul>\n</section>` : ''}
${proofSection(domain, profile, sites, summary)}

    <section id="contact">
      <h2>Talk to us about ${esc(article(profile.primaryRegion))}${esc(profile.primaryRegion || '')} project</h2>
      <p>One contractor, one point of contact, across every location in a
      portfolio. Call ${esc(profile.phoneDisplay || '')} or
      <a href="https://www.jwordenasphaltpaving.com/request-estimate">request an estimate</a>.</p>
    </section>
  </main>
  ${jsonLd(domain, profile, sites)}`
}

export { MARKET_STATES }
