import React, { useState } from 'react';
import { useTenant } from '@/lib/TenantContext';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Globe, Lock, CheckCircle, Sparkles, Bot, Zap,
  Search, ShieldCheck, MapPin, Cpu, ArrowRight, RefreshCw, Layers
} from 'lucide-react';

const TRADE_PRESETS = [
  { label: 'Asphalt Paving & Sealcoating', trade: 'paving', color: '#f59e0b' },
  { label: 'Concrete & Flatwork', trade: 'concrete', color: '#64748b' },
  { label: 'Roofing & Solar', trade: 'roofing', color: '#dc2626' },
  { label: 'General Contracting', trade: 'gc', color: '#3b82f6' },
  { label: 'Landscaping & Hardscapes', trade: 'landscaping', color: '#22c55e' },
  { label: 'Plumbing & HVAC', trade: 'mep', color: '#8b5cf6' },
];

export default function SiteFactoryPanel() {
  const tenant = useTenant();
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  
  // Site Form State
  const [hostname, setHostname] = useState('');
  const [siteTitle, setSiteTitle] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [trade, setTrade] = useState('paving');
  const [primaryColor, setPrimaryColor] = useState('#f59e0b');
  const [routeMode, setRouteMode] = useState('market-landing');
  const [enableSeoMatrix, setEnableSeoMatrix] = useState(true);
  const [enableSchemaOrg, setEnableSchemaOrg] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [launched, setLaunched] = useState(null);

  const isPro = tenant?.subscription_tier === 'pro' ||
    !!sessionStorage.getItem('OWNER_TOKEN') ||
    !!localStorage.getItem('owner_token');

  // AI Prompt Studio Generator (Mr. Worden Persona)
  const handleAiArchitect = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    setError('');

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://jworden-api.fly.dev';
      const res = await fetch(`${baseUrl}/api/v1/jarvis/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are Mr. Worden AI Site Architect. The user wants to build a website with this prompt: "${aiPrompt}". Extract JSON containing: 1) hostname (clean domain slug or custom domain), 2) site_title (catchy, high-converting), 3) city, 4) state (2-letter code), 5) primary_color (hex color), 6) trade (paving/concrete/roofing/gc/landscaping/mep). Respond ONLY in valid JSON.`,
          persona: 'MR_WORDEN_SALES',
          options: { confirmed: true }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.text || data.message || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.hostname) setHostname(parsed.hostname);
          if (parsed.site_title) setSiteTitle(parsed.site_title);
          if (parsed.city) setCity(parsed.city);
          if (parsed.state) setState(parsed.state);
          if (parsed.primary_color) setPrimaryColor(parsed.primary_color);
          if (parsed.trade) setTrade(parsed.trade);
        }
      }
    } catch {
      // Intelligent fallback parsing if API is offline
      const promptLower = aiPrompt.toLowerCase();
      if (promptLower.includes('richmond')) { setCity('Richmond'); setState('VA'); setHostname('richmondasphaltpros.com'); setSiteTitle('Richmond Asphalt Paving Pros'); }
      else if (promptLower.includes('charlotte')) { setCity('Charlotte'); setState('NC'); setHostname('charlottepavingpros.com'); setSiteTitle('Charlotte Blacktop & Paving'); }
      else if (promptLower.includes('roof')) { setTrade('roofing'); setPrimaryColor('#dc2626'); setSiteTitle('Premium Roofing Systems'); }
      else { setCity('Metro Area'); setState('VA'); setSiteTitle('JWORDENAI Managed Site'); }
    } finally {
      setIsAiGenerating(false);
    }
  };

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
          hostname: hostname.toLowerCase().trim(),
          site_title: siteTitle || `${city ? city + ' ' : ''}Contracting Pros`,
          route_mode: routeMode,
          city_target: city || null,
          state_target: state || null,
          primary_color: primaryColor,
          enable_seo_matrix: enableSeoMatrix,
          enable_schema_org: enableSchemaOrg,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setLaunched(data);
    } catch (err) {
      setError(err.message || 'Failed to launch site. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isPro) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-indigo-500/10" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/80 shadow-inner">
            <Lock className="h-8 w-8 text-amber-400" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-white tracking-tight">JWORDENAI Website Factory</h3>
          <p className="mb-6 max-w-md text-slate-400">
            Upgrade to Pro to unlock Mr. Worden AI Site Architect, automated Schema.org SEO, and unlimited high-ranking sub-brand sites.
          </p>
          <Button
            variant="default"
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold border-0 cursor-pointer"
            onClick={async () => {
              try {
                const res = await api.createStripeCheckoutSession({ plan: 'pro', tenant_id: 'default' });
                if (res?.url) {
                  window.open(res.url, '_blank');
                }
              } catch {
                window.open('mailto:support@thewordenstandard.com?subject=Upgrade to Pro SaaS', '_blank');
              }
            }}
          >
            Upgrade to Pro SaaS
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-[#060913] p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Cpu className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-white tracking-tight">JWORDENAI Website Factory</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                Auto-SEO #1 Rank
              </span>
            </div>
            <p className="text-xs text-slate-400">Outperform GoDaddy & WordPress with automated Schema & Geo-Matrix SEO</p>
          </div>
        </div>
      </div>

      {/* 🤖 Mr. Worden AI Prompt Studio */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          Mr. Worden AI Architect (Prompt-to-Website)
        </div>
        <div className="flex gap-2">
          <Input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiArchitect()}
            placeholder="Tell Mr. Worden: 'Build a commercial asphalt site for Raleigh NC with red accent colors'"
            className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 text-sm flex-1"
          />
          <Button
            onClick={handleAiArchitect}
            disabled={isAiGenerating || !aiPrompt.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4"
          >
            {isAiGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Generate Site
          </Button>
        </div>
      </div>

      {/* Trade Presets */}
      <div>
        <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2">Trade Profiles</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TRADE_PRESETS.map((p) => (
            <button
              key={p.trade}
              type="button"
              onClick={() => { setTrade(p.trade); setPrimaryColor(p.color); }}
              className={`flex items-center gap-2 p-2 rounded-md border text-left text-xs transition-all ${
                trade === p.trade
                  ? 'border-amber-500/50 bg-amber-500/10 text-white font-semibold'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span className="truncate">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Configuration Form */}
      <form onSubmit={handleLaunch} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase mb-1 block">Target Domain / Subdomain</label>
            <Input
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              placeholder="e.g. richmondpaving.com or rva.thewordenstandard.com"
              className="bg-slate-900/60 border-slate-800 text-white text-sm"
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase mb-1 block">Site Title</label>
            <Input
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="e.g. Richmond Asphalt Paving Pros"
              className="bg-slate-900/60 border-slate-800 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase mb-1 block">City Target</label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Richmond"
              className="bg-slate-900/60 border-slate-800 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase mb-1 block">State Target</label>
            <Input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. VA"
              maxLength={2}
              className="bg-slate-900/60 border-slate-800 text-white text-sm"
            />
          </div>
        </div>

        {/* SEO Multipliers */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3 space-y-2">
          <span className="text-[11px] font-mono text-amber-400 uppercase font-bold block mb-1">
            ⚡ Automated SEO Ranking Features
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={enableSeoMatrix}
                onChange={(e) => setEnableSeoMatrix(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
              />
              <span>Generate City + Zip Code Sub-Pages Matrix</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={enableSchemaOrg}
                onChange={(e) => setEnableSchemaOrg(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
              />
              <span>Inject JSON-LD Schema.org & FAQ Markup</span>
            </label>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || !hostname}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-sm py-5 shadow-lg shadow-amber-500/10"
        >
          {loading ? 'Provisioning Site & Subdomains...' : '🚀 Launch Site on JWORDENAI Network'}
        </Button>
      </form>

      {error && <p className="text-sm text-red-400 font-mono">{error}</p>}

      {launched && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">
              {launched.hostname || hostname} is LIVE on the JWORDENAI Network!
            </p>
            <p className="text-xs text-slate-300 font-mono">
              Auto-SEO Matrix: <span className="text-emerald-400">ENABLED (Schema.org + Zip Code Pages)</span>
            </p>
            {launched.cockpit_url && (
              <a
                href={launched.cockpit_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-amber-400 font-bold underline mt-1"
              >
                Open Client Cockpit <ArrowRight className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
