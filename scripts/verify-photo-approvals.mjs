/**
 * verify-photo-approvals.mjs — the owner decides which photographs become pins.
 *
 * WHY THIS EXISTS
 *
 * Every pin on the public footprint map, and every "documented project" cited on
 * a regional domain, is derived from GPS coordinates inside photographs. The
 * pipeline that builds them cannot tell a photograph of a driveway you paved
 * from a photograph of a house you slept in — both are a cluster of images at a
 * coordinate, and the evidence floor that filters noise (four or more
 * photographs at one place) is exactly what a family holiday produces.
 *
 * That has now put personal locations on the public internet four times:
 *
 *   2026-08-09  three of the owner's own homes, caught by hand
 *   2026-08-11  a family visit to the Outer Banks, published as TEN job sites
 *               with coordinates on the public map and cited as proof on
 *               obxpaving.com — 183 photographs of a holiday sold as evidence
 *               of work
 *
 * Each time it was caught by the owner reading the site, not by the build. A
 * heuristic that fails this way does not get another chance to be clever; it
 * gets an approval list with a human name against every entry.
 *
 * WHAT IT ENFORCES
 *
 *   denied      Present in jobSites.json -> BUILD FAILS. This is the part that
 *               matters most: it stops a removed location silently returning
 *               through the next photo re-import, which is otherwise exactly
 *               what would happen.
 *
 *   approved    Confirmed by the owner as real work.
 *
 *   mode=warn   Unreviewed locations still publish; the build reports the
 *               backlog. Where we are today, with 287 sites never reviewed.
 *
 *   mode=strict Only approved locations publish. Anything unreviewed fails the
 *               build. The end state, once the queue is worked.
 *
 * Identity is the rounded coordinate pair rather than the city name, because a
 * city label can change under re-geocoding while the coordinates baked into a
 * photograph cannot.
 *
 * SCOPE LIMIT, stated plainly rather than implied: this guards build-time data
 * in src/data/jobSites.json. Gallery photographs served from the backend API at
 * runtime never pass through this script and are NOT protected by it. They need
 * the same approval gate on the backend before they can be trusted.
 */

import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sitesPath = path.join(root, 'src', 'data', 'jobSites.json')
const approvalsPath = path.join(root, 'src', 'data', 'photoApprovals.json')

/**
 * Stable identity for a photographed location.
 *
 * Four decimal places is roughly 11 metres — tight enough that two genuinely
 * different job sites never collide, loose enough that the same site re-imported
 * with marginally different EXIF rounding still matches the denial that was
 * recorded against it. Getting this wrong in the loose direction would let a
 * denied location back in under a slightly different coordinate, which is the
 * precise failure this file exists to prevent.
 */
export function siteId(site) {
  const lat = Number(site?.lat)
  const lon = Number(site?.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return `${lat.toFixed(4)},${lon.toFixed(4)}`
}

export function evaluate(sites, approvals) {
  const denied = new Map((approvals.denied || []).map((d) => [d.id, d]))
  const approved = new Set((approvals.approved || []).map((a) => (typeof a === 'string' ? a : a.id)))

  const violations = []
  const unreviewed = []
  const noCoords = []

  for (const site of sites) {
    const id = siteId(site)
    if (!id) {
      // A site with no coordinates cannot be identified, so it cannot be
      // approved or denied either. Surfaced rather than silently allowed.
      noCoords.push(site)
      continue
    }
    if (denied.has(id)) {
      violations.push({ site, id, entry: denied.get(id) })
      continue
    }
    if (!approved.has(id)) unreviewed.push({ site, id })
  }

  return { violations, unreviewed, noCoords }
}

function describe(site, id) {
  const where = [site.city, site.state].filter(Boolean).join(', ') || 'unknown location'
  const photos = site.photo_count ? `${site.photo_count} photographs` : 'unknown count'
  return `${where} (${photos}) at ${id}`
}

function main() {
  if (!fs.existsSync(approvalsPath)) {
    console.error('[photo-approvals] src/data/photoApprovals.json is missing — refusing to publish photo-derived locations without it.')
    process.exit(1)
  }
  if (!fs.existsSync(sitesPath)) {
    console.log('[photo-approvals] no jobSites.json — nothing to check.')
    return
  }

  const approvals = JSON.parse(fs.readFileSync(approvalsPath, 'utf8'))
  const sites = JSON.parse(fs.readFileSync(sitesPath, 'utf8')).sites || []
  const mode = (approvals.mode || 'warn').toLowerCase()

  const { violations, unreviewed, noCoords } = evaluate(sites, approvals)

  if (violations.length) {
    console.error('\n[photo-approvals] BUILD STOPPED — locations the owner has explicitly denied are back in jobSites.json:\n')
    for (const v of violations) {
      console.error(`  ✗ ${describe(v.site, v.id)}`)
      console.error(`      ${v.entry.label} — ${v.entry.reason}`)
    }
    console.error(
      '\nThese are personal locations, not job sites. They were removed once already.\n' +
        'If a re-import put them back, fix the import — do not delete the denial.\n'
    )
    process.exit(1)
  }

  if (noCoords.length) {
    console.warn(`[photo-approvals] ${noCoords.length} site(s) have no usable coordinates and cannot be checked.`)
  }

  if (mode === 'strict' && unreviewed.length) {
    console.error(`\n[photo-approvals] BUILD STOPPED — mode is "strict" and ${unreviewed.length} location(s) are not on the approved list:\n`)
    for (const u of unreviewed.slice(0, 25)) console.error(`  • ${describe(u.site, u.id)}`)
    if (unreviewed.length > 25) console.error(`  … and ${unreviewed.length - 25} more`)
    console.error('\nApprove them in src/data/photoApprovals.json, or set mode back to "warn".\n')
    process.exit(1)
  }

  const approvedCount = sites.length - unreviewed.length - noCoords.length
  console.log(
    `[photo-approvals] ok — ${sites.length} location(s), ${approvedCount} owner-approved, ` +
      `${unreviewed.length} awaiting review, ${(approvals.denied || []).length} denied and absent (mode: ${mode}).`
  )
  if (mode === 'warn' && unreviewed.length) {
    console.log(
      `[photo-approvals] ${unreviewed.length} location(s) publish without the owner having confirmed them. ` +
        'Switch mode to "strict" once reviewed to make that impossible.'
    )
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main()
