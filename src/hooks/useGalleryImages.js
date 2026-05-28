import { useState, useEffect, useCallback } from 'react'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

/**
 * US state name + abbreviation lookup. Used by the location parser so we can
 * accept either "Richmond, VA" or "Richmond, Virginia" in a job_name.
 */
const US_STATES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
  MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}
const STATE_NAME_TO_ABBR = Object.fromEntries(
  Object.entries(US_STATES).map(([abbr, name]) => [name.toLowerCase(), abbr]),
)

/**
 * Try to extract a city / state from any free-text field on a gallery image.
 *
 * Operators upload photos with `job_name` strings like:
 *   "KFC Parking Lot — Richmond, VA"
 *   "Driveway, Stewarts Draft VA"
 *   "Taco Bell - Colonial Heights, Virginia"
 *
 * We pull out the city and 2-letter state code so the homepage can render a
 * caption + emit `contentLocation` JSON-LD without making the operator type
 * the same data into a separate field.
 *
 * Returns `null` if no location can be confidently identified — the caller
 * falls back to the brand's primary service area in that case.
 */
export function parseLocation(text) {
  if (!text || typeof text !== 'string') return null
  const cleaned = text.replace(/[—–]/g, '-')
  // Capture group 1: a city name — initial-capital words (1-4 of them) so we
  // accept "Richmond", "Stewarts Draft", "Virginia Beach", "Colonial Heights".
  // Capture group 2: a state — either a 2-letter code ("VA") or 1-2 capitalized
  // words ("Virginia", "New York", "North Carolina"). The state is then
  // resolved against US_STATES to filter out false positives.
  const re = /([A-Z][A-Za-z.'’-]+(?:\s+[A-Z][A-Za-z.'’-]+){0,3})[,\s-]+([A-Z]{2}|[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/g
  let match
  let last = null
  while ((match = re.exec(cleaned)) !== null) {
    const cityCandidate = match[1].trim()
    const stateCandidate = match[2].trim()
    let abbr = null
    if (stateCandidate.length === 2 && US_STATES[stateCandidate.toUpperCase()]) {
      abbr = stateCandidate.toUpperCase()
    } else if (STATE_NAME_TO_ABBR[stateCandidate.toLowerCase()]) {
      abbr = STATE_NAME_TO_ABBR[stateCandidate.toLowerCase()]
    }
    if (abbr && cityCandidate.length >= 3) {
      last = { city: cityCandidate, region: abbr, country: 'US' }
    }
  }
  return last
}

/**
 * Build a content-location candidate from any structured location fields the
 * API may already return, falling back to parsing the job_name / description.
 *
 * The backend currently doesn't store geo fields, but we look for them anyway
 * so this works automatically when columns are added later.
 */
export function imageLocation(img) {
  if (!img) return null
  if (typeof img.latitude === 'number' && typeof img.longitude === 'number') {
    return {
      city: img.city || img.location || null,
      region: img.region || img.state || null,
      country: img.country || 'US',
      lat: img.latitude,
      lon: img.longitude,
    }
  }
  if (img.city || img.location || img.region || img.state) {
    return {
      city: img.city || img.location || null,
      region: img.region || img.state || null,
      country: img.country || 'US',
    }
  }
  return parseLocation(img.job_name) || parseLocation(img.description)
}

/**
 * Shared hook for loading the public gallery.
 *
 * Used by both the dedicated /gallery page (full grid + admin tools) and the
 * Home page Featured Branded Work carousel — single source of truth so the
 * homepage automatically updates whenever an operator uploads a new photo.
 *
 * Options:
 *   defer  — when true, the network request is delayed until after first
 *            paint via `requestIdleCallback` (falling back to setTimeout).
 *            The gallery payload is heavy (base64-encoded data URIs from the
 *            backend), so deferring it on the homepage keeps it from
 *            competing with the LCP hero image.
 */
export function useGalleryImages({ defer = false } = {}) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(!defer)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE}/api/v1/gallery/images`)
      if (!res.ok) throw new Error(`Failed to load gallery (${res.status})`)
      const data = await res.json()
      setImages(Array.isArray(data.images) ? data.images : [])
    } catch (err) {
      setError(err.message || 'Could not load gallery.')
      setImages([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!defer) {
      reload()
      return
    }
    // Wait for the browser to be idle so we don't compete with the LCP/hero
    // render. Falls back to a 1.5s setTimeout when requestIdleCallback is
    // unavailable (Safari).
    const ric = typeof window !== 'undefined' && window.requestIdleCallback
    let handle
    if (ric) {
      handle = ric(() => reload(), { timeout: 2500 })
      return () => window.cancelIdleCallback && window.cancelIdleCallback(handle)
    }
    handle = setTimeout(reload, 1500)
    return () => clearTimeout(handle)
  }, [defer, reload])

  return { images, loading, error, reload, setImages }
}
