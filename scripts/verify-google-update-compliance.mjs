import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');

function fail(message) {
  console.error(`[google-update-guard] FAIL: ${message}`);
  process.exit(1);
}

function listFilesRecursive(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(p));
    else out.push(p);
  }
  return out;
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBodyText(html) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return stripHtml(match ? match[1] : html);
}

function getTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].trim() : '';
}

function getH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? stripHtml(m[1]) : '';
}

function normalizedTokens(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4);
}

function bigramSet(tokens) {
  const set = new Set();
  for (let i = 0; i < tokens.length - 1; i += 1) {
    set.add(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return set;
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

if (!fs.existsSync(distDir)) {
  fail('dist directory not found. Run build first.');
}

const htmlFiles = listFilesRecursive(distDir).filter((f) => f.endsWith('.html'));
if (htmlFiles.length === 0) {
  fail('No HTML files found in dist output.');
}

const marketFiles = htmlFiles.filter((file) => {
  const rel = path.relative(distDir, file).replace(/\\/g, '/');
  return rel.startsWith('locations/') || rel.startsWith('service-areas/');
});

if (marketFiles.length === 0) {
  fail('No market pages found under dist/locations or dist/service-areas.');
}

const issues = [];
const warnings = [];
const byTitle = new Map();
const byH1 = new Map();
const pages = [];
const strictPathMatchers = [
  /^locations\/richmond-va\/\d{5}\/index\.html$/,
  /^lp\/.+\/index\.html$/,
];

function isStrictPage(rel) {
  return strictPathMatchers.some((re) => re.test(rel));
}

for (const file of marketFiles) {
  const rel = path.relative(distDir, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  const bodyText = getBodyText(html);
  const title = getTitle(html);
  const h1 = getH1(html);
  const lower = bodyText.toLowerCase();
  const tokens = normalizedTokens(bodyText);
  const words = bodyText.split(/\s+/).filter(Boolean).length;

  if (/\{\{[^}]+\}\}/.test(html)) {
    issues.push(`${rel}: unresolved template token(s) found.`);
  }
  const strictPage = isStrictPage(rel);
  if (words < 180) {
    (strictPage ? issues : warnings).push(`${rel}: thin content (${words} words).`);
  }
  if (!title) (strictPage ? issues : warnings).push(`${rel}: missing <title>.`);
  if (!h1) (strictPage ? issues : warnings).push(`${rel}: missing <h1>.`);
  if (!/application\/ld\+json/i.test(html)) {
    (strictPage ? issues : warnings).push(`${rel}: missing JSON-LD schema block.`);
  }
  if (strictPage && !/"@type"\s*:\s*"(LocalBusiness|ProfessionalService)"/i.test(html)) {
    issues.push(`${rel}: JSON-LD missing LocalBusiness/ProfessionalService type.`);
  }
  if (strictPage && !/"telephone"\s*:/i.test(html)) {
    issues.push(`${rel}: JSON-LD missing telephone.`);
  }
  if (strictPage && !/"address"\s*:/i.test(html)) {
    issues.push(`${rel}: JSON-LD missing address.`);
  }
  if (/(lorem ipsum|coming soon|tbd|placeholder)/i.test(lower)) {
    issues.push(`${rel}: placeholder text detected.`);
  }

  if (title) byTitle.set(title, (byTitle.get(title) || 0) + 1);
  if (h1) byH1.set(h1, (byH1.get(h1) || 0) + 1);

  pages.push({
    rel,
    tokens,
    grams: bigramSet(tokens),
  });
}

for (const [title, count] of byTitle.entries()) {
  if (count > 1) warnings.push(`duplicate <title> used on ${count} pages: "${title}"`);
}

for (const [h1, count] of byH1.entries()) {
  if (count > 1) warnings.push(`duplicate <h1> used on ${count} pages: "${h1}"`);
}

let highSimilarityPairs = 0;
for (let i = 0; i < pages.length; i += 1) {
  for (let j = i + 1; j < pages.length; j += 1) {
    const score = jaccard(pages[i].grams, pages[j].grams);
    if (score >= 0.97) {
      highSimilarityPairs += 1;
      if (highSimilarityPairs <= 6) {
        warnings.push(
          `near-duplicate doorway risk: ${pages[i].rel} vs ${pages[j].rel} (similarity ${score.toFixed(3)})`,
        );
      }
    }
  }
}

if (highSimilarityPairs > 6) {
  warnings.push(`near-duplicate doorway risk count too high: ${highSimilarityPairs} pairs.`);
}

if (issues.length > 0) {
  console.error('[google-update-guard] Issues detected:');
  for (const issue of issues.slice(0, 120)) {
    console.error(` - ${issue}`);
  }
  if (issues.length > 120) {
    console.error(` - ...and ${issues.length - 120} more`);
  }
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn('[google-update-guard] Advisory warnings (non-blocking):');
  for (const warning of warnings.slice(0, 60)) {
    console.warn(` - ${warning}`);
  }
  if (warnings.length > 60) {
    console.warn(` - ...and ${warnings.length - 60} more`);
  }
}

console.log(
  `[google-update-guard] PASS: ${marketFiles.length} market pages checked (people-first + anti-doorway + schema checks).`,
);
