#!/usr/bin/env node
/**
 * state-reach-report.mjs
 *
 * Reports current US jurisdiction coverage and a prioritized expansion queue.
 * Uses src/lib/states50.js as source of truth.
 */

import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const statesMod = await import(pathToFileURL(resolve(process.cwd(), 'src/lib/states50.js')).href)

const STATE_MAP = statesMod.STATE_MAP || {}
const WORDEN_ACTIVE_STATES = statesMod.WORDEN_ACTIVE_STATES || []

const allCodes = Object.keys(STATE_MAP).sort()
const activeSet = new Set(WORDEN_ACTIVE_STATES)

const total = allCodes.length
const activeCount = WORDEN_ACTIVE_STATES.length
const inactiveCodes = allCodes.filter((abbr) => !activeSet.has(abbr))
const coveragePct = total > 0 ? Number(((activeCount / total) * 100).toFixed(2)) : 0

const densityRank = { high: 3, medium: 2, low: 1 }
const priorityCandidates = inactiveCodes
  .map((abbr) => ({ abbr, ...STATE_MAP[abbr] }))
  .sort((a, b) => {
    const densityDelta = (densityRank[b.qsrDensity] || 0) - (densityRank[a.qsrDensity] || 0)
    if (densityDelta !== 0) return densityDelta
    return (b.laborIndex || 0) - (a.laborIndex || 0)
  })
  .slice(0, 12)
  .map((s) => ({
    abbr: s.abbr,
    name: s.name,
    region: s.region,
    qsrDensity: s.qsrDensity,
    laborIndex: s.laborIndex,
    materialPremium: s.materialPremium,
  }))

const byRegion = {}
for (const abbr of allCodes) {
  const s = STATE_MAP[abbr]
  if (!s) continue
  const region = s.region || 'Unknown'
  if (!byRegion[region]) byRegion[region] = { total: 0, active: 0 }
  byRegion[region].total += 1
  if (activeSet.has(abbr)) byRegion[region].active += 1
}

const report = {
  generatedAt: new Date().toISOString(),
  totalJurisdictions: total,
  activeJurisdictions: activeCount,
  inactiveJurisdictions: inactiveCodes.length,
  coveragePct,
  activeStates: WORDEN_ACTIVE_STATES,
  expansionPriority: priorityCandidates,
  regionCoverage: byRegion,
}

console.log(JSON.stringify(report, null, 2))
