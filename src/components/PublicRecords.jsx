import React from 'react'
import { BadgeCheck, ExternalLink } from 'lucide-react'
import { publishableFor } from '@/data/publicRecords'

/**
 * PublicRecords — the credentials a buyer can check without asking us.
 *
 * Renders only rows graded VERIFIABLE in src/data/publicRecords.js, filtered to
 * the brand this site trades under. The filtering is done in the data module,
 * not here, so a component change can never widen what gets published.
 *
 * The section deliberately shows the permit NUMBER at full size. A number is
 * what makes the claim checkable, and a checkable claim is the only kind worth
 * putting on a contractor's website.
 */
export default function PublicRecords({ brand, heading, intro }) {
  const records = publishableFor(brand)
  if (!records.length) return null

  return (
    <section id="public-records" className="py-16 md:py-24 border-b border-slate-800/80 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 text-xs font-semibold uppercase tracking-wider mb-4">
          <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
          Government Records
        </div>
        <h2 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tight leading-[0.95] text-white mb-4">
          {heading || 'Credentials You Can Check Yourself'}
        </h2>
        <p className="text-slate-400 leading-relaxed max-w-2xl mb-10">
          {intro ||
            'Every item below is a record held by a government body, not a claim made by us. Each one carries the number you need to confirm it at the source.'}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {records.map((r) => (
            <article
              key={r.id}
              className="border border-slate-800 bg-slate-900/60 rounded-2xl p-6 md:p-7 hover:border-orange-500/50 transition-colors"
            >
              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-orange-400">
                  {r.authorityShort}
                </p>
                <p className="font-mono text-[11px] text-slate-500 tabular-nums">{r.year}</p>
              </div>

              <h3 className="font-display text-xl md:text-2xl font-bold uppercase tracking-tight text-white mt-2.5">
                {r.kind}
              </h3>

              {r.reference && (
                <p className="font-mono text-2xl md:text-3xl font-semibold text-orange-400 tabular-nums mt-1.5">
                  {r.reference}
                </p>
              )}

              <p className="text-sm text-slate-300 leading-relaxed mt-4">{r.plain}</p>
              <p className="text-sm text-slate-400 leading-relaxed mt-3">{r.whyItMatters}</p>

              <div className="mt-5 pt-4 border-t border-slate-800">
                <p className="font-display text-[10px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-1.5">
                  Verify it
                </p>
                {r.verifyUrl ? (
                  <a
                    href={r.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-300 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
                  >
                    {r.howToCheck}
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  </a>
                ) : (
                  <p className="text-sm text-slate-400 leading-relaxed">{r.howToCheck}</p>
                )}
              </div>
            </article>
          ))}
        </div>

        <p className="text-xs text-slate-500 leading-relaxed mt-8 max-w-3xl">
          {/* Said plainly, because the absence of a claim is itself informative
              and a reader who notices it should not have to wonder. */}
          Records are listed only where a member of the public can confirm them at the issuing
          authority. Credentials we hold but which are not publicly searchable are not listed here.
        </p>
      </div>
    </section>
  )
}
