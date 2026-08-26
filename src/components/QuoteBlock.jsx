import EstimateForm from './EstimateForm'
import ErrorBoundary from './ErrorBoundary'
import { publishableFor, BRAND_JWORDEN } from '@/data/publicRecords'

/**
 * QuoteBlock — one place on the page where a visitor can actually ask for work.
 *
 * WHY THIS EXISTS, AND WHY IT IS NOT JUST A BUTTON
 * ────────────────────────────────────────────────
 * Twenty-four public pages on this site offered exactly two ways to convert,
 * and both of them left the page: a <Link to="/quote"> and a tel: link. A link
 * to a form is not a form. Every hop between reading and typing loses people,
 * and the ones lost are disproportionately the ones who were only half decided
 * — which is most of them, at nine in the evening, on a phone.
 *
 * Google's own Business Profile reporting for this company recorded quote
 * requests as the thing that actually happened when the business was visible.
 * The site's job is to capture that on the page the visitor is already on.
 *
 * WHY THE PROOF SITS BESIDE THE ASK
 * ─────────────────────────────────
 * The question in someone's head at the moment they type a phone number is not
 * "are these people good", it is "are these people real". A permit number
 * issued by a named government body answers that in a way no adjective can.
 * The rows come from publicRecords.js through publishableFor(), the same gate
 * every other surface uses, so nothing unverified can reach a page even by
 * accident — and each site sees only its own brand's records, which is also
 * what keeps two domains from publishing the same credential text.
 *
 * WHY THE GUARD IS INSIDE THE COMPONENT
 * ─────────────────────────────────────
 * This block is the revenue path, so it is the worst possible thing to let
 * take a page down with it — and the worst thing to have silently vanish. It
 * carries its own ErrorBoundary rather than trusting seventeen call sites to
 * remember one: if the form or the records lookup throws, the visitor still
 * gets a heading and a phone number instead of a blank section or a white
 * screen. A caller cannot forget a guard it does not have to write.
 */
function QuoteBlockBody({ heading, intro, source, brand = BRAND_JWORDEN }) {
  const records = publishableFor(brand)

  return (
    <section id="quote" className="py-16 bg-brand-navy text-white scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
        <div>
          <h2 className="font-display text-3xl md:text-4xl uppercase tracking-tight leading-tight mb-3">
            {heading}
          </h2>
          {intro && (
            <p className="text-white/70 leading-relaxed mb-6 max-w-prose">{intro}</p>
          )}

          <div className="bg-white text-brand-navy rounded-2xl p-5 md:p-6 shadow-xl">
            <EstimateForm source={source} />
          </div>
        </div>

        <aside className="lg:pt-24">
          {records.length > 0 && (
            <>
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
                      <p className="font-mono text-sm text-brand-amber tabular-nums mt-0.5">
                        {r.reference}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-white/50 leading-relaxed mt-6">
                {/* Said plainly: the numbers are there to be used, not admired. */}
                Every item above is a record held by a government body or a surety, listed with
                the number you need to confirm it at the source.
              </p>
            </>
          )}
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

/**
 * The fallback is deliberately not an apology. If the form cannot render, the
 * visitor still needs the one thing that always works, so they get the number.
 */
function QuoteBlockFallback({ heading }) {
  return (
    <section id="quote" className="py-16 bg-brand-navy text-white scroll-mt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-display text-3xl md:text-4xl uppercase tracking-tight leading-tight mb-4">
          {heading}
        </h2>
        <a
          href="tel:+18044461296"
          className="inline-flex items-center gap-2 font-display text-2xl font-bold text-brand-amber hover:text-white transition-colors"
        >
          Call or text (804) 446-1296
        </a>
      </div>
    </section>
  )
}

export default function QuoteBlock(props) {
  const heading = props.heading || 'Request a Free Estimate'
  return (
    <ErrorBoundary silent label="QuoteBlock" fallback={<QuoteBlockFallback heading={heading} />}>
      <QuoteBlockBody {...props} heading={heading} />
    </ErrorBoundary>
  )
}
