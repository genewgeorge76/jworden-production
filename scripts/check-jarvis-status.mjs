#!/usr/bin/env node
const base = (process.env.JARVIS_STATUS_BASE_URL || process.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

if (!base) {
  console.error('[jarvis-status] Missing JARVIS_STATUS_BASE_URL or VITE_API_BASE_URL');
  process.exit(1);
}

const url = `${base}/api/v1/jarvis/status`;

const main = async () => {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const tools = data?.tools || {};
  const summary = {
    engine: data?.engine,
    model: data?.model,
    web_search: Boolean(tools.web_search),
    make_phone_call: Boolean(tools.make_phone_call),
    send_email: Boolean(tools.send_email),
    autonomy: data?.autonomy || {},
  };

  console.log('[jarvis-status] OK');
  console.log(JSON.stringify(summary, null, 2));

  const allReady = summary.web_search && summary.make_phone_call && summary.send_email;
  if (!allReady) {
    process.exitCode = 2;
  }
};

main().catch((err) => {
  console.error(`[jarvis-status] Failed: ${err.message}`);
  process.exitCode = 1;
});
