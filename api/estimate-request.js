// api/estimate-request.js — Vercel serverless function (ported from the former
// Netlify function). Emails the team a new estimate request via Gmail.
//
// The original also posted to Netlify Forms as a backup; that mechanism does not
// exist on Vercel, so it has been dropped and the direct Gmail notification is
// now the single source of truth. Requires GMAIL_USER, GMAIL_APP_PASSWORD, and
// (optionally) LEAD_EMAIL in the Vercel project's Environment Variables.
import nodemailer from 'nodemailer';

// Escape user-supplied values before interpolating them into the HTML email body.
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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

  const name    = String(payload.name    || '').slice(0, 200);
  const email   = String(payload.email   || '').slice(0, 200);
  const phone   = String(payload.phone   || '').slice(0, 50);
  const service = String(payload.service || '').slice(0, 100);
  const message = String(payload.message || '').slice(0, 2000);
  const source  = String(payload.source  || req.headers?.referer || 'homepage').slice(0, 500);
  const ts      = new Date().toISOString();

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const leadEmail = process.env.LEAD_EMAIL || gmailUser;

  if (!gmailUser || !gmailPass || !leadEmail) {
    console.error('[estimate-request] Gmail env vars not configured');
    return res.status(502).json({ ok: false, error: 'notifier not configured' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });

    await transporter.sendMail({
      from: `"J. Worden & Sons Website" <${gmailUser}>`,
      to: leadEmail,
      subject: `New estimate request — ${name || 'Unknown'} — ${service || 'General paving'}`,
      replyTo: email || undefined,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0f0f0f;padding:24px 32px;">
            <h2 style="color:#ff7a00;margin:0;font-size:22px;letter-spacing:2px;text-transform:uppercase;">New Estimate Request</h2>
            <p style="color:#888;margin:4px 0 0;font-size:13px;">jwordenasphaltpaving.com — ${ts}</p>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #eee;">
            <table style="width:100%;font-size:14px;border-collapse:collapse;">
              <tr style="border-bottom:1px solid #f5f5f5;"><td style="padding:10px 16px 10px 0;font-weight:700;color:#333;width:120px;">Name</td><td style="padding:10px 0;color:#555;">${esc(name) || '<em>not provided</em>'}</td></tr>
              <tr style="border-bottom:1px solid #f5f5f5;"><td style="padding:10px 16px 10px 0;font-weight:700;color:#333;">Phone</td><td style="padding:10px 0;color:#555;">${esc(phone) || '<em>not provided</em>'}</td></tr>
              <tr style="border-bottom:1px solid #f5f5f5;"><td style="padding:10px 16px 10px 0;font-weight:700;color:#333;">Email</td><td style="padding:10px 0;color:#555;">${esc(email) || '<em>not provided</em>'}</td></tr>
              <tr style="border-bottom:1px solid #f5f5f5;"><td style="padding:10px 16px 10px 0;font-weight:700;color:#333;">Service</td><td style="padding:10px 0;color:#555;">${esc(service) || '<em>not specified</em>'}</td></tr>
              <tr><td style="padding:10px 16px 10px 0;font-weight:700;color:#333;vertical-align:top;">Details</td><td style="padding:10px 0;color:#555;white-space:pre-wrap;">${esc(message) || '<em>none</em>'}</td></tr>
            </table>
            <div style="margin-top:24px;padding:16px;background:#fffbf0;border-left:4px solid #ff7a00;">
              <p style="margin:0;font-size:13px;color:#666;">Source: ${esc(source)}</p>
            </div>
          </div>
        </div>`,
    });

    return res.status(200).json({ ok: true, results: { email: true } });
  } catch (err) {
    console.error('[estimate-request] gmail error', err);
    return res.status(502).json({ ok: false, error: 'send failed' });
  }
}
