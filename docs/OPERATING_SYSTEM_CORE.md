# Operating System Core Contract

This file defines the governance model for running the JWorden operating system across multiple repositories.

## Source Of Truth

- Machine-readable contract: `src/config/operatingSystemContract.json`
- Tenant + integration contract: `src/config/siteFactoryManifest.json`
- Drift guards:
  - `npm run guard:tenant-contract-drift`
  - `npm run guard:operating-system-contract`
  - `npm run guard:release-readiness`

## Scope Rule (Full + Trapped Logic)

All required repos must be declared in `operatingSystemContract.json`, including:

- Full-capacity active repos.
- Trapped or partial-capacity repos that still provide logic/data lineage.

If any integration-required repo is missing from the operating-system contract, CI fails.

## Versioning + Compatibility Rules

The contract enforces:

- `contractVersion` uses semver (`x.y.z`).
- `compatibilityPolicy.policyVersion` uses semver (`x.y.z`).
- Every repo entry declares:
  - `contractVersion`
  - `minCompatiblePolicyVersion`
  - `maxCompatiblePolicyVersion`
- `requiredSharedApiVersion` uses `major.minor` format.

## Hard Release Criteria

A release is blocked if any of these fail:

1. Guardrails are red (`tenant-contract-drift`, `operating-system-contract`, `deploy-mode`).
2. Build/lint/test pipeline is red.
3. Open critical code-scanning alerts exist (`guard:release-readiness`).

This keeps reliability and contract discipline as non-negotiable gates.
