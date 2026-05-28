/**
 * Central feature-flag registry.
 *
 * Every experimental, AI, or in-progress feature is gated through this file.
 * Default is always OFF in production until explicitly enabled via Netlify env.
 *
 * Conventions:
 *   - All flags are read from import.meta.env.VITE_FEATURE_<NAME>
 *   - Truthy values: "true" (string). Anything else => false.
 *   - Never default to true here — production env must opt in explicitly.
 *
 * To enable a flag in dev:
 *   echo "VITE_FEATURE_DISPATCH=true" >> .env.local
 *
 * To enable in production:
 *   Netlify → Site settings → Environment variables → add VITE_FEATURE_DISPATCH=true
 *
 * To kill-switch in seconds:
 *   Flip the env var to "false" → trigger redeploy → feature is gone.
 */

const flag = (name) =>
  String(import.meta.env?.[`VITE_FEATURE_${name}`] ?? '').toLowerCase() === 'true';

export const FEATURES = {
  /** Smart Dispatch Board (crew swim lanes, drag-drop, AI route optimizer). */
  DISPATCH: flag('DISPATCH'),

  /** Live GPS map view of crews + jobs. */
  CREW_MAP: flag('CREW_MAP'),

  /** Jarvis nightly auto-planner for tomorrow's schedule. */
  JARVIS_PLANNER: flag('JARVIS_PLANNER'),

  /** Worden Pavement Index (proprietary aggregated pricing data). */
  WORDEN_INDEX: flag('WORDEN_INDEX'),

  /** Multi-tenant SaaS UI (org switcher, billing, invites). */
  MULTI_TENANT: flag('MULTI_TENANT'),
};

/** Convenience: returns true if ANY AI feature is enabled (used to show beta banner). */
export const anyExperimentalEnabled = () =>
  Object.values(FEATURES).some(Boolean);

export default FEATURES;
