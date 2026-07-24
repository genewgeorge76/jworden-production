/**
 * regionalMarketProfiles — hostname → regional market profile lookup.
 *
 * STUB: the original profile dataset was never committed to the repo, which
 * broke the production build (`Could not load src/data/regionalMarketProfiles`).
 * Every caller already treats a `null` result as "no localized profile" and
 * falls back to default content, so returning `null` here keeps those pages
 * rendering correctly. Restore the real hostname→profile map when the data is
 * available.
 */
export function getRegionalMarketProfile(/* hostname */) {
  return null;
}

export default getRegionalMarketProfile;
