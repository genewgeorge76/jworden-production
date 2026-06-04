import nodemailer from 'nodemailer'

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' }
  }

  const name    = String(payload.name    || '').slice(0, 200)
  const email   = String(payload.email   || '').slice(0, 200)
  const phone   = String(payload.phone   || '').slice(0, 50)
  const service = String(payload.service || '').slice(0, 100)
  const message = String(payload.message || '').slice(0, 2000)
  const source  = String(payload.source  || event.headers?.referer || 'homepage').slice(0, 500)
  const ts      = new Date().toISOString()

  const results = { netlify: false, email: false }

  // Netlify Forms backup — captured in dashboard + configurable email notification
  try {
    const formBody = new URLSearchParams({
      'form-name': 'estimate-request',
      name, email, phone, service, message, source, timestamp: ts,
    }).toString()
    const siteUrl = process.env.URL || 'https://www.jwordenasphaltpaving.com'
    const res = await fetch(`${siteUrl}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    })
    results.netlify = res.ok
  } catch (err) {
    console.error('[estimate-request] netlify forms error', err)
  }

  // Direct Gmail notification via nodemailer
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD
  const leadEmail = process.env.LEAD_EMAIL || gmailUser

  if (gmailUser && gmailPass && leadEmail) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      })

      await transporter.sendMail({
        from: `"J. Worden & Sons Website" <${gmailUser}>`,
        to: leadEmail,
        subject: `New estimate request — ${name || 'Unknown'} — ${service || 'General paving'}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#0f0f0f;padding:24px 32px;">
              <h2 style="color:#ff7a00;margin:0;font-size:22px;letter-spacing:2px;text-transform:uppercase;">
                New Estimate Request
              </h2>
              <p style="color:#888;margin:4px 0 0;font-size:13px;">jwordenasphaltpaving.com — ${escapeHtml(ts)}</p>
            </div>
            <div style="background:#fff;padding:32px;border:1px solid #eee;">
              <table style="width:100%;font-size:14px;border-collapse:collapse;">
                <tr style="border-bottom:1px solid #f5f5f5;">
                  <td style="padding:10px 16px 10px 0;font-weight:700;color:#333;width:120px;">Name</td>
                  <td style="padding:10px 0;color:#555;">${name ? escapeHtml(name) : '<em>not provided</em>'}</td>
                </tr>
                <tr style="border-bottom:1px solid #f5f5f5;">
                  <td style="padding:10px 16px 10px 0;font-weight:700;color:#333;">Phone</td>
                  <td style="padding:10px 0;color:#555;">${phone ? escapeHtml(phone) : '<em>not provided</em>'}</td>
                </tr>
                <tr style="border-bottom:1px solid #f5f5f5;">
                  <td style="padding:10px 16px 10px 0;font-weight:700;color:#333;">Email</td>
                  <td style="padding:10px 0;color:#555;">${email ? escapeHtml(email) : '<em>not provided</em>'}</td>
                </tr>
                <tr style="border-bottom:1px solid #f5f5f5;">
                  <td style="padding:10px 16px 10px 0;font-weight:700;color:#333;">Service</td>
                  <td style="padding:10px 0;color:#555;">${service ? escapeHtml(service) : '<em>not specified</em>'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px 10px 0;font-weight:700;color:#333;vertical-align:top;">Details</td>
                  <td style="padding:10px 0;color:#555;white-space:pre-wrap;">${message ? escapeHtml(message) : '<em>none</em>'}</td>
                </tr>
              </table>
              <div style="margin-top:24px;padding:16px;background:#fffbf0;border-left:4px solid #ff7a00;">
                <p style="margin:0;font-size:13px;color:#666;">Source: ${escapeHtml(source)}</p>
              </div>
            </div>
          </div>
        `,
      })
      results.email = true
    } catch (err) {
      console.error('[estimate-request] gmail error', err)
    }
  }

  if (!results.netlify && !results.email) {
    return { statusCode: 502, body: JSON.stringify({ ok: false, results }) }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, results }),
  }
}
