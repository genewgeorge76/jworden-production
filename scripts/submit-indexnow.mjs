#!/usr/bin/env node
/**
 * submit-indexnow.mjs
 * ---------------------------------------------------------------
 * Reads public/sitemap.xml and submits every URL to IndexNow,
 * which notifies Bing, Yandex, Seznam, Naver, and Yep within
 * minutes (Google ignores IndexNow but reads the sitemap directly).
 *
 * Run locally:    npm run indexnow
 * Run on deploy:  Netlify post-build (see netlify.toml)
 *
 * Override host or key with env vars:
 *   INDEXNOW_HOST=www.jwordenasphaltpaving.com
 *   INDEXNOW_KEY=3ef8a81ce186414ca3235bebb5072f22
 * ---------------------------------------------------------------
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const HOST = process.env.INDEXNOW_HOST || 'www.jwordenasphaltpaving.com';
const KEY = process.env.INDEXNOW_KEY || '3ef8a81ce186414ca3235bebb5072f22';
const KEY_FILE = `https://${HOST}/${KEY}.txt`;
const SITEMAP_PATH = resolve(ROOT, 'public/sitemap.xml');

function log(msg) {
  console.log(`[indexnow] ${msg}`);
}

// Only ping on production deploys — skip local builds, deploy previews,
// and branch builds so we don't spam IndexNow with non-public URLs.
// Override with INDEXNOW_FORCE=1 to run anywhere.
const isProdDeploy = (process.env.NETLIFY === 'true' && process.env.CONTEXT === 'production') || (process.env.VERCEL_ENV === 'production');
const isManualRun = process.argv.includes('--force') || process.env.INDEXNOW_FORCE === '1';
if (!isProdDeploy && !isManualRun) {
  log('skipping (not a production deploy; use INDEXNOW_FORCE=1 to override)');
  process.exit(0);
}

// Everything below is advisory (an SEO ping) and must NEVER fail the build —
// a bug here previously crashed every production deploy for two days
// (readdirSync was used without being imported) while every preview deploy
// silently skipped this whole block via the isProdDeploy check above and
// never exercised the broken code path. Wrapping in try/catch is
// defense-in-depth so a future bug here can only ever log, not break prod.
try {
  const SITEMAPS_DIR = resolve(ROOT, 'public/sitemaps');
  if (!existsSync(SITEMAPS_DIR)) {
    log(`sitemaps dir not found at ${SITEMAPS_DIR} — skipping`);
    process.exit(0);
  }

  const files = readdirSync(SITEMAPS_DIR).filter(f => f.startsWith('sitemap-') && f.endsWith('.xml'));

  if (files.length === 0) {
    log('no sitemaps found — skipping');
    process.exit(0);
  }

  for (const file of files) {
    const hostMatch = file.match(/sitemap-(.+)\.xml/);
    if (!hostMatch) continue;
    const HOST = hostMatch[1];

    const xml = readFileSync(resolve(SITEMAPS_DIR, file), 'utf8');
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

    if (urls.length === 0) continue;

    const KEY = process.env.INDEXNOW_KEY || '3ef8a81ce186414ca3235bebb5072f22';
    const KEY_FILE = `https://${HOST}/${KEY}.txt`;

    const body = {
      host: HOST,
      key: KEY,
      keyLocation: KEY_FILE,
      urlList: urls,
    };

    log(`submitting ${urls.length} URLs to IndexNow for ${HOST}`);

    try {
      const res = await fetch('https://api.indexnow.org/IndexNow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body),
      });
      const txt = await res.text();
      if (res.ok || res.status === 202) {
        log(`success (HTTP ${res.status}) for ${HOST}`);
      } else {
        log(`HTTP ${res.status} for ${HOST}: ${txt.slice(0, 200)}`);
      }
    } catch (e) {
      log(`network error (non-fatal) for ${HOST}: ${e.message}`);
    }
  }
} catch (e) {
  log(`error (non-fatal): ${e.message}`);
}

