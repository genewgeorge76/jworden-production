// Netlify Function — Jarvis AI chat
// Proxies to Claude via server-side key; never exposes ANTHROPIC_API_KEY to client.

import Anthropic from '@anthropic-ai/sdk';
import { BUSINESS_SHORT, BUSINESS_PHONE, WORDEN_COMPACTION_FLOOR_PCT, WORDEN_BASE_SPEC, OIL_SHIELD_BUFFER_PER_TON, BINDER_INDEX, GROSS_MARGIN_FLOOR } from '@jworden/core';

const SYSTEM = `You are Jarvis, the AI assistant for J. Worden & Sons Paving & General Contracting (${BUSINESS_SHORT}). Phone: ${BUSINESS_PHONE}.

WORDEN ENGINEERING STANDARDS — always apply:
- Compaction: ${WORDEN_COMPACTION_FLOOR_PCT}% Marshall Unit Weight minimum (AASHTO T245)
- Base: ${WORDEN_BASE_SPEC}
- Oil Shield Buffer: ±$${OIL_SHIELD_BUFFER_PER_TON}/ton in all estimates
- Margin floor: ${(GROSS_MARGIN_FLOOR * 100).toFixed(0)}%
- Binder index: $${BINDER_INDEX}

Asphalt tonnage: tons = (sqft / 9 × depth_in × density) / 24,000
Residential density: 145 pcf | Commercial: 148 pcf

Be helpful, concise, and authoritative. If you can answer a price question, do so with caveats. If someone wants a formal estimate, direct them to call ${BUSINESS_PHONE} or submit the online form.`;

export default async function handler(req, context) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI service not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const messages = (body.messages ?? [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-20)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

  if (!messages.length) {
    return new Response(JSON.stringify({ error: 'No messages' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM,
      messages,
    });
    const reply = resp.content[0]?.type === 'text' ? resp.content[0].text : 'Sorry, I could not generate a response.';
    return new Response(JSON.stringify({ reply }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Jarvis error:', err);
    return new Response(JSON.stringify({ error: 'AI error', reply: `I'm having trouble right now. Please call us at ${BUSINESS_PHONE}.` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
