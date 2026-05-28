# Domains Inventory

This document serves as a reference for all domains owned by the organization. 

**IMPORTANT SECURITY/OPERATIONS RULE:** 
None of these domains are to be added to active infrastructure, CORS lists, or deployment configurations without explicit user approval. They are listed here strictly for inventory and documentation purposes.

## Registered Domains (as of May 2026)

1. `thewordenstandard.com`
2. `savannahpaving.store`
3. `savannahpaving.shop`
4. `savannahpaving.net`
5. `savannahpaving.life`
6. `savannahpaving.info`
7. `savannahasphaltpaving.com`
8. `richmondasphaltpros.com`
9. `richmondasphaltpaving.net`
10. `richmondasphaltpaving.com`
11. `michiganasphaltpavingpros.xyz`
12. `michiganasphaltpavingpros.store`
13. `michiganasphaltpavingpros.shop`
14. `michiganasphaltpavingpros.net`
15. `michiganasphaltpavingpros.info`
16. `jwordenuniversity.com`
17. `carolinablacktop.com`
18. `asphaltpavingkansascity.com`
19. `carolinaasphaltpavingpros.com`

## GoDaddy Status Snapshot (Owner-Provided)

Snapshot date: May 2026
Registrar: GoDaddy

Assumption: renewal dates below are mapped in the same order as the domain list above.

| Domain | Renewal Date | Auto-Renew | Domain Lock | Status | Suggested Role |
|---|---|---|---|---|---|
| `thewordenstandard.com` | Apr 14, 2027 | On | On | Active | Internal operations hub (command center, onboarding, advisory) |
| `savannahpaving.store` | Apr 14, 2027 | On | On | Active | Savannah market alias / future city funnel |
| `savannahpaving.shop` | Apr 15, 2027 | On | On | Active | Savannah market alias / future city funnel |
| `savannahpaving.net` | Apr 14, 2027 | On | On | Active | Savannah market alias / future city funnel |
| `savannahpaving.life` | Apr 14, 2027 | On | On | Active | Savannah market alias / future city funnel |
| `savannahpaving.info` | Apr 14, 2027 | On | On | Active | Savannah market alias / future city funnel |
| `savannahasphaltpaving.com` | Apr 14, 2027 | On | On | Active | Savannah primary candidate domain |
| `richmondasphaltpros.com` | Apr 14, 2027 | On | On | Active | Richmond market alias / future city funnel |
| `richmondasphaltpaving.net` | Apr 14, 2027 | On | On | Active | Richmond market alias / future city funnel |
| `richmondasphaltpaving.com` | Nov 4, 2027 | On | On | Active | Richmond primary candidate domain |
| `michiganasphaltpavingpros.xyz` | Apr 16, 2027 | On | On | Active | Michigan market alias / future city funnel |
| `michiganasphaltpavingpros.store` | Apr 15, 2027 | On | On | Active | Michigan market alias / future city funnel |
| `michiganasphaltpavingpros.shop` | Apr 16, 2027 | On | On | Active | Michigan market alias / future city funnel |
| `michiganasphaltpavingpros.net` | Apr 15, 2027 | On | On | Active | Michigan market alias / future city funnel |
| `michiganasphaltpavingpros.info` | Apr 15, 2027 | On | On | Active | Michigan market alias / future city funnel |
| `jwordenuniversity.com` | Apr 15, 2027 | On | On | Active | Training academy (videos, certifications, onboarding LMS) |
| `carolinablacktop.com` | Apr 14, 2027 | On | On | Active | Carolinas market domain |
| `asphaltpavingkansascity.com` | Apr 14, 2027 | On | On | Active | Kansas City market domain |

## Registrar.eu / Webador Snapshot (Owner-Provided)

Snapshot date: May 2026
Reminder source: Webador annual ICANN Whois data reminder

### Domain: `carolinaasphaltpavingpros.com`

- Registrar: Registrar.eu
- Original creation date: 2025-04-09T03:34:46Z
- Expiration date: 2027-04-09T03:34:46Z
- Registrant contact: Gene George
- Address: O'Malleys ct 707, Clover, SC 29710, US
- Phone: +1 843 6108935
- Email: genewgeorge@gmail.com
- Nameservers:
	- ns1.openprovider.nl
	- ns2.openprovider.be
	- ns3.openprovider.eu
- Management link: https://www.webador.com/v2/redirect-website/subscription/domains

Pending additions: 2 more registrar reminder records to be added later.

## Recommended Domain Architecture

1. Internal/Operator layer:
	- `thewordenstandard.com` for operational systems, employee onboarding, and protected internal tooling.
2. Training/Education layer:
	- `jwordenuniversity.com` for training videos, SOPs, role-based learning, and certification progress.
3. Market/SEO layer:
	- City and state domains used as either:
	  - 301 redirects into canonical market pages, or
	  - isolated market microsites when there is enough content and operational capacity.

## Candidate Domains (Not Yet Confirmed Purchased)

1. `minnesotaasphaltpaving.com` - strong primary market domain candidate for Minnesota launch.
2. `minnesotasealcoating.com` - optional support domain; not required if the primary Minnesota domain has a robust sealcoating service page.

## Acquisition Guidance

1. Prefer one primary market domain per launch (example: `minnesotaasphaltpaving.com`) to concentrate authority.
2. Treat service-specific domains (example: sealcoating-only) as secondary and only add if they support a dedicated campaign with unique content and conversion goals.
3. Do not split authority across multiple thin domains during the first launch wave.

## Guardrail

Per this repository policy, domains remain inventory-only until explicit approval for infrastructure use. This includes CORS, deploy targets, DNS cutover, redirects, and sitemap inclusion.
