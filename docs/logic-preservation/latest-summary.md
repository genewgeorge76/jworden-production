# Logic Preservation Snapshot

Generated: 2026-07-13T00:52:04.550Z
Branch: feature/antigravity-abilities
HEAD: 1daac4b
Logic files captured: 702
Old logic files: 702
New logic files: 0
Total bytes: 6758842
Dirty paths: 0

## Logic Age Counts

| Age | Files |
|---|---:|
| old | 702 |
| new | 0 |

## Git Status Counts (Captured Logic Files)

| Status | Files |
|---|---:|
| clean | 702 |

## By Area

| Area | Files |
|---|---:|
| src | 343 |
| app | 226 |
| scripts | 82 |
| alembic | 19 |
| tests | 15 |
| docs | 9 |
| alembic.ini | 1 |
| docker-compose.yml | 1 |
| Dockerfile | 1 |
| eslint.config.js | 1 |
| package.json | 1 |
| railway.json | 1 |
| tailwind.config.js | 1 |
| vite.config.js | 1 |

## Largest Files (Top 20)

| File | Bytes | Lines |
|---|---:|---:|
| src/pages/CommandCenter.jsx | 305735 | 6660 |
| src/lib/locations.js | 164045 | 2226 |
| src/data/blogPosts.js | 142585 | 3011 |
| app/models.py | 88826 | 2008 |
| app/data/tech-intelligence/latest.json | 82915 | 2653 |
| src/data/legal/buildingPermits.js | 73780 | 1481 |
| src/data/legal/roadsAndPavingRegulations.js | 65778 | 1317 |
| src/data/legal/contractLaw.js | 56135 | 1313 |
| src/data/legal/environmentalPermits.js | 53331 | 1082 |
| src/data/legal/utilityDepthClearances.js | 53324 | 1913 |
| src/components/ChatWidget.jsx | 53319 | 1225 |
| src/api/client.js | 51455 | 1038 |
| alembic/versions/0e263db2f322_initial_schema.py | 47073 | 761 |
| src/pages/advisory/TaxComplianceAdvisory.jsx | 45662 | 832 |
| src/data/legal/constructionLicensing.js | 42743 | 1156 |
| src/data/legal/mechanicsLienLaws.js | 42078 | 936 |
| app/services/jarvis.py | 41041 | 904 |
| src/pages/CockpitHome.jsx | 39567 | 1006 |
| src/data/legal/workersSafety.js | 39173 | 874 |
| src/components/AIConciergeBubble.jsx | 38790 | 942 |

## Current Dirty Paths

Working tree is clean.

## Restore Strategy

1. Run this snapshot before large refactors.
2. If behavior drifts, compare current file hashes against latest-snapshot.json.
3. Restore only the mismatched files, then re-run validation commands.
4. Review the complete old/new logic list in docs/logic-preservation/logic-catalog.md.