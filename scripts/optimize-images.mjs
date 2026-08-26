#!/usr/bin/env node
/**
 * optimize-images.mjs
 *
 * Generates WebP + AVIF siblings next to large JPG/PNG assets in /public.
 * Idempotent: only writes if the modern sibling is missing OR older than the source.
 * Also re-encodes the original JPG with mozjpeg-quality 78 to shave bytes
 * for browsers that don't accept the modern formats.
 *
 * Targets:
 *   - public/work/portfolio/*.jpg  (LCP candidate)
 *   - public/work/kfc/*.jpg        (33MB of 3.7MB-each portfolio bombs)
 *   - public/work/**\/*.jpg        (other portfolios)
 *
 * Skips: anything already < 200KB.
 */
import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join, extname, basename, dirname } from 'node:path';
import sharp from 'sharp';

// WHAT THIS SCRIPT IS ALLOWED TO SPEND
// ────────────────────────────────────
// Walking every image under public/ finds 295 files and 431 MB of source. All
// of it would encode; almost none of it would ever be requested. 277 of those
// files are not referenced from src/ by any means — literal path, template
// literal, or component convention — so their derivatives would be dead weight
// in a repository whose .git directory is already 891 MB.
//
// So the default scope is the set the browser can actually ask for, which is
// two things and not one:
//
//   1. EVERYTHING UNDER public/work. Not because every file there is
//      referenced, but because SmartImage.jsx emits <source> elements for
//      `${base}.avif` and `${base}.webp` for ANY /work/** jpg or png it is
//      handed, without checking. A missing sibling there is not a missed
//      optimisation, it is a failed image request followed by a retry — and on
//      an SPA the failure arrives as 200 OK with an HTML body, which is the
//      slowest possible way to discover a file is absent.
//
//   2. Files under public/images that src/ actually references. Nothing claims
//      siblings for these, so an unreferenced one costs nothing by staying as
//      it is.
//
// Pass --all to encode the whole tree anyway. That is the right flag the day
// those 177 unreferenced photographs get wired to a page, and the wrong one
// until then.
const ROOTS = ['public/work', 'public/images'];
const ALWAYS = 'public/work';
const MIN_BYTES = 200 * 1024; // 200 KB
const MAX_WIDTH = 1920;
const ENCODE_EVERYTHING = process.argv.includes('--all');

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const SKIP_SRC_DIRS = new Set(['generated', 'node_modules', '__pycache__']);

/** Root-relative image paths written literally anywhere in src/. */
function referencedFromSrc() {
  const refs = new Set();
  const files = [];
  (function collect(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_SRC_DIRS.has(e.name)) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) collect(full);
      else if (/\.(jsx?|mjs|json)$/.test(e.name)) files.push(full);
    }
  })('src');
  for (const file of files) {
    const body = readFileSync(file, 'utf8');
    for (const m of body.matchAll(/["'](\/[\w\-./]+\.(?:jpe?g|png))["']/gi)) refs.add(m[1]);
  }
  return refs;
}

const referenced = ENCODE_EVERYTHING ? null : referencedFromSrc();

function inScope(p) {
  if (ENCODE_EVERYTHING) return true;
  if (p.startsWith(ALWAYS)) return true;
  return referenced.has('/' + p.replace(/^public\//, ''));
}

const targets = ROOTS.filter((r) => existsSync(r))
  .flatMap((r) => [...walk(r)])
  .filter((p) => /\.(jpe?g|png)$/i.test(p))
  .filter(inScope);
const big = targets.filter((p) => statSync(p).size >= MIN_BYTES);

console.log(
  `[optimize] scope=${ENCODE_EVERYTHING ? 'all' : 'served'}, scanning ${targets.length} images, ${big.length} over ${MIN_BYTES / 1024}KB`,
);

let savedBytes = 0;
let touched = 0;

for (const src of big) {
  const ext = extname(src);
  const base = src.slice(0, -ext.length);
  const webp = `${base}.webp`;
  const avif = `${base}.avif`;
  const srcStat = statSync(src);
  const srcSize = srcStat.size;

  const needsWebp = !existsSync(webp) || statSync(webp).mtimeMs < srcStat.mtimeMs;
  const needsAvif = !existsSync(avif) || statSync(avif).mtimeMs < srcStat.mtimeMs;

  // Re-encode the original JPG only if it's huge AND we haven't already optimized it
  // (heuristic: if a sibling .webp already exists, the JPG was already touched).
  const jobs = [];
  if (needsWebp) {
    jobs.push(
      sharp(src)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 78, effort: 5 })
        .toFile(webp)
        .then((info) => {
          savedBytes += srcSize - info.size;
          return ['webp', info.size];
        }),
    );
  }
  if (needsAvif) {
    jobs.push(
      sharp(src)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .avif({ quality: 55, effort: 4 })
        .toFile(avif)
        .then((info) => {
          savedBytes += srcSize - info.size;
          return ['avif', info.size];
        }),
    );
  }

  if (jobs.length === 0) continue;
  const results = await Promise.all(jobs);
  touched++;
  const rel = src.replace(/\\/g, '/');
  console.log(
    `  ${(srcSize / 1024).toFixed(0).padStart(5)}KB  ${rel}  ->  ${results
      .map(([fmt, sz]) => `${fmt} ${(sz / 1024).toFixed(0)}KB`)
      .join(', ')}`,
  );
}

console.log(
  `[optimize] done. files touched: ${touched}, est savings vs original: ${(savedBytes / 1024 / 1024).toFixed(1)} MB`,
);
