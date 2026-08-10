// api/chat-lead-capture.js — Vercel serverless function (ported from the former
// Netlify function of the same name). Emails the owners a new chat lead and
// sends the customer an auto-reply. Requires GMAIL_USER, GMAIL_APP_PASSWORD, and
// GMAIL_RECIPIENTS to be set in the Vercel project's Environment Variables.
import nodemailer from 'nodemailer';

// Escape user-supplied values before interpolating them into HTML email bodies,
// so a crafted field (e.g. name = "<script>…") cannot inject markup.
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vercel parses JSON bodies automatically, but be defensive about strings.
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { name, phone, email, service, projectDetails, timing } = body;

    if (!name || !phone || !email || !service) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });

    const ownerEmailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; }
    .header { background: linear-gradient(135deg, #1c3a47 0%, #2d5a6f 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .header h2 { margin: 0; color: #f59e0b; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #1c3a47; }
    .value { color: #666; padding: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h2>🎯 NEW CHAT LEAD - J. Worden & Sons</h2></div>
    <div class="field"><div class="label">Name:</div><div class="value">${esc(name)}</div></div>
    <div class="field"><div class="label">Phone:</div><div class="value"><a href="tel:${esc(phone)}">${esc(phone)}</a></div></div>
    <div class="field"><div class="label">Email:</div><div class="value"><a href="mailto:${esc(email)}">${esc(email)}</a></div></div>
    <div class="field"><div class="label">Service Interested In:</div><div class="value">${esc(service)}</div></div>
    <div class="field"><div class="label">Project Details:</div><div class="value">${esc(projectDetails) || 'Not provided'}</div></div>
    <div class="field"><div class="label">Project Timing:</div><div class="value">${esc(timing) || 'Not provided'}</div></div>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #999; font-size: 12px;">
      <p>This lead came from the chat widget on your website. Follow up promptly to convert!</p>
    </div>
  </div>
</body>
</html>`;

    const customerEmailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; }
    .header { background: linear-gradient(135deg, #1c3a47 0%, #2d5a6f 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .header h2 { margin: 0; }
    .highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h2>Thanks for contacting J. Worden & Sons! 🎉</h2></div>
    <p>Hi ${esc(name)},</p>
    <p>We received your request for a free driveway paving estimate. Our team will contact you within 24 hours to discuss your project and answer any questions.</p>
    <div class="highlight">
      <strong>In the meantime, feel free to call us:</strong><br>
      📞 <a href="tel:8044461296">(804) 446-1296</a><br>
      Hours: Mon–Fri 7am–6pm · Sat 8am–2pm
    </div>
    <h3>What to expect:</h3>
    <ul>
      <li>Free, no-obligation in-person estimate</li>
      <li>Detailed written quote within 24 hours</li>
      <li>Expert consultation on your ${esc(String(service).toLowerCase())}</li>
      <li>40+ years of trusted Richmond-area paving experience</li>
    </ul>
    <p><strong>Have questions in the meantime?</strong> Visit us at:
      <a href="https://jwordenasphaltpaving.com" style="color: #f59e0b; text-decoration: none; font-weight: bold;">jwordenasphaltpaving.com</a></p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #999; font-size: 12px;">
      <p>J. Worden & Sons Asphalt Paving · Chester, VA 23836<br>Virginia Class A Contractor License · Licensed & Insured</p>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_RECIPIENTS,
      subject: `🎯 NEW LEAD: ${name} - ${service}`,
      html: ownerEmailContent,
      replyTo: email,
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Thanks for contacting J. Worden & Sons! 🎉',
      html: customerEmailContent,
    });

    return res.status(200).json({ success: true, message: 'Lead captured successfully' });
  } catch (error) {
    console.error('[chat-lead-capture] error:', error);
    return res.status(500).json({ error: 'Failed to process lead', details: error.message });
  }
}
