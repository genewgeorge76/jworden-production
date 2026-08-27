import { climateFor, CLIMATE_SOURCE, CLIMATE_SPREAD } from '@/data/localClimate'

/**
 * LocalClimateBlock — the measured reason this town's spec is what it is.
 *
 * WHY A NUMBER BEATS AN ADJECTIVE HERE
 * ────────────────────────────────────
 * Every paving company in Virginia says it uses the right base depth for local
 * conditions. None of them says what the local conditions measurably are. The
 * claim is unfalsifiable, so a homeowner correctly discounts it to zero.
 *
 * "Chester averages 50.7 freeze-thaw cycles a year, measured over thirty years"
 * is a different kind of sentence. It can be checked, which is exactly why it
 * is worth saying — and it explains the price of a deeper base without ever
 * having to argue about the price.
 *
 * WHY THE SPREAD IS SHOWN ALONGSIDE IT
 * ────────────────────────────────────
 * A single number has no scale. Fifty cycles means nothing to somebody who has
 * never counted one. Fifty cycles against Virginia Beach's eighteen and
 * Ruckersville's seventy-three tells them where they sit, and it does the real
 * work: it demonstrates that "region-specific" is a measurement this company
 * actually took rather than a phrase in a brochure.
 *
 * WHAT IT REFUSES TO SAY
 * ──────────────────────
 * The dataset also holds days reaching the 50°F laydown floor. That is a
 * ceiling on the season, not the season — sustained temperature, dry base and
 * rain are not modelled — so it is not rendered here at all. A visitor reading
 * "303 workable days" would reasonably conclude we pave in January.
 *
 * Renders nothing when a location has no measured row, rather than a default.
 * A missing number is not an average number.
 */
export default function LocalClimateBlock({ slug, city }) {
  const c = climateFor(slug)
  if (!c) return null

  const spread = CLIMATE_SPREAD
  const isHigh = c.freezeThawAvg >= 60
  const isLow = c.freezeThawAvg <= 30

  return (
    <section className="py-16 bg-slate-50 border-t border-brand-navy/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <p className="font-display text-[11px] uppercase tracking-[0.16em] text-brand-navy/50 mb-3">
          Measured, not estimated
        </p>
        <h2 className="font-display text-3xl md:text-4xl uppercase tracking-tight text-brand-navy leading-tight mb-8">
          What {city} weather actually does to pavement
        </h2>

        <div className="grid gap-8 md:grid-cols-[auto_1fr] md:gap-12 items-start">
          <div className="shrink-0">
            <p className="font-display text-6xl md:text-7xl font-black text-brand-navy tabular-nums leading-none">
              {c.freezeThawAvg}
            </p>
            <p className="font-display text-xs uppercase tracking-[0.12em] text-brand-navy/60 mt-2 max-w-[14rem]">
              freeze-thaw cycles a year
            </p>
            <p className="text-sm text-brand-navy/50 mt-1 tabular-nums">
              range {c.freezeThawMin}–{c.freezeThawMax} over {c.years} years
            </p>
          </div>

          <div className="space-y-4 text-brand-navy/80 leading-relaxed">
            <p>
              A freeze-thaw cycle is a day that drops below freezing and climbs back above it.
              Water sitting in a crack expands as it freezes, widens the crack, and drains away
              — then does it again the next night. It is the single mechanism that turns a
              hairline crack into a pothole, and {city} goes through it{' '}
              <strong className="text-brand-navy">{c.freezeThawAvg} times in an average year</strong>.
            </p>
            <p>
              {isHigh && (
                <>That puts {city} among the hardest-hit places we work — well above{' '}
                {spread.lowest.city}&rsquo;s {spread.lowest.freezeThawAvg}. Base depth and drainage
                are not upsells here; they are the difference between a driveway that lasts twenty
                years and one that fails in six.</>
              )}
              {isLow && (
                <>That is mild by Virginia standards — {spread.highest.city} takes{' '}
                {spread.highest.freezeThawAvg}. The trade-off near the coast is different: less
                frost damage, more salt aerosol and a higher water table, which is a drainage
                problem rather than a freezing one.</>
              )}
              {!isHigh && !isLow && (
                <>That sits mid-range for our territory, between {spread.lowest.city}&rsquo;s{' '}
                {spread.lowest.freezeThawAvg} and {spread.highest.city}&rsquo;s{' '}
                {spread.highest.freezeThawAvg} — enough frost cycling that a base cut short shows
                up inside a decade.</>
              )}
            </p>
            <p>
              Across our service area the figure ranges from {spread.lowest.freezeThawAvg} to{' '}
              {spread.highest.freezeThawAvg} — roughly {spread.ratio} times — between towns two
              hours apart. That is why we spec by location rather than by a single state-wide rule.
            </p>
          </div>
        </div>

        {/* The source is stated because a number a reader cannot check is worth
            no more than the adjective it replaced. */}
        <p className="text-xs text-brand-navy/50 leading-relaxed mt-8 pt-6 border-t border-brand-navy/10">
          Source: {CLIMATE_SOURCE.dataset}, {CLIMATE_SOURCE.provider}. Daily temperature extremes
          for this location, {CLIMATE_SOURCE.baselineStart.slice(0, 4)}–
          {CLIMATE_SOURCE.baselineEnd.slice(0, 4)} ({CLIMATE_SOURCE.years} years).{' '}
          {CLIMATE_SOURCE.freezeThawDefinition}
        </p>
      </div>
    </section>
  )
}
