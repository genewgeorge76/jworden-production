# 06 — Action Items

> Open todos. Mirror of the IDE todo list, plus blockers and owners.
> Update when items are completed or added.

## Legend
- ⬜ = open
- 🟡 = in progress / partially done
- ✅ = done
- 🚫 = blocked (need user action)

---

## NEXT (do these first, in order)

| # | Item | Owner | Blocker |
|---|------|-------|---------|
| 1 | Create Cloudflare R2 bucket `jworden-media` + custom domain `media.jwordenasphaltpaving.com` | 🚫 You | ~10 min in Cloudflare dashboard |
| 2 | Create R2 API token, save to local `.env.local` | 🚫 You | After bucket created |
| 3 | Add `ANTHROPIC_API_KEY` to Railway env | 🚫 You | Anthropic console |
| 4 | Add `TAVILY_API_KEY` to Railway env | 🚫 You | tavily.com signup |
| 5 | Add `VAPI_API_KEY` + `VAPI_ASSISTANT_ID` to Railway env | 🚫 You | vapi.ai signup |
| 6 | Add `SENDGRID_API_KEY` + `SENDGRID_FROM_EMAIL` to Railway env | 🚫 You | sendgrid.com signup |
| 7 | Add `OPENAI_API_KEY` to Railway env | 🚫 You | platform.openai.com |
| 8 | Add `GOOGLE_PSI_API_KEY` to Netlify env | 🚫 You | Google Cloud Console |
| 9 | Add `GSC_SERVICE_ACCOUNT_JSON` to Netlify env | 🚫 You | Google Cloud Console (already have project) |
| 10 | Enable GitHub branch protection on `main` (require PR + green CI) | 🚫 You | GitHub repo settings |
| 11 | Authenticate `gh` CLI for log access | 🚫 You | `gh auth login` in terminal |

## ME (unblocked, can do anytime)

| # | Item | Status |
|---|------|--------|
| 1 | Add CSP header to `netlify.toml` | ⬜ |
| 2 | Wire Sentry (free tier) using existing `SENTRY_SETUP.md` | ⬜ |
| 3 | Build R2 upload script `scripts/upload-to-r2.mjs` | ⬜ Blocked on R2 token |
| 4 | Move 2 large `.MOV` files out of git | ⬜ |
| 5 | Migrate KFC photo set to R2 | ⬜ Blocked on R2 token |
| 6 | Build Dispatch board: crew swim lanes (read-only) | ⬜ |
| 7 | Build Dispatch board: status tags | ⬜ |
| 8 | Build Dispatch board: drag-and-drop reschedule | ⬜ |
| 9 | Build AI Route Optimizer with asphalt-cooling logic | ⬜ |
| 10 | Build Jarvis "Plan Tomorrow" autonomous nightly job | ⬜ |
| 11 | Scaffold Jarvis Command Surface (Iron Man UI) on `feat/jarvis-surface` | ⬜ |

## STRATEGIC (longer-term, do when ready)

| # | Item | Cost | Status |
|---|------|------|--------|
| 1 | File USPTO provisional patent ($320) | $320 | 🚫 You |
| 2 | Register trademarks (JWordenAI, Worden Pavement Index) | $500 total | 🚫 You |
| 3 | Get first paying contractor (TX/FL/NC, $2K/mo trial) | — | 🚫 You — sales |
| 4 | Sign Vanta/Drata for SOC2 Type I | $15K | 🚫 You — when ready |
| 5 | Convert provisional patent to utility ($10K) | $10K | After 6-12 months |

---

## DONE THIS SESSION

✅ Stability foundation pushed to main (`bf85ad1`)
✅ Dispatch board scaffold pushed to `feat/dispatch-board` (`fd8431f`)
✅ Production verified untouched (homepage 200)
✅ Dev notebook created in `docs/dev-notebook/`

---

## How to update

When you complete something:
1. Move the line from "NEXT" / "ME" to "DONE THIS SESSION"
2. Append to [05-decisions-log.md](./05-decisions-log.md)
3. Commit changes — these are doc files, safe to push to main anytime
