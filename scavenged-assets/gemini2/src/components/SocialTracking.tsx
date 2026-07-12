import { useEffect } from 'react'

declare global {
  interface Window {
    fbAsyncInit?: () => void
    FB?: {
      init: (config: {
        appId: string
        cookie: boolean
        xfbml: boolean
        version: string
      }) => void
    }
    TiktokAnalytics?: TiktokAnalyticsQueue
  }
}

type TiktokAnalyticsMethod = 'track' | 'identify'

type TiktokAnalyticsQueue = Array<[TiktokAnalyticsMethod, ...unknown[]]> & {
  methods: TiktokAnalyticsMethod[]
  factory: (method: TiktokAnalyticsMethod) => (...args: unknown[]) => TiktokAnalyticsQueue
  load: (id: string) => void
  track: (...args: unknown[]) => TiktokAnalyticsQueue
  identify: (...args: unknown[]) => TiktokAnalyticsQueue
}

const FACEBOOK_SDK_ID = 'facebook-jssdk'
const TIKTOK_SDK_ID = 'tiktok-pixel-sdk'

function getFacebookAppId() {
  return import.meta.env.VITE_FACEBOOK_APP_ID?.trim() ?? ''
}

function getTikTokPixelId() {
  return import.meta.env.VITE_TIKTOK_PIXEL_ID?.trim() ?? ''
}

export default function SocialTracking() {
  useEffect(() => {
    const appId = getFacebookAppId()
    if (!appId) {
      return
    }

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId,
        cookie: true,
        xfbml: true,
        version: 'v9.0',
      })
    }

    if (document.getElementById(FACEBOOK_SDK_ID)) {
      return
    }

    const firstScript = document.getElementsByTagName('script')[0]
    if (!firstScript?.parentNode) {
      return
    }

    const script = document.createElement('script')
    script.id = FACEBOOK_SDK_ID
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.async = true
    script.defer = true
    firstScript.parentNode.insertBefore(script, firstScript)
  }, [])

  useEffect(() => {
    const pixelId = getTikTokPixelId()
    if (!pixelId) {
      return
    }

    if (document.getElementById(TIKTOK_SDK_ID)) {
      return
    }

    const analytics = (window.TiktokAnalytics || []) as TiktokAnalyticsQueue
    analytics.methods = ['track', 'identify']
    analytics.factory = (method: TiktokAnalyticsMethod) => {
      return (...args: unknown[]) => {
        const queuedCall: [TiktokAnalyticsMethod, ...unknown[]] = [method, ...args]
        analytics.push(queuedCall)
        return analytics
      }
    }

    for (const method of analytics.methods) {
      analytics[method] = analytics.factory(method)
    }

    analytics.load = (id: string) => {
      const script = document.createElement('script')
      script.id = TIKTOK_SDK_ID
      script.src = 'https://analytics.tiktok.com/i18n/pixel/events.js'
      script.setAttribute('data-pixel-id', id)
      script.async = true
      document.head.appendChild(script)
    }

    analytics.load(pixelId)
    window.TiktokAnalytics = analytics
  }, [])

  return null
}
