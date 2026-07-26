import fs from 'fs'
import path from 'path'
import http from 'http'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
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
    if (SKIP_ROUTES.has(p) || SKIP_ROUTES.has(base)) return false
    // Routes ending in .html are prebuilt static pages, not SPA routes — they
    // ship with their content already in the file (5,000-7,000 chars each).
    // Loading one in the browser waits for a React app that will never boot,
    // so every single one burned the full 30s page timeout and reported
    // FAILED. That is 36 of the 262 sitemap entries: a 30-minute stall and a
    // wall of red on a run where nothing was actually wrong.
    if (p.endsWith('.html')) return false
    return true
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

// Puppeteer serializes the DOM *after* the font stylesheet's onload has run,
// which flips media="print" → media="all" and makes the link render-blocking
// again. Restore the non-blocking media="print" on the serialized link so the
// shipped HTML keeps Google Fonts off the critical path; the runtime onload
// re-enables it for real users and <noscript> covers JS-disabled visitors.
function forceNonBlockingFonts(html) {
  return html.replace(/<link\b[^>]*\bonload="this\.media='all'"[^>]*>/g, (tag) =>
    /\bmedia=/.test(tag)
      ? tag.replace(/\bmedia="[^"]*"/, 'media="print"')
      : tag.replace(/<link\b/, '<link media="print"'),
  )
}

function savePage(route, html) {
  const routePath = route === '/' ? '/index.html' : `${route}/index.html`
  const outPath   = path.join(DIST_DIR, routePath)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, forceNonBlockingFonts(html), 'utf-8')
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

// Publish the outcome INTO the build output, at /prerender-status.json.
//
// WHY: this step fails soft on purpose — a browser problem must not take the
// whole site offline. The cost of that choice is that a failed prerender and a
// successful one produce byte-identical deploy status, and the only evidence
// lives in a build log. Reading Vercel's build log requires dashboard access,
// which cost this project an entire day of "merged, deployed, still 395
// characters" with no way to tell which layer was lying.
//
// Writing the result as a deployed file makes the answer curl-able from
// anywhere, forever, with no credentials:
//
//     curl https://www.jwordenasphaltpaving.com/prerender-status.json
//
// It is a few hundred bytes and carries no secrets.
function writeStatus(status) {
  try {
    fs.mkdirSync(DIST_DIR, { recursive: true })
    fs.writeFileSync(
      path.join(DIST_DIR, 'prerender-status.json'),
      JSON.stringify({ generatedAt: new Date().toISOString(), ...status }, null, 2),
      'utf-8',
    )
  } catch (err) {
    console.error('[prerender] could not write prerender-status.json:', err?.message)
  }
}

// Distinguishes "puppeteer is missing/stubbed" from "Chrome will not start".
// Both surface as a launch() throw, but they need opposite fixes, and a stale
// node_modules restored from build cache is a real failure mode here: the
// `fake-puppeteer` stub that used to be pinned in package-lock.json exports no
// launch(), so importing it succeeds and only launching fails.
async function browserDiagnostics(puppeteerNs) {
  const diag = {
    puppeteerVersion: null,
    exportsLaunch: typeof puppeteerNs?.default?.launch === 'function',
    bundledExecutablePath: null,
    executableExists: false,
    envOverride: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN || null,
    cacheDir: process.env.PUPPETEER_CACHE_DIR || null,
  }
  try {
    const req = createRequire(import.meta.url)
    diag.puppeteerVersion = req('puppeteer/package.json').version
  } catch { /* not resolvable — leave null */ }
  try {
    diag.bundledExecutablePath = puppeteerNs?.default?.executablePath?.() ?? null
    if (diag.bundledExecutablePath) diag.executableExists = fs.existsSync(diag.bundledExecutablePath)
  } catch (err) {
    diag.bundledExecutablePath = `unavailable: ${err?.message?.slice(0, 120)}`
  }
  return diag
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
  let diag = null
  try {
    const puppeteer = await import('puppeteer')
    diag = await browserDiagnostics(puppeteer)
    console.log(`[prerender] puppeteer ${diag.puppeteerVersion ?? 'unknown'}`
      + ` · exportsLaunch=${diag.exportsLaunch}`
      + ` · chrome=${diag.envOverride ?? diag.bundledExecutablePath ?? 'none'}`
      + ` (exists=${diag.executableExists})`)
    browser = await puppeteer.default.launch({
      headless: 'new',
      // Honour an explicitly provided browser (CI images, this repo's own
      // sandbox) and otherwise fall back to the copy that `npm run
      // prerender:browser` downloads into puppeteer's cache during postbuild.
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
        || process.env.CHROME_BIN
        || undefined,
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
    const msg = `[prerender] FAILED TO LAUNCH CHROME — every page will ship as an
  empty shell with no indexable content. Cause: ${err?.message}`
    console.error('\n' + '='.repeat(72) + '\n' + msg + '\n' + '='.repeat(72) + '\n')
    writeStatus({
      ok: false,
      stage: 'browser-launch',
      cause: err?.message?.slice(0, 400) ?? String(err),
      rendered: 0,
      failed: routes.length,
      diagnostics: diag ?? { note: 'puppeteer import itself failed' },
    })
    server.close()
    if (process.env.PRERENDER_REQUIRED === '1') process.exit(1)
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

  writeStatus({
    ok: results.failed.length === 0,
    stage: 'complete',
    rendered: results.ok.length,
    failed: results.failed.length,
    failedRoutes: results.failed.slice(0, 25),
    diagnostics: diag,
  })

  const criticalFailures = results.failed.filter(r => CRITICAL_ROUTES.has(r))
  if (criticalFailures.length > 0) {
    console.error('[prerender] CRITICAL ROUTES FAILED:', criticalFailures.join(', '))
    process.exit(1)
  }

  console.log('[prerender] Complete.')
}

prerender().catch(err => { console.warn('[prerender] Non-fatal error:', err?.message || err) })
