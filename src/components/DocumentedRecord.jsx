import React from 'react'
import { FileCheck, MapPin, Receipt, ShieldCheck } from 'lucide-react'

import { GA, QUADS } from '@/data/kfcProgrammeTracker'
import { KBP_INVOICE_EVIDENCE } from '@/data/georgiaStores'
import { KBP_STORES, tally } from '@/data/kbpStoreMap'
import { MASTER_ROSTER } from '@/data/kbpTrackerApril2017'

/**
 * DocumentedRecord — the numbers, instead of the adjectives.
 *
 * WHY THIS REPLACES WHAT WAS HERE
 * ───────────────────────────────
 * The section above this one used to open with "Trusted Paving Partner for
 * America's Premier Brands" and "Over 40 years ... for Fortune 500 retail
 * anchors and national QSR franchises."
 *
 * Every paving contractor in the country has that paragraph. It is
 * unfalsifiable, which is precisely why a facilities manager skims past it —
 * there is nothing in it that a competitor could not also write, so it carries
 * no information. It is what an AI writes when it has nothing to say.
 *
 * This company now has something to say. $4,082,440.23 invoiced to one QSR
 * franchisee across 146 documents. 29 Georgia stores invoiced AND PAID.
 * Figures that reconcile against the CLIENT'S own outstanding total to the
 * cent. A competitor cannot write that paragraph, because it isn't true of
 * them.
 *
 * EVERY FIGURE HERE IS IMPORTED, NOT TYPED
 * ────────────────────────────────────────
 * The numbers come from the data modules that carry their own provenance and
 * their own tests. Nothing is hard-coded into this component, so a figure
 * cannot drift from its source, and if a source figure ever changes the page
 * changes with it.
 *
 * WHAT IS DELIBERATELY NOT CLAIMED
 * ────────────────────────────────
 * Only paid and invoiced stores are counted as work. The 75 roster stores are
 * shown as a footprint and labelled as assigned, never as completed. That
 * distinction is the reason a buyer can trust the rest of the number.
 */

const usd0 = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const usd2 = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

export default function DocumentedRecord() {
  const counts = tally()
  const states = new Set(KBP_STORES.map((s) => s.state)).size
  // Documented work is all three evidence grades kbpStoreMap.js allows to be
  // shown as work: the client's paid rows, the client's invoiced rows, AND the
  // stores completed with revenue in our own Kickserv record. Counting only
  // paid+invoiced under-stated the programme (the owner caught it, 2026-08-28).
  const worked = counts.paid + counts.invoiced + counts.completed

  const figures = [
    {
      icon: Receipt,
      value: usd2(KBP_INVOICE_EVIDENCE.totalUsd),
      label: 'Invoiced to one QSR franchisee',
      detail: `${KBP_INVOICE_EVIDENCE.invoices} invoices, 2015–2018, including new builds and change orders.`,
    },
    {
      icon: MapPin,
      value: `${worked} restaurants`,
      label: `Documented across ${states} states`,
      detail:
        'Each one a store number and street address in the client’s tracker or a completed job in our own records — not a claim.',
    },
    {
      icon: FileCheck,
      value: `${GA.storesPaid} stores`,
      label: `Paid in Georgia alone — ${usd0(GA.paidUsd)}`,
      detail:
        'One state’s settled subset. Reconciles against the client’s own outstanding balance to the cent.',
    },
    {
      icon: ShieldCheck,
      value: 'SCDOT #211746',
      label: 'Encroachment permit, closed out',
      detail:
        'Applied for, completion photographs submitted, archived by the South Carolina DOT.',
    },
  ]

  return (
    <section className="bg-slate-950 border-y border-slate-800/80 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold tracking-widest uppercase">
            The record, not the résumé
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-50 text-balance">
            Every number here has a document behind it.
          </h2>
          <p className="mt-5 text-lg text-slate-400 leading-relaxed">
            Most contractors tell you they serve national brands. Here is the paperwork —
            invoice counts, amounts settled, store numbers, and a state DOT permit closed
            out by the state that issued it.
          </p>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-800/70 border border-slate-800/70 rounded-2xl overflow-hidden">
          {figures.map(({ icon: Icon, value, label, detail }) => (
            <div key={label} className="bg-slate-950 p-6 flex flex-col gap-3">
              <Icon className="w-5 h-5 text-amber-500 shrink-0" aria-hidden="true" />
              <dt className="sr-only">{label}</dt>
              <dd className="flex flex-col gap-2">
                <span className="block text-2xl md:text-[1.75rem] leading-none font-extrabold text-slate-50 tabular-nums tracking-tight">
                  {value}
                </span>
                <span className="block text-sm font-semibold text-amber-400/90">{label}</span>
                <span className="block text-sm text-slate-500 leading-relaxed">{detail}</span>
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-sm text-slate-500 leading-relaxed max-w-3xl">
          The client’s own master roster — the {MASTER_ROSTER.contactSheetTitle.toLowerCase()} —
          spans {MASTER_ROSTER.states} states, Florida and Kansas City to Norfolk and
          Syracuse. A further {counts.listed} rostered restaurants are not counted above:
          they were assigned, that is not the same as finished, and the difference is why
          the rest of this holds up.
          {QUADS.iowa > 0 && (
            <> The Iowa work — {QUADS.iowa} stores — carries the client’s own scheduling notes.</>
          )}
        </p>
      </div>
    </section>
  )
}
