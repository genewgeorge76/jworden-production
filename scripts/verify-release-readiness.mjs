const repoSlug = String(process.env.GITHUB_REPOSITORY || '').trim();
const token = String(process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '').trim();

function fail(message) {
  console.error(`[release-readiness] FAIL: ${message}`);
  process.exit(1);
}

async function getOpenCriticalCodeScanningAlerts() {
  const response = await fetch(
    `https://api.github.com/repos/${repoSlug}/code-scanning/alerts?state=open&severity=critical&per_page=1`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer ' + token,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    fail(`Could not check code scanning alerts (${response.status}): ${body.slice(0, 400)}`);
  }

  const alerts = await response.json();
  return Array.isArray(alerts) ? alerts.length : 0;
}

async function main() {
  if (!repoSlug || !token) {
    console.log('[release-readiness] SKIP: GITHUB_REPOSITORY or GITHUB_TOKEN is missing; critical-alert check unavailable.');
    return;
  }

  const openCriticalAlerts = await getOpenCriticalCodeScanningAlerts();
  if (openCriticalAlerts > 0) {
    fail(`Open critical code scanning alerts detected (${openCriticalAlerts}). Release criteria not met.`);
  }

  console.log('[release-readiness] PASS: no open critical code scanning alerts found.');
}

await main();
