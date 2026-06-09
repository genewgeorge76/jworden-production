#!/usr/bin/env node
/**
 * generate-redirects.mjs
 * ---------------------------------------------------------------
 * Automatically updates public/_redirects with 301 redirects for
 * all locations in src/lib/locations.js.
 *
 * It matches both the raw location slug (e.g. /fluvanna-va) and
 * common SEO variations (e.g. /fluvanna-va-paving, /fluvanna-va-driveway-paving)
 * and redirects them with a forced 301 to /locations/:slug.
 * ---------------------------------------------------------------
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

async function importLocations() {
  const filePath = resolve(ROOT, 'src/lib/locations.js');
  const fileUrl = new URL(`file://${filePath}`);
  const { LOCATIONS } = await import(fileUrl.href);
  return LOCATIONS;
}

async function main() {
  try {
    const locations = await importLocations();
    console.log(`[redirects] Loaded ${locations.length} locations from src/lib/locations.js`);

    const redirectsPath = resolve(ROOT, 'public/_redirects');
    let content = readFileSync(redirectsPath, 'utf8');

    const startMarker = '# START_LOCATION_REDIRECTS';
    const endMarker = '# END_LOCATION_REDIRECTS';

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
      console.error('[redirects] Error: Could not find START or END markers in public/_redirects');
      process.exit(1);
    }

    const redirectRules = [];

    // Sort locations alphabetically by slug to keep the file tidy
    const sortedLocations = [...locations].sort((a, b) => a.slug.localeCompare(b.slug));

    for (const loc of sortedLocations) {
      if (!loc.slug) continue;
      
      // 1. Raw slug redirect: /fluvanna-va -> /locations/fluvanna-va
      redirectRules.push(`/${loc.slug}    /locations/${loc.slug}    301!`);
      
      // 2. Common suffix variations to handle old landing pages or SEO rankings
      redirectRules.push(`/${loc.slug}-paving    /locations/${loc.slug}    301!`);
      redirectRules.push(`/${loc.slug}-driveway-paving    /locations/${loc.slug}    301!`);
    }

    const newSegment = `${startMarker}\n${redirectRules.join('\n')}\n`;

    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);

    const updatedContent = before + newSegment + after;
    writeFileSync(redirectsPath, updatedContent, 'utf8');

    console.log(`[redirects] Successfully generated ${redirectRules.length} redirect rules in public/_redirects`);
  } catch (err) {
    console.error('[redirects] Error running generator:', err);
    process.exit(1);
  }
}

main();
