import React, { useState } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  PenTool, Lock, ExternalLink, Copy, CheckCheck, Sparkles, ShieldCheck, RefreshCw
} from 'lucide-react';

const BLOG_PRESETS = [
  { label: 'Driveway Resurfacing vs Full Replacement', category: 'residential' },
  { label: 'Commercial Parking Lot Maintenance Schedule', category: 'commercial' },
  { label: 'Winter Freeze-Thaw Pavement Care Guide', category: 'maintenance' },
  { label: 'Understanding Local Asphalt & Concrete Permits', category: 'legal' },
];

export default function BlogGeneratorPanel() {
  const tenant = useTenant();
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [targetCity, setTargetCity] = useState('');
  const [wordCount, setWordCount] = useState('1500');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const isPro = tenant?.subscription_tier === 'pro' ||
    !!sessionStorage.getItem('OWNER_TOKEN') ||
    !!localStorage.getItem('owner_token');
  const hostname = tenant?.hostname || tenant?.domain || window.location.hostname;

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!topic) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const token = sessionStorage.getItem('OWNER_TOKEN') || localStorage.getItem('owner_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://jworden-api.fly.dev';
      
      const kwList = keywords ? keywords.split(',').map(k => k.trim()) : topic.split(' ');

      const res = await fetch(`${baseUrl}/api/v1/factory/blog/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          hostname,
          topic: targetCity ? `${topic} in ${targetCity}` : topic,
          keywords: kwList,
          word_count: parseInt(wordCount, 10),
          inject_local_data: true,
          persona: 'MR_WORDEN_SALES'
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      setTopic('');
      setKeywords('');
    } catch (err) {
      setError(err.message || 'Failed to generate blog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.body || result.content || JSON.stringify(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isPro) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/80 shadow-inner">
            <Lock className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-white tracking-tight">JWORDENAI Blog & Authority Engine</h3>
          <p className="mb-6 max-w-md text-slate-400">
            Upgrade to Pro to generate unlimited high-converting, long-form SEO articles with automated Google Indexing.
          </p>
          <Button
            variant="default"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold border-0"
            onClick={() => window.open('mailto:support@thewordenstandard.com?subject=Upgrade to Pro SaaS', '_blank')}
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <PenTool className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-white tracking-tight">JWORDENAI Authority & Blog Engine</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                Mr. Worden AI Writer
              </span>
            </div>
            <p className="text-xs text-slate-400">Generates 1,500+ word technical articles for <span className="text-emerald-400 font-bold">{hostname}</span></p>
          </div>
        </div>
      </div>

      {/* Preset Topics */}
      <div>
        <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2">High-Converting Topic Starters</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BLOG_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setTopic(p.label)}
              className="text-left p-2.5 rounded-md border border-slate-800 bg-slate-900/40 text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-xs flex items-center justify-between group"
            >
              <span className="truncate">{p.label}</span>
              <Sparkles className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-[11px] font-mono text-slate-400 uppercase mb-1 block">Article Topic / Target Headline</label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 2026 Commercial Asphalt Sealcoating Costs & Longevity"
              className="bg-slate-900/60 border-slate-800 text-white text-sm"
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase mb-1 block">Target City / Metro</label>
            <Input
              value={targetCity}
              onChange={(e) => setTargetCity(e.target.value)}
              placeholder="e.g. Richmond VA"
              className="bg-slate-900/60 border-slate-800 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase mb-1 block">Keywords (comma-separated)</label>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. asphalt repair, driveway paving, cost per sqft"
              className="bg-slate-900/60 border-slate-800 text-white text-sm"
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Includes <strong>Local Soil/Climate Data</strong> & <strong>Automatic IndexNow Google Submission</strong></span>
          </div>
          <select
            value={wordCount}
            onChange={(e) => setWordCount(e.target.value)}
            className="rounded border border-slate-800 bg-slate-950 text-white px-2 py-1 text-xs font-mono"
          >
            <option value="1000">1,000 words</option>
            <option value="1500">1,500 words</option>
            <option value="2500">2,500 words (Ultimate Guide)</option>
          </select>
        </div>

        <Button
          type="submit"
          disabled={loading || !topic}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-extrabold text-sm py-5 shadow-lg shadow-emerald-500/10"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" /> Writing Article & Formatting Schema...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <PenTool className="h-4 w-4" /> Generate & Publish SEO Article
            </span>
          )}
        </Button>
      </form>

      {error && <p className="text-sm text-red-400 font-mono">{error}</p>}

      {result && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">{result.title || 'Article Generated'}</p>
              {result.slug && (
                <p className="text-xs text-slate-400 font-mono mt-0.5">/{result.slug}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={handleCopy} className="text-slate-300 hover:text-white">
                {copied ? <CheckCheck className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </Button>
              {result.slug && (
                <Button size="sm" variant="ghost" asChild className="text-slate-300 hover:text-white">
                  <a href={`/blog/${result.slug}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-300 line-clamp-3">
            {result.excerpt || result.body?.replace(/<[^>]+>/g, '').slice(0, 250) || 'Article published successfully.'}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono font-bold pt-1 border-t border-emerald-500/20">
            <span>✓ Published to {hostname}</span>
            <span>·</span>
            <span>✓ IndexNow Pinged to Google & Bing</span>
          </div>
        </div>
      )}
    </div>
  );
}

