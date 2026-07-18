/**
 * siteProfiles.js
 * 
 * Provides constants for site routing modes.
 */

export const SITE_ROUTE_MODES = {
  FULL_SITE: 'full-site',
  MARKET_LANDING: 'market-landing',
  OPERATIONS: 'operations',
  UNIVERSITY: 'university',
  SAAS_CLIENT: 'saas-client',
};

/**
 * SAAS_CLIENT branding tiers.
 * - 'jarvis'         → "Powered by Jarvis"
 * - 'worden_standard' → "Powered by The Worden Standard"
 * - 'white_label'   → No branding (enterprise tier)
 */
export const SAAS_BRANDING_TIERS = {
  JARVIS: 'jarvis',
  WORDEN_STANDARD: 'worden_standard',
  WHITE_LABEL: 'white_label',
};

/**
 * Resolve the "Powered by" footer label for a given tenant.
 * Falls back to 'jarvis' if no branding_tier is specified.
 */
export function getSaasBrandingLabel(tenant) {
  const tier = tenant?.branding_tier || SAAS_BRANDING_TIERS.JARVIS;
  if (tier === SAAS_BRANDING_TIERS.WORDEN_STANDARD) return 'Powered by The Worden Standard';
  if (tier === SAAS_BRANDING_TIERS.WHITE_LABEL) return null;
  return 'Powered by Jarvis';
}
