import fs from 'node:fs'

const APP_PATH = 'src/App.jsx'
const PROFILES_PATH = 'src/lib/siteProfiles.js'
const MANIFEST_PATH = 'src/config/siteFactoryManifest.json'
const NETLIFY_PATH = 'netlify.toml'

const appSource = fs.readFileSync(APP_PATH, 'utf8')
const profilesSource = fs.readFileSync(PROFILES_PATH, 'utf8')
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
const netlify = fs.readFileSync(NETLIFY_PATH, 'utf8')

const integration = manifest.integration || {}
const canonicalBackend = String(integration?.canonicalBackend?.domain || '').replace(/\/$/, '')
const surfaces = Array.isArray(integration.surfaces) ? integration.surfaces : []

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const toOrigin = (value) => {
  try {
    return new URL(String(value || '')).origin.toLowerCase()
  } catch {
    return String(value || '').trim().toLowerCase()
  }
}

const backendOrigin = toOrigin(canonicalBackend)
const surfaceOrigins = surfaces
  .map((surface) => ({ repo: String(surface.repo || ''), origin: toOrigin(surface.domain) }))
  .filter((surface) => surface.origin)

const duplicateOrigins = new Set()
const seenOrigins = new Set()
for (const surface of surfaceOrigins) {
  if (seenOrigins.has(surface.origin)) duplicateOrigins.add(surface.origin)
  seenOrigins.add(surface.origin)
}

const checks = [
  {
    label: 'Site route modes are defined in site profile registry',
    ok: /SITE_ROUTE_MODES\s*=\s*\{[\s\S]*FULL_SITE[\s\S]*MARKET_LANDING[\s\S]*OPERATIONS/.test(profilesSource),
  },
  {
    label: 'App resolves route mode from site profile',
    ok: /const routeMode = siteProfile\.routeMode \|\| SITE_ROUTE_MODES\.FULL_SITE;/.test(appSource),
  },
  {
    label: 'Market landing route tree is isolated to root plus catch-all redirect',
    ok: /if \(isMarketLandingSite\) \{[\s\S]*<Route path="\/" element=\{<MarketLanding \/>\} \/>[\s\S]*<Route path="\*" element=\{<Navigate to="\/" replace \/>\} \/>/.test(appSource),
  },
  {
    label: 'Chat widget rendering is site-profile controlled',
    ok: /const shouldRenderChatWidget = Boolean\(siteProfile\.enableChatWidget\);/.test(appSource),
  },
  {
    label: 'Integration manifest defines canonical backend domain',
    ok: Boolean(backendOrigin),
  },
  {
    label: 'Netlify /api redirect points to canonical backend domain',
    ok: backendOrigin
      ? new RegExp(`\\[\\[redirects\\]\\][\\s\\S]*?from\\s*=\\s*"/api/\\*"[\\s\\S]*?to\\s*=\\s*"${escapeRegex(canonicalBackend)}/api/:splat"`).test(netlify)
      : false,
  },
  {
    label: 'No surface domain points at backend origin',
    ok: backendOrigin ? surfaceOrigins.every((surface) => surface.origin !== backendOrigin) : false,
  },
  {
    label: 'Integration surfaces have unique origins',
    ok: duplicateOrigins.size === 0,
  },
]

const failures = checks.filter((check) => !check.ok)

if (failures.length > 0) {
  console.error('Site isolation guard failed:')
  for (const failure of failures) {
    console.error(` - ${failure.label}`)
  }
  if (duplicateOrigins.size > 0) {
    console.error(` - Duplicate origins: ${[...duplicateOrigins].join(', ')}`)
  }
  process.exit(1)
}

console.log(`Site isolation guard passed (${surfaceOrigins.length} integration surfaces checked).`)
