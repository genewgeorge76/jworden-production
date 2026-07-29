import { defineConfig } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL,
    headless: true,
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // `npx vite build`, not `npm run build`, and the difference matters.
        //
        // npm runs the `postbuild` lifecycle after `build`: normalize-meta-quality,
        // `puppeteer browsers install chrome` (a second large browser download on
        // top of the one Playwright just did), prerendering every route in the
        // sitemap, then submit-indexnow and submit-google-search-console.
        //
        // None of that is needed here. These specs stub every /api/v1/** call and
        // assert against client-rendered DOM, so they need a served bundle and
        // nothing else. Two of those steps are actively wrong in CI: a test run
        // should never ping IndexNow or Search Console.
        //
        // It was also failing. Measured in the same CI run that this comment was
        // written for, the full `npm run build` took 202s against the 180s
        // budget below — so the server never started and every spec failed on
        // "Timed out waiting 180000ms from config.webServer". That is
        // deterministic, not flaky: the build simply takes longer than the wait.
        command: 'npx vite build && npm run preview -- --host 127.0.0.1 --port 4173',
        env: {
          ...process.env,
          VITE_AUTH_MODE: 'pin',
          VITE_CC_PASSWORD: 'e2e-pin',
        },
        url: baseURL,
        reuseExistingServer: true,
        // vite build alone is ~60s locally; the headroom is for cold CI runners.
        timeout: 240_000,
      },
})
