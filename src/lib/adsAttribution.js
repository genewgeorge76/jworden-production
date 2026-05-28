const ATTR_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'wbraid',
  'gbraid',
]

const STORAGE_KEY = 'jworden:last_attribution'

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function readAttributionFromUrl() {
  if (typeof window === 'undefined') return {}
  const qs = new URLSearchParams(window.location.search)
  const result = {}
  for (const key of ATTR_KEYS) {
    const value = qs.get(key)
    if (value) result[key] = value
  }
  return result
}

export function persistAttribution() {
  if (typeof window === 'undefined') return {}
  const fromUrl = readAttributionFromUrl()
  if (Object.keys(fromUrl).length > 0) {
    const existing = safeJsonParse(window.localStorage.getItem(STORAGE_KEY) || '')
    const merged = {
      ...(existing && typeof existing === 'object' ? existing : {}),
      ...fromUrl,
      captured_at: existing?.captured_at || new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    return merged
  }

  const cached = safeJsonParse(window.localStorage.getItem(STORAGE_KEY) || '')
  return cached && typeof cached === 'object' ? cached : {}
}

export function getAttribution() {
  if (typeof window === 'undefined') return {}
  const cached = safeJsonParse(window.localStorage.getItem(STORAGE_KEY) || '')
  return cached && typeof cached === 'object' ? cached : {}
}

export function getAttributionEventParams() {
  const a = getAttribution()
  return {
    traffic_source: a.utm_source || 'direct',
    traffic_medium: a.utm_medium || 'none',
    traffic_campaign: a.utm_campaign || 'none',
    traffic_term: a.utm_term || 'none',
    traffic_content: a.utm_content || 'none',
    gclid: a.gclid || undefined,
    wbraid: a.wbraid || undefined,
    gbraid: a.gbraid || undefined,
  }
}

export function inferAttributionConversionSource(attribution = {}, referrer = '') {
  const source = String(attribution.utm_source || '').toLowerCase()
  const medium = String(attribution.utm_medium || '').toLowerCase()
  const campaign = String(attribution.utm_campaign || '').toLowerCase()
  const ref = String(referrer || '').toLowerCase()

  if (attribution.gclid || attribution.wbraid || attribution.gbraid) return 'google_ads'
  if (source === 'google_ads' || source === 'googleads' || source === 'adwords') return 'google_ads'
  if (source === 'facebook' || source === 'fb') return 'facebook'
  if (source === 'houzz') return 'houzz'
  if (medium.includes('geofence') || source.includes('geofence') || campaign.includes('geofence') || campaign.includes('geo_fence')) {
    return 'geofencing'
  }
  if (medium.includes('backlink') || source.includes('backlink') || source.includes('partner')) {
    return 'backlink_partner'
  }
  if (ref.includes('google.')) return 'google_organic'
  if (ref.includes('facebook.')) return 'facebook'
  if (ref.includes('houzz.')) return 'houzz'
  if (ref && !ref.includes('jwordenasphaltpaving.com')) return 'referral'
  return 'direct'
}

export function getLeadAttributionFields() {
  const a = getAttribution()
  const inferredSource = inferAttributionConversionSource(a, typeof document !== 'undefined' ? document.referrer : '')
  const referrerDomain = (() => {
    try {
      if (typeof document === 'undefined' || !document.referrer) return undefined
      return new URL(document.referrer).hostname
    } catch {
      return undefined
    }
  })()
  return {
    conversion_source: inferredSource,
    attribution_snapshot: Object.keys(a).length ? JSON.stringify(a) : undefined,
    attribution_first_touch_at: a.captured_at || new Date().toISOString(),
    gclid: a.gclid || undefined,
    wbraid: a.wbraid || undefined,
    gbraid: a.gbraid || undefined,
    geofence_vendor: a.utm_source && inferredSource === 'geofencing' ? a.utm_source : undefined,
    geofence_campaign: inferredSource === 'geofencing' ? a.utm_campaign || undefined : undefined,
    backlink_domain: inferredSource === 'backlink_partner' ? referrerDomain : undefined,
    offline_conversion_ready: Boolean(a.gclid || a.wbraid || a.gbraid),
  }
}

export function getOfflineConversionIdentifiers() {
  const a = getAttribution()
  return {
    gclid: a.gclid || null,
    wbraid: a.wbraid || null,
    gbraid: a.gbraid || null,
  }
}
