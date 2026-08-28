/**
 * documentedJobSites.js — named commercial jobs with a map location.
 *
 * Same doctrine as kbpStoreMap.js: a pin is a claim, so every pin carries the
 * evidence behind it and the precision of its placement. Two precisions:
 *
 *   exact  The documented street address, geocoded through the US Census
 *          geocoder (the same pipeline as kbpStoreCounties.json).
 *   city   The job is documented to a city but the street address is not in
 *          the published record, so the pin sits on the city and says so.
 *
 * Dollar amounts stay off this file — public cards do not carry contract
 * values. No customer PII: every site here is a business location already
 * named on the public client cards.
 *
 * Dollar Tree Charleston is deliberately absent: the job was not completed
 * (mobilization only, per the GC's 8/18 reconciliation) and is not publishable
 * as work.
 */

export const DOCUMENTED_JOB_SITES = [
  {
    id: 'planned-parenthood-richmond',
    client: 'Planned Parenthood',
    label: '11,480 sq ft lot resurface, wedge repair & ADA striping',
    city: 'Richmond',
    state: 'VA',
    year: 2026,
    lat: 37.559454,
    lng: -77.490859,
    precision: 'exact',
    evidence: 'Quotation QUOT3099 + certificate of insurance naming the client',
  },
  {
    id: 'capital-one-annandale',
    client: 'Capital One Bank #61458',
    label: 'Parking lot work, invoiced through the GC (PO 26566 + change order)',
    city: 'Annandale',
    state: 'VA',
    year: 2026,
    lat: 38.8304,
    lng: -77.1964,
    precision: 'city',
    evidence: 'Invoice against GC purchase order, acknowledged in writing',
  },
  {
    id: 'target-stuarts-draft',
    client: 'Target',
    label: 'Site work, invoiced through the GC (PO 26581)',
    city: 'Stuarts Draft',
    state: 'VA',
    year: 2026,
    lat: 38.0304,
    lng: -79.0328,
    precision: 'city',
    evidence: 'Invoice against GC purchase order, acknowledged in writing',
  },
  {
    id: 'hobby-lobby-danville',
    client: 'Hobby Lobby',
    label: 'Parking lot work completed July 2026 — invoiced and paid through the GC',
    city: 'Danville',
    state: 'VA',
    year: 2026,
    lat: 36.586,
    lng: -79.395,
    precision: 'city',
    evidence: 'GC reconciliation and remittance at account level',
  },
  {
    id: 'tractor-supply-ruckersville',
    client: 'Tractor Supply Co.',
    label: 'Parking lot work completed June 2026 — invoiced through the GC',
    city: 'Ruckersville',
    state: 'VA',
    year: 2026,
    lat: 38.2354,
    lng: -78.3695,
    precision: 'city',
    evidence: 'GC reconciliation at account level',
  },
]
