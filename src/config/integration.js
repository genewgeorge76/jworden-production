const FALLBACK_API_BASE = 'https://jworden-api.fly.dev'
const FALLBACK_UNIVERSITY_ENDPOINT = `${FALLBACK_API_BASE}/api/worden-university/contract`

const canonicalBackend = {}
const sharedContract = {}

const normalizeUrl = (value, fallback = '') => {
  const safe = String(value || fallback || '').trim()
  return safe.replace(/\/$/, '')
}

const toOrigin = (value) => {
  try {
    return new URL(value).origin.toLowerCase()
  } catch {
    return String(value || '').trim().toLowerCase()
  }
}

export const canonicalBackendRepo = String(canonicalBackend.repo || 'codexbuildfreeofbase44').toLowerCase()
export const canonicalBackendDomain = normalizeUrl(canonicalBackend.domain, FALLBACK_API_BASE)
export const canonicalApiBaseUrl = normalizeUrl(sharedContract.apiBaseUrl, canonicalBackendDomain || FALLBACK_API_BASE)
export const universityContractEndpoint = normalizeUrl(
  sharedContract.universityContractEndpoint,
  FALLBACK_UNIVERSITY_ENDPOINT,
)

export const repoAliases = Object.freeze(
  Object.fromEntries(
    (Array.isArray(canonicalBackend.aliases) ? canonicalBackend.aliases : [])
      .map((alias) => [String(alias || '').toLowerCase(), canonicalBackendRepo])
      .filter(([alias]) => alias),
  ),
)

export const integrationSurfaces = []
export const integrationDataSources = {}
export const integrationLegacyAssets = {}

export const sharedAllowedOrigins = Object.freeze(
  Array.from(
    new Set(
      (Array.isArray(sharedContract.allowedOrigins) ? sharedContract.allowedOrigins : [])
        .map((origin) => toOrigin(origin))
        .filter(Boolean),
    ),
  ),
)

export const expectedSources = Object.freeze(
  Array.from(
    new Set(
      (Array.isArray(sharedContract.expectedSources) ? sharedContract.expectedSources : [])
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean),
    ),
  ),
)

export const resolveRepoAlias = (repo) => {
  const normalized = String(repo || '').trim().toLowerCase()
  return repoAliases[normalized] || normalized
}

/**
 * In a browser on any deployed host, the API base is SAME-ORIGIN ('').
 *
 * vercel.json's first rewrite proxies /api/(.*) to the Fly backend, so a
 * relative fetch('/api/v1/...') works on every attached domain and on every
 * preview URL without the backend having to CORS-allowlist each origin. The
 * absolute Fly URL is what broke Mr. Worden everywhere but the five
 * allowlisted origins: the browser went cross-origin, preflight got 400, and
 * the chat silently died. Localhost keeps the absolute base because the Vite
 * dev server has no /api proxy (and Fly's CORS already allows localhost).
 */
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname
    const isLocal = h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local')
    if (!isLocal) return ''
  }
  return normalizeUrl(import.meta.env.VITE_API_BASE_URL, canonicalApiBaseUrl)
}
export const getSiteSource = () => {
  const envSource = String(import.meta.env.VITE_WORDEN_SOURCE || '').trim().toLowerCase()
  return envSource || 'jwordenproduction'
}

export const getAllowedOrigins = () => {
  const activeSiteDomain = String(import.meta.env.VITE_SITE_DOMAIN || '').trim()
  const activeSiteOrigin = activeSiteDomain ? toOrigin(`https://${activeSiteDomain.replace(/^https?:\/\//, '')}`) : ''
  const origins = new Set(sharedAllowedOrigins)
  if (activeSiteOrigin) origins.add(activeSiteOrigin)
  return [...origins]
}
