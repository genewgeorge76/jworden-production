/**
 * Social media configuration for J. Worden & Sons.
 *
 * All platform URLs, handles, and sharing utilities live here.
 * Override individual URLs via environment variables so staging and
 * production can point to different profiles without code changes.
 */

export const SOCIAL_PROFILES = {
  facebook: {
    url: import.meta.env.VITE_FACEBOOK_URL || 'https://www.facebook.com/jwordenpaving/',
    label: 'Facebook',
    handle: 'jwordenpaving',
    color: '#1877F2',
  },
  instagram: {
    url: import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/jwordensons',
    label: 'Instagram',
    handle: '@jwordensons',
    color: '#E1306C',
  },
  youtube: {
    url: import.meta.env.VITE_YOUTUBE_URL || 'https://www.youtube.com/@JWordenSons',
    label: 'YouTube',
    handle: '@JWordenSons',
    color: '#FF0000',
    // Checked 2026-08-24: youtube.com/@JWordenSons returns 404. The channel
    // does not exist. Kept here rather than deleted so that setting
    // VITE_YOUTUBE_URL restores it everywhere at once — see `live` below.
    live: false,
  },
  linkedin: {
    url:
      import.meta.env.VITE_LINKEDIN_URL ||
      'https://www.linkedin.com/showcase/j.-worden-%26-sons-paving-l.l.c./',
    label: 'LinkedIn',
    handle: 'J. Worden & Sons',
    color: '#0A66C2',
  },
  twitter: {
    // Checked 2026-08-24 on both hosts: twitter.com/JWordenSons and
    // x.com/JWordenSons both return 404. Set VITE_TWITTER_URL to restore.
    live: false,
    url: import.meta.env.VITE_TWITTER_URL || 'https://twitter.com/JWordenSons',
    label: 'X / Twitter',
    handle: '@JWordenSons',
    color: '#000000',
  },
  googlebusiness_va: {
    url: import.meta.env.VITE_GMB_VA_URL || null,
    label: 'Google Business Profile (Virginia)',
    handle: 'J. Worden & Sons VA',
    color: '#4285F4',
  },
  googlebusiness_ga: {
    url: import.meta.env.VITE_GMB_GA_URL || null,
    label: 'Google Business Profile (Atlanta, GA)',
    handle: 'J. Worden & Sons GA',
    color: '#4285F4',
  },
  googlebusiness_fl: {
    url: import.meta.env.VITE_GMB_FL_URL || null,
    label: 'Google Business Profile (Florida)',
    handle: 'J. Worden & Sons FL',
    color: '#4285F4',
  },
  nextdoor: {
    url:
      import.meta.env.VITE_NEXTDOOR_URL ||
      'https://nextdoor.com/pages/nashville-asphalt-paving-pros-chester-va/',
    label: 'Nextdoor',
    handle: 'J. Worden & Sons',
    color: '#8DB600',
  },
  alignable: {
    url:
      import.meta.env.VITE_ALIGNABLE_URL ||
      'https://www.alignable.com/chester-va/j-worden-sons-paving',
    label: 'Alignable',
    handle: 'J. Worden & Sons',
    color: '#1F2D5A',
  },
  houzz: {
    url:
      import.meta.env.VITE_HOUZZ_URL ||
      'https://www.houzz.com/professionals/stone-pavers-and-concrete/j-worden-and-sons-paving-l-l-c-pfvwus-pf~663227484',
    label: 'Houzz',
    handle: 'J. Worden & Sons',
    color: '#7AC142',
  },
  tiktok: {
    url: import.meta.env.VITE_TIKTOK_URL || 'https://www.tiktok.com/@jwordenandsonspaving',
    label: 'TikTok',
    handle: '@jwordenandsonspaving',
    color: '#000000',
  },
}

/**
 * Whether a profile actually resolves.
 *
 * A `sameAs` entry is an identity claim — it tells a crawler "this business is
 * also that page". Pointing one at a 404 does not fail quietly: it asks the
 * crawler to reconcile the entity against a page that is not there, which is
 * the opposite of what sameAs is for. The whole set was checked on 2026-08-24
 * and two were dead, so those are marked `live: false` above and excluded here
 * rather than published.
 *
 * An explicit env override always wins. If the account is created later,
 * setting VITE_TWITTER_URL or VITE_YOUTUBE_URL puts it back into `sameAs`, the
 * footer and the icon strip in one move, with no code change.
 */
const OVERRIDES = {
  twitter: import.meta.env.VITE_TWITTER_URL,
  youtube: import.meta.env.VITE_YOUTUBE_URL,
}

const isLive = (key) => {
  const profile = SOCIAL_PROFILES[key]
  if (!profile?.url) return false
  return profile.live !== false || Boolean(OVERRIDES[key])
}

/** Ordered list for display in icon strips — only platforms with icon assets in SocialLinks.jsx. */
export const SOCIAL_DISPLAY_ORDER = [
  'googlebusiness_va',
  'googlebusiness_ga',
  'googlebusiness_fl',
  'facebook',
  'instagram',
  'youtube',
  'linkedin',
  'twitter',
  'nextdoor',
].filter(isLive)

/** Every key in SOCIAL_PROFILES, live or not. */
export const SOCIAL_ALL_KEYS = Object.keys(SOCIAL_PROFILES)

/** The keys whose profiles resolve. */
export const SOCIAL_LIVE_KEYS = SOCIAL_ALL_KEYS.filter(isLive)

/**
 * Flat array of profile URLs — injected into Schema.org `sameAs` to tell a
 * crawler which accounts belong to this business. Live profiles only.
 */
export const SAME_AS_URLS = SOCIAL_LIVE_KEYS.map((k) => SOCIAL_PROFILES[k].url)

/**
 * Build a UTM-tagged canonical share URL for a given path.
 *
 * @param {string} path  — e.g. "/services" or "/projects"
 * @param {object} opts  — override utm_source, utm_medium, utm_campaign
 */
export function buildShareUrl(
  path,
  { utm_source = 'social', utm_medium = 'social', utm_campaign = 'share' } = {}
) {
  const base = import.meta.env.VITE_SITE_URL || 'https://www.jwordenasphaltpaving.com'
  const params = new URLSearchParams({ utm_source, utm_medium, utm_campaign })
  return `${base}${path}?${params.toString()}`
}

/**
 * Build ready-to-use platform share links for a given absolute URL.
 *
 * @param {string} pageUrl   — absolute URL to share (with UTM params already appended)
 * @param {string} shareText — pre-populated text for tweet / WhatsApp
 */
export function buildShareLinks(
  pageUrl,
  shareText = 'J. Worden & Sons — 4th-Generation Asphalt Paving Since 1984'
) {
  const encoded = encodeURIComponent(pageUrl)
  const encodedText = encodeURIComponent(shareText)
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    twitter: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedText}&via=JWordenSons`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encoded}`,
    email: `mailto:?subject=${encodeURIComponent('Check this out — J. Worden & Sons')}&body=${encodedText}%0A%0A${encoded}`,
  }
}
