# Google APIs — what to enable, and what the code already does with it

Two different questions get confused whenever this comes up, so this document
keeps them apart:

1. **Is the API enabled and approved in the Google Cloud project?** A console
   question. Nothing in this repo can answer it.
2. **Does anything in this backend actually call it?** A code question. That
   column below is derived from the source, not from intent.

An API can be enabled for months with no caller, and a caller can exist for an
API that was never enabled. Both failures are quiet. The table is the join.

---

## Tier 1 — enable now

| API | Why | In this repo today |
|---|---|---|
| Business Profile Performance | GBP calls / clicks / direction requests per location | **No caller.** |
| My Business Business Information | Read+write hours, categories, service areas across the portfolio | **No caller.** |
| My Business Verifications | The verification rejection | **No caller.** |
| My Business Notifications | Pub/Sub push when a review or question lands | **No caller.** Reviews are polled instead — see below. |
| Google Search Console | Queries, pages, indexing | `app/services/gsc_client.py`, surfaced by `app/routers/google_reporting.py`. Service-account auth, scope `webmasters.readonly`. |
| Web Search Indexing | Ping Google when a page changes | **No caller.** `scripts/submit-google-search-console.mjs` submits sitemaps, which is a different mechanism. |
| Gmail | What the Sentinel runs on | `app/services/gmail_ingest.py` (+ `mailbox_auth.py`). |
| PageSpeed Insights | Core Web Vitals across the site portfolio | `app/services/google_suite.py::pagespeed_status`, probed by `provider_health.py`. |

**Four of the eight have no caller at all**, and all four are the Business
Profile ones. That is the actual gap.

### The GBP quota trap

Every My Business / Business Profile API is granted **quota 0 on enable**. They
are gated behind the [GBP API access request form][gbp-form], and approval runs
days to weeks. Enabling them is what starts that clock, so enable all four now
even though nothing calls them yet — the code is the fast part, the approval is
not.

Note this applies to the existing GBP code too: `gbp_automation.py` already
calls `mybusiness.googleapis.com/v4` for posts and reviews, and those calls are
subject to the same approval. A 403 there is a gating answer, not a bug.

[gbp-form]: https://developers.google.com/my-business/content/prereqs

### Why the v4 endpoint is still correct

`gbp_automation.py` uses `mybusiness.googleapis.com/v4` for `localPosts` and
`reviews`. That is not stale code to be migrated. Google split most of v4 into
the newer per-surface APIs above, but **reviews and local posts have no v1
equivalent** and are still served by v4. The two coexist: v4 for posts and
reviews, the split APIs for everything in the table.

### Restricted scopes

Gmail and GBP scopes are *restricted*. For this account, with this project's own
OAuth client, that is fine. The moment JWordenAI reads a mailbox that is not
ours, it triggers Google's app verification plus a third-party security
assessment — an expensive surprise to discover after the integration is written.
Worth deciding deliberately now: **single-tenant by design**, or budget for the
assessment.

---

## Tier 2 — enable when there is a use for it

| API | Use | In this repo today |
|---|---|---|
| Places (New) | Competitor listings and review counts per market | `app/services/supplier_discovery.py` |
| Address Validation | Clean job-site addresses before they reach a quote | **No caller.** |
| Sheets | Outputs | `app/services/google_sheets.py` (via `googleapiclient`, scope `spreadsheets`) |
| Drive | Outputs | **No caller.** |
| Calendar | Job scheduling | **No caller.** |
| Chrome UX Report | Real-user field data; complements PageSpeed lab data | **No caller.** |
| My Business Place Actions | The "Request a quote" link on listings | **No caller.** |

---

## Not applicable

The Cloud infrastructure block — Spanner, Dataproc, Bigtable, Composer, and the
rest — does not apply. This stack runs on Railway, Fly, Vercel and Netlify. None
of it should be enabled, and enabling it only widens the project's surface.

---

## Already in use, outside both tiers

Enabled and called today, listed so the Cloud project's API list has no
unexplained entries:

| API | Where |
|---|---|
| Maps / Geocoding | `geocoding.py`, `dispatch_engine.py`, `market_intelligence.py`, and others |
| Routes | `google_routes.py` |
| Aerial View, Solar | `vision_takeoff.py` |
| Photos Library | `app/routers/metrics.py` |
| Generative Language (Gemini) | `gbp_automation.py`, `llm_client.py` |
| Analytics Data (GA4) | `ga4_client.py` |
| Google Ads | `ad_signals.py`, `google_suite.py::ads_status` |

---

## Config keys

The Google-related keys `runtime_config.py` reads today:

`GOOGLE_API_KEY`, `GOOGLE_MAPS_API_KEY`, `GOOGLE_PAGESPEED_API_KEY`,
`GEMINI_API_KEY`, `GSC_SERVICE_ACCOUNT_JSON`, `GSC_SITE_URL`,
`GA4_SERVICE_ACCOUNT_JSON`, `GA4_PROPERTY_ID`, `GBP_ACCOUNT_ID`,
`GBP_LOCATION_ID`, `GBP_OAUTH_TOKEN`, `GBP_REVIEW_LINK`,
`GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`,
`GOOGLE_ADS_LOGIN_CUSTOMER_ID`, `GOOGLE_ADS_REFRESH_TOKEN`,
`GOOGLE_ADS_SITE_DOMAIN`, `GOOGLE_TRENDS_GEO`.

The four Tier-1 Business Profile APIs need no new key — they authenticate with
the same `GBP_OAUTH_TOKEN` and `GBP_ACCOUNT_ID` the existing v4 calls use. See
`docs/ENV_KEYS_MASTER.md` for where each is set.
