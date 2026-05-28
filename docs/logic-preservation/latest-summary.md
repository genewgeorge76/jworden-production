# Logic Preservation Snapshot

Generated: 2026-05-08T22:15:13.778Z
Branch: main
HEAD: a1a7d24
Logic files captured: 600
Old logic files: 580
New logic files: 20
Total bytes: 5732369
Dirty paths: 58

## Logic Age Counts

| Age | Files |
|---|---:|
| old | 580 |
| new | 20 |

## Git Status Counts (Captured Logic Files)

| Status | Files |
|---|---:|
| clean | 557 |
| modified | 24 |
| untracked | 19 |

## By Area

| Area | Files |
|---|---:|
| src | 304 |
| app | 202 |
| scripts | 46 |
| alembic | 15 |
| tests | 14 |
| docs | 9 |
| alembic.ini | 1 |
| docker-compose.yml | 1 |
| Dockerfile | 1 |
| eslint.config.js | 1 |
| netlify.toml | 1 |
| package.json | 1 |
| railway.json | 1 |
| requirements.txt | 1 |
| tailwind.config.js | 1 |
| vite.config.js | 1 |

## Largest Files (Top 20)

| File | Bytes | Lines |
|---|---:|---:|
| src/pages/CommandCenter.jsx | 262059 | 5657 |
| src/data/blogPosts.js | 145595 | 3011 |
| app/models.py | 83418 | 1618 |
| src/data/legal/buildingPermits.js | 73786 | 1448 |
| src/data/legal/roadsAndPavingRegulations.js | 65695 | 1291 |
| src/data/legal/contractLaw.js | 57447 | 1313 |
| src/components/ChatWidget.jsx | 54344 | 1227 |
| src/data/legal/utilityDepthClearances.js | 54097 | 1876 |
| src/data/legal/environmentalPermits.js | 53288 | 1060 |
| src/lib/locations.js | 52878 | 855 |
| src/api/client.js | 50361 | 1015 |
| alembic/versions/0e263db2f322_initial_schema.py | 47833 | 761 |
| src/pages/advisory/TaxComplianceAdvisory.jsx | 46492 | 832 |
| src/data/legal/constructionLicensing.js | 43028 | 1136 |
| src/data/legal/mechanicsLienLaws.js | 42153 | 917 |
| src/data/legal/utilitiesOneCall.js | 39630 | 1006 |
| src/components/AIConciergeBubble.jsx | 39244 | 932 |
| src/data/legal/workersSafety.js | 39194 | 857 |
| src/pages/StaffPortal.jsx | 38248 | 866 |
| app/services/jarvis.py | 35691 | 741 |

## Current Dirty Paths

- .github/workflows/ci.yml
- .github/workflows/vector-reindex.yml
- DOMAINS_INVENTORY.md
- README.md
- app/database.py
- app/main.py
- app/routers/admin.py
- app/routers/admin_integrations.py
- app/routers/health.py
- app/routers/jarvis_router.py
- app/routers/leads.py
- app/routers/metrics.py
- app/routers/tts.py
- app/services/jarvis.py
- app/services/llm_client.py
- app/services/runtime_config.py
- app/services/tts_service.py
- app/tasks/email_tasks.py
- package.json
- public/sitemap.txt
- public/sitemap.xml
- requirements.txt
- scripts/generate-sitemap.mjs
- scripts/set-operational-secrets.ps1
- src/App.jsx
- src/components/SEO.jsx
- src/lib/ElevenLabsService.js
- src/main.jsx
- src/pages/CommandCenter.jsx
- tests/e2e/public-pages-smoke.spec.js
- .cc_head.txt
- WEBSITE_FACTORY_BRAIN.md
- app/services/jarvis_access.py
- app/services/jarvis_observability.py
- docs/CLEAN_HOUSE_PHASE2.md
- docs/WEBSITE_BUILDER_WORLD_CLASS_ROADMAP.md
- docs/clean-house/
- docs/logic-preservation/
- jworden_leads.db
- scripts/add-site-to-factory.mjs
- scripts/calc-builder-pricing.mjs
- scripts/clean-house-report.mjs
- scripts/create-seo-growth-kit.mjs
- scripts/factory-blog-writer.mjs
- scripts/factory-launch-pack.mjs
- scripts/logic-preserve-snapshot.mjs
- scripts/state-reach-report.mjs
- scripts/verify-public-core-boundary.mjs
- scripts/verify-seo-readiness.mjs
- scripts/verify-site-isolation.mjs
- scripts/watch-ci.mjs
- site-blueprints/premium-addons-catalog.json
- src/config/
- src/lib/siteProfiles.js
- src/pages/MarketLanding.jsx
- tests/backend/test_jarvis_access_control.py
- tests/backend/test_public_core_boundary.py
- tests/backend/test_tts_streaming.py

## Restore Strategy

1. Run this snapshot before large refactors.
2. If behavior drifts, compare current file hashes against latest-snapshot.json.
3. Restore only the mismatched files, then re-run validation commands.
4. Review the complete old/new logic list in docs/logic-preservation/logic-catalog.md.