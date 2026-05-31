import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const manifestPath = path.join(root, 'src', 'config', 'siteFactoryManifest.json');
const canonicalBackendDomain = 'https://codexbuildfreeofbase44-production.up.railway.app';
const canonicalBackendRepo = 'codexbuildfreeofbase44';

function fail(message) {
  console.error(`[tenant-contract-drift] FAIL: ${message}`);
  process.exit(1);
}

function toOrigin(value) {
  try {
    return new URL(String(value || '')).origin.toLowerCase();
  } catch {
    return String(value || '').trim().toLowerCase();
  }
}

if (!fs.existsSync(manifestPath)) {
  fail('Missing src/config/siteFactoryManifest.json');
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const frontendProfiles = new Set((manifest.profiles || []).map((p) => String(p.key || '').toLowerCase()).filter(Boolean));
const frontendHostMap = Object.fromEntries(
  Object.entries(manifest.hostnames || {}).map(([host, tenant]) => [String(host).toLowerCase(), String(tenant).toLowerCase()]),
);

const pyCode = [
  'import json',
  'from app.core.tenant_contract import load_site_factory_manifest',
  'm = load_site_factory_manifest()',
  'print(json.dumps({',
  '  "profiles": [p.key.lower() for p in m.profiles],',
  '  "hostnames": {k.lower(): v.lower() for k, v in m.hostnames.items()}',
  '}))',
].join('\n');

const py = spawnSync('python', ['-c', pyCode], {
  cwd: root,
  encoding: 'utf8',
  env: process.env,
});

if (py.status !== 0) {
  fail(`Backend contract parse failed: ${(py.stderr || py.stdout || '').trim()}`);
}

let backend;
try {
  backend = JSON.parse((py.stdout || '').trim());
} catch (err) {
  fail(`Could not parse backend contract output: ${err.message}`);
}

const backendProfiles = new Set((backend.profiles || []).map((k) => String(k).toLowerCase()));
const backendHostMap = Object.fromEntries(
  Object.entries(backend.hostnames || {}).map(([host, tenant]) => [String(host).toLowerCase(), String(tenant).toLowerCase()]),
);

const frontendOnlyProfiles = [...frontendProfiles].filter((k) => !backendProfiles.has(k));
const backendOnlyProfiles = [...backendProfiles].filter((k) => !frontendProfiles.has(k));

const hostMismatches = [];
for (const [host, tenant] of Object.entries(frontendHostMap)) {
  if ((backendHostMap[host] || '') !== tenant) {
    hostMismatches.push(`${host}: frontend=${tenant} backend=${backendHostMap[host] || 'missing'}`);
  }
}
for (const [host, tenant] of Object.entries(backendHostMap)) {
  if ((frontendHostMap[host] || '') !== tenant && !hostMismatches.find((m) => m.startsWith(`${host}:`))) {
    hostMismatches.push(`${host}: frontend=${frontendHostMap[host] || 'missing'} backend=${tenant}`);
  }
}

const unknownHostTenants = Object.entries(frontendHostMap)
  .filter(([, tenant]) => !frontendProfiles.has(tenant))
  .map(([host, tenant]) => `${host} -> ${tenant}`);

const integration = manifest.integration || {};
const canonicalBackend = integration.canonicalBackend || {};
const sharedContract = integration.sharedContract || {};
const surfaces = Array.isArray(integration.surfaces) ? integration.surfaces : [];
const allowedOrigins = new Set(
  (Array.isArray(sharedContract.allowedOrigins) ? sharedContract.allowedOrigins : []).map((origin) => toOrigin(origin)),
);
const expectedSources = Array.isArray(sharedContract.expectedSources) ? sharedContract.expectedSources : [];

const integrationErrors = [];
if (String(canonicalBackend.repo || '').toLowerCase() !== canonicalBackendRepo) {
  integrationErrors.push(`integration.canonicalBackend.repo must be ${canonicalBackendRepo}`);
}
if (String(canonicalBackend.domain || '').replace(/\/$/, '') !== canonicalBackendDomain) {
  integrationErrors.push(`integration.canonicalBackend.domain must be ${canonicalBackendDomain}`);
}

const aliases = Array.isArray(canonicalBackend.aliases) ? canonicalBackend.aliases.map((a) => String(a).toLowerCase()) : [];
if (!aliases.includes('codeexfreofbase44')) {
  integrationErrors.push('integration.canonicalBackend.aliases must include codeexfreofbase44');
}

if (String(sharedContract.apiBaseUrl || '').replace(/\/$/, '') !== canonicalBackendDomain) {
  integrationErrors.push(`integration.sharedContract.apiBaseUrl must be ${canonicalBackendDomain}`);
}
if (
  String(sharedContract.universityContractEndpoint || '').replace(/\/$/, '')
  !== `${canonicalBackendDomain}/api/worden-university/contract`
) {
  integrationErrors.push('integration.sharedContract.universityContractEndpoint is not aligned to canonical backend');
}

for (const profile of manifest.profiles || []) {
  const origin = toOrigin(profile.canonicalUrl);
  if (origin && !allowedOrigins.has(origin)) {
    integrationErrors.push(`sharedContract.allowedOrigins missing profile origin ${origin}`);
  }
}

const seenRepos = new Set();
for (const surface of surfaces) {
  const repo = String(surface.repo || '').toLowerCase();
  if (!repo) {
    integrationErrors.push('integration.surfaces contains an entry without repo');
    continue;
  }
  if (seenRepos.has(repo)) {
    integrationErrors.push(`integration.surfaces has duplicate repo ${repo}`);
  }
  seenRepos.add(repo);

  const domainOrigin = toOrigin(surface.domain);
  if (!domainOrigin || domainOrigin === 'https://') {
    integrationErrors.push(`integration.surfaces.${repo} has invalid domain ${JSON.stringify(surface.domain)}`);
  } else if (!allowedOrigins.has(domainOrigin)) {
    integrationErrors.push(`sharedContract.allowedOrigins missing surface origin ${domainOrigin}`);
  }
}

for (const source of ['jwordenproduction', 'jwordenuniversity']) {
  if (!expectedSources.map((s) => String(s).toLowerCase()).includes(source)) {
    integrationErrors.push(`integration.sharedContract.expectedSources missing ${source}`);
  }
}

const errors = [];
if (frontendOnlyProfiles.length) errors.push(`Profiles only in frontend manifest: ${frontendOnlyProfiles.join(', ')}`);
if (backendOnlyProfiles.length) errors.push(`Profiles only in backend contract load: ${backendOnlyProfiles.join(', ')}`);
if (hostMismatches.length) errors.push(`Hostname mapping mismatches:\n- ${hostMismatches.join('\n- ')}`);
if (unknownHostTenants.length) errors.push(`Hostnames mapped to unknown tenant keys:\n- ${unknownHostTenants.join('\n- ')}`);
if (integrationErrors.length) errors.push(`Integration contract mismatches:\n- ${integrationErrors.join('\n- ')}`);

if (errors.length) {
  fail(errors.join('\n'));
}

console.log(
  `[tenant-contract-drift] PASS: ${frontendProfiles.size} profiles, ${Object.keys(frontendHostMap).length} host mappings, ${surfaces.length} integration surfaces aligned.`,
);
