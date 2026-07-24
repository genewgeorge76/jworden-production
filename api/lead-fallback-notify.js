// api/lead-fallback-notify.js — Vercel serverless function.
//
// Always-on lead notification fallback. The original Netlify version submitted
// to Netlify Forms, relying on Netlify's built-in form-notification emails.
// Vercel has no equivalent, so this re-implements the same "always email me the
// lead" intent with a direct Gmail send. It is fired in parallel with the
// primary backend POST; failures here are logged but must never block the user.
//
// Requires GMAIL_USER, GMAIL_APP_PASSWORD, and one of GMAIL_RECIPIENTS /
// LEAD_EMAIL in the Vercel project's Environment Variables.
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let payload;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const safe = {
    name: String(payload.name || '').slice(0, 200),
    email: String(payload.email || '').slice(0, 200),
    phone: String(payload.phone || '').slice(0, 50),
    address: String(payload.address || '').slice(0, 300),
    service: String(payload.service_type || payload.service || '').slice(0, 100),
    message: String(payload.message || '').slice(0, 2000),
    source: String(payload.source || req.headers?.referer || 'unknown').slice(0, 500),
    timestamp: new Date().toISOString(),
  };

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.GMAIL_RECIPIENTS || process.env.LEAD_EMAIL || gmailUser;

  if (!gmailUser || !gmailPass || !to) {
    console.error('[lead-fallback] Gmail env vars not configured');
    return res.status(502).json({ ok: false, error: 'notifier not configured' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });

    const rows = Object.entries(safe)
      .map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#333;text-transform:capitalize;">${k}</td><td style="padding:6px 0;color:#555;white-space:pre-wrap;">${v || '<em>—</em>'}</td></tr>`)
      .join('');

    await transporter.sendMail({
      from: `"J. Worden & Sons Lead Fallback" <${gmailUser}>`,
      to,
      subject: `Lead fallback — ${safe.name || 'Unknown'} — ${safe.service || 'general'}`,
      replyTo: safe.email || undefined,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#ff7a00;">New Lead (fallback notifier)</h2>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">${rows}</table>
      </div>`,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[lead-fallback] error', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
