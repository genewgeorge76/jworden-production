/**
 * Fails the build if pages advertised in a sitemap are near-duplicates.
 *
 * WHY THIS IS A GATE AND NOT A REPORT
 *
 * Programmatic pages are the fastest way to add URLs and the fastest way to
 * earn a thin-content problem. Google's doorway-page policy targets exactly
 * this shape: many pages differing only by a place name, each existing to
 * catch a query rather than to answer one. The penalty is not scoped to the
 * offending pages — it lands on the site.
 *
 * This repository has already been here once. From generate-sitemap.mjs:
 *
 *   "hundreds of 'distinct' pages that all collapse to one canonical — so
 *    their sitemap is restricted to just the root URL until real per-path
 *    generation exists"
 *
 * That was caught by hand. This catches it automatically, and only for pages
 * actually being advertised: a generated page held out of the sitemap is a
 * scaffold, and scaffolds are allowed to be similar. What is not allowed is
 * telling Google about them.
 *
 * The threshold is deliberately strict. Two service pages for neighbouring
 * counties SHOULD share structure — headers, calls to action, spec citations.
 * What they must not share is all of their substance.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Above this, two advertised pages are the same page wearing two URLs.
const MAX_SIMILARITY = 0.82;
// Pages shorter than this cannot be meaningfully compared; they are flagged
// as thin on their own terms instead.
const MIN_WORDS = 40;

function collectSitemapUrls() {
  const files = [];
  for (const dir of [join(ROOT, 'public'), join(ROOT, 'public/sitemaps'), join(ROOT, 'dist')]) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (name.startsWith('sitemap') && name.endsWith('.xml')) files.push(join(dir, name));
    }
  }
  const urls = new Set();
  for (const file of files) {
    const xml = readFileSync(file, 'utf8');
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(m[1].trim());
  }
  return { files, urls: [...urls] };
}

/**
 * Rendered text for a URL, if the prerender produced one.
 *
 * Resolution is host-aware and must stay that way. Brand sites build into
 * dist/brands/<host>/ and some domains emit a single dist/<host>.html; an
 * earlier version of this script resolved every URL to dist/<path> and so
 * reported six genuinely distinct brand homepages as 100% identical. A
 * duplicate-content gate that manufactures duplicates is worse than no gate,
 * because the first thing anyone does with a false alarm is stop trusting it.
 */
function candidateFiles(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return [];
  }
  const host = parsed.hostname;
  const bare = host.replace(/^www\./, '');
  const path = parsed.pathname.replace(/\/+$/, '');
  const leaf = path === '' ? 'index.html' : `${path}/index.html`;

  const out = [];
  // Per-brand build output, with and without the www prefix.
  for (const h of new Set([host, bare])) {
    out.push(join(ROOT, 'dist', 'brands', h, leaf));
  }
  // Single-file domain snapshots: dist/<host>.html
  if (path === '') {
    for (const h of new Set([host, bare])) out.push(join(ROOT, 'dist', `${h}.html`));
  }
  // The primary domain renders straight into dist/.
  out.push(join(ROOT, 'dist', leaf));
  return out;
}

function renderedText(url) {
  for (const file of candidateFiles(url)) {
    if (!existsSync(file)) continue;
    return readFileSync(file, 'utf8')
      // Order matters. Comments and <head> are byte-identical across every
      // page in this build — the font-loading notes alone run to a paragraph —
      // so leaving them in scores unrelated pages at 86% and buries the real
      // duplicates. Compare only what a reader sees.
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<head[\s\S]*?<\/head>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }
  return null;
}

/** Jaccard over word shingles — cheap, order-insensitive, good enough here. */
function shingles(text, n = 4) {
  const words = text.split(' ').filter(Boolean);
  const out = new Set();
  for (let i = 0; i + n <= words.length; i += 1) out.add(words.slice(i, i + n).join(' '));
  return out;
}

function similarity(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const s of a) if (b.has(s)) shared += 1;
  return shared / (a.size + b.size - shared);
}

const { files, urls } = collectSitemapUrls();
if (!files.length) {
  console.log('[uniqueness] no sitemaps found — nothing advertised, nothing to check');
  process.exit(0);
}

const pages = [];
let unrendered = 0;
for (const url of urls) {
  const text = renderedText(url);
  if (text === null) { unrendered += 1; continue; }
  pages.push({ url, text, words: text.split(' ').length, sh: shingles(text) });
}

if (!pages.length) {
  console.log(
    `[uniqueness] ${urls.length} advertised URL(s), none prerendered yet — ` +
    'run after `npm run build` for this gate to mean anything',
  );
  process.exit(0);
}

const thin = pages.filter((p) => p.words < MIN_WORDS);
const dupes = [];
for (let i = 0; i < pages.length; i += 1) {
  for (let j = i + 1; j < pages.length; j += 1) {
    const score = similarity(pages[i].sh, pages[j].sh);
    if (score > MAX_SIMILARITY) {
      dupes.push({ a: pages[i].url, b: pages[j].url, score });
    }
  }
}

console.log(
  `[uniqueness] ${pages.length} advertised page(s) compared` +
  (unrendered ? `, ${unrendered} not prerendered (skipped)` : ''),
);

if (thin.length) {
  console.error(`\n[uniqueness] ${thin.length} advertised page(s) under ${MIN_WORDS} words:`);
  for (const p of thin.slice(0, 10)) console.error(`  ${p.words}w  ${p.url}`);
}

if (dupes.length) {
  dupes.sort((x, y) => y.score - x.score);
  console.error(
    `\n[uniqueness] FAIL — ${dupes.length} pair(s) above ${(MAX_SIMILARITY * 100).toFixed(0)}% similarity.` +
    '\nThese are advertised to Google as distinct pages. They are not.\n',
  );
  for (const d of dupes.slice(0, 12)) {
    console.error(`  ${(d.score * 100).toFixed(1)}%  ${d.a}\n         ${d.b}`);
  }
  if (dupes.length > 12) console.error(`  … and ${dupes.length - 12} more`);
  console.error(
    '\nFix by giving each page material the others do not have, or by removing\n' +
    'it from the sitemap. A page can exist without being advertised.\n',
  );
  process.exit(1);
}

if (thin.length) process.exit(1);
console.log('[uniqueness] OK — no advertised page duplicates another');
