/**
 * Retired phone numbers must never reach a published page.
 *
 * 804-822-7715 was disconnected for years and was still being served on every
 * Texas brand page, in the header, the footer, the tel: link and the JSON-LD.
 * It survived because it was the HARDCODED FALLBACK inside build-brand-sites.mjs
 * — typed as a literal into three separate template strings — so any brand
 * without an explicit phoneDisplay silently inherited a dead line.
 *
 * A wrong phone number is the most expensive possible defect on a lead-
 * generation site: the page ranks, the customer calls, and nothing happens. It
 * also poisons NAP consistency, which local search depends on.
 *
 * Add a number here the day it is retired.
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/** Numbers no longer in service. Digits only. */
export const RETIRED = ['8048227715']

const digits = (s) => String(s).replace(/\D/g, '')

function sourceFiles() {
  const out = execFileSync('git', ['ls-files',
    '*.js', '*.jsx', '*.mjs', '*.json', '*.py', '*.html'], { cwd: ROOT }).toString().trim()
  return out ? out.split('\n').filter(f => !f.startsWith('dist/')) : []
}

test('no retired number appears in any source file', () => {
  const offenders = []
  for (const rel of sourceFiles()) {
    const full = path.join(ROOT, rel)
    let text
    try { text = fs.readFileSync(full, 'utf-8') } catch { continue }
    // Strip comments so the note explaining the retirement does not trip this.
    const code = text
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/^\s*(\/\/|#).*$/gm, ' ')
    const flat = digits(code)
    for (const num of RETIRED) {
      if (flat.includes(num)) offenders.push(`${rel} contains ${num}`)
    }
  }
  assert.deepEqual(offenders, [], `retired numbers still in source:\n${offenders.join('\n')}`)
})

test('no retired number reaches a built brand page', () => {
  const dir = path.join(ROOT, 'dist/brands')
  if (!fs.existsSync(dir)) return // dist not built in every lane
  const offenders = []
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.name.endsWith('.html')) {
        const flat = digits(fs.readFileSync(full, 'utf-8'))
        for (const num of RETIRED) {
          if (flat.includes(num)) offenders.push(path.relative(ROOT, full))
        }
      }
    }
  }
  walk(dir)
  assert.deepEqual(offenders, [], `retired numbers on built pages:\n${offenders.slice(0, 10).join('\n')}`)
})

test('every brand resolves to a real, non-retired number', async () => {
  const { REGIONAL_MARKET_PROFILES: P } =
    await import(path.join(ROOT, 'src/data/regionalMarketProfiles.js'))
  const { PHONE_DISPLAY } = await import(path.join(ROOT, 'src/lib/businessInfo.canonical.js'))

  for (const [domain, profile] of Object.entries(P)) {
    const resolved = digits(profile.phoneDisplay || PHONE_DISPLAY)
    assert.equal(resolved.length, 10, `${domain}: ${resolved} is not 10 digits`)
    assert.ok(!RETIRED.includes(resolved), `${domain} resolves to a retired number`)
  }
})
