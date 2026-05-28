import { test, expect } from '@playwright/test'

const demoJob = {
  id: 2,
  title: 'River City Retail Center Resurface',
  client_name: 'River City Retail Partners',
  client_email: 'ops@rivercity.example',
  address: '2420 Commerce Road, Richmond, VA',
  scheduled_date: '2026-05-04',
  start_time: '8:00 AM',
  crew: 'Worden crew',
  surface_type: 'commercial_asphalt',
  status: 'in_progress',
  progress_percent: 62,
  progress_notes: 'Milling and base repairs are complete. Surface lift is scheduled next.',
}

const demoDocuments = [
  {
    id: 11,
    job_id: 2,
    client_email: 'ops@rivercity.example',
    title: 'Approved Commercial Scope',
    filename: 'river-city-approved-scope.pdf',
    document_type: 'contract',
    visible_to_client: true,
    file_url: 'data:application/pdf;base64,JVBERi0xLjQK',
  },
  {
    id: 12,
    job_id: 2,
    client_email: 'ops@rivercity.example',
    title: 'Deposit Invoice',
    filename: 'river-city-deposit-invoice.pdf',
    document_type: 'invoice',
    visible_to_client: true,
    file_url: 'data:application/pdf;base64,JVBERi0xLjQK',
  },
]

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('jworden.auth.token', 'e2e-token')
    window.sessionStorage.setItem('jworden.auth.expires_at', String(Math.floor(Date.now() / 1000) + 3600))
    // Suppress splash screen so it doesn't block clicks
    window.sessionStorage.setItem('jworden_splash_shown', '1')
  })

  await page.route('**/api/v1/auth/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ auth_required: true, auth_mode: 'pin', token_endpoint: '/api/v1/auth/pin-token' }),
    })
  })

  await page.route('**/api/v1/auth/pin-token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: 'e2e-token', expires_in: 3600 }),
    })
  })

  await page.route('**/api/v1/operations/jobs**', async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(demoJob) })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ jobs: [demoJob] }) })
  })

  await page.route('**/api/v1/operations/job-documents**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ documents: demoDocuments }) })
  })

  await page.route('**/api/v1/admin/monitoring/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ monitoring: { slack_enabled: true, datadog_enabled: true, dd_service: 'jworden-api', dd_env: 'production' } }),
    })
  })

  await page.route('**/api/v1/operations/public/jobs/2', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(demoJob) })
  })
})

test('homepage hero + key sections smoke flow', async ({ page }) => {
  await page.goto('/')

  // Hero (H1 changed to local-pack-first copy after May 2026 redesign)
  await expect(page.getByRole('heading', { level: 1, name: /Driveways.+Lots.+Done Right/is })).toBeVisible()
  await expect(page.getByRole('link', { name: /Open JWordenAI Scan/i })).toBeVisible()

  // Core narrative sections that survived the redesign
  await expect(page.getByRole('heading', { name: /Everything your pavement needs/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Built for owners who need the truth/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Home turf around Richmond/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Real paving prices come from real site conditions/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /answer should come from the pavement/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Owners still need a checklist/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Asphalt questions buyers ask before they call/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Dinwiddie to Fairfax/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /wrong paving contractor is not cheap/i })).toBeVisible()
})

test('jwordenai teaser smoke flow', async ({ page }) => {
  await page.goto('/jwordenai')

  await expect(page.getByRole('heading', { name: /Scan pavement/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Use iPhone Photos/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Add Drone Views/i })).toBeVisible()
})

test('command center smoke flow', async ({ page }) => {
  // Override auth/status for this test: auth_required=false so RequireAuth passes through
  await page.route('**/api/v1/auth/status', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ auth_required: false }) })
  })
  await page.goto('/command-center')

  // CC redesigned May 2026: gate is a SessionUnlockModal opened via an Unlock button,
  // not an inline password input. Smoke check that the page mounts without crashing
  // and that the unlock surface (or post-unlock content) is reachable.
  await expect(page.locator('body')).toBeVisible()

  // Either the unlock affordance is visible OR the page is already unlocked in this build.
  const unlockBtn = page.getByRole('button', { name: /unlock/i }).first()
  const isUnlockVisible = await unlockBtn.isVisible({ timeout: 5000 }).catch(() => false)
  if (!isUnlockVisible) {
    // No unlock affordance shown — confirm the CC root rendered something meaningful.
    await expect(page.getByText(/Command Center|JWordenAI|Operator/i).first()).toBeVisible({ timeout: 10000 })
  }
})

test('admin documents visual smoke flow', async ({ page }) => {
  await page.goto('/admin/documents')

  await expect(page.getByRole('heading', { name: /Customer Documents/i })).toBeVisible()
  await expect(page.getByText(/Production Demo Workspace/i)).toBeVisible()
  await expect(page.getByText(/Monitoring Alerts/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Complete', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Packet/i })).toBeVisible()
  await expect(page.getByText(/River City Retail Center Resurface/i).first()).toBeVisible()
  await expect(page.getByText(/Approved Commercial Scope/i).first()).toBeVisible()
})

test('customer portal visual smoke flow', async ({ page }) => {
  await page.goto('/portal')

  await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible()
  await expect(page.getByText(/River City Retail Center Resurface/i).first()).toBeVisible()
  await expect(page.getByText(/Project Details/i)).toBeVisible()
  await expect(page.getByText(/Invoices & Receipts/i)).toBeVisible()
  await expect(page.getByText(/Deposit Invoice/i)).toBeVisible()
})

test('crew eta visual smoke flow', async ({ page }) => {
  await page.goto('/crew-eta?jobId=2')

  await expect(page.getByText(/Live Crew Tracker/i)).toBeVisible()
  await expect(page.getByText(/Work in Progress/i)).toBeVisible()
  await expect(page.getByText(/62%/i)).toBeVisible()
  await expect(page.getByText(/2420 Commerce Road/i)).toBeVisible()
})
