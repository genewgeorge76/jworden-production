import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '@/lib/AuthContext';

/**
 * The tab bar over every signed-in page.
 *
 * Two rules govern what appears here:
 *
 *   1. Every entry points at a route that exists in App.jsx. A tab that leads
 *      to a 404 is worse than a missing tab.
 *   2. Tier assignments come from the published price list in
 *      pages/MarketingHome.jsx — the page a customer read before paying — and
 *      from nowhere else. Where that list does not say which tier a tool
 *      belongs to, the tool is marked OPERATOR rather than assigned a tier
 *      here. Inventing an assignment in a nav bar would either give away
 *      something that was sold, or withhold something that was.
 *
 * The published list, verbatim:
 *   LITE $199 — Core Cockpit Dashboard, Manual Estimate Builder,
 *               Basic CRM & Leads
 *   PRO  $499 — everything in Lite, plus Local SEO Website Factory,
 *               AI Blog Generator, Advanced Telemetry
 *   MAX  $999 — everything in Pro, plus Drone AI Scanner,
 *               Predictive Weather Risk, Supply Chain Pricing API,
 *               Dedicated Account Rep
 */

// `tier` is the minimum subscription that includes the tool, quoting the
// price-list line it comes from. `owner: true` means the operations side of
// the platform, which is not part of any subscription.
const TABS = [
  // ── Everyday ─────────────────────────────────────────────────────────────
  { to: '/dashboard', label: 'Dashboard', group: 'Work', tier: 'lite', source: 'Core Cockpit Dashboard' },
  { to: '/estimate', label: 'Estimates', group: 'Work', tier: 'lite', source: 'Manual Estimate Builder' },
  { to: '/customers', label: 'Customers', group: 'Work', tier: 'lite', source: 'Basic CRM & Leads' },
  { to: '/leads', label: 'Leads', group: 'Work', tier: 'lite', source: 'Basic CRM & Leads' },
  { to: '/portal', label: 'Client Portal', group: 'Work', tier: 'lite', source: 'Basic CRM & Leads' },

  // Jarvis is not a line on the price list. The backend grants any valid
  // bearer token the staff_operator role (services/jarvis_access.py), so every
  // signed-in account already has it — which makes withholding the tab here a
  // fiction rather than a gate.
  { to: '/jarvis', label: 'Jarvis', group: 'Work', tier: 'lite', source: 'staff_operator, granted to any signed-in account' },

  // ── Max-tier tools ───────────────────────────────────────────────────────
  { to: '/scanner', label: 'Drone Scanner', group: 'Field', tier: 'max', source: 'Drone AI Scanner' },
  { to: '/storm-tracker', label: 'Weather Risk', group: 'Field', tier: 'max', source: 'Predictive Weather Risk' },

  // ── Operations ───────────────────────────────────────────────────────────
  // Everything below is the operator's side of the platform. None of it is
  // named on the price list, so none of it is assigned a tier.
  { to: '/command-center', label: 'Command Center', group: 'Operations', owner: true },
  { to: '/analytics', label: 'Analytics', group: 'Operations', owner: true },
  { to: '/revenue', label: 'Revenue', group: 'Operations', owner: true },
  { to: '/estimators', label: 'AI Estimators', group: 'Operations', owner: true },
  { to: '/takeoff', label: 'Takeoff', group: 'Operations', owner: true },
  { to: '/satellite-map', label: 'Satellite', group: 'Operations', owner: true },
  { to: '/bid-hunter', label: 'Bid Hunter', group: 'Operations', owner: true },
  { to: '/lien-calendar', label: 'Lien Calendar', group: 'Operations', owner: true },
  { to: '/plans-inbox', label: 'Plans Inbox', group: 'Operations', owner: true },
  { to: '/voice-calls', label: 'Voice Calls', group: 'Operations', owner: true },
  { to: '/autonomy', label: 'Autonomy', group: 'Operations', owner: true },

  // ── Crew ─────────────────────────────────────────────────────────────────
  { to: '/crew-eta', label: 'Crew ETA', group: 'Crew', owner: true },
  { to: '/crew-reporting', label: 'Crew Reports', group: 'Crew', owner: true },
  { to: '/crew-mode', label: 'Field App', group: 'Crew', owner: true },

  // ── Admin ────────────────────────────────────────────────────────────────
  { to: '/super-admin', label: 'Tenants', group: 'Admin', owner: true },
  { to: '/super-admin/apis', label: 'API Health', group: 'Admin', owner: true },
  { to: '/admin/documents', label: 'Documents', group: 'Admin', owner: true },
  { to: '/admin/slack', label: 'Slack', group: 'Admin', owner: true },
];

const GROUP_ORDER = ['Work', 'Field', 'Operations', 'Crew', 'Admin'];

export default function ConsoleNav() {
  const { isOwner, hasTier, tier, identity, logout } = useAuth();
  const { pathname } = useLocation();

  if (!identity) return null;

  const visible = TABS.filter((tab) => {
    if (tab.owner) return isOwner;
    return hasTier(tab.tier);
  });

  const groups = GROUP_ORDER
    .map((name) => ({ name, tabs: visible.filter((t) => t.group === name) }))
    .filter((g) => g.tabs.length > 0);

  return (
    <nav
      aria-label="Console"
      className="sticky top-0 z-40 border-b border-white/10 bg-[#070b14]/95 backdrop-blur"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-2 border-b border-white/5">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500/80">
            {isOwner ? 'Operations' : `${String(tier || 'no plan').toUpperCase()} plan`}
          </p>
          <p className="truncate text-sm text-slate-300">
            {identity.company_name || identity.email}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:text-amber-500"
        >
          Sign out
        </button>
      </div>

      {/* Horizontal scroll rather than a wrap: on a phone in a truck this stays
          one predictable row instead of reflowing to four. */}
      <div className="overflow-x-auto">
        <ul className="flex items-stretch gap-1 px-2 py-1 w-max">
          {groups.map((group, groupIndex) => (
            <React.Fragment key={group.name}>
              {groupIndex > 0 && (
                <li aria-hidden="true" className="mx-1 my-2 w-px shrink-0 bg-white/10" />
              )}
              {group.tabs.map((tab) => {
                const active = pathname === tab.to || pathname.startsWith(`${tab.to}/`);
                return (
                  <li key={tab.to} className="shrink-0">
                    <Link
                      to={tab.to}
                      aria-current={active ? 'page' : undefined}
                      className={
                        active
                          ? 'block whitespace-nowrap rounded px-3 py-2 text-xs font-semibold uppercase tracking-widest text-[#070b14] bg-amber-500'
                          : 'block whitespace-nowrap rounded px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-amber-400 hover:bg-white/5'
                      }
                    >
                      {tab.label}
                    </Link>
                  </li>
                );
              })}
            </React.Fragment>
          ))}
        </ul>
      </div>
    </nav>
  );
}

// Exported for the test that checks every destination is a declared route.
export { TABS };
