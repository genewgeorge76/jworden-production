# 03 — Jarvis Capabilities

> What Jarvis CAN do today, what's wired but dormant, and what's planned.

## What Jarvis IS

A multipurpose AI assistant for Jeremy Worden:
- **Primary domain**: JWordenAI — Virginia asphalt paving operations
- **Secondary domain**: Jeremy's personal life — calls, reservations, appointments, research
- **Voice**: Stark-style "At your service, Sir" register
- **Persona switching**: JARVIS (lifestyle butler) ↔ Mr. Worden (energetic salesman)

Code: [app/services/jarvis.py](../../app/services/jarvis.py)

## Architecture

```
User input
    ↓
FastAPI router (app/routers/jarvis_router.py)
    ↓
JARVIS_SYSTEM_PROMPT loaded
    ↓
Anthropic Claude (claude-3-5-sonnet-latest)
    ↓
Two-round tool-use loop:
    Round 1: Claude thinks, decides which tool to call
    Round 2: Tool result returned to Claude, final answer composed
    ↓
Response back to user
```

## Tools wired (3 total)

### 1. `web_search(query, deep)`
- **Provider**: Tavily
- **Cost**: Free 1,000 searches/mo
- **Status**: Code live ✅, needs `TAVILY_API_KEY`
- **Use cases**: weather, prices, business hours, news, anything current

### 2. `make_phone_call(to_number, purpose, script_hint)`
- **Provider**: Vapi outbound voice AI
- **Cost**: ~$0.05/min
- **Status**: Code live ✅, needs `VAPI_API_KEY` + assistant ID
- **Use cases**: restaurant reservations, vendor coordination, customer follow-up
- **Safety**: requires autonomy kill switch unfrozen + (optionally) operator confirmation

### 3. `send_email(to_email, subject, body)`
- **Provider**: SendGrid
- **Cost**: Free 100 emails/day
- **Status**: Code live ✅, needs `SENDGRID_API_KEY`
- **Default to**: `j.wordenandsonspaving@gmail.com`

## Real-world examples Jarvis can handle today

| Request | Tool flow |
|---------|-----------|
| "What's the weather in Richmond?" | `web_search` |
| "Call Lemaire and book a table for Friday 7pm for 2" | `make_phone_call` |
| "Email me the master keys list" | `send_email` |
| "Look up that restaurant's phone number and call them" | `web_search` → `make_phone_call` |
| "What time does Lowes close today?" | `web_search` |
| "Research the new Apple Vision Pro pricing" | `web_search` |
| "Confirm my dentist appointment by calling them" | `make_phone_call` |
| "Send my wife the address of the new house" | `send_email` |
| "Draft an estimate for the Henderson driveway" | (uses estimate tool — separate router) |

## Status endpoint

`GET /api/v1/jarvis/status` returns:
```json
{
  "identity": "JARVIS",
  "engine": "anthropic-claude" | "heuristic-fallback",
  "tools": {
    "web_search": true | false,
    "make_phone_call": true | false,
    "send_email": true | false
  },
  "autonomy": { "master": true, "frozen": false }
}
```

The Command Center shows this live so you always know what's armed.

## Autonomy kill switch

Code: [app/services/autonomy_state.py](../../app/services/autonomy_state.py)

- Disk-persisted JSON at `/tmp/jarvis_autonomy.json`
- `master` (bool): is Jarvis allowed to act autonomously at all
- `frozen` (bool): emergency freeze — refuses all side-effect tools
- Defense-in-depth: even if one layer is bypassed, others hold

Manual freeze (shell on Railway):
```bash
echo '{"master": true, "frozen": true}' > /tmp/jarvis_autonomy.json
```

## Personas

### JARVIS (default)
- Sophisticated, lifestyle-oriented, calm, precise
- Stark-style "At your service, Sir"
- Good for: research, scheduling, reservations, business analysis

### MR_WORDEN_SALES
- Energetic, closer mindset, builds rapport fast
- Good for: outbound sales calls, lead nurturing, customer reassurance

Switching is automatic based on context, or explicit via API.

## What's planned (not yet wired)

| Future tool | What it would do | Difficulty |
|-------------|------------------|------------|
| `read_calendar(date)` | Check Google Calendar for free slots | Easy (Google Calendar API) |
| `book_calendar(slot, title)` | Create calendar event | Easy |
| `take_photo_analyze(image_url)` | Claude Vision analyzes a job photo | Easy (already in stack) |
| `query_postgres(sql)` | Direct DB queries (read-only) | Medium (need safety guards) |
| `dispatch_crew(crew_id, job_id)` | Move a crew to a new job | Medium (needs Dispatch board first) |
| `pay_invoice(amount, vendor)` | Pay bills via banking API | HARD — high risk, needs strict guardrails |
| `compaction_verify(roller_video)` | Verify roller compaction from video | Medium (Claude Vision + heuristics) |

## Business intelligence services (separate from Jarvis tools)

These run on backend, not via Jarvis tool-use, but Jarvis can call them:

- [app/services/analytics.py](../../app/services/analytics.py)
- [app/services/ad_signals.py](../../app/services/ad_signals.py)
- [app/services/anomaly_detector.py](../../app/services/anomaly_detector.py)
- [app/services/license_service.py](../../app/services/license_service.py)
- [app/services/lawyer_recommender.py](../../app/services/lawyer_recommender.py)
- [app/services/market_intelligence.py](../../app/services/market_intelligence.py)
- [app/services/proposal_generator.py](../../app/services/proposal_generator.py)
- [app/services/proof_pack.py](../../app/services/proof_pack.py)
- [app/services/national_permits.py](../../app/services/national_permits.py)

## 24-source intel feed

Jarvis can reference these in its responses:
FHWA, AASHTO, DOT, Supreme Court precedents, 51-State Licensing, OSHA, EPA, FCC, USACE, NIOSH, DOL, IRS, SBA, GSA, USDOT, NHTSA, Federal Acquisition Regulations, state DMV/DOT pages, AGC, NAPA, NPDES, SWPPP guides, ICE/ASTM standards, local municipal codes.

## Concurrency

Each Jarvis session is independent — like Gmail handling many inboxes.
- Anthropic API: 4,000 req/min default
- Vapi: 100+ concurrent calls per assistant
- FastAPI: ~500 req/sec on $5 Railway instance

**Bottom line**: 6 simultaneous calls + you + wife + tech all working = no problem.

## Endpoints

- `POST /api/v1/jarvis/command` — main chat/command entry
- `POST /api/v1/jarvis/search` — direct web search
- `POST /api/v1/jarvis/call` — direct phone call
- `POST /api/v1/jarvis/email` — direct email
- `GET  /api/v1/jarvis/status` — health/tools/autonomy state

## Required env vars to fully activate

| Var | Service | Free tier |
|-----|---------|-----------|
| `ANTHROPIC_API_KEY` | Claude brain | $0 baseline + usage |
| `TAVILY_API_KEY` | Web search | 1,000/mo free |
| `VAPI_API_KEY` | Voice calls | $0 baseline |
| `VAPI_ASSISTANT_ID` | Vapi assistant | — |
| `SENDGRID_API_KEY` | Email | 100/day free |
| `SENDGRID_FROM_EMAIL` | Sender address | — |
| `OPENAI_API_KEY` | Secondary AI (proposals/SEO) | $0 baseline |
