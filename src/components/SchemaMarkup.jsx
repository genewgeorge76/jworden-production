import { Helmet, HelmetData } from 'react-helmet-async'
import { SITE_URL } from '../lib/schemas'
import { useTenant } from '../lib/TenantContext'

// Re-export schema helpers so existing page imports still work via this path.
export {
  LOCAL_BUSINESS_SCHEMA,
  ORGANIZATION_SCHEMA,
  WEBSITE_SCHEMA,
  FOUNDER_PERSON_SCHEMA,
  serviceSchema,
  faqSchema,
  reviewsSchema,
  howToSchema,
  videoObjectSchema,
  projectCaseStudySchema,
  premiumBlogPostingSchema,
} from '../lib/schemas'

const standaloneHelmetData = new HelmetData({})

/**
 * Injects SEO meta tags, Open Graph, Twitter Card, and JSON-LD
 * structured data into <head> for a given page.
 *
 * Props:
 *   title       — page <title> (appended with brand)
 *   description — meta description (max ~160 chars)
 *   canonical   — canonical path, e.g. "/services"
 *   image       — absolute OG image URL (defaults to /og-default.jpg)
 *   schema      — JSON-LD object (or array of objects) to inject
 *   breadcrumb  — array of { name, path } for BreadcrumbList schema
 *   noindex     — when true, emit robots="noindex,follow" so the page is
 *                 excluded from search results (use for soft-404, gated, or
 *                 utility pages that should not appear in the SERPs).
 */
export default function SchemaMarkup({
  title,
  description,
  canonical = '/',
  image = `${SITE_URL}/og-default.jpg`,
  schema,
  breadcrumb,
  noindex = false,
}) {
  const tenant = useTenant()
  const currentSiteUrl = tenant?.canonicalUrl || SITE_URL
  const brandName = tenant?.market?.marketName || tenant?.label || 'J. Worden & Sons Paving LLC'

  const fullTitle = `${title} | ${brandName}`
  const canonicalUrl = `${currentSiteUrl}${canonical}`
  const resolvedImage = image.startsWith('http') ? image : `${currentSiteUrl}${image.replace(SITE_URL, '')}`

  const schemas = []

  // Inject provided schema(s)
  if (schema) {
    if (Array.isArray(schema)) schemas.push(...schema)
    else schemas.push(schema)
  }

  // BreadcrumbList
  if (breadcrumb && breadcrumb.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumb.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: item.name,
        item: `${currentSiteUrl}${item.path}`,
      })),
    })
  }

  // Dynamically rewrite hardcoded URLs and Brand Names in static schemas
  const rewrittenSchemas = schemas.map(s => {
    let str = JSON.stringify(s)
    // Replace hardcoded canonical URL with the actual domain
    str = str.replace(new RegExp(SITE_URL, 'g'), currentSiteUrl)
    // Replace hardcoded brand name if this domain has a custom profile
    if (brandName !== 'J. Worden & Sons Paving LLC') {
      str = str.replace(/J\. Worden & Sons Paving LLC/g, brandName)
    }
    return JSON.parse(str)
  })

  return (
    <Helmet helmetData={standaloneHelmetData}>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {/* Per-page robots override. Defaults in index.html allow indexing;
          setting noindex here suppresses it for soft-404 / utility pages. */}
      {noindex && <meta name="robots" content="noindex,follow" />}
      {noindex && <meta name="googlebot" content="noindex,follow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={resolvedImage} />
      <meta property="og:site_name" content={brandName} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@JWordenSons" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedImage} />

      {/* JSON-LD blocks */}
      {rewrittenSchemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  )
}
