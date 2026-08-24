/**
 * nap-syndication.mjs — the NAP payload, ready to submit.
 *
 * WHAT THIS SCRIPT USED TO DO, AND WHY THAT WAS NOT ACCEPTABLE
 * ───────────────────────────────────────────────────────────
 * It printed, for each of Bing Places, Yelp, Apple Business Connect and
 * BrightLocal:
 *
 *     [OK] Successfully overwrote mismatched listings on Bing Places API
 *
 * after awaiting `new Promise(resolve => setTimeout(resolve, 800))`. No request
 * was made. No API was contacted. There were no credentials for any of the four.
 * The endpoints were listed in the source and never called.
 *
 * An operator running that saw four green confirmations and reasonably
 * concluded his listings were fixed. They were not, and — because the file it
 * read was the fabricated one — what it claimed to have syndicated was
 * "123 Paving Way, 804-555-0199" anyway. A tool that reports success it did not
 * achieve is worse than no tool: it removes the thing from the operator's list.
 *
 * WHAT IT DOES NOW
 * ────────────────
 * Emits the exact NAP payload, validates it, and says plainly that nothing has
 * been submitted and where each one has to be submitted by hand. Directory
 * submission genuinely does need a human — Google Business Profile requires
 * postcard or video verification, Apple requires a signed-in business owner,
 * Yelp requires claiming the page. There is no API that gets around that, so
 * pretending otherwise was never going to become true.
 *
 * Run: node scripts/nap-syndication.mjs
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const NAP_FILE = resolve(ROOT, 'src/data/napProfile.json')

/** Patterns that mean a field was never filled in. */
const PLACEHOLDER = [
  /\b555-01\d\d\b/,           // the reserved-for-fiction phone range
  /\b123 [A-Z][a-z]+ (Way|St|Street|Rd|Road|Ave)\b/i,
  /\b(123456789|987654321|000000000)\b/,
  /\b(your|example|placeholder|lorem|tbd|xxx)\b/i,
]

function validate(nap) {
  const problems = []
  const flat = JSON.stringify(nap)

  for (const pattern of PLACEHOLDER) {
    const hit = flat.match(pattern)
    if (hit) problems.push(`placeholder value still present: ${hit[0]}`)
  }
  for (const [path, value] of [
    ['businessName', nap.businessName],
    ['address.street', nap.address?.street],
    ['address.city', nap.address?.city],
    ['address.state', nap.address?.state],
    ['address.zipCode', nap.address?.zipCode],
    ['phone', nap.phone],
  ]) {
    if (!String(value || '').trim()) problems.push(`${path} is empty`)
  }
  if (nap.phone && !/^\+1-\d{3}-\d{3}-\d{4}$/.test(nap.phone)) {
    problems.push(`phone is not in the E.164-with-dashes form directories expect: ${nap.phone}`)
  }
  return problems
}

/** Where each listing actually has to be done, and by whom. */
const DIRECTORIES = [
  { name: 'Google Business Profile', url: 'https://business.google.com/', note: 'The one that matters most. Verification is by postcard, phone or video — no API path.' },
  { name: 'Bing Places', url: 'https://www.bingplaces.com/', note: 'Can import from Google Business Profile once that is verified.' },
  { name: 'Apple Business Connect', url: 'https://businessconnect.apple.com/', note: 'Requires a signed-in business owner. Feeds Apple Maps and Siri.' },
  { name: 'Yelp', url: 'https://biz.yelp.com/', note: 'The existing page must be claimed before it can be corrected.' },
  { name: 'Facebook Page', url: 'https://www.facebook.com/jwordenpaving/', note: 'Page already exists — check the About block matches exactly.' },
  { name: 'BBB', url: 'https://www.bbb.org/', note: 'Profile is live. Correct the address there; it is a widely-scraped citation.' },
  { name: 'Angi', url: 'https://www.angi.com/', note: 'Profile is live and carries the old details.' },
  { name: 'Houzz', url: 'https://www.houzz.com/', note: 'Profile is live. Four Best of Houzz awards are on it.' },
]

const nap = JSON.parse(readFileSync(NAP_FILE, 'utf8'))
const problems = validate(nap)

console.log('NAP payload — the three facts every directory must agree on\n')
console.log(`  Name    ${nap.businessName}`)
console.log(`  Address ${nap.address.street}`)
console.log(`          ${nap.address.city}, ${nap.address.state} ${nap.address.zipCode}`)
console.log(`  Phone   ${nap.phone}`)
console.log(`  Site    ${nap.website}`)
console.log(`  Founded ${nap.foundingYear}`)

if (problems.length) {
  console.error('\nNOT READY TO SUBMIT:')
  for (const problem of problems) console.error(`  - ${problem}`)
  console.error('\nFix src/lib/businessInfo.canonical.js, then re-run scripts/build-nap-profile.mjs.')
  process.exit(1)
}

console.log('\nValidated. NOTHING HAS BEEN SUBMITTED — this script contacts no API.')
console.log('Each of these has to be done by a signed-in human. Use the exact values above:\n')
for (const d of DIRECTORIES) {
  console.log(`  ${d.name}`)
  console.log(`    ${d.url}`)
  console.log(`    ${d.note}\n`)
}
console.log('Consistency is the whole point. A directory that disagrees is not neutral —')
console.log('it is evidence Google cannot resolve which business this is.')
