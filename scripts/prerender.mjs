import fs from 'fs'
import path from 'path'
import http from 'http'
import { fileURLToPath } from 'url'
import express from 'express'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const DIST_DIR   = path.resolve(__dirname, '../dist')
const SITEMAP    = path.resolve(DIST_DIR, 'sitemap.xml')
const CONCURRENCY = 4

const CRITICAL_ROUTES = new Set([
  '/', '/about', '/services', '/contact', '/reviews',
  '/locations', '/asphalt-paving', '/parking-lots', '/sealcoating', '/hardscapes',
])

const SKIP_ROUTES = new Set([
  '/command-center', '/dashboard', '/leads', '/portal', '/staff',
  '/voice-calls', '/revenue', '/candidate', '/dns-migration', '/admin',
])

const PAGE_TIMEOUT_MS = 30_000

function getRoutesFromSitemap() {
  if (!fs.existsSync(SITEMAP)) {
    console.warn('[prerender] No sitemap — prerendering / only')
    return ['/']
  }
  const xml   = fs.readFileSync(SITEMAP, 'utf-8')
  const urls  = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  const paths = urls.map(u => { try { return new URL(u).pathname } catch { return '/' } })
  return [...new Set(paths)].filter(p => {
    const base = '/' + p.split('/')[1]
    return !SKIP_ROUTES.has(p) && !SKIP_ROUTES.has(base)
  })
}

function startServer() {
  const app = express()
  app.use(express.static(DIST_DIR))
  app.use((_req, res) => res.sendFile(path.resolve(DIST_DIR, 'index.html')))
  return new Promise(resolve => {
    const srv = app.listen(0, () => resolve({ port: srv.address().port, close: () => srv.close() }))
  })
}

async function waitForServer(port, retries = 40) {
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/`, res => { res.resume(); resolve() })
        req.on('error', reject)
        req.setTimeout(500, () => { req.destroy(); reject(new Error('timeout')) })
      })
      return
    } catch {
      await new Promise(r => setTimeout(r, 250))
    }
  }
  throw new Error(`Server on port ${port} did not become ready after ${retries} attempts`)
}

async function renderPage(browser, baseUrl, route) {
  const page = await browser.newPage()

  await page.evaluateOnNewDocument(() => { window.__PRERENDER__ = true })

  await page.setRequestInterception(true)
  page.on('request', req => {
    const url = req.url()
    const blocked = [
      'railway.app', 'sentry.io', 'google-analytics', 'googletagmanager',
      'analytics', 'hotjar', 'intercom', 'facebook.net', 'twitter.com', 'segment.com',
    ]
    if (blocked.some(b => url.includes(b))) { req.abort() } else { req.continue() }
  })

  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle0', timeout: PAGE_TIMEOUT_MS })
    await page.waitForFunction(
      () => { const root = document.getElementById('root'); return root && (root.innerText || '').trim().length > 50 },
      { timeout: PAGE_TIMEOUT_MS },
    )
    return await page.content()
  } finally {
    await page.close()
  }
}

function savePage(route, html) {
  const routePath = route === '/' ? '/index.html' : `${route}/index.html`
  const outPath   = path.join(DIST_DIR, routePath)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, html, 'utf-8')
}

async function renderWithRetry(browser, baseUrl, route) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const html = await renderPage(browser, baseUrl, route)
      savePage(route, html)
      return { ok: true, bytes: html.length, attempt }
    } catch (err) {
      if (attempt === 2) return { ok: false, error: err.message?.slice(0, 80) }
    }
  }
}

async function prerender() {
  if (!fs.existsSync(DIST_DIR)) { console.error('[prerender] dist/ not found.'); process.exit(1) }

  const routes = getRoutesFromSitemap()
  console.log(`[prerender] ${routes.length} routes to prerender`)

  const server  = await startServer()
  const baseUrl = `http://localhost:${server.port}`
  await waitForServer(server.port)
  console.log(`[prerender] Server ready on ${baseUrl}`)

  let browser
  try {
    const puppeteer = await import('puppeteer')
    browser = await puppeteer.default.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        // --single-process removed: crashes Chrome 120+ (Puppeteer 24+)
      ],
    })
  } catch (err) {
    console.warn('[prerender] Chrome not available — skipping prerender:', err?.message)
    server.close()
    return
  }

  const results = { ok: [], failed: [] }

  for (let i = 0; i < routes.length; i += CONCURRENCY) {
    const batch   = routes.slice(i, i + CONCURRENCY)
    const settled = await Promise.allSettled(batch.map(r => renderWithRetry(browser, baseUrl, r)))
    for (let j = 0; j < batch.length; j++) {
      const route  = batch[j]
      const result = settled[j].status === 'fulfilled'
        ? settled[j].value
        : { ok: false, error: settled[j].reason?.message }
      if (result?.ok) {
        results.ok.push(route)
        console.log(`  → ${route} ... ✓ (${result.bytes?.toLocaleString()} bytes${result.attempt > 1 ? ' retry' : ''})`)
      } else {
        results.failed.push(route)
        console.log(`  → ${route} ... ✗ FAILED: ${result?.error}`)
      }
    }
  }

  await browser.close()
  server.close()

  console.log(`\n[prerender] ✓ ${results.ok.length} succeeded · ✗ ${results.failed.length} failed`)
  if (results.failed.length) console.log('Failed:', results.failed.join(', '))

  const criticalFailures = results.failed.filter(r => CRITICAL_ROUTES.has(r))
  if (criticalFailures.length > 0) {
    console.error('[prerender] CRITICAL ROUTES FAILED:', criticalFailures.join(', '))
    process.exit(1)
  }

  console.log('[prerender] Complete.')
}

prerender().catch(err => { console.warn('[prerender] Non-fatal error:', err?.message || err) })
