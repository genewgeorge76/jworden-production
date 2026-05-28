import fs from 'node:fs'

const APP_PATH = 'src/App.jsx'
const PROFILES_PATH = 'src/lib/siteProfiles.js'

const appSource = fs.readFileSync(APP_PATH, 'utf8')
const profilesSource = fs.readFileSync(PROFILES_PATH, 'utf8')

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
]

const failures = checks.filter((check) => !check.ok)

if (failures.length > 0) {
  console.error('Site isolation guard failed:')
  for (const failure of failures) {
    console.error(` - ${failure.label}`)
  }
  process.exit(1)
}

console.log('Site isolation guard passed.')
