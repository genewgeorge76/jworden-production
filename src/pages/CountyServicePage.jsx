/**
 * CountyServicePage — one Virginia county, one service.
 *
 * Copy, specifications and JSON-LD all come from src/lib/countyPages.js, which
 * reads the same shared data file as the backend. Nothing on this page is
 * written by hand per county, and nothing is invented: every technical claim
 * traces to an entry in the sourced specification table, and there is no
 * search-volume figure anywhere because nothing measures one.
 *
 * PER-COUNTY FACTS
 * The template alone produced ninety-five pages differing only by a place
 * name, which is the doorway-page pattern Google names by that term. What
 * makes each page its own is src/data/virginiaCountyFacts.json: a measured
 * elevation and real VDOT project references for that county, every field
 * fetched by scripts/build-county-facts.mjs rather than authored.
 *
 * Elevation is not decoration. Freeze-thaw depth drives base thickness, so a
 * 3,211 ft county in Bristol genuinely does not take the same section as a
 * tidewater county at 6 ft. Fourteen counties came back without usable facts
 * and are marked complete:false; those render the plain template rather than
 * a page padded to look full.
 *
 * NOINDEX
 * The publish switch. It was held closed while the set was thin, and is open
 * now that each page carries county-specific, sourced content. It must move
 * together with the sitemap entries in scripts/generate-sitemap.mjs — a page
 * that is advertised while noindexed, or indexed while unadvertised, is a
 * mistake in one direction or the other.
 */
import { useParams, Navigate, Link } from 'react-router-dom';

import SEO from '@/components/SEO';
import { generatePage, countyFromSlug, SERVICES } from '@/lib/countyPages';
import COUNTY_FACTS from '@/data/virginiaCountyFacts.json';

// The publish switch. See the note above before changing it.
export const NOINDEX_COUNTY_PAGES = false;

const BUSINESS_NAME = 'J. Worden & Sons';

/**
 * The host this page is actually being served from.
 *
 * This was hardcoded to 'www.jwordenasphaltpaving.com', which is a Sedo
 * parking page — so every county page's JSON-LD `url` announced the canonical
 * copy of itself as living on an advertising placeholder. A hardcoded domain
 * is also wrong for every new host the site factory spins up.
 *
 * Falls back to the old constant only during SSR/prerender, where there is no
 * window; the prerenderer rewrites the host afterwards.
 */
function siteDomain() {
  if (typeof window !== 'undefined' && window.location?.host) {
    return window.location.host;
  }
  return 'www.jwordenasphaltpaving.com';
}

/** Facts for one county, or null when nothing usable came back. */
function factsFor(countyName) {
  const bare = String(countyName).replace(/\s+County$/i, '');
  const rec = COUNTY_FACTS.counties.find((c) => c.county === bare);
  return rec && rec.complete ? rec : null;
}

export default function CountyServicePage() {
  const { countySlug, service } = useParams();

  const county = countyFromSlug(countySlug || '');
  if (!county || !SERVICES[service]) {
    // An unknown county or service is a real 404, not a page about nothing.
    return <Navigate to="/service-areas" replace />;
  }

  let page;
  try {
    page = generatePage({
      domain: siteDomain(),
      county,
      service,
      businessName: BUSINESS_NAME,
    });
  } catch {
    return <Navigate to="/service-areas" replace />;
  }

  const facts = factsFor(page.county);

  return (
    <>
      <SEO
        title={page.meta_title}
        description={page.meta_description}
        canonicalPath={page.path}
        jsonLd={page.schema_jsonld}
        noindex={NOINDEX_COUNTY_PAGES}
      />

      <main className="mx-auto max-w-3xl px-5 py-14 md:py-20">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          VDOT {page.district}
        </p>

        <h1 className="mt-3 text-3xl font-bold leading-tight text-foreground md:text-4xl">
          {page.h1}
        </h1>

        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          {page.service_label} across {page.county} — parking lots, drive lanes and
          truck entrances built to Virginia Department of Transportation
          specifications.
        </p>

        {page.specifications.length > 0 && (
          <section className="mt-10" aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="text-xl font-semibold text-foreground">
              Specifications
            </h2>
            <ul className="mt-4 space-y-3">
              {page.specifications.map((spec) => (
                <li
                  key={spec.code}
                  className="border-l-2 border-primary bg-muted/40 px-4 py-3"
                >
                  <p className="font-mono text-sm font-medium text-foreground">
                    {spec.code}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {spec.description}
                  </p>
                  {/* The citation is shown, not just stored. A spec claim a
                      reader cannot check is worth less than one they can. */}
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {spec.source}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {facts?.terrain && (
          <section className="mt-10" aria-labelledby="terrain-heading">
            <h2 id="terrain-heading" className="text-xl font-semibold text-foreground">
              Conditions in {page.county}
            </h2>
            <div className="mt-4 border-l-2 border-primary bg-muted/40 px-4 py-3">
              <p className="font-mono text-sm font-medium text-foreground">
                {facts.terrain.elevation_ft.toLocaleString()} ft above sea level
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {facts.terrain.note}
              </p>
              {/* Named so a reader knows this is a measurement, not an
                  opinion about their county. */}
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Elevation at county centroid — Google Elevation API
              </p>
            </div>
          </section>
        )}

        {facts?.road_references?.length > 0 && (
          <section className="mt-10" aria-labelledby="vdot-heading">
            <h2 id="vdot-heading" className="text-xl font-semibold text-foreground">
              Recent VDOT work in {page.county}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Published by the Virginia Department of Transportation. Linked
              rather than reproduced — these are VDOT&rsquo;s notices, not ours.
            </p>
            <ul className="mt-4 space-y-3">
              {facts.road_references.map((ref) => (
                <li key={ref.url} className="border-l-2 border-muted px-4 py-2">
                  <a
                    href={ref.url}
                    rel="nofollow noopener"
                    target="_blank"
                    className="text-sm text-foreground underline underline-offset-2"
                  >
                    {ref.title}
                  </a>
                  {ref.published && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {String(ref.published).slice(0, 10)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/contact"
            className="inline-block bg-primary px-6 py-3 font-semibold uppercase tracking-wide text-primary-foreground"
          >
            Request an estimate
          </Link>
          <Link
            to="/service-areas"
            className="inline-block border border-foreground px-6 py-3 font-semibold uppercase tracking-wide text-foreground"
          >
            All service areas
          </Link>
        </section>
      </main>
    </>
  );
}
