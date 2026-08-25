#!/usr/bin/env node
/**
 * build-kbp-map.mjs — a Google My Maps import for the KBP store footprint.
 *
 * WHY A CSV AND NOT A RENDERED MAP
 * ────────────────────────────────
 * These stores have street addresses and no coordinates. Plotting them would
 * mean geocoding, and geocoding from memory is exactly the kind of quiet
 * invention this repository exists to prevent — a pin two miles off looks
 * identical to a pin that is right.
 *
 * Google My Maps geocodes on import, using Google's own geocoder against the
 * real addresses. So the output is a CSV, the positions come from Google, and
 * nothing here guesses where anything is.
 *
 * THREE LAYERS, NOT ONE
 * ─────────────────────
 * The file is written as three separate CSVs so each becomes its own My Maps
 * layer with its own pin colour. That is the whole point: a single 138-pin
 * layer would claim 138 completed jobs, and only 29 of them are settled.
 *
 *   paid      29  KBP invoiced, received and settled it
 *   invoiced  34  billed and in the client's tracker, payment not shown
 *   listed    75  assigned to the programme, nothing more
 *
 * Store numbers stay OUT of the CSV. They are KBP's internal identifiers and
 * the join key to this company's invoices; they belong in the record, not on
 * a map that may be shared.
 *
 * Usage:  node scripts/build-kbp-map.mjs [outDir]
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { KBP_STORES, PAID, INVOICED, LISTED } from '../src/data/kbpStoreMap.js'

const outDir = process.argv[2] ?? 'private/map'

const LAYERS = [
  { grade: PAID, file: 'kbp-paid.csv', label: 'Invoiced and paid' },
  { grade: INVOICED, file: 'kbp-invoiced.csv', label: 'Invoiced' },
  { grade: LISTED, file: 'kbp-listed.csv', label: 'On the programme roster' },
]

/** RFC 4180: quote everything, double any embedded quote. */
const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
const row = (cells) => cells.map(cell).join(',')

const money = (usd) =>
  usd == null ? '' : `$${usd.toLocaleString('en-US', { minimumFractionDigits: 0 })}`

mkdirSync(outDir, { recursive: true })

let total = 0
for (const layer of LAYERS) {
  const stores = KBP_STORES.filter((s) => s.grade === layer.grade)
  const lines = [row(['Name', 'Address', 'City', 'State', 'Evidence', 'Job value'])]
  for (const s of stores) {
    lines.push(
      row([
        `KFC — ${s.city}, ${s.state}`,
        `${s.address}, ${s.city}, ${s.state}`,
        s.city,
        s.state,
        layer.label,
        money(s.usd),
      ]),
    )
  }
  writeFileSync(join(outDir, layer.file), lines.join('\n') + '\n', 'utf8')
  console.log(`${layer.file.padEnd(20)} ${String(stores.length).padStart(3)} pins — ${layer.label}`)
  total += stores.length
}

console.log(`\n${total} stores across ${new Set(KBP_STORES.map((s) => s.state)).size} states → ${outDir}/`)
console.log('Import each CSV as its own layer in Google My Maps and colour them separately.')
