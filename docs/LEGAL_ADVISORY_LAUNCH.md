# Legal Advisory Launch Plan

## Purpose

This playbook turns existing platform logic into a sellable launch + compliance advisory offer.

Advisory outputs are operational guidance only and are not legal advice.

## Existing Capability Base

The repository already includes:

- 51-jurisdiction legal/compliance tables (50 states + DC)
- Compliance verification APIs (`/api/v1/compliance/*`)
- Advisor strategy APIs (`/api/v1/advisor/*`)
- Jarvis operator workflows (`/api/v1/jarvis/*`)
- Math AI estimate and forecasting (`/api/v1/math-ai/*`)
- Stripe deposit capture (`/api/v1/payments/*`)
- Ads intelligence and anomaly scans (`/api/v1/ads/*`)

## Productized Advisory Offers

1. Compliance Verification Retainer
- Deliverables: monthly batch checks, state matrix snapshots, red-flag escalations.
- Realistic range: $1,000-$12,000 per month.

2. Launch Readiness Advisory
- Deliverables: close-rate plan, deposit conversion setup, capacity constraints map.
- Realistic range: $2,500-$9,000 per month.

3. Ads Intelligence Managed Layer
- Deliverables: URL exclusions, CRM export loops, anomaly response runbook.
- Realistic range: $4,500-$30,000 per month.

4. Recurring Maintenance Growth Advisory
- Deliverables: forecast-driven campaign sequencing, repeat-cycle offers.
- Realistic range: $3,000-$20,000 per month.

## Launch Sequence

1. Stabilize funnel conversion (quote -> proposal -> deposit).
2. Turn on anomaly and reporting cadence for paid media.
3. Launch compliance advisory packages with scoped deliverables.
4. Expand recurring maintenance lane after capacity confirms.

## Monitoring and Change Management

Use `npm run ops:legal-advisory` to generate change and impact reports from legal data.

Outputs:

- `docs/legal-advisory/latest-report.md`
- `docs/legal-advisory/latest.json`
- `docs/legal-advisory/current-snapshot.json`
- `docs/legal-advisory/baseline.json`

Automation:

- `.github/workflows/legal-advisory-monitor.yml` runs every 12 hours and publishes the latest impact report.

## API Support Added

New advisor endpoint:

- `POST /api/v1/advisor/launch-compliance-plan`

This endpoint provides:

- Capacity-capped monthly revenue forecast bands
- Launch sequence recommendations
- Compliance checklist
- Advisory notices for legal/tax/professional verification
