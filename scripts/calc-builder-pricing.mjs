import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const catalogPath = path.resolve(__dirname, '../site-blueprints/premium-addons-catalog.json')

function parseArgs(argv) {
  const args = {}
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue
    const [key, ...rest] = raw.slice(2).split('=')
    args[key] = rest.join('=').trim()
  }
  return args
}

function asCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

if (!fs.existsSync(catalogPath)) {
  console.error('Pricing calculator failed: premium add-ons catalog not found.')
  process.exit(1)
}

const args = parseArgs(process.argv.slice(2))
const rawCatalog = fs.readFileSync(catalogPath, 'utf8')
const catalog = JSON.parse(rawCatalog)

const addons = Array.isArray(catalog.addons) ? catalog.addons : []
if (!addons.length) {
  console.error('Pricing calculator failed: no add-ons in catalog.')
  process.exit(1)
}

if (String(args.list || '').toLowerCase() === 'true') {
  console.log('Available add-ons:')
  for (const addon of addons) {
    console.log(` - ${addon.key}: ${addon.name}`)
  }
  process.exit(0)
}

const selectedKeys = String(args.addons || '')
  .split('|')
  .map((v) => v.trim())
  .filter(Boolean)

if (!selectedKeys.length) {
  console.error('Usage: node scripts/calc-builder-pricing.mjs --addons=gbp-automation|keyword-blog-engine [--base-setup=2500] [--base-monthly=499]')
  process.exit(1)
}

const selected = []
const missing = []
for (const key of selectedKeys) {
  const addon = addons.find((item) => item.key === key)
  if (!addon) missing.push(key)
  else selected.push(addon)
}

if (missing.length > 0) {
  console.error(`Unknown add-ons: ${missing.join(', ')}`)
  process.exit(1)
}

const baseSetup = Number(args['base-setup'] || 2500)
const baseMonthly = Number(args['base-monthly'] || 499)
const currency = catalog.currency || 'USD'

const addonSetup = selected.reduce((sum, addon) => sum + Number(addon.setupFee || 0), 0)
const addonMonthly = selected.reduce((sum, addon) => sum + Number(addon.monthlyFee || 0), 0)
const totalSetup = baseSetup + addonSetup
const totalMonthly = baseMonthly + addonMonthly

console.log('Premium Builder Pricing Summary')
console.log(`Base Setup: ${asCurrency(baseSetup, currency)}`)
console.log(`Base Monthly: ${asCurrency(baseMonthly, currency)}`)
console.log('Selected Add-ons:')
for (const addon of selected) {
  console.log(
    ` - ${addon.name}: setup ${asCurrency(Number(addon.setupFee || 0), currency)}, monthly ${asCurrency(Number(addon.monthlyFee || 0), currency)}`
  )
}
console.log(`Total Setup: ${asCurrency(totalSetup, currency)}`)
console.log(`Total Monthly: ${asCurrency(totalMonthly, currency)}`)
