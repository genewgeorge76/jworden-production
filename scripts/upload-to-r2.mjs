#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const publicDir = path.resolve(repoRoot, 'public');

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');

const sourcePrefixes = (
  process.env.R2_UPLOAD_PREFIXES
  || 'work/imported/,work/kfc/,videos/parking-lot.mp4'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const maxCount = Number(process.env.R2_UPLOAD_MAX_FILES || '0') || Infinity;
const endpoint = process.env.R2_ENDPOINT || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
const bucket = process.env.R2_BUCKET || '';

const requireConfig = () => {
  const missing = [];
  if (!endpoint) missing.push('R2_ENDPOINT');
  if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
  if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
  if (!bucket) missing.push('R2_BUCKET');
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
};

const listFiles = async (dir) => {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        out.push(full);
      }
    }
  }
  return out;
};

const matchesPrefixes = (relPath) => {
  const normalized = relPath.replace(/\\/g, '/');
  return sourcePrefixes.some((prefix) => {
    const p = prefix.replace(/^\/+/, '');
    if (p.endsWith('/')) return normalized.startsWith(p);
    return normalized === p;
  });
};

const toContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.mov':
      return 'video/quicktime';
    case '.mp4':
      return 'video/mp4';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
};

const upload = async () => {
  const allFiles = await listFiles(publicDir);
  const selected = allFiles
    .map((fullPath) => ({
      fullPath,
      relPath: path.relative(publicDir, fullPath).replace(/\\/g, '/'),
    }))
    .filter((f) => matchesPrefixes(f.relPath))
    .slice(0, maxCount);

  if (!selected.length) {
    console.log('[r2-upload] No files matched configured prefixes.');
    return;
  }

  const totalBytes = selected.reduce(async (sumP, f) => {
    const sum = await sumP;
    const st = await fs.stat(f.fullPath);
    return sum + st.size;
  }, Promise.resolve(0));

  if (dryRun) {
    console.log(`[r2-upload] DRY RUN: ${selected.length} files, ${(await totalBytes / (1024 * 1024)).toFixed(1)} MB`);
    for (const f of selected.slice(0, 25)) {
      console.log(` - ${f.relPath}`);
    }
    if (selected.length > 25) console.log(` ... and ${selected.length - 25} more`);
    return;
  }

  requireConfig();

  const client = new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  let uploaded = 0;
  for (const f of selected) {
    const body = await fs.readFile(f.fullPath);
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: f.relPath,
      Body: body,
      ContentType: toContentType(f.relPath),
      CacheControl: 'public, max-age=31536000, immutable',
    });
    await client.send(cmd);
    uploaded += 1;
    if (uploaded % 20 === 0 || uploaded === selected.length) {
      console.log(`[r2-upload] Uploaded ${uploaded}/${selected.length}`);
    }
  }

  console.log(`[r2-upload] Complete: ${uploaded} files uploaded to bucket ${bucket}.`);
};

upload().catch((err) => {
  console.error(`[r2-upload] Failed: ${err.message}`);
  process.exitCode = 1;
});
