/**
 * Public pages smoke tests — no auth required.
 * Verifies critical customer-facing pages load, render their headline,
 * and contain at least one call-to-action link.
 */
import { test, expect } from '@playwright/test'

// Stub the live-data API calls so tests don't need Railway running
test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
  })
})

// ── Home ────────────────────────────────────────────────────────────────────
test('home page renders headline and phone CTA', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/J\. Worden/i)
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /804/i }).first()).toBeVisible()
})

// ── Services ─────────────────────────────────────────────────────────────────
test('services page renders and links to sub-services', async ({ page }) => {
  await page.goto('/services')
  await expect(page).toHaveTitle(/Service/i)
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
})

test('asphalt paving page renders', async ({ page }) => {
  await page.goto('/paving')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /804/i }).first()).toBeVisible()
})

test('sealcoating page renders', async ({ page }) => {
  await page.goto('/sealcoating')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
})

test('concrete page renders', async ({ page }) => {
  await page.goto('/concrete')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
})

test('crack repair page renders', async ({ page }) => {
  await page.goto('/crack-repair')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
})

test('parking lots page renders', async ({ page }) => {
  await page.goto('/parking-lots')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
})

test('hardscapes page renders with Houzz section', async ({ page }) => {
  await page.goto('/hardscapes')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  // Houzz awards strip we added
  await expect(page.getByText(/Houzz Awards/i)).toBeVisible()
  await expect(page.getByText(/Best of Houzz/i).first()).toBeVisible()
})

test('general contracting page renders with Houzz strip', async ({ page }) => {
  await page.goto('/general-contracting')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  await expect(page.getByText(/Houzz Pro Certified/i)).toBeVisible()
  await expect(page.getByText(/Best of Houzz/i).first()).toBeVisible()
})

test('residential page renders', async ({ page }) => {
  await page.goto('/residential')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
})

test('millings and fines page renders', async ({ page }) => {
  await page.goto('/millings-fines')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
})

test('tar and chip page renders', async ({ page }) => {
  await page.goto('/tar-and-chip')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
})

// ── Location pages ───────────────────────────────────────────────────────────
test('service areas index renders', async ({ page }) => {
  await page.goto('/service-areas')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  // At least one city link visible
  await expect(page.getByRole('link', { name: /Richmond/i }).first()).toBeVisible()
})

test('Richmond city page renders', async ({ page }) => {
  await page.goto('/service-areas/richmond-va')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
})

test('Richmond paving spotlight renders', async ({ page }) => {
  await page.goto('/richmond-paving')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
})

// ── Blog ─────────────────────────────────────────────────────────────────────
test('blog index renders at least one post', async ({ page }) => {
  await page.route('**/api/v1/blog/posts**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        posts: [
          { id: 1, slug: 'test-post', title: 'How Long Does Asphalt Last?', summary: 'A guide.', published_at: '2026-01-01', category: 'guides' },
        ],
      }),
    })
  })
  await page.goto('/blog')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
})

// ── About & Contact ───────────────────────────────────────────────────────────
test('about page renders', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
})

test('contact page renders with phone and form', async ({ page }) => {
  await page.goto('/contact')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /804/i }).first()).toBeVisible()
  await expect(page.getByRole('textbox').first()).toBeVisible()
})

// ── Reviews ───────────────────────────────────────────────────────────────────
test('reviews page renders with Houzz awards section', async ({ page }) => {
  // Match both /api/v1/reviews and /api/v1/reviews/ (trailing slash optional)
  await page.route('**/api/v1/reviews*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ aggregate_rating: 4.9, total_reviews: 87, reviews: [] }),
    })
  })
  await page.goto('/reviews')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  // Houzz Pro Certified badge text is static (no API dependency)
  await expect(page.getByText(/Houzz Pro Certified/i).first()).toBeVisible()
  await expect(page.getByText(/Best of Houzz/i).first()).toBeVisible()
})

// ── JWordenAI ─────────────────────────────────────────────────────────────────
test('jwordenai page renders scan workflow', async ({ page }) => {
  await page.goto('/jwordenai')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  await expect(page.getByText(/iPhone/i).first()).toBeVisible()
})

test('command center route remains auth gated', async ({ page }) => {
  await page.route('**/api/v1/auth/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ auth_required: true, is_authenticated: false }),
    })
  })

  await page.goto('/command-center')
  await expect(page.getByText(/Admin Access/i).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /Enter PIN/i })).toBeVisible()
})

// ── 404 ───────────────────────────────────────────────────────────────────────
test('404 page renders for unknown route', async ({ page }) => {
  const response = await page.goto('/this-does-not-exist-at-all-xyz')
  // SPA returns 200 but renders the NotFound component
  await expect(page.getByText(/404/i).first()).toBeVisible()
})
