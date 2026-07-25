import React, { useState } from 'react';
import { Zap, CheckCircle, ArrowRight } from 'lucide-react';

export default function SaaSPlatformPortal() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    subdomainSlug: '',
    tier: 'pro'
  });
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await fetch('https://jworden-api.fly.dev/api/v1/factory/saas/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: formData.companyName,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          subdomain_slug: formData.subdomainSlug,
          subscription_tier: formData.tier
        })
      });
      const data = await resp.json();
      setSuccessData(data);
    } catch (err) {
      console.error(err);
      alert('SaaS Provisioning error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" />
            THE WORDEN STANDARD SAAS PLATFORM
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
            White-Label AI Paving OS for Contractors
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Launch your own AI-powered paving platform in 10 seconds. Automated 51-state bid hunting, instant satellite estimates, and 24/7 AI dispatching.
          </p>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 hover:border-slate-700 transition">
            <h3 className="text-2xl font-bold mb-2">Starter Tier</h3>
            <div className="text-4xl font-extrabold text-amber-400 mb-6">$299<span className="text-lg font-normal text-slate-400">/mo</span></div>
            <ul className="space-y-3 text-slate-300 mb-8 text-sm">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Single City Paving Website</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Instant Driveway Calculator</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> 10 Commercial Bids / Month</li>
            </ul>
          </div>

          <div className="bg-gradient-to-b from-amber-950/40 to-slate-900 border-2 border-amber-500/50 rounded-2xl p-8 relative shadow-2xl">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-full text-xs">MOST POPULAR</span>
            <h3 className="text-2xl font-bold mb-2">Pro Operator</h3>
            <div className="text-4xl font-extrabold text-amber-400 mb-6">$599<span className="text-lg font-normal text-slate-400">/mo</span></div>
            <ul className="space-y-3 text-slate-300 mb-8 text-sm">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> 10 Statewide City Silos</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> AI Driveway Surface Scanner</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Unlimited PlanHub & SAM Bids</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> 24/7 AI Voice Dispatcher</li>
            </ul>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 hover:border-slate-700 transition">
            <h3 className="text-2xl font-bold mb-2">Enterprise Empire</h3>
            <div className="text-4xl font-extrabold text-amber-400 mb-6">$1,299<span className="text-lg font-normal text-slate-400">/mo</span></div>
            <ul className="space-y-3 text-slate-300 mb-8 text-sm">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> 51-State Multi-Domain Network</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> White-Label Client Portal</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Custom Domain Mapping</li>
            </ul>
          </div>

        </div>

        {/* Provisioning Form */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 md:p-12 max-w-2xl mx-auto shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Provision Your Paving SaaS Tenant</h2>
          
          {successData ? (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-emerald-300 mb-2">Tenant Provisioned Successfully!</h3>
              <p className="text-slate-300 text-sm mb-4">Your white-label SaaS instance is ready:</p>
              <div className="bg-slate-950 p-4 rounded-xl text-amber-400 font-mono text-sm break-all">
                Tenant ID: {successData.tenant_id}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Company Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                  placeholder="e.g. Smith Asphalt Paving LLC"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Contact Email</label>
                <input 
                  type="email" 
                  required 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                  placeholder="owner@smithpaving.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Subdomain Slug</label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3">
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-transparent p-3 text-slate-100 outline-none"
                    placeholder="smithpaving"
                    value={formData.subdomainSlug}
                    onChange={(e) => setFormData({...formData, subdomainSlug: e.target.value})}
                  />
                  <span className="text-slate-500 text-sm font-mono">.thewordenstandard.com</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Subscription Tier</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                  value={formData.tier}
                  onChange={(e) => setFormData({...formData, tier: e.target.value})}
                >
                  <option value="starter">Starter ($299/mo)</option>
                  <option value="pro">Pro Operator ($599/mo)</option>
                  <option value="enterprise">Enterprise ($1,299/mo)</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold py-4 rounded-xl hover:brightness-110 transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 mt-6"
              >
                {loading ? 'Provisioning SaaS Instance...' : 'Launch SaaS Platform Now'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
