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
import { readFileSync, existsSync } from 'node:fs';
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

// Only ping on Netlify production deploys — skip local builds, deploy previews,
// and branch builds so we don't spam IndexNow with non-public URLs.
// Override with INDEXNOW_FORCE=1 to run anywhere (e.g. `npm run indexnow`).
const isNetlifyProd = process.env.NETLIFY === 'true' && process.env.CONTEXT === 'production';
const isManualRun = process.argv.includes('--force') || process.env.INDEXNOW_FORCE === '1';
if (!isNetlifyProd && !isManualRun) {
  log('skipping (not a Netlify production deploy; use INDEXNOW_FORCE=1 to override)');
  process.exit(0);
}

if (!existsSync(SITEMAP_PATH)) {
  log(`sitemap not found at ${SITEMAP_PATH} — skipping`);
  process.exit(0);
}

const xml = readFileSync(SITEMAP_PATH, 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

if (urls.length === 0) {
  log('no URLs found in sitemap — skipping');
  process.exit(0);
}

// IndexNow API caps batches at 10,000 URLs; we're well under.
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
    log(`success (HTTP ${res.status})`);
  } else {
    log(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
    // Don't fail the build on IndexNow errors — they're advisory.
    process.exit(0);
  }
} catch (e) {
  log(`network error (non-fatal): ${e.message}`);
  process.exit(0);
}
