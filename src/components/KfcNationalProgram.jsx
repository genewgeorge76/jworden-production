/**
 * KfcNationalProgram — the QSR portfolio proof, told honestly.
 *
 * Two kinds of evidence live here and they are deliberately presented
 * differently, because only one of them carries verified detail:
 *
 *   1. Documented projects — the six entries in public/kfc_projects_database.json.
 *      Each has a real store, street address, scope, square footage and
 *      completion year, and its own photographs. These are stated in full.
 *
 *   2. Programme photography — the 120 job photos in public/work/kfc. These are
 *      genuine, but their per-photo captions and locations in the old
 *      legacyPortfolio.js were generated arithmetically (labels assigned by
 *      `KFC_LABELS[i % KFC_LABELS.length]`, phase by `i % 5 === 2`), so they
 *      described nothing real. The photographs are shown WITHOUT location or
 *      phase claims rather than with invented ones. A franchise buyer who
 *      recognises a site we mislabelled is a lost portfolio, and the fix costs
 *      nothing: the work speaks without a fake caption.
 *
 * EXIF was stripped during image optimisation, so nothing truthful about place
 * or date can be recovered from the files. Restoring per-photo detail means
 * re-importing from the original library, not guessing here.
 *
 * Images are served through <picture> so the existing AVIF and WebP renditions
 * are actually used — they were generated but never referenced.
 */

import { useMemo, useState } from 'react'
import { Building2, CalendarDays, MapPin, Ruler } from 'lucide-react'
import kfcProjects from '@/data/kfcProjects.json'

const PHOTO_COUNT = 120
const PAGE = 24

/** /work/kfc/kfc-job-007.jpg + its .webp / .avif siblings. */
function jobPhoto(index) {
  const num = String(index + 1).padStart(3, '0')
  return {
    base: `/work/kfc/kfc-job-${num}`,
    id: `kfc-job-${num}`,
  }
}

function ProofImage({ base, alt, eager = false }) {
  return (
    <picture>
      <source srcSet={`${base}.avif`} type="image/avif" />
      <source srcSet={`${base}.webp`} type="image/webp" />
      <img
        src={`${base}.jpg`}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className="h-full w-full object-cover"
      />
    </picture>
  )
}

export default function KfcNationalProgram() {
  const [shown, setShown] = useState(PAGE)

  const projects = useMemo(() => (Array.isArray(kfcProjects) ? kfcProjects : []), [])

  const totals = useMemo(() => {
    const sqft = projects.reduce((s, p) => s + (p.sqft || 0), 0)
    const states = [...new Set(projects.map((p) => p.state).filter(Boolean))]
    return { sqft, states, count: projects.length }
  }, [projects])

  const photos = useMemo(
    () => Array.from({ length: PHOTO_COUNT }, (_, i) => jobPhoto(i)),
    [],
  )

  return (
    <section className="bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <p className="font-display text-primary text-xs uppercase tracking-[0.3em]">
            QSR / Franchise Programme
          </p>
          <h2 className="font-display mt-2 text-3xl font-black uppercase tracking-tight text-foreground">
            KFC National Program
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Multi-site restaurant work delivered as general contractor — pavement
            replacement, night milling and overlay, subgrade stabilisation and ADA
            striping, phased so the restaurant keeps trading. One contractor and one
            point of contact across every location in a portfolio.
          </p>

          {/* Only figures that come from the documented project records. */}
          <div className="mt-6 flex flex-wrap gap-6">
            <div>
              <div className="font-display text-2xl font-black text-primary">
                {totals.sqft.toLocaleString()}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                sq ft documented
              </div>
            </div>
            <div>
              <div className="font-display text-2xl font-black text-primary">{totals.count}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                documented locations
              </div>
            </div>
            <div>
              <div className="font-display text-2xl font-black text-primary">
                {totals.states.join(' · ')}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                states documented
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documented projects — full detail, because every field is verified. */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
          Documented Locations
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Address, scope and completion year on file for each.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <article key={p.location_id} className="overflow-hidden border border-border bg-card">
              {Array.isArray(p.photos) && p.photos[0] && (
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={p.photos[0]}
                    alt={`${p.store_name} — ${p.scope}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                <h4 className="font-display font-bold text-foreground">{p.store_name}</h4>

                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{p.address}</span>
                  </div>
                  {p.sqft ? (
                    <div className="flex items-center gap-2">
                      <Ruler className="h-3.5 w-3.5 shrink-0" />
                      <span>{p.sqft.toLocaleString()} sq ft</span>
                    </div>
                  ) : null}
                  {p.completion_year ? (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      <span>Completed {p.completion_year}</span>
                    </div>
                  ) : null}
                </div>

                <p className="mt-3 border-t border-border pt-3 text-sm text-foreground">{p.scope}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Programme photography — no location or phase claims attached. */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h3 className="font-display flex items-center gap-2 text-lg font-bold uppercase tracking-wide text-foreground">
                <Building2 className="h-4 w-4 text-primary" />
                Programme Photography
              </h3>
              <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                {PHOTO_COUNT} job photographs from the KFC programme. Individual sites are not
                labelled — the original location data was lost when these were optimised for the
                web, and we would rather show the work unlabelled than caption it wrongly.
              </p>
            </div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              showing {Math.min(shown, PHOTO_COUNT)} of {PHOTO_COUNT}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.slice(0, shown).map((ph, i) => (
              <figure key={ph.id} className="aspect-square overflow-hidden border border-border bg-muted">
                <ProofImage
                  base={ph.base}
                  alt="KFC national programme — J. Worden &amp; Sons job photograph"
                  eager={i < 4}
                />
              </figure>
            ))}
          </div>

          {shown < PHOTO_COUNT && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setShown((n) => Math.min(n + PAGE, PHOTO_COUNT))}
                className="border border-primary px-6 py-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Show more work
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
