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
        command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
        env: {
          ...process.env,
          VITE_AUTH_MODE: 'pin',
          VITE_CC_PASSWORD: 'e2e-pin',
        },
        url: baseURL,
        reuseExistingServer: true,
        timeout: 180_000,
      },
})
