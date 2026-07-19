/**
 * siteProfiles.js
 * 
 * Provides constants and helpers for site & subdomain routing modes.
 */

export const SITE_ROUTE_MODES = {
  FULL_SITE: 'full-site',
  MARKET_LANDING: 'market-landing',
  OPERATIONS: 'operations',
  UNIVERSITY: 'university',
  SAAS_CLIENT: 'saas-client',
};

export const SUBDOMAIN_MODES = {
  ADMIN: 'admin',         // admin.thewordenstandard.com -> /command-center
  CREW: 'crew',           // crew.jwordenasphaltpaving.com -> /staff
  BIDS: 'bids',           // bids.jwordenasphaltpaving.com -> /subcontractors
  PORTAL: 'portal',       // portal.jwordenasphaltpaving.com -> /client-lite
};

export function detectSubdomainMode(hostname = window.location.hostname) {
  const host = hostname.toLowerCase();
  if (host.startsWith('admin.') || host.startsWith('command.')) return SUBDOMAIN_MODES.ADMIN;
  if (host.startsWith('crew.') || host.startsWith('staff.')) return SUBDOMAIN_MODES.CREW;
  if (host.startsWith('bids.') || host.startsWith('vendors.')) return SUBDOMAIN_MODES.BIDS;
  if (host.startsWith('portal.') || host.startsWith('myquote.')) return SUBDOMAIN_MODES.PORTAL;
  return null;
}

export const SAAS_BRANDING_TIERS = {
  JARVIS: 'jarvis',
  WORDEN_STANDARD: 'worden_standard',
  WHITE_LABEL: 'white_label',
};

export function getSaasBrandingLabel(tenant) {
  const tier = tenant?.branding_tier || SAAS_BRANDING_TIERS.JARVIS;
  if (tier === SAAS_BRANDING_TIERS.WORDEN_STANDARD) return 'Powered by The Worden Standard';
  if (tier === SAAS_BRANDING_TIERS.WHITE_LABEL) return null;
  return 'Powered by Jarvis';
}
