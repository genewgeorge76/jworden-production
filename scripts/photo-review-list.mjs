/**
 * photo-review-list.mjs — build the owner's review queue for photo-derived pins.
 *
 * WHY THIS EXISTS
 *
 * 287 locations are published on the public footprint map and cited as proof on
 * the regional domains, and not one of them has been confirmed by the owner as
 * actual work. Four have already turned out to be personal — three of his homes
 * and a family visit to the Outer Banks that shipped as ten job sites with
 * coordinates. Each was caught by him reading his own website.
 *
 * scripts/verify-photo-approvals.mjs can make that impossible, but only in
 * "strict" mode, and strict mode needs an approved list. This builds the queue
 * to produce one.
 *
 * WHY IT IS ORDERED BY RISK RATHER THAN ALPHABETICALLY
 *
 * Reviewing 287 rows in city order means the dangerous entries are scattered
 * through hundreds of obvious ones, and attention runs out before they turn up.
 * So the ordering front-loads whatever looks like the mistakes already found.
 *
 * The signature of a personal location, taken from the four real cases:
 *
 *   residential            a job site with a business name is checkable; a
 *                          nameless residential pin is where personal
 *                          locations hide
 *   long date span         work happens over days or weeks. Photographs at one
 *                          address spread across seasons or years is somewhere
 *                          he returns to — a home, or a place he holidays
 *   high photograph count  92 photographs at one address in Kill Devil Hills
 *                          looked exactly like a large job; it was a holiday
 *   no address or place    nothing a reader could check
 *
 * None of these is proof on its own. A big residential repave photographed over
 * two visits scores high and is perfectly real. The score decides reading order,
 * nothing else — every row still needs a human answer.
 */

import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function parseExifDate(raw) {
  const m = /^(\d{4}):(\d{2}):(\d{2})/.exec(raw || '')
  return m ? new Date(`${m[1]}-${m[2]}-${m[3]}`) : null
}

function spanDays(site) {
  const a = parseExifDate(site.first_seen)
  const b = parseExifDate(site.last_seen)
  if (!a || !b) return 0
  return Math.round((b - a) / 86400000)
}

function fmt(raw) {
  const d = parseExifDate(raw)
  return d ? d.toISOString().slice(0, 10) : '?'
}

export function siteId(site) {
  const lat = Number(site?.lat)
  const lon = Number(site?.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return `${lat.toFixed(4)},${lon.toFixed(4)}`
}

export function riskScore(site) {
  const days = spanDays(site)
  const photos = site.photo_count || 0
  let score = 0
  const why = []

  if (site.kind !== 'commercial') {
    score += 2
    why.push('residential')
  }
  if (days > 180) {
    score += 2
    why.push(`photographed across ${days} days`)
  } else if (days > 30) {
    score += 1
    why.push(`photographed across ${days} days`)
  }
  if (photos >= 40) {
    score += 2
    why.push(`${photos} photographs`)
  } else if (photos >= 20) {
    score += 1
    why.push(`${photos} photographs`)
  }
  if (!site.address && !site.place) {
    score += 1
    why.push('no address or business name')
  }
  return { score, why }
}

function main() {
  const sites = JSON.parse(
    fs.readFileSync(path.join(root, 'src', 'data', 'jobSites.json'), 'utf8')
  ).sites
  const approvals = JSON.parse(
    fs.readFileSync(path.join(root, 'src', 'data', 'photoApprovals.json'), 'utf8')
  )
  const approved = new Set((approvals.approved || []).map((a) => (typeof a === 'string' ? a : a.id)))

  const rows = sites
    .map((s) => ({ site: s, id: siteId(s), ...riskScore(s) }))
    .filter((r) => r.id && !approved.has(r.id))
    .sort((a, b) => b.score - a.score || (b.site.photo_count || 0) - (a.site.photo_count || 0))

  const outDir = process.argv.find((a) => a.startsWith('--out='))?.slice(6) || root

  // ── Markdown, for reading and ticking ──────────────────────────────────────
  const md = []
  md.push('# Job site review — which of these are real work?')
  md.push('')
  md.push(`${rows.length} locations, none confirmed yet. Every one is currently published`)
  md.push('on the public footprint map and can be cited as proof on the regional sites.')
  md.push('')
  md.push('**Mark each line `K` to keep or `R` to remove.** Anything you mark `R` gets')
  md.push('deleted from the map and permanently blocked from coming back. Anything you')
  md.push('mark `K` becomes owner-approved.')
  md.push('')
  md.push('Ordered by how much it looks like the mistakes already found — your homes and')
  md.push('the Outer Banks trip were all residential, photographed over long periods, with')
  md.push('a lot of images and no business name. **The top of this list is where any')
  md.push('remaining personal locations almost certainly are.** The bottom is mostly named')
  md.push('commercial sites you will recognise instantly.')
  md.push('')
  md.push('A high score is not an accusation — a big driveway shot over two visits scores')
  md.push('the same. It only decides reading order.')
  md.push('')

  let lastBand = null
  for (const r of rows) {
    const band = r.score >= 5 ? 'CHECK THESE FIRST' : r.score >= 3 ? 'WORTH A LOOK' : 'LIKELY FINE'
    if (band !== lastBand) {
      md.push('')
      md.push(`## ${band}`)
      md.push('')
      lastBand = band
    }
    const s = r.site
    const name = s.place || s.address || `${s.city}`
    md.push(
      `- [ ] **${name}** — ${s.city}, ${s.state} · ${s.photo_count || 0} photos · ` +
        `${fmt(s.first_seen)} to ${fmt(s.last_seen)}` +
        `${r.why.length ? ` · _${r.why.join(', ')}_` : ''}  \n` +
        `      \`${r.id}\` · [map](https://www.google.com/maps?q=${r.id})`
    )
  }
  md.push('')
  md.push('---')
  md.push('')
  md.push('Send this back however is easiest — the marked file, a photo of it, or just the')
  md.push('rows to remove. I will apply it to the approval list and switch the guard to')
  md.push('strict, so nothing publishes again without your say-so.')

  fs.writeFileSync(path.join(outDir, 'job-site-review.md'), md.join('\n'))

  // ── CSV, for anyone who would rather use a spreadsheet ─────────────────────
  const csv = ['keep_or_remove,name,city,state,photos,first_seen,last_seen,days,kind,risk,id,map']
  for (const r of rows) {
    const s = r.site
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    csv.push(
      [
        '', cell(s.place || s.address || s.city), cell(s.city), cell(s.state),
        s.photo_count || 0, fmt(s.first_seen), fmt(s.last_seen), spanDays(s),
        cell(s.kind), r.score, cell(r.id),
        cell(`https://www.google.com/maps?q=${r.id}`),
      ].join(',')
    )
  }
  fs.writeFileSync(path.join(outDir, 'job-site-review.csv'), csv.join('\n'))

  const high = rows.filter((r) => r.score >= 5).length
  const mid = rows.filter((r) => r.score >= 3 && r.score < 5).length
  console.log(
    `[review-list] ${rows.length} unapproved location(s): ${high} check first, ${mid} worth a look, ` +
      `${rows.length - high - mid} likely fine.`
  )
  console.log(`[review-list] wrote job-site-review.md and job-site-review.csv to ${outDir}`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
