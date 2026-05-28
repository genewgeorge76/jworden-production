const owner = 'jwordenaii';
const repo = 'codexbuildfreeofbase44';
const perPage = 50;
const maxAttempts = 40;
const delayMs = 15000;

async function fetchRuns() {
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=${perPage}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'copilot-debug' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

(async () => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const j = await fetchRuns();
      const runs = j.workflow_runs || [];
      const mainRun = runs.find(r => r.head_branch === 'main');
      if (!mainRun) {
        console.log(`${i}: no main run found`);
      } else {
        const state = mainRun.conclusion || mainRun.status;
        console.log(`${i}: ${state} ^| ${mainRun.name} ^| ${mainRun.head_branch} ^| ${mainRun.head_sha.slice(0,7)} ^| ${mainRun.created_at} ^| ${mainRun.html_url}`);
        if (mainRun.status === 'completed' || mainRun.conclusion) {
          process.exit(0);
        }
      }
    } catch (e) {
      console.error('fetch error', e.message || e);
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  console.log('timed out waiting for main run to complete');
  process.exit(2);
})();
