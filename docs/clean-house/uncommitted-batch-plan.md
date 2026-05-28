# Uncommitted Batch Plan

Generated: 2026-05-08

Goal: process the remaining uncommitted files in safe, isolated commits.

## Batch 1: local-runtime-data (do not commit)

Files:
- .cc_head.txt
- .runtime/
- jworden_leads.db

Action:
- Keep local only.
- Add to .gitignore if needed in a dedicated hygiene commit.

## Batch 2: ci-workflows

Files:
- .github/workflows/ci.yml
- .github/workflows/vector-reindex.yml
- .github/workflows/legal-advisory-monitor.yml

Checks before commit:
- gh workflow list --repo jwordenaii/codexbuildfreeofbase44

## Batch 3: backend

Files:
- app/database.py
- app/main.py
- app/routers/admin.py
- app/routers/admin_integrations.py
- app/routers/advisor.py
- app/routers/jarvis_router.py
- app/routers/leads.py
- app/routers/metrics.py
- app/routers/tts.py
- app/services/jarvis.py
- app/services/jarvis_access.py
- app/services/jarvis_observability.py
- app/services/llm_client.py
- app/services/runtime_config.py
- app/services/tts_service.py
- app/tasks/email_tasks.py

Checks before commit:
- npm run lint
- python -m pytest tests/backend -q

## Batch 4: frontend and site factory

Files:
- src/App.jsx
- src/components/SEO.jsx
- src/main.jsx
- src/lib/ElevenLabsService.js
- src/lib/siteProfiles.js
- src/pages/CommandCenter.jsx
- src/pages/MarketLanding.jsx
- src/config/
- site-blueprints/premium-addons-catalog.json

Checks before commit:
- npm run lint
- npm run build

## Batch 5: legal datasets

Files:
- src/data/legal/buildingPermits.js
- src/data/legal/constructionLicensing.js
- src/data/legal/environmentalPermits.js
- src/data/legal/mechanicsLienLaws.js
- src/data/legal/prevailingWage.js
- src/data/legal/promptPaymentLaws.js
- src/data/legal/roadsAndPavingRegulations.js
- src/data/legal/states.js
- src/data/legal/utilityDepthClearances.js
- src/data/legal/workersSafety.js

Checks before commit:
- npm run ops:legal-advisory

## Batch 6: scripts-tooling

Files:
- scripts/add-site-to-factory.mjs
- scripts/calc-builder-pricing.mjs
- scripts/clean-house-report.mjs
- scripts/create-seo-growth-kit.mjs
- scripts/factory-blog-writer.mjs
- scripts/factory-launch-pack.mjs
- scripts/generate-sitemap.mjs
- scripts/legal-advisory-change-report.mjs
- scripts/logic-preserve-snapshot.mjs
- scripts/set-operational-secrets.ps1
- scripts/state-reach-report.mjs
- scripts/verify-public-core-boundary.mjs
- scripts/verify-seo-readiness.mjs
- scripts/verify-site-isolation.mjs
- scripts/watch-ci.mjs

Checks before commit:
- npm run lint
- npm run build

## Batch 7: docs and root docs/config

Files:
- DOMAINS_INVENTORY.md
- WEBSITE_FACTORY_BRAIN.md
- docs/CLEAN_HOUSE_PHASE2.md
- docs/LEGAL_ADVISORY_LAUNCH.md
- docs/WEBSITE_BUILDER_WORLD_CLASS_ROADMAP.md
- docs/clean-house/
- docs/legal-advisory/
- docs/logic-preservation/
- docs/reliability/

Notes:
- Keep generated artifacts grouped in one docs commit.

## Batch 8: public and tests

Files:
- public/sitemap.txt
- public/sitemap.xml
- tests/backend/test_jarvis_access_control.py
- tests/backend/test_public_core_boundary.py
- tests/backend/test_tts_streaming.py
- tests/e2e/public-pages-smoke.spec.js

Checks before commit:
- npm run build
- npm run test:e2e

## Suggested per-batch commit pattern

1. git add <batch paths>
2. git status --short
3. run checks for that batch
4. git commit -m "<batch scope>: <what changed>"
5. git push origin main
