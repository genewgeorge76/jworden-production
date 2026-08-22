/**
 * site-hosts.mjs — which hostname is the real one for a domain.
 *
 * One definition, imported by both sides:
 *
 *   scripts/build-brand-sites.mjs   stamps the canonical on every brand page
 *   scripts/generate-sitemap.mjs    writes the <loc> of every advertised URL
 *
 * Same reason as county-index-policy.mjs next door: these two scripts run at
 * different points in the build and cannot read each other's output, so the
 * rule got written out twice and the two copies drifted.
 *
 * The drift was live. Richmond's pages carried
 * canonical=https://www.richmondasphaltpaving.com/... because
 * build-brand-sites hardcoded `https://www.${domain}`, while its sitemap
 * advertised https://richmondasphaltpaving.com/... because generate-sitemap
 * used the bare domain. Both hosts answer 200 — the vercel.json rewrites match
 * `(www\.)?<domain>` and serve the same files — so Google was handed 87 URLs
 * and told, on each one, that the page it had just fetched was not the real
 * address. Search Console files that as "Alternate page with proper canonical
 * tag": the www copy is indexed and every submitted URL is reported as not
 * indexed as submitted. The sitemap cancels itself.
 *
 * The rule
 * ────────
 * Apex is canonical. Three independent signals already pointed there before
 * this file existed: the sitemaps advertise apex, the .net redirects
 * (richmondasphaltpaving.net, savannahpaving.net) target apex, and apex is
 * what the business calls these sites.
 *
 * WWW_CANONICAL is the exception list, and it exists because one domain
 * genuinely is a www site: jwordenasphaltpaving.com has always been published,
 * linked and redirected to as www.jwordenasphaltpaving.com. Flipping it to
 * apex here would silently rewrite the hub URL that every brand page links
 * back to, which is a different change than the one this file is making.
 *
 * Adding a domain to the exception list means adding a www -> apex redirect
 * removal in vercel.json to match. The two have to agree: a canonical pointing
 * at a host that 301s somewhere else is worse than the drift it replaced.
 */

/**
 * Domains whose canonical hostname carries the www prefix. Everything not
 * listed here is canonical at the apex.
 */
export const WWW_CANONICAL = new Set([
  'jwordenasphaltpaving.com',
]);

/** Strip a leading www. and lowercase, so any spelling resolves the same. */
export function bareDomain(input) {
  return String(input || '').trim().toLowerCase().replace(/^www\./, '');
}

/** The one hostname that should appear in a canonical, a <loc>, or a link. */
export function canonicalHost(input) {
  const bare = bareDomain(input);
  return WWW_CANONICAL.has(bare) ? `www.${bare}` : bare;
}

/** `https://` + canonicalHost, with no trailing slash. */
export function canonicalOrigin(input) {
  return `https://${canonicalHost(input)}`;
}

/**
 * A full canonical URL for one path on one domain.
 *
 * Takes the path exactly as the route defines it. '/' stays '/', because a
 * canonical of "https://example.com" and one of "https://example.com/" are
 * the same page to a browser and two different strings to a crawler.
 */
export function canonicalUrl(input, path = '/') {
  const p = String(path || '/');
  return `${canonicalOrigin(input)}${p === '/' ? '/' : p}`;
}

/** The hostname that must 301 away, or null when a domain has none. */
export function redirectHost(input) {
  const bare = bareDomain(input);
  return WWW_CANONICAL.has(bare) ? bare : `www.${bare}`;
}
