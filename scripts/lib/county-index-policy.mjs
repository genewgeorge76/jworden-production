/**
 * county-index-policy.mjs — which county pages may be indexed and advertised.
 *
 * One definition, imported by both sides:
 *
 *   scripts/build-brand-sites.mjs   stamps the robots meta on each page
 *   scripts/generate-sitemap.mjs    decides which URLs go in the sitemap
 *
 * They cannot read each other's output — generate-sitemap runs in `prebuild`
 * and build-brand-sites in `postbuild`, so the brand manifest does not exist
 * yet when the sitemap is written. The obvious workaround is to write the rule
 * out twice, and two copies of a rule drift. The drift is silent and it is
 * exactly the contradiction Search Console reports as an error: a URL
 * advertised in a sitemap while the page itself says noindex.
 *
 * So the rule lives here, once.
 *
 * The rule
 * ────────
 * All 475 county pages are generated and reachable; a URL that exists should
 * serve its own content rather than redirect. But "distinct" is not
 * "substantial", and only pages clearing both bars are advertised:
 *
 *   1. The county returned real facts — a measured elevation and at least one
 *      citable VDOT reference. Fourteen did not; those are the plain
 *      template at roughly a hundred words.
 *   2. It is the primary service. Measured on Augusta County, two services in
 *      the same county share 0.82 of their vocabulary — exactly the
 *      uniqueness gate's ceiling, at ~150 words each. Five near-identical
 *      pages per county is the weak axis, so only the money term opens first.
 *
 * Widening the set means changing this file, and both sides follow.
 */

export const PRIMARY_SERVICE = 'commercial-asphalt-paving';

export function countySlug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function countyPath(county, service) {
  return `/virginia/${countySlug(county)}-county/${service}`;
}

/**
 * @param {{county: string, service: string}} route
 * @param {Set<string>} factCounties counties with usable facts (complete === true)
 */
export function isIndexable(route, factCounties) {
  return route.service === PRIMARY_SERVICE && factCounties.has(route.county);
}

/** Counties whose fact lookup produced something worth publishing. */
export function factCountiesFrom(factsJson) {
  return new Set(
    (factsJson?.counties || []).filter((c) => c.complete).map((c) => c.county),
  );
}

/** Every county/service pair in the roster. */
export function allCountyRoutes(marketPagesJson) {
  const out = [];
  for (const d of marketPagesJson.districts || []) {
    for (const county of d.counties || []) {
      for (const [service, entry] of Object.entries(marketPagesJson.services || {})) {
        out.push({ county, district: d.name, service, label: entry.label, specs: entry.specs || [] });
      }
    }
  }
  return out;
}
