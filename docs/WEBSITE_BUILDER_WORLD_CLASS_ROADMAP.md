# Website Builder World-Class Roadmap

This roadmap shows what is already implemented in the repo and what still needs to be added to compete with premium builders.

## Implemented In Repo

- Multi-site profile manifest and hostname routing
- Route isolation guardrails for site separation
- SEO growth kit generator (GBP, citations, backlinks, keywords, review templates)
- Keyword-driven blog writer pipeline per site profile
- One-command launch pack for new market sites
- Premium add-ons catalog with pricing calculator
- CI build + lint + isolation checks + SEO readiness checks

## Must-Have To Match Premium Competitors

1. Onboarding UX:
- Guided setup wizard with brand, domain, services, and goals intake
- One-click template selection and content style presets
- In-app launch checklist with progress status

2. Billing + Plans:
- Subscription plans, trial logic, and add-on checkout
- Usage-based billing for AI generation volumes
- Customer invoice history and payment recovery

3. Customer Admin Portal:
- Multi-tenant dashboard per customer
- Domain/DNS status monitor
- Lead inbox, analytics, and campaign control

4. Integrations:
- Native Google Business Profile API workflow
- Search Console and GA4 connection wizard
- CRM connectors (HubSpot, GoHighLevel, Salesforce)

5. Reliability + Scale:
- Per-tenant feature flags
- Queue-backed content generation jobs
- Error budget and uptime SLO dashboards

## Premium Moat Features

1. AI Market Intelligence:
- Competitor SERP watcher
- Automatic keyword gap discovery
- AI recommendations by market intent and seasonality

2. Conversion Intelligence:
- AI CRO test suggestions
- Dynamic CTA experiments by traffic source
- Lead quality scoring and funnel attribution

3. Reputation Growth Engine:
- Review outreach autopilot
- Negative-review rescue workflows
- Local authority score dashboard

4. Revenue Expansion Engine:
- Upsell recommendation assistant for premium add-ons
- Churn prediction and retention playbooks
- Per-client profitability dashboard

## Command Layer For Sales + Operations

- Preview launch pack without writes:
  npm run factory:launch-pack -- --site-key=minnesota --domain=minnesotaasphaltpaving.com --label="Minnesota Asphalt Paving" --brand="Minnesota Asphalt Paving" --city="Minneapolis" --region="Minnesota" --dry-run=true

- Build keyword blogs from a site profile:
  npm run content:blog-writer -- --site-key=minnesota --dry-run=true

- Price premium add-on stack:
  npm run ops:pricing -- --addons=gbp-automation|keyword-blog-engine|backlink-authority-engine

## KPI Targets To Beat Competitors

1. Time to first launch: under 30 minutes
2. Time to first ranking movement: under 21 days
3. Time to first qualified lead: under 14 days
4. Website uptime: 99.95% or higher
5. Core Web Vitals pass rate: 90%+ URLs
