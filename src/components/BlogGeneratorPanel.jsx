import React, { useState } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PenTool, Lock, ExternalLink, Copy, CheckCheck } from 'lucide-react';

export default function BlogGeneratorPanel() {
  const tenant = useTenant();
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const isPro = tenant?.subscription_tier === 'pro' ||
    !!sessionStorage.getItem('OWNER_TOKEN') ||
    !!localStorage.getItem('owner_token');
  const hostname = tenant?.hostname || tenant?.domain || window.location.hostname;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!keyword) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const token = sessionStorage.getItem('OWNER_TOKEN') || localStorage.getItem('owner_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://jworden-api.fly.dev';
      const res = await fetch(`${baseUrl}/api/v1/factory/blog/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          hostname,
          topic: keyword,
          keywords: keyword.split(' ').filter(Boolean),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      setKeyword('');
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
            <Lock className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-white tracking-tight">Blog Generator</h3>
          <p className="mb-6 max-w-md text-slate-400">
            Upgrade to Pro to generate unlimited high-converting SEO blogs.
          </p>
          <Button
            variant="default"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0"
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <PenTool className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Blog Generator</h3>
          <p className="text-sm text-slate-400">Instantly generate programmatic SEO content for <span className="text-emerald-400">{hostname}</span></p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="flex gap-3">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="e.g. driveway paving richmond va"
          className="bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500"
        />
        <Button
          type="submit"
          disabled={loading || !keyword}
          className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
        >
          {loading ? 'Generating...' : 'Generate Blog'}
        </Button>
      </form>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-5 rounded-lg border border-emerald-500/20 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white">{result.title || 'Blog Generated'}</p>
              {result.slug && (
                <p className="text-xs text-slate-500 font-mono mt-0.5">/{result.slug}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={handleCopy} className="text-slate-400 hover:text-white">
                {copied ? <CheckCheck className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </Button>
              {result.slug && (
                <Button size="sm" variant="ghost" asChild className="text-slate-400 hover:text-white">
                  <a href={`/blog/${result.slug}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 line-clamp-3">
            {result.excerpt || result.body?.replace(/<[^>]+>/g, '').slice(0, 200) || 'Blog saved successfully.'}
          </p>
          <p className="mt-2 text-xs text-emerald-500 font-medium">✓ Blog saved and published to your site</p>
        </div>
      )}
    </div>
  );
}

