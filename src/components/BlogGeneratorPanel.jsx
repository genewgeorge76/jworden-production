import React, { useState } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PenTool, Lock } from 'lucide-react';

export default function BlogGeneratorPanel() {
  const tenant = useTenant();
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isPro = tenant?.subscription_tier === 'pro';

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!keyword) return;
    setLoading(true);
    setMessage('');
    
    // Mock API call to generate blog
    setTimeout(() => {
      setMessage(`Successfully generated SEO blog for "${keyword}"!`);
      setKeyword('');
      setLoading(false);
    }, 1500);
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
          <Button variant="default" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
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
          <p className="text-sm text-slate-400">Instantly generate programmatic SEO content</p>
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
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {loading ? 'Generating...' : 'Generate Blog'}
        </Button>
      </form>
      {message && <p className="mt-4 text-sm text-emerald-400 font-medium">{message}</p>}
    </div>
  );
}
