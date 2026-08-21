/**
 * CountyServicePage — one Virginia county, one service.
 *
 * Copy, specifications and JSON-LD all come from src/lib/countyPages.js, which
 * reads the same shared data file as the backend. Nothing on this page is
 * written by hand per county, and nothing is invented: every technical claim
 * traces to an entry in the sourced specification table, and there is no
 * search-volume figure anywhere because nothing measures one.
 *
 * NOINDEX
 * These pages ship with noindex and are held out of every sitemap while the
 * set is reviewed. Publishing 475 pages before anyone has read one is how a
 * site earns a thin-content problem. Flip NOINDEX_COUNTY_PAGES to false and
 * add the routes to scripts/generate-sitemap.mjs when the content has been
 * signed off — those two changes together are the publish switch, and keeping
 * them together means a page can never be advertised while still noindexed.
 */
import { useParams, Navigate, Link } from 'react-router-dom';

import SEO from '@/components/SEO';
import { generatePage, countyFromSlug, SERVICES } from '@/lib/countyPages';

// The publish switch. See the note above before changing it.
export const NOINDEX_COUNTY_PAGES = true;

const BUSINESS_NAME = 'J. Worden & Sons';
const SITE_DOMAIN = 'www.jwordenasphaltpaving.com';

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
      domain: SITE_DOMAIN,
      county,
      service,
      businessName: BUSINESS_NAME,
    });
  } catch {
    return <Navigate to="/service-areas" replace />;
  }

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
