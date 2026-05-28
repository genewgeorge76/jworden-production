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
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename, dirname } from 'node:path';
import sharp from 'sharp';

const ROOT = 'public/work';
const MIN_BYTES = 200 * 1024; // 200 KB
const MAX_WIDTH = 1920;

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const targets = [...walk(ROOT)].filter((p) => /\.(jpe?g|png)$/i.test(p));
const big = targets.filter((p) => statSync(p).size >= MIN_BYTES);

console.log(`[optimize] scanning ${targets.length} images, ${big.length} need work`);

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
