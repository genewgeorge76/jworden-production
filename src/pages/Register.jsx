import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, MapPin, Building2, User, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { registerTenant, request } from '@/api/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
  "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const INDUSTRIES = [
  "Asphalt Paving",
  "Roofing",
  "Concrete",
  "Civil Construction (GCS)",
  "Brick & Masonry",
  "Dirt Work & Excavation",
  "Infrastructure & DOT",
  "Utility Locating & Scanning",
  "Real Estate Development",
  "Property Insurance & Adjusting",
  "Drone Operations & Aerial Scanning",
  "Commercial Property Management",
  "General / Specialty Contractor"
];

export default function Register() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    email: '',
    password: '',
    state: '',
    city: '',
    plan: new URLSearchParams(window.location.search).get('plan') || 'pro',
  });

  const handleNext = (e) => {
    e.preventDefault();
    setStep((s) => s + 1);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Create Tenant & User
      // registerTenant stores the access_token the endpoint now returns, so the
      // checkout call below is authenticated. See client.js for why that was
      // the difference between a working signup and no signup at all.
      const authData = await registerTenant(formData);
      
      // 2. Generate Stripe Checkout Session
      //
      // The billing router requires authentication, and a brand-new registrant
      // has no other way to obtain a token — which is why this step used to
      // fail with "Failed to create checkout session" and nobody could
      // subscribe. /auth/register now returns an access_token; store it so
      // request() attaches it here and on every call after.
      const billingData = await request('POST', '/api/v1/billing/checkout', {
        tenant_id: authData.tenant_id,
        plan: formData.plan
      });

      // 3. Redirect to Stripe
      window.location.href = billingData.url;
    } catch (err) {
      alert("Error: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] text-slate-200 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-[#0a0f1c] border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
        
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Shield className="w-6 h-6 text-amber-500" />
          <span className="font-display font-bold text-lg tracking-wide text-white">THE J. WORDEN STANDARD OS</span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-8 relative">
          <div className="absolute left-10 right-10 top-1/2 h-0.5 bg-slate-800 -z-10" />
          {[1, 2, 3].map((num) => (
            <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= num ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-500'}`}>
              {num}
            </div>
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-slate-400 mb-6 text-sm">Enter your company details to get started.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input required className="pl-10 h-12 bg-slate-900/50 border-slate-800" placeholder="Texas Paving Pros" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Primary Trade / Industry</label>
                <Select required value={formData.industry} onValueChange={(val) => setFormData({...formData, industry: val})}>
                  <SelectTrigger className="h-12 bg-slate-900/50 border-slate-800 text-white">
                    <SelectValue placeholder="Select your trade" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    {INDUSTRIES.map(ind => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Owner Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input type="email" required className="pl-10 h-12 bg-slate-900/50 border-slate-800" placeholder="owner@company.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Password</label>
                <Input type="password" required className="h-12 bg-slate-900/50 border-slate-800" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
            </div>
            
            <Button type="submit" className="w-full h-12 mt-6 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold">
              Continue
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleNext} className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-2">Market Targeting</h2>
            <p className="text-slate-400 mb-6 text-sm">Select your primary operating state to set up your first market site.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Primary State</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 z-10" />
                  <Select required value={formData.state} onValueChange={(val) => setFormData({...formData, state: val})}>
                    <SelectTrigger className="pl-10 h-12 bg-slate-900/50 border-slate-800 text-white">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {US_STATES.map(st => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Primary City</label>
                <Input required className="h-12 bg-slate-900/50 border-slate-800" placeholder="e.g. Dallas" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-12 border-slate-700 w-1/3">Back</Button>
              <Button type="submit" className="h-12 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold flex-1">Continue</Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-2">Finalize Subscription</h2>
            <p className="text-slate-400 mb-6 text-sm">You selected the <strong>{formData.plan.toUpperCase()}</strong> plan. Enter payment details to begin your 14-day free trial.</p>
            
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 mb-6 flex items-center gap-4">
              <CreditCard className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-white font-medium">Stripe Sandbox (Test Mode)</p>
                <p className="text-slate-500 text-xs">No card required for simulation</p>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-12 border-slate-700 w-1/3" disabled={loading}>Back</Button>
              <Button type="submit" disabled={loading} className="h-12 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold flex-1">
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Provisioning OS...</> : 'Complete & Launch'}
              </Button>
            </div>
          </form>
        )}

        {/* A signup form with no route back to sign-in strands anyone who
            already has an account — or who completed step 1 and then lost the
            Stripe tab, since the tenant and user are committed before checkout. */}
        <p className="text-sm text-slate-400 mt-6 text-center">
          Already have an account?{' '}
          <a href="/signin" className="text-amber-400 hover:text-amber-300 font-medium">
            Sign in
          </a>
        </p>
      </motion.div>
    </div>
  );
}
