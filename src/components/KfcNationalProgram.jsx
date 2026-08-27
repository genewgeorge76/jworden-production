/**
 * KfcNationalProgram — the QSR portfolio proof, told honestly.
 *
 * This page exists for one reader: someone evaluating whether J. Worden & Sons
 * can run work across a multi-site portfolio. That reader can check anything
 * they like, so every claim here has to survive being checked.
 *
 * WHAT CHANGED AND WHY
 *
 * This component previously headlined six "documented locations" from
 * src/data/kfcProjects.json — each with a street address, a square footage and
 * three photographs. The photographs are placeholder vector artwork of a
 * stylised road, not job photographs, and the accompanying figures could not be
 * traced to any record. Six unverifiable entries have been replaced by the
 * thirty-nine that carry a dated email each.
 *
 * TWO KINDS OF EVIDENCE, PRESENTED DIFFERENTLY
 *
 *   1. Documented sites — src/data/nationalProjects.json. Each entry is backed
 *      by a dated email, most of them completion-photograph submissions sent to
 *      the client. Store numbers and street addresses are stated where the
 *      correspondence states them; scope is left blank rather than guessed.
 *
 *   2. Programme photography — the 120 job photos in public/work/kfc. Genuine
 *      photographs, but their captions in the old legacyPortfolio.js were
 *      assigned arithmetically (`KFC_LABELS[i % KFC_LABELS.length]`), so they
 *      described nothing real, and EXIF was stripped during image optimisation.
 *      They are shown without location or phase claims rather than with invented
 *      ones. A franchise buyer who recognises a site we mislabelled is a lost
 *      portfolio; the work speaks without a fake caption.
 *
 * The site list is explicitly a floor, not a ceiling — it enumerates what one
 * mailbox documents with a date. Saying so is not a weakness in the pitch. A
 * contractor who can name thirty-nine restaurants with dates and say "and there
 * were more" reads as someone who keeps records.
 *
 * Images are served through <picture> so the existing AVIF and WebP renditions
 * are actually used — they were generated but never referenced.
 */

import { useMemo, useState } from 'react'
import { Building2, CalendarDays, HardHat, MapPin, Store } from 'lucide-react'
import nationalProjects from '@/data/nationalProjects.json'

const PHOTO_COUNT = 120
const PAGE = 24

const STATE_NAMES = {
  VA: 'Virginia',
  NC: 'North Carolina',
  MI: 'Michigan',
  NJ: 'New Jersey',
  GA: 'Georgia',
  TX: 'Texas',
  IL: 'Illinois',
  TN: 'Tennessee',
  MO: 'Missouri',
  FL: 'Florida',
  LA: 'Louisiana',
}

/** /work/kfc/kfc-job-007.jpg + its .webp / .avif siblings. */
function jobPhoto(index) {
  const num = String(index + 1).padStart(3, '0')
  return { base: `/work/kfc/kfc-job-${num}`, id: `kfc-job-${num}` }
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

/** "2017-07-10" → "July 2017". Day precision is noise at portfolio scale. */
function fmtMonth(iso) {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})/.exec(iso)
  if (!m) return iso
  return new Date(`${m[1]}-${m[2]}-01`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function SiteRow({ site }) {
  const line = [site.address, site.city].filter(Boolean).join(', ')
  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {site.store && (
              <span className="shrink-0 border border-primary/40 bg-primary/5 px-1.5 py-0.5 font-display text-[10px] font-bold tracking-wider text-primary">
                #{site.store}
              </span>
            )}
            <span className="truncate text-sm font-semibold text-foreground">
              {line || site.city}
            </span>
          </div>
          {site.scope && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{site.scope}</p>
          )}
          <p className="mt-1 text-[11px] italic text-muted-foreground/80">{site.evidence}</p>
        </div>
        {site.documented && (
          <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">
            {fmtMonth(site.documented)}
          </span>
        )}
      </div>
    </div>
  )
}

export default function KfcNationalProgram() {
  const [shown, setShown] = useState(PAGE)

  const program = nationalProjects.programs?.[0]
  const sites = useMemo(() => program?.sites ?? [], [program])

  /** Group by state, most-documented state first. */
  const byState = useMemo(() => {
    const map = new Map()
    for (const s of sites) {
      if (!map.has(s.state)) map.set(s.state, [])
      map.get(s.state).push(s)
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [sites])

  const photos = useMemo(() => Array.from({ length: PHOTO_COUNT }, (_, i) => jobPhoto(i)), [])

  const newBuild = program?.newBuildProgram
  const other = nationalProjects.otherCommercial ?? []

  return (
    <section className="bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <p className="font-display text-primary text-xs uppercase tracking-[0.1em]">
            QSR / Franchise Programme
          </p>
          <h2 className="font-display mt-2 text-3xl font-bold uppercase tracking-tight text-foreground">
            KFC National Program
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Multi-site restaurant work for {program?.client} — {program?.clientNote} Pavement
            replacement, sealcoating, concrete and site work phased so the restaurant keeps
            trading, plus general contracting on the ground-up build programme. One contractor and
            one point of contact across a portfolio.
          </p>

          <div className="mt-6 flex flex-wrap gap-8">
            <div>
              <div className="font-display text-2xl font-bold text-primary">{sites.length}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                sites with a dated record
              </div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-primary">{byState.length}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                states
              </div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-primary">{program?.years}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                programme span
              </div>
            </div>
          </div>

          {/* Said plainly, because a floor stated as a floor is more credible
              than a ceiling stated as a total. */}
          <p className="mt-6 max-w-3xl border-l-2 border-primary/40 pl-4 text-xs leading-relaxed text-muted-foreground">
            The list below is a floor, not a ceiling. It enumerates only the locations we can put a
            dated record against — the Atlanta metro alone ran to well over a hundred restaurants.
          </p>
        </div>
      </div>

      {/* Documented sites, grouped by state. */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        <h3 className="font-display flex items-center gap-2 text-lg font-bold uppercase tracking-wide text-foreground">
          <Store className="h-4 w-4 text-primary" />
          Documented Locations
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Store number and address where the record carries them, and the date the work was
          documented to the client.
        </p>

        <div className="mt-6 grid gap-x-10 gap-y-8 lg:grid-cols-2">
          {byState.map(([state, list]) => (
            <div key={state}>
              <h4 className="font-display flex items-baseline gap-2 border-b-2 border-primary pb-2 text-sm font-bold uppercase tracking-wide text-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {STATE_NAMES[state] || state}
                <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                  {list.length} {list.length === 1 ? 'site' : 'sites'}
                </span>
              </h4>
              <div className="mt-1">
                {list.map((s, i) => (
                  <SiteRow key={`${state}-${i}`} site={s} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ground-up builds — a different capability, so it gets its own block. */}
      {newBuild && (
        <div className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <h3 className="font-display flex items-center gap-2 text-lg font-bold uppercase tracking-wide text-foreground">
              <HardHat className="h-4 w-4 text-primary" />
              New-Store Build Programme — {newBuild.role}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Ground-up restaurant construction delivered as general contractor for{' '}
              {newBuild.developer}, coordinating the full design and construction team.
            </p>

            <div className="mt-6 grid gap-8 md:grid-cols-2">
              <div>
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Project Team
                </h4>
                <ul className="mt-3 space-y-1.5">
                  {newBuild.projectTeam.map((t) => (
                    <li key={t} className="text-sm text-muted-foreground">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Sites
                </h4>
                <ul className="mt-3 space-y-1.5">
                  {newBuild.sites.map((s) => (
                    <li key={`${s.city}-${s.state}`} className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {s.city}, {s.state}
                      </span>{' '}
                      — {s.note}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other commercial clients, same evidence standard. */}
      {other.length > 0 && (
        <div className="border-t border-border">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <h3 className="font-display flex items-center gap-2 text-lg font-bold uppercase tracking-wide text-foreground">
              <Building2 className="h-4 w-4 text-primary" />
              Other Commercial Work
            </h3>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {other.map((o) => (
                <article key={`${o.client}-${o.city}`} className="border border-border bg-card p-5">
                  <h4 className="font-display font-bold text-foreground">{o.client}</h4>
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {[o.address, o.city, o.state].filter(Boolean).join(', ')}
                    </span>
                  </div>
                  {o.scope && <p className="mt-3 text-sm text-foreground">{o.scope}</p>}
                  <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    {fmtMonth(o.documented)}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

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
              <figure
                key={ph.id}
                className="aspect-square overflow-hidden border border-border bg-muted"
              >
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
                className="border border-primary px-6 py-3 font-display text-xs font-bold uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
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
