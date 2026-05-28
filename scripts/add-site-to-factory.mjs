import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const manifestPath = path.resolve(__dirname, '../src/config/siteFactoryManifest.json')

const VALID_MODES = new Set(['full-site', 'market-landing', 'operations'])

function parseArgs(argv) {
  const args = {}
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue
    const [key, ...rest] = raw.slice(2).split('=')
    args[key] = rest.join('=').trim()
  }
  return args
}

function requireArg(args, key) {
  const value = String(args[key] || '').trim()
  if (!value) {
    throw new Error(`Missing required argument --${key}=...`)
  }
  return value
}

function toKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function normalizeDomain(domain) {
  return String(domain || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.+$/, '')
}

function ensureHex(value, fallback) {
  const candidate = String(value || '').trim()
  return /^#[0-9a-fA-F]{6}$/.test(candidate) ? candidate : fallback
}

function loadManifest() {
  const raw = fs.readFileSync(manifestPath, 'utf8')
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed.profiles)) parsed.profiles = []
  if (!parsed.hostnames || typeof parsed.hostnames !== 'object') parsed.hostnames = {}
  return parsed
}

function writeManifest(manifest) {
  const normalized = {
    profiles: [...manifest.profiles].sort((a, b) => String(a.key).localeCompare(String(b.key))),
    hostnames: Object.fromEntries(
      Object.entries(manifest.hostnames).sort(([a], [b]) => a.localeCompare(b))
    ),
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(normalized, null, 2)}\n`)
}

try {
  const args = parseArgs(process.argv.slice(2))

  const key = toKey(requireArg(args, 'key'))
  const label = requireArg(args, 'label')
  const domain = normalizeDomain(requireArg(args, 'domain'))
  const routeMode = String(args.mode || 'market-landing').trim().toLowerCase()

  if (!VALID_MODES.has(routeMode)) {
    throw new Error('Invalid --mode value. Use one of: full-site, market-landing, operations')
  }

  const manifest = loadManifest()

  if (manifest.profiles.some((profile) => profile.key === key)) {
    throw new Error(`Profile key already exists: ${key}`)
  }
  if (manifest.hostnames[domain] || manifest.hostnames[`www.${domain}`]) {
    throw new Error(`Domain already mapped in factory manifest: ${domain}`)
  }

  const profile = {
    key,
    label,
    canonicalUrl: `https://www.${domain}`,
    primaryColor: ensureHex(args.primaryColor, '#13283a'),
    accentColor: ensureHex(args.accentColor, '#f0b429'),
    routeMode,
    enableChatWidget: String(args.enableChatWidget || 'false').toLowerCase() === 'true',
  }

  if (routeMode === 'market-landing') {
    const marketName = String(args.marketName || label).trim()
    const primaryRegion = String(args.region || 'Target Region').trim()
    const primaryMetro = String(args.metro || 'Target Metro').trim()

    profile.market = {
      marketName,
      primaryRegion,
      primaryMetro,
      heroKicker: String(args.heroKicker || 'Verified Job Photos').trim(),
      heroHeadline: String(args.heroHeadline || `${marketName} Built For Local Conditions`).trim(),
      heroBody: String(
        args.heroBody ||
          'Commercial lots and residential drives with documented prep, clear scope, and practical scheduling.'
      ).trim(),
      ctaLabel: String(args.ctaLabel || 'Call For Local Estimate').trim(),
      phoneDisplay: String(args.phone || '804-446-1296').trim(),
      proofHeadline: String(args.proofHeadline || 'Recent Verified Work').trim(),
      geo: {
        region: String(args.geoRegion || 'US-VA').trim(),
        placename: String(args.geoPlacename || 'Chester, Virginia').trim(),
        position: String(args.geoPosition || '37.3563;-77.4411').trim(),
        icbm: String(args.geoIcbm || '37.3563, -77.4411').trim(),
      },
    }
  }

  manifest.profiles.push(profile)
  manifest.hostnames[domain] = key
  manifest.hostnames[`www.${domain}`] = key

  writeManifest(manifest)

  console.log('Factory site profile added successfully.')
  console.log(` - key: ${key}`)
  console.log(` - domain: ${domain}`)
  console.log(` - mode: ${routeMode}`)
  console.log('Next: run npm run guard:site-isolation && npm run build')
} catch (error) {
  console.error(`add-site-to-factory failed: ${error.message}`)
  process.exit(1)
}
