#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(repoRoot, 'dist');

const enabled = String(process.env.MEDIA_CDN_PRUNE_ENABLED || '').toLowerCase() === 'true';
const pathsToPrune = (process.env.MEDIA_CDN_PRUNE_PATHS || 'work/,videos/parking-lot.mp4')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const removeTarget = async (rel) => {
  const target = path.resolve(distDir, rel);
  if (target !== distDir && !target.startsWith(distDir + path.sep)) return { rel, removed: false, bytes: 0 };
  try {
    const stat = await fs.stat(target);
    const bytes = stat.isDirectory() ? 0 : stat.size;
    await fs.rm(target, { recursive: true, force: true });
    return { rel, removed: true, bytes };
  } catch {
    return { rel, removed: false, bytes: 0 };
  }
};

const main = async () => {
  if (!enabled) {
    console.log('[media-prune] Skipped (MEDIA_CDN_PRUNE_ENABLED != true).');
    return;
  }

  const results = await Promise.all(pathsToPrune.map(removeTarget));
  const removed = results.filter((r) => r.removed);
  console.log(`[media-prune] Removed ${removed.length}/${pathsToPrune.length} targets from dist.`);
  removed.forEach((r) => console.log(` - ${r.rel}`));
};

main().catch((err) => {
  console.error(`[media-prune] Failed: ${err.message}`);
  process.exitCode = 1;
});
