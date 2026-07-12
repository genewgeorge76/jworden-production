import React, { useState } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/api/client';
import { Globe, Lock } from 'lucide-react';

export default function SiteFactoryPanel() {
  const tenant = useTenant();
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isPro = tenant?.subscription_tier === 'pro';

  const handleLaunch = async (e) => {
    e.preventDefault();
    if (!domain) return;
    setLoading(true);
    setMessage('');
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/v1/factory/sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });
      if (!response.ok) throw new Error('Launch failed');
      const data = await response.json();
      setMessage(`Successfully launched site for ${domain}!`);
      setDomain('');
    } catch (err) {
      setMessage('Failed to launch site. Please try again.');
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
          <Button variant="default" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
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
          <p className="text-sm text-slate-400">Launch new market-specific sites instantly</p>
        </div>
      </div>
      
      <form onSubmit={handleLaunch} className="flex gap-3">
        <Input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="e.g. richmondpaving.com"
          className="bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500"
        />
        <Button 
          type="submit" 
          disabled={loading || !domain}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? 'Launching...' : 'Launch Site'}
        </Button>
      </form>
      {message && <p className="mt-4 text-sm text-blue-400 font-medium">{message}</p>}
    </div>
  );
}
