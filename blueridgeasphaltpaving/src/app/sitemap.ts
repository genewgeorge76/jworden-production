import { MetadataRoute } from 'next'
import { getSortedInsightsData } from '@/lib/insights'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://jwordenasphaltpaving.com'

  // Main Services
  const services = [
    '',
    '/commercial-paving',
    '/residential-driveways',
    '/asphalt-milling',
    '/sealcoating-maintenance',
    '/insights',
  ]

  // Local SEO Silo Pages
  const locations = [
    '/richmond-va',
    '/henrico-va',
    '/23221',
    '/chester-va',
    '/chesterfield-va',
    '/midlothian-va',
    '/new-kent-va',
    '/williamsburg-va',
    '/hanover-va',
    '/ashland-va',
    '/powhatan-va',
    '/goochland-va',
    '/hopewell-va',
    '/prince-george-va',
    '/fredericksburg-va',
    '/petersburg-va',
    '/mechanicsville-va',
    '/colonial-heights-va',
    '/the-fan-district',
    '/museum-district',
    '/windsor-farms',
    '/stratford-hills',
    '/west-end-richmond',
    '/church-hill',
    '/scotts-addition',
  ]

  const serviceUrls = services.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  const locationUrls = locations.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Dynamic Insight/Blog Pages
  const insights = getSortedInsightsData()
  const insightUrls = insights.map((insight) => ({
    url: `${baseUrl}/insights/${insight.slug}`,
    lastModified: new Date(insight.date),
    changeFrequency: 'yearly' as const,
    priority: 0.6,
  }))

  return [...serviceUrls, ...locationUrls, ...insightUrls]
}
