# Phase 2: Clean House Without Losing Logic

This phase is designed to preserve all existing logic while improving repo structure in controlled, auditable batches.

## Goals

- Preserve current behavior and legacy paths during refactors.
- Create machine-readable snapshots before structural cleanup.
- Split cleanup into low-risk commit batches.
- Avoid guessing and avoid destructive operations.

## New Helper Commands

Run a full logic snapshot (with timestamped history):

```bash
npm run ops:logic-snapshot
```

Run a current working-tree cleanup report:

```bash
npm run ops:clean-house
```

Run both in sequence:

```bash
npm run ops:phase2
```

## Output Files

Logic preservation outputs:

- `docs/logic-preservation/latest-snapshot.json`
- `docs/logic-preservation/latest-summary.md`
- `docs/logic-preservation/logic-catalog.json`
- `docs/logic-preservation/logic-catalog.md`
- `docs/logic-preservation/new-logic-files.txt`
- `docs/logic-preservation/old-logic-files.txt`
- `docs/logic-preservation/modified-old-logic-files.txt`
- `docs/logic-preservation/history/<timestamp>.json`

Clean-house outputs:

- `docs/clean-house/latest.json`
- `docs/clean-house/latest-report.md`

## Recommended Workflow

1. Run `npm run ops:logic-snapshot` before any large reorganization.
2. Run `npm run ops:clean-house` and review high-risk file list first.
3. Commit in focused batches:
   - CI/root config
   - backend domain batches
   - frontend route batches
   - scripts/docs
4. Re-run `npm run lint` and `npm run build` between batches.
5. If behavior drifts, compare current files to latest logic snapshot and restore mismatched files.

## Guardrails

- Do not delete legacy logic unless replacement behavior is validated.
- Keep unknown-risk changes behind feature flags when possible.
- Do not mix generated artifacts with critical runtime logic commits.
- Keep each commit explainable by one purpose.
