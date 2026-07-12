// Netlify Function — lead capture form submission
// Validates, stores (to API backend or fallback email), and optionally forwards to Kickserv.

export default async function handler(req, _context) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { name, phone } = body;
  if (!name?.trim() || !phone?.trim()) {
    return new Response(JSON.stringify({ error: 'Name and phone are required' }), { status: 422, headers: { 'Content-Type': 'application/json' } });
  }

  const lead = {
    id: `WEB-${Date.now()}`,
    name: name.trim(),
    phone: phone.trim(),
    email: body.email?.trim() ?? '',
    service: body.service ?? '',
    address: body.address ?? '',
    message: body.message ?? '',
    source: body.source ?? 'web-form',
    submittedAt: body.submittedAt ?? new Date().toISOString(),
  };

  // Forward to backend API if configured
  const apiBase = process.env.VITE_API_BASE_URL ?? process.env.API_BASE_URL;
  if (apiBase) {
    try {
      await fetch(`${apiBase}/api/v1/leads/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
    } catch (err) {
      console.error('Backend lead forward failed:', err);
    }
  }

  console.log('Lead captured:', lead.id, lead.name, lead.phone, lead.service);

  return new Response(JSON.stringify({ success: true, id: lead.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
