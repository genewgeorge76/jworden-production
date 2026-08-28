/**
 * HouzzAwards — the full awards wall (name kept for its import sites).
 *
 * Every recognition the record documents, in one section — the owner asked
 * for all of it (2026-08-28), and all of it is verifiable:
 *
 *   Industry (Pavement / Pavement & Maintenance Magazine):
 *     - Top 75 Contractors, recognized in four separate categories
 *     - 2018 Top Contractor Award  (listed on the verified Houzz profile
 *       fetch of 2026-08-28, publicRecordsWithheld.js)
 *     - 2020 Best Asphalt Paving Company  (same verified fetch)
 *     - 2026 Top Contractor Award — Nominee
 *
 *   Houzz (HOUZZ_PROFILE_2026 + the owner's profile screenshots):
 *     - Best of Houzz SERVICE 2014, 2015, 2016, 2023
 *     - Recommended badge, 500 Saves, 4.8 stars over 12 reviews
 *
 * Tiles are typeset natively rather than hotlinking badge artwork: crisp at
 * every size, no external requests. Per the standing rule, no deep link to
 * the Houzz profile ships until the owner confirms the public page is
 * reactivated — the claims stand on the documented record either way.
 */
import React from 'react'
import { Award, Trophy, Medal, ThumbsUp, Bookmark, Star } from 'lucide-react'

const INDUSTRY_AWARDS = [
  {
    icon: Trophy,
    title: 'Top 75 Contractors',
    org: 'Pavement Magazine',
    detail: 'Recognized in four separate contractor categories.',
    featured: true,
  },
  {
    icon: Medal,
    title: '2018 Top Contractor Award',
    org: 'Pavement & Maintenance Magazine',
    detail: 'Awarded during the national KFC program years.',
  },
  {
    icon: Medal,
    title: '2020 Best Asphalt Paving Company',
    org: 'Industry recognition',
    detail: 'Carried on the company’s verified trade profile.',
  },
  {
    icon: Award,
    title: '2026 Top Contractor — Nominee',
    org: 'Pavement Magazine',
    detail: 'Nominated for the industry-wide 2026 award.',
  },
]

const HOUZZ_YEARS = [
  { year: '2023', latest: true },
  { year: '2016' },
  { year: '2015' },
  { year: '2014' },
]

export default function HouzzAwards() {
  return (
    <section className="bg-brand-navy border-y border-white/10 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full mb-3">
              Awards &amp; Recognition
            </span>
            <h2 className="text-white font-bold text-3xl md:text-5xl tracking-tight">
              Recognized nationally.<br />Earned on the mat.
            </h2>
          </div>
          <p className="text-white/40 text-sm md:text-right md:max-w-xs">
            Industry-verified recognitions — not self-reported. Virginia Class A
            Contractor #2705 105644 · USDOT 2568168.
          </p>
        </div>

        {/* Industry awards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {INDUSTRY_AWARDS.map((a) => {
            const Icon = a.icon
            return (
              <div
                key={a.title}
                className={
                  a.featured
                    ? 'rounded-2xl bg-brand-amber text-black p-6 flex flex-col'
                    : 'rounded-2xl bg-white/5 border border-white/10 text-white p-6 flex flex-col'
                }
              >
                <Icon className={`w-6 h-6 mb-3 ${a.featured ? 'text-black' : 'text-brand-amber'}`} aria-hidden="true" />
                <span className="font-display font-extrabold text-lg leading-tight">{a.title}</span>
                <span className={`mt-1 text-xs font-bold uppercase tracking-[0.14em] ${a.featured ? 'text-black/60' : 'text-brand-amber/80'}`}>
                  {a.org}
                </span>
                <span className={`mt-2 text-xs leading-relaxed ${a.featured ? 'text-black/70' : 'text-white/50'}`}>
                  {a.detail}
                </span>
              </div>
            )
          })}
        </div>

        {/* Houzz years */}
        <div className="mt-8 flex flex-col md:flex-row md:items-center gap-4">
          <p className="text-white/60 text-sm font-bold uppercase tracking-[0.14em] md:w-40 shrink-0">
            Best of Houzz<br className="hidden md:block" /> Service
          </p>
          <div className="grid grid-cols-4 gap-2 md:gap-3 flex-1">
            {HOUZZ_YEARS.map((a) => (
              <div
                key={a.year}
                className={
                  a.latest
                    ? 'rounded-xl bg-brand-amber text-black py-4 flex flex-col items-center'
                    : 'rounded-xl bg-white/5 border border-white/10 text-white py-4 flex flex-col items-center'
                }
              >
                <span className="font-display font-extrabold text-xl md:text-2xl leading-none tabular-nums">{a.year}</span>
                <span className={`mt-1 text-[9px] font-bold uppercase tracking-[0.2em] ${a.latest ? 'text-black/60' : 'text-white/40'}`}>
                  Service
                </span>
              </div>
            ))}
          </div>
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
