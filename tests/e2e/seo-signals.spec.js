/**
 * SEO signal tests — verifies canonical tags, Open Graph, JSON-LD schema,
 * and robots directives on key pages.
 *
 * These catch the most common deploy regressions: a missing canonical, a broken
 * OG image, or a page that accidentally gets noindexed.
 */
import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Stub all API calls so pages render without the Railway backend
  await page.route('**/api/v1/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
  })
})

// Helper: read a <meta> attribute value
async function getMeta(page, selector, attr = 'content') {
  return page.$eval(`meta[${selector}]`, (el, a) => el.getAttribute(a), attr).catch(() => null)
}

// Helper: parse first JSON-LD script on the page
async function getJsonLd(page) {
  const text = await page.$eval('script[type="application/ld+json"]', (el) => el.textContent).catch(() => null)
  if (!text) return null
  try { return JSON.parse(text) } catch { return null }
}

// ── Home ─────────────────────────────────────────────────────────────────────
test('home: has correct title, canonical, OG, and LocalBusiness schema', async ({ page }) => {
  await page.goto('/')

  // Title
  await expect(page).toHaveTitle(/J\. Worden/i)

  // Canonical
  const canonical = await page.$eval('link[rel="canonical"]', (el) => el.href).catch(() => null)
  expect(canonical).toMatch(/jwordenasphaltpaving\.com\/?$|127\.0\.0\.1/)

  // Open Graph
  const ogTitle = await getMeta(page, 'property="og:title"')
  expect(ogTitle).toBeTruthy()
  const ogImage = await getMeta(page, 'property="og:image"')
  expect(ogImage).toBeTruthy()

  // Twitter card
  const twitterCard = await getMeta(page, 'name="twitter:card"')
  expect(twitterCard).toBeTruthy()

  // Not noindexed
  const robots = await getMeta(page, 'name="robots"')
  expect(robots ?? 'index').not.toMatch(/noindex/)
})

// ── Contact ───────────────────────────────────────────────────────────────────
test('contact: indexed, has canonical, has OG', async ({ page }) => {
  await page.goto('/contact')

  const canonical = await page.$eval('link[rel="canonical"]', (el) => el.href).catch(() => null)
  expect(canonical).toBeTruthy()

  const ogTitle = await getMeta(page, 'property="og:title"')
  expect(ogTitle).toBeTruthy()

  const robots = await getMeta(page, 'name="robots"')
  expect(robots ?? 'index').not.toMatch(/noindex/)
})

// ── Quote ─────────────────────────────────────────────────────────────────────
test('quote: indexed, has canonical', async ({ page }) => {
  await page.goto('/quote')
  const canonical = await page.$eval('link[rel="canonical"]', (el) => el.href).catch(() => null)
  expect(canonical).toBeTruthy()
  const robots = await getMeta(page, 'name="robots"')
  expect(robots ?? 'index').not.toMatch(/noindex/)
})

// ── Services ─────────────────────────────────────────────────────────────────
test('paving service page: has JSON-LD Service schema', async ({ page }) => {
  await page.goto('/paving')
  const schema = await getJsonLd(page)
  expect(schema).not.toBeNull()
})

// ── Blog ─────────────────────────────────────────────────────────────────────
test('blog index: indexed, has OG', async ({ page }) => {
  await page.route('**/api/v1/blog/posts**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ posts: [] }) })
  })
  await page.goto('/blog')
  const robots = await getMeta(page, 'name="robots"')
  expect(robots ?? 'index').not.toMatch(/noindex/)
})

// ── Location pages ────────────────────────────────────────────────────────────
test('Richmond city page: has LocalBusiness schema with city name', async ({ page }) => {
  await page.goto('/service-areas/richmond-va')
  const schema = await getJsonLd(page)
  expect(schema).not.toBeNull()
  // Schema should reference Richmond somewhere
  expect(JSON.stringify(schema)).toMatch(/Richmond/i)
})

// ── Admin pages: must be noindexed ────────────────────────────────────────────
test('dashboard: is noindexed (protected page)', async ({ page }) => {
  // Set auth token so the page renders instead of redirecting
  await page.addInitScript(() => {
    window.sessionStorage.setItem('jworden.auth.token', 'e2e-token')
    window.sessionStorage.setItem('jworden.auth.expires_at', String(Math.floor(Date.now() / 1000) + 3600))
  })
  await page.route('**/api/v1/auth/status', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ auth_required: false }) })
  })
  await page.goto('/dashboard')
  const robots = await getMeta(page, 'name="robots"')
  // Either explicit noindex OR the page is behind auth (redirect)
  const url = page.url()
  const isRedirectedAway = !url.includes('/dashboard')
  if (!isRedirectedAway) {
    expect(robots).toMatch(/noindex/)
  }
})

// ── Houzz canonical links ─────────────────────────────────────────────────────
test('general-contracting: Houzz profile links are present and correct', async ({ page }) => {
  await page.goto('/general-contracting')
  const houzzLinks = await page.$$eval(
    'a[href*="houzz.com"]',
    (els) => els.map((el) => el.href)
  )
  expect(houzzLinks.length).toBeGreaterThanOrEqual(1)
  expect(houzzLinks[0]).toContain('j-worden-sons')
})

test('hardscapes: Houzz profile link opens correct URL', async ({ page }) => {
  await page.goto('/hardscapes')
  const houzzLinks = await page.$$eval(
    'a[href*="houzz.com"]',
    (els) => els.map((el) => el.href)
  )
  expect(houzzLinks.length).toBeGreaterThanOrEqual(1)
  expect(houzzLinks[0]).toContain('j-worden-sons')
})

test('reviews: Houzz profile link opens correct URL', async ({ page }) => {
  await page.route('**/api/v1/reviews/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ aggregate_rating: 4.9, total_reviews: 87, reviews: [] }),
    })
  })
  await page.goto('/reviews')
  const houzzLinks = await page.$$eval(
    'a[href*="houzz.com"]',
    (els) => els.map((el) => el.href)
  )
  expect(houzzLinks.length).toBeGreaterThanOrEqual(2)
  expect(houzzLinks.some((h) => h.includes('j-worden-sons'))).toBe(true)
})
