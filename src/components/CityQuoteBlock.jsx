import EstimateForm from './EstimateForm'
import { publishableFor, BRAND_JWORDEN } from '@/data/publicRecords'

/**
 * CityQuoteBlock — the quote request, on the page, with the proof beside it.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Every location page used to offer two ways to convert and both of them left
 * the page: a link to /quote and a tel: link. A link to a form is not a form.
 * Someone reading about paving in their own town at nine in the evening had
 * nowhere to type, and the click-through to /quote loses people at every step.
 *
 * Google's own Business Profile reports for this company recorded quote
 * requests as the conversion that mattered — twice through the profile in the
 * period measured. The site should capture the same thing rather than
 * redirecting to somewhere that might.
 *
 * WHY THE CREDENTIALS SIT NEXT TO THE FORM
 * ────────────────────────────────────────
 * Proof adjacent to the ask is the whole point. A homeowner deciding whether
 * to hand over a phone number is asking "are these people real", and a permit
 * number issued by a named government body answers it in a way adjectives
 * cannot. They are drawn from publicRecords.js through the same
 * publishableFor() gate every other surface uses, so nothing unverified can
 * reach this block even by accident.
 */
export default function CityQuoteBlock({ city, stateCode, slug }) {
  const records = publishableFor(BRAND_JWORDEN)

  return (
    <section id="quote" className="py-16 bg-brand-navy text-white scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
        <div>
          <h2 className="font-display text-3xl md:text-4xl uppercase tracking-tight leading-tight mb-3">
            Request a Quote for {city}
          </h2>
          <p className="text-white/70 leading-relaxed mb-6 max-w-prose">
            Tell us the job and we will come and look at it. Free estimate, no obligation, and a
            straight answer about what {city} soil and drainage mean for the price.
          </p>

          <div className="bg-white text-brand-navy rounded-2xl p-5 md:p-6 shadow-xl">
            <EstimateForm source={`city_${slug}`} />
          </div>
        </div>

        <aside className="lg:pt-24">
          <p className="font-display text-[11px] uppercase tracking-[0.16em] text-brand-amber mb-4">
            Records you can check yourself
          </p>
          <ul className="space-y-4">
            {records.map((r) => (
              <li key={r.id} className="border-l-2 border-brand-amber/60 pl-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/50">
                  {r.authorityShort} &middot; {r.year}
                </p>
                <p className="font-display text-sm font-bold uppercase tracking-tight text-white mt-0.5">
                  {r.kind}
                </p>
                {r.reference && (
                  <p className="font-mono text-sm text-brand-amber tabular-nums mt-0.5">{r.reference}</p>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-white/50 leading-relaxed mt-6">
            {/* Said plainly: the numbers are there to be used, not admired. */}
            Every item above is a record held by a government body or a surety, listed with the
            number you need to confirm it at the source.
          </p>
          <a
            href="tel:+18044461296"
            className="inline-flex items-center gap-2 mt-6 font-display text-lg font-bold text-white hover:text-brand-amber transition-colors"
          >
            Or call (804) 446-1296
          </a>
        </aside>
      </div>
    </section>
  )
}
