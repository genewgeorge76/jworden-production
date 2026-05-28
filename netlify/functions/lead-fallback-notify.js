// netlify/functions/lead-fallback-notify.js
//
// Always-on lead notification fallback.
//
// Purpose: even if SendGrid is down or the env vars on Railway are missing,
// every lead submission still produces a Netlify Form submission, which
// Netlify itself will email to the address registered on your Netlify
// account (zero config needed beyond enabling Form notifications in the
// Netlify dashboard).
//
// The frontend's Quote/Contact submit handler should fire this in parallel
// with the primary backend POST. Failures here are logged but never block
// the user.
//
// Wire-up:
//   1. Netlify dashboard → Forms → enable Form notifications → add your
//      email (Gene's). Done. Every lead emails you instantly, forever.
//   2. Frontend posts {name,email,phone,address,service,message,source}
//      to /.netlify/functions/lead-fallback-notify

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const safe = {
    'form-name': 'lead-fallback',
    name: String(payload.name || '').slice(0, 200),
    email: String(payload.email || '').slice(0, 200),
    phone: String(payload.phone || '').slice(0, 50),
    address: String(payload.address || '').slice(0, 300),
    service: String(payload.service_type || payload.service || '').slice(0, 100),
    message: String(payload.message || '').slice(0, 2000),
    source: String(payload.source || event.headers?.referer || 'unknown').slice(0, 500),
    timestamp: new Date().toISOString(),
  };

  // Submit as a Netlify Form (registered in index.html). Netlify will
  // email this to whoever is configured under Forms → Notifications.
  try {
    const formBody = new URLSearchParams(safe).toString();
    const siteUrl = process.env.URL || 'https://www.jwordenasphaltpaving.com';
    const res = await fetch(`${siteUrl}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    });
    if (!res.ok) {
      console.error('[lead-fallback] netlify forms post failed', res.status);
      return { statusCode: 502, body: JSON.stringify({ ok: false, status: res.status }) };
    }
  } catch (err) {
    console.error('[lead-fallback] error', err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(err) }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  };
};
