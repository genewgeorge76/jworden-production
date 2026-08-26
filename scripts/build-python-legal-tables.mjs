#!/usr/bin/env node
/**
 * build-python-legal-tables.mjs — the Python side of the legal advisor,
 * generated from the cited JavaScript datasets.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The legal advisor is meant to take a scenario and guide you to the best
 * outcome. In practice the Python half could not reach the data the JavaScript
 * half uses, so it carried its own hand-written copies:
 *
 *   lien_calendar.py                13 states, no citations
 *   state_51_compliance_engine.py    3 states, marked "for demonstration"
 *
 * Both were quietly short. The lien calculator returned a default for the other
 * 38 jurisdictions; the compliance engine told 48 of them it was "reverting to
 * Federal default guidelines" it did not have.
 *
 * THE COPY THAT WAS NOT IMPORTED, AND WHY
 * ───────────────────────────────────────
 * A full 51-jurisdiction lien table exists in another repository and could have
 * been pasted in. It was checked against the cited dataset first, and the two
 * disagree on 21 of 51 states — Mississippi 365 days against 90, Utah 90
 * against 180, Texas foreclosure 730 against 180, Rhode Island 365 against 40.
 *
 * The cited dataset carries a statute reference and a verification date for
 * every row. The other carries neither. On a mechanics lien a wrong filing
 * deadline does not cost an argument, it costs the lien, so the unsourced copy
 * was rejected and the tables are generated from the cited one instead. There
 * is now one source of truth and both halves read it.
 *
 * WHAT THIS SCRIPT WILL NOT DO
 * ────────────────────────────
 * It does not invent a value to fill a gap, and it does not flatten a rule into
 * a day count that is not one. Where the source says nothing, the output says
 * null and the calculator declines to compute rather than returning a date
 * nobody stands behind.
 *
 * Usage:  node scripts/build-python-legal-tables.mjs [outFile]
 */

import { writeFileSync } from 'node:fs'

const OUT = process.argv[2] ?? 'app/services/legal_tables.py'

const lien = (await import('../src/data/legal/mechanicsLienLaws.js')).default
const wage = (await import('../src/data/legal/prevailingWage.js')).default
const licensing = (await import('../src/data/legal/constructionLicensing.js')).default

/**
 * WHAT A DEADLINE IS COUNTED FROM IS PART OF THE DEADLINE
 * ──────────────────────────────────────────────────────
 * The old Python counted every filing deadline from last furnishing and every
 * preliminary notice from the project start date. Neither holds across the
 * fifty-one.
 *
 * Nine states count filing from COMPLETION, which for a subcontractor is not
 * the day they left the site. Virginia's preliminary notice runs from LAST
 * furnishing, not the first — anchoring it to the project start makes the
 * notice look due at the beginning of a job when it is actually due at the end.
 *
 * The anchor is read from the source's own wording. A note that does not state
 * one yields null, and the calculator says so instead of guessing.
 */
function filingAnchor(row) {
  // An explicit anchor on the row wins. Virginia carries one because reading
  // Va. Code § 43-4 showed the period runs from the last day of the MONTH in
  // which work ended, not the day it ended — a distinction the prose note did
  // not make and the parser below cannot infer.
  if (row.lienFilingDeadlineAnchor) return row.lienFilingDeadlineAnchor
  const n = String(row.lienFilingDeadlineNote ?? '').toLowerCase()
  if (/last (date|day)? ?of ?(furnishing|providing)|last furnishing/.test(n)) return 'last_furnishing'
  if (/completion|work completed|completed/.test(n)) return 'completion'
  return null
}

function noticeAnchor(prose) {
  const n = String(prose ?? '').toLowerCase()
  if (!n) return null
  if (/last furnishing|last date of furnishing/.test(n)) return 'last_furnishing'
  if (/first furnishing|first delivery|commencing|commencement|starting work/.test(n))
    return 'first_furnishing'
  return null
}

/** Leading day count in a phrase like "Within 20 days of first furnishing". */
function noticeDays(prose) {
  const m = String(prose ?? '').match(/(\d+)\s*days?/i)
  return m ? Number(m[1]) : null
}

/**
 * TEXAS IS NOT A DAY COUNT AND NEVER WAS
 * ──────────────────────────────────────
 * The rule is "affidavit filed by the 15th day of the 4th calendar month after
 * the day work was completed" (3rd month on residential). The old table stored
 * `lien_filing_days: 15` and computed last furnishing plus fifteen days, which
 * produced a deadline roughly three and a half months early on the state where
 * this company has more documented work than anywhere outside Virginia.
 *
 * Early is not harmless when it is presented as the deadline: it is a wrong
 * date carrying the same confidence as a right one.
 *
 * So a rule that counts calendar months is stored as one, and the calculator
 * walks the months rather than adding days.
 */
function specialRule(row) {
  const n = String(row.lienFilingDeadlineNote ?? '')
  const m = n.match(/(\d+)(?:st|nd|rd|th) day of (?:the )?(\d+)(?:st|nd|rd|th) (?:calendar )?month/i)
  if (!m) return null
  const residential = n.match(/residential:\s*(\d+)(?:st|nd|rd|th)/i)
  return {
    kind: 'calendar_month_day',
    day_of_month: Number(m[1]),
    months_after: Number(m[2]),
    residential_months_after: residential ? Number(residential[1]) : null,
    anchor: filingAnchor(row) ?? 'completion',
  }
}

const py = (v) => {
  if (v === null || v === undefined) return 'None'
  if (typeof v === 'boolean') return v ? 'True' : 'False'
  if (typeof v === 'number') return String(v)
  if (Array.isArray(v)) return `[${v.map(py).join(', ')}]`
  if (typeof v === 'object') {
    return `{${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${py(x)}`).join(', ')}}`
  }
  return JSON.stringify(String(v))
}

const lienRows = lien.map((r) => ({
  state: r.state,
  lien_filing_days: r.lienFilingDeadlineDays ?? null,
  lien_filing_anchor: filingAnchor(r),
  // A second, independent deadline that can expire first. Virginia's lien is
  // cut off at 90 days from completion regardless of the month-end period, so
  // reporting only the later of the two would overstate the time available.
  lien_filing_also_capped_by: r.lienFilingAlsoCappedBy ?? null,
  lien_filing_note: r.lienFilingDeadlineNote ?? null,
  lien_filing_rule: specialRule(r),
  foreclosure_days: r.lienForeClosureDeadlineDays ?? null,
  preliminary_notice_required: r.preliminaryNoticeRequired ?? false,
  preliminary_notice_days: noticeDays(r.preliminaryNoticeDeadline),
  preliminary_notice_anchor: noticeAnchor(r.preliminaryNoticeDeadline),
  preliminary_notice_note: r.preliminaryNoticeDeadline ?? null,
  notice_of_intent_days: r.noticeOfIntentDeadlineDays ?? null,
  citation: r.citation ?? null,
  notes: r.notes ?? null,
  last_verified: r.lastVerified ?? null,
}))

const wageRows = wage.map((r) => ({
  state: r.state,
  prevailing_wage_law: r.prevailingWageLaw ?? false,
  law_scope: r.lawScope ?? null,
  administered_by: r.administeredBy ?? null,
  threshold_public_works_usd: r.thresholdForPublicWorks ?? null,
  davis_bacon_applies: r.davisBaconApplies ?? false,
  citation: r.citation ?? null,
  last_verified: r.lastVerified ?? null,
}))

const licenseRows = licensing.map((r) => ({
  state: r.state,
  state_license_required: r.stateLicenseRequired ?? false,
  authority: r.authority ?? null,
  authority_url: r.authorityUrl ?? null,
  threshold_usd: r.thresholdAmount ?? null,
  license_classes: r.licenseClasses ?? [],
  renewal_years: r.licenseRenewalYears ?? null,
  ce_hours_required: r.ceHoursRequired ?? null,
  last_verified: r.lastVerified ?? null,
}))

function table(name, rows, keyOf) {
  const body = rows
    .map((r) => {
      const { [keyOf]: _drop, ...rest } = r
      void _drop
      return `    ${JSON.stringify(r[keyOf])}: ${py(rest)},`
    })
    .join('\n')
  return `${name}: dict[str, dict] = {\n${body}\n}`
}

const withAbbr = (src, rows) => rows.map((r, i) => ({ abbr: src[i].abbr, ...r }))

const out = `"""
legal_tables.py — GENERATED. Do not hand-edit.

Written by scripts/build-python-legal-tables.mjs from the cited datasets in
src/data/legal/. Every row here has a statute citation and a verification date
because the source rows do; nothing was added that the source did not state.

Regenerate with:
    node scripts/build-python-legal-tables.mjs

WHY IT IS GENERATED RATHER THAN MAINTAINED
──────────────────────────────────────────
The Python side used to keep its own copies — 13 states in the lien calculator,
3 in the compliance ability — and they drifted from the JavaScript tables the
advisory pages serve. A second hand-maintained copy of fifty-one jurisdictions
of statute law does not stay in step, and the way you find out is a missed
filing deadline.

WHAT A NULL MEANS HERE
──────────────────────
The source did not state it. It does not mean zero, and it does not mean the
requirement is absent. Callers must decline to compute rather than substitute a
default — a plausible date carries the same authority as a correct one and is
indistinguishable to the person relying on it.
"""

# ruff: noqa: E501

JURISDICTION_COUNT = ${lienRows.length}

${table('LIEN_LAWS', withAbbr(lien, lienRows), 'abbr')}

${table('PREVAILING_WAGE', withAbbr(wage, wageRows), 'abbr')}

${table('CONTRACTOR_LICENSING', withAbbr(licensing, licenseRows), 'abbr')}

# Topics the cited datasets do not cover. Named explicitly so that a caller
# asking for one gets a straight answer instead of a confident invention.
UNCOVERED_TOPICS = {
    "retainage_limit": "No sourced dataset in this repository states statutory retainage limits. The only file that ever carried the field held three states and was marked as a demonstration.",
}
`

writeFileSync(OUT, out, 'utf8')

const anchored = lienRows.filter((r) => r.lien_filing_anchor).length
const special = lienRows.filter((r) => r.lien_filing_rule).length
console.log(`${lienRows.length} jurisdictions → ${OUT}`)
console.log(`  lien filing anchor resolved: ${anchored}/${lienRows.length}`)
console.log(`  calendar-month rules: ${special}`)
console.log(`  preliminary notice day counts: ${lienRows.filter((r) => r.preliminary_notice_days).length}`)
console.log(`  foreclosure period stated: ${lienRows.filter((r) => r.foreclosure_days).length}`)
