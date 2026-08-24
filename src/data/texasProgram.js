/**
 * texasProgram.js — the Texas work, and the file each figure came out of.
 *
 * WHY THIS IS NOT DRAWN FROM jobSites.json
 * ────────────────────────────────────────
 * jobSites.json has no build script and disagrees with the photographs in this
 * repository — it claims one Georgia site while twenty geotagged Atlanta images
 * exist. A page that sells a market on unverifiable entries is the same mistake
 * as the fabricated store database that was served on every domain until it was
 * deleted.
 *
 * These figures come from the Project Red invoice tracker
 * (Updated_Invoice_tracker_TXNJQUADS_4317.xlsx, TX tab), read by
 * app/services/job_ledger.py. Only rows carrying an invoice number, a submitted
 * date or an amount are counted; rows with an address and nothing else are not.
 *
 * THE ADVANCE AND THE FINAL ARE NOT ADDED
 * ───────────────────────────────────────
 * That sheet bills in two stages. Greenville reads advance 17,949, final
 * 17,949, total 17,949 — one job billed twice, not $35,898. Every value below
 * is the row's own "Total amount of job", which is what both parties agreed the
 * job was worth. Seven of these were checked against the operator's independent
 * reading of the same file and matched to the cent.
 *
 * THE CLIENT IS NOT NAMED HERE
 * ────────────────────────────
 * The programme was run for a national QSR franchise operator. The brand is not
 * printed on a marketing page: the relationship is the client's to disclose,
 * and there is nothing about the work that needs their name to be impressive.
 */

/** Rows on the TX tab carrying invoice evidence. */
export const TX_INVOICED_JOBS = 23

/** Sum of "Total amount of job" across those rows. */
export const TX_INVOICED_VALUE_USD = 670039.0

/**
 * Every Texas city with an invoiced job, and what it was worth.
 *
 * Two entries appear twice — Brownsville, Laredo, Tyler and Waco each carried
 * two separate stores — and they are listed as they appear rather than merged,
 * because merging them would hide that the programme returned to those cities.
 */
export const TX_SITES = [
  { store: 'G135209', city: 'Greenville', value: 17949.0 },
  { store: 'G135210', city: 'Palestine', value: 19678.0 },
  { store: 'G135211', city: 'Harlingen', value: 51192.0 },
  { store: 'G135212', city: 'Laredo', value: 22894.0 },
  { store: 'G135213', city: 'Weslaco', value: 29867.0 },
  { store: 'G135215', city: 'Killeen', value: 11428.0 },
  { store: 'G135216', city: 'Waco', value: 11278.0 },
  { store: 'G135217', city: 'South Padre Island', value: 27780.0 },
  { store: 'G135220', city: 'Mission', value: 22712.0 },
  { store: 'G135224', city: 'Tyler', value: 7645.0 },
  { store: 'G135227', city: 'Temple', value: 22524.0 },
  { store: 'G135229', city: 'Edinburg', value: 37440.0 },
  { store: 'G135230', city: 'McAllen', value: 35049.0 },
  { store: 'G135231', city: 'Del Rio', value: 23345.0 },
  { store: 'G135232', city: 'Brownsville', value: 29205.0 },
  { store: 'G135233', city: 'Eagle Pass', value: 25621.0 },
  { store: 'G135234', city: 'Waco', value: 53748.0 },
  { store: 'G135235', city: 'San Benito', value: 31020.0 },
  { store: 'G135236', city: 'Tyler', value: 37438.0 },
  { store: 'G135237', city: 'Laredo', value: 35679.0 },
  { store: 'G135238', city: 'Pharr', value: 53675.0 },
  { store: 'G135239', city: 'Brownsville', value: 36500.0 },
  { store: 'G135240', city: 'Rio Grande City', value: 26372.0 },
]

/** Distinct cities, in the order they first appear. */
export const TX_CITIES = [...new Set(TX_SITES.map((s) => s.city))]

/**
 * The regions the work actually spans, which is the point of the whole thing:
 * a single contractor covering the Valley, the border, Central and East Texas
 * on one programme is a different proposition from a local paving outfit.
 */
export const TX_REGIONS = [
  {
    name: 'Rio Grande Valley',
    cities: ['Harlingen', 'McAllen', 'Mission', 'Pharr', 'Weslaco', 'Edinburg', 'San Benito', 'Brownsville', 'Rio Grande City'],
  },
  { name: 'Border', cities: ['Laredo', 'Del Rio', 'Eagle Pass'] },
  { name: 'Central Texas', cities: ['Waco', 'Temple', 'Killeen'] },
  { name: 'East & North Texas', cities: ['Tyler', 'Palestine', 'Greenville'] },
  { name: 'Gulf Coast', cities: ['South Padre Island'] },
]
