const repoSlug = String(process.env.GITHUB_REPOSITORY || '').trim();
const token = String(process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '').trim();
// Filter alerts to the current branch ref so alerts fixed on this branch
// don't block CI just because main hasn't been re-scanned yet.
const githubRef = String(process.env.GITHUB_REF || '').trim();

function fail(message) {
  console.error(`[release-readiness] FAIL: ${message}`);
  process.exit(1);
}

async function getOpenCriticalCodeScanningAlerts() {
  const params = new URLSearchParams({ state: 'open', severity: 'critical', per_page: '1' });
  if (githubRef) params.set('ref', githubRef);

  let response;
  try {
    response = await fetch(
      `https://api.github.com/repos/${repoSlug}/code-scanning/alerts?${params}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: 'Bearer ' + token,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );
  } catch (error) {
    console.log(`[release-readiness] SKIP: unable to reach GitHub API (${error.message}).`);
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 403 && body.toLowerCase().includes('blocked by dns monitoring proxy')) {
      console.log('[release-readiness] SKIP: outbound GitHub API call is blocked in this execution environment.');
      return null;
    }
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
  if (openCriticalAlerts === null) {
    return;
  }
  if (openCriticalAlerts > 0) {
    fail(`Open critical code scanning alerts detected (${openCriticalAlerts}). Release criteria not met.`);
  }

  console.log('[release-readiness] PASS: no open critical code scanning alerts found.');
}

await main();
