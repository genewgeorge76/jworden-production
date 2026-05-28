/**
 * siteProfiles.js
 *
 * Multi-site profile registry so one codebase can drive multiple branded sites.
 *
 * Runtime behavior today:
 * - Resolves profile by hostname when possible
 * - Falls back to VITE_SITE_PROFILE or "jworden"
 *
 * This is intentionally lightweight to avoid destabilizing the current site.
 */

import factoryManifest from '@/config/siteFactoryManifest.json'

export const SITE_ROUTE_MODES = {
  FULL_SITE: 'full-site',
  MARKET_LANDING: 'market-landing',
  OPERATIONS: 'operations',
}

const RAW_PROFILES = Array.isArray(factoryManifest?.profiles)
  ? factoryManifest.profiles
  : []

const SITE_PROFILES = RAW_PROFILES.reduce((acc, profile) => {
  if (!profile?.key) return acc
  acc[profile.key] = {
    ...profile,
    routeMode: profile.routeMode || SITE_ROUTE_MODES.FULL_SITE,
    enableChatWidget: Boolean(profile.enableChatWidget),
  }
  return acc
}, {})

const HOSTNAME_PROFILE_HINTS = {
  ...(factoryManifest?.hostnames || {}),
}

const FALLBACK_SITE_KEY = SITE_PROFILES.jworden ? 'jworden' : Object.keys(SITE_PROFILES)[0]

function normalizeHostname(hostname) {
  return String(hostname || '').trim().toLowerCase()
}

export function resolveSiteProfile(hostname) {
  if (!FALLBACK_SITE_KEY) {
    return {
      key: 'default',
      label: 'Default Site',
      canonicalUrl: 'https://www.jwordenasphaltpaving.com',
      primaryColor: '#13283a',
      accentColor: '#f0b429',
      routeMode: SITE_ROUTE_MODES.FULL_SITE,
      enableChatWidget: false,
    }
  }

  const safeHostname = normalizeHostname(
    hostname || (typeof window !== 'undefined' ? window.location.hostname : '')
  )

  const hintedKey = HOSTNAME_PROFILE_HINTS[safeHostname]
  if (hintedKey && SITE_PROFILES[hintedKey]) {
    return SITE_PROFILES[hintedKey]
  }

  const envKey = String(import.meta.env.VITE_SITE_PROFILE || '').trim().toLowerCase()
  if (envKey && SITE_PROFILES[envKey]) {
    return SITE_PROFILES[envKey]
  }

  return SITE_PROFILES[FALLBACK_SITE_KEY]
}

export function getSiteProfiles() {
  return { ...SITE_PROFILES }
}
