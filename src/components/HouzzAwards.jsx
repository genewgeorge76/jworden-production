/**
 * HouzzAwards — the Houzz record, displayed.
 *
 * Four Best of Houzz SERVICE awards (2014, 2015, 2016, 2023), the Recommended
 * and 500-Saves badges, and the 12-review rating — all documented from the
 * owner's profile (publicRecordsWithheld.js HOUZZ_PROFILE_2026, plus the
 * owner's profile screenshots of 2026-08-28 which added the two badges).
 *
 * The tiles are typeset natively rather than hotlinking Houzz badge artwork:
 * they render crisp at every size, in both palettes, and need no external
 * request. Per the standing rule, no deep link to the profile ships until the
 * owner confirms the public page is reactivated — the claim stands on the
 * documented record either way.
 */
import React from 'react'
import { Award, ThumbsUp, Bookmark, Star } from 'lucide-react'

const AWARD_YEARS = [
  { year: '2023', latest: true },
  { year: '2016' },
  { year: '2015' },
  { year: '2014' },
]

export default function HouzzAwards() {
  return (
    <section className="bg-brand-navy border-y border-white/10 py-14 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full mb-3">
              Independently Awarded
            </span>
            <h2 className="text-white font-bold text-2xl md:text-4xl tracking-tight">
              Best of Houzz Service — four times.
            </h2>
          </div>
          <p className="text-white/40 text-sm md:text-right md:max-w-xs">
            Awarded by Houzz from verified client reviews. Virginia Class A Contractor
            #2705 105644.
          </p>
        </div>

        {/* Award year tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {AWARD_YEARS.map((a) => (
            <div
              key={a.year}
              className={
                a.latest
                  ? 'rounded-2xl bg-brand-amber text-black p-5 md:p-6 flex flex-col items-center text-center'
                  : 'rounded-2xl bg-white/5 border border-white/10 text-white p-5 md:p-6 flex flex-col items-center text-center'
              }
            >
              <Award className={`w-6 h-6 mb-2 ${a.latest ? 'text-black' : 'text-brand-amber'}`} aria-hidden="true" />
              <span className="font-display font-extrabold text-3xl md:text-4xl leading-none tabular-nums">{a.year}</span>
              <span className={`mt-2 text-[10px] font-bold uppercase tracking-[0.22em] ${a.latest ? 'text-black/70' : 'text-white/50'}`}>
                Best of Houzz
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-[0.22em] ${a.latest ? 'text-black/70' : 'text-white/50'}`}>
                Service
              </span>
            </div>
          ))}
        </div>

        {/* Badges + reviews */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80">
            <ThumbsUp className="w-4 h-4 text-brand-amber" aria-hidden="true" /> Recommended on Houzz
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80">
            <Bookmark className="w-4 h-4 text-brand-amber" aria-hidden="true" /> 500+ project saves
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80">
            <Star className="w-4 h-4 text-brand-amber" aria-hidden="true" /> 4.8 ★ · 12 client reviews
          </span>
        </div>
      </div>
    </section>
  )
}
