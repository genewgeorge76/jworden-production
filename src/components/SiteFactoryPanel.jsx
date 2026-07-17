import React, { useState } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Lock, CheckCircle } from 'lucide-react';

const ROUTE_MODES = [
  { value: 'market-landing', label: 'Market Landing (local SEO site)' },
  { value: 'full-site', label: 'Full Site (complete multi-page)' },
];

export default function SiteFactoryPanel() {
  const tenant = useTenant();
  const [hostname, setHostname] = useState('');
  const [siteTitle, setSiteTitle] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [routeMode, setRouteMode] = useState('market-landing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [launched, setLaunched] = useState(null);

  const isPro = tenant?.subscription_tier === 'pro' ||
    !!sessionStorage.getItem('OWNER_TOKEN') ||
    !!localStorage.getItem('owner_token');

  const handleLaunch = async (e) => {
    e.preventDefault();
    if (!hostname) return;
    setLoading(true);
    setError('');
    setLaunched(null);

    try {
      const token = sessionStorage.getItem('OWNER_TOKEN') || localStorage.getItem('owner_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://jworden-api.fly.dev';
      const res = await fetch(`${baseUrl}/api/v1/factory/sites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          hostname,
          site_title: siteTitle || `${city ? city + ' ' : ''}Paving`,
          route_mode: routeMode,
          city_target: city || null,
          state_target: state || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setLaunched(data);
      setHostname('');
      setSiteTitle('');
      setCity('');
      setState('');
    } catch (err) {
      setError(err.message || 'Failed to launch site. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isPro) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/80 shadow-inner">
            <Lock className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-white tracking-tight">Site Factory</h3>
          <p className="mb-6 max-w-md text-slate-400">
            Upgrade to Pro to launch unlimited local SEO market sites.
          </p>
          <Button
            variant="default"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0"
            onClick={() => window.open('mailto:support@thewordenstandard.com?subject=Upgrade to Pro', '_blank')}
          >
            Upgrade to Pro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0a0f1e] p-6 shadow-lg">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
          <Globe className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Site Factory</h3>
          <p className="text-sm text-slate-400">Launch a new market-specific site instantly</p>
        </div>
      </div>

      <form onSubmit={handleLaunch} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            placeholder="Domain (e.g. richmondpaving.com)"
            className="bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500"
            required
          />
          <Input
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
            placeholder="Site Title (e.g. Richmond Paving Pros)"
            className="bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500"
          />
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City Target (e.g. Richmond)"
            className="bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500"
          />
          <Input
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State (e.g. VA)"
            maxLength={2}
            className="bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500"
          />
        </div>
        <select
          value={routeMode}
          onChange={(e) => setRouteMode(e.target.value)}
          className="w-full rounded-md border border-slate-800 bg-slate-900/50 text-white text-sm px-3 py-2"
        >
          {ROUTE_MODES.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <Button
          type="submit"
          disabled={loading || !hostname}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? 'Launching...' : '🚀 Launch Site'}
        </Button>
      </form>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {launched && (
        <div className="mt-5 rounded-lg border border-blue-500/20 bg-slate-900/60 p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">
              {launched.hostname || launched.domain || hostname} launched!
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Route mode: <span className="text-blue-300">{launched.route_mode || routeMode}</span>
            </p>
            {launched.id && (
              <p className="text-xs text-slate-500 font-mono mt-0.5">Site ID: {launched.id}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
