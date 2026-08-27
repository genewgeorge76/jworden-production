import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle, Shield, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SaaSMarketing() {
  return (
    <div className="min-h-screen bg-[#050810] text-slate-200 selection:bg-amber-500/30 font-sans overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#050810]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="text-amber-500 w-8 h-8" />
            <span className="font-display font-bold text-xl tracking-wide text-white">THE J. WORDEN STANDARD OS</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm font-medium hover:text-amber-400 transition-colors">Sign In</a>
            <Button onClick={() => window.location.href = '/register'} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-[#050810] to-[#050810] -z-10" />
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-mono tracking-[0.08em]"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            NOW AVAILABLE IN ALL 51 STATES
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-bold text-white leading-tight"
          >
            The Ultimate Operating System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Specialty Contractors</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto"
          >
            Launch high-converting local market websites instantly, dominate your territory's SEO with our AI Content Engine, and manage your entire fleet from one powerful Cockpit.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button onClick={() => window.location.href = '/register'} className="h-14 px-8 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-lg w-full sm:w-auto shadow-[0_0_40px_rgba(245,166,35,0.3)]">
              Start Your Free Trial <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" className="h-14 px-8 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white w-full sm:w-auto">
              View Demo
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 border-y border-white/5 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">Dominate Your Local Market</h2>
            <p className="text-slate-400 mt-4">Built exclusively for the construction trades (Roofing, Concrete, Civil, Paving & More).</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-[#0a0f1c] border border-white/5 hover:border-amber-500/30 transition-colors">
              <Globe className="w-12 h-12 text-amber-500 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Instant Site Factory</h3>
              <p className="text-slate-400 leading-relaxed">
                Spin up unlimited hyper-local landing pages for surrounding cities. Change colors, copy, and targeting instantly from the dashboard.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-[#0a0f1c] border border-white/5 hover:border-amber-500/30 transition-colors relative overflow-hidden">
              <div className="absolute top-4 right-4 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded">PRO</div>
              <Zap className="w-12 h-12 text-amber-500 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">AI Content Engine</h3>
              <p className="text-slate-400 leading-relaxed">
                Our AI writes highly technical, localized SEO blog posts (e.g., "Pothole Repair in Dallas") with perfect semantic HTML.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-[#0a0f1c] border border-white/5 hover:border-amber-500/30 transition-colors">
              <Shield className="w-12 h-12 text-amber-500 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Operations Cockpit</h3>
              <p className="text-slate-400 leading-relaxed">
                Manage incoming leads, send AI-assisted estimates, and track your crews in real-time from an ultra-premium command center.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">Simple, Transparent Pricing</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Lite Tier */}
            <div className="p-8 rounded-2xl bg-[#0a0f1c] border border-white/5 flex flex-col">
              <h3 className="text-2xl font-bold text-white">Lite</h3>
              <p className="text-slate-400 mt-2 h-12">Perfect for independent owner-operators.</p>
              <div className="my-6">
                <span className="text-4xl font-bold text-white">$199</span><span className="text-slate-400">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['1 Market Site', 'Operations Cockpit', 'Lead Tracking', 'Standard Support'].map((feature, i) => (
                  <li key={i} className="flex items-center text-slate-300">
                    <CheckCircle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button onClick={() => window.location.href = '/register?plan=lite'} variant="outline" className="w-full h-12 border-slate-700 text-white hover:bg-slate-800">
                Start Lite
              </Button>
            </div>

            {/* Pro Tier */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-amber-500/10 to-[#0a0f1c] border border-amber-500/50 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_40px_rgba(245,166,35,0.15)]">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-slate-900 font-bold px-4 py-1 rounded-full text-sm">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold text-white">Pro</h3>
              <p className="text-slate-400 mt-2 h-12">For growing fleets needing territorial dominance.</p>
              <div className="my-6">
                <span className="text-4xl font-bold text-white">$499</span><span className="text-slate-400">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Unlimited Market Sites', 'AI Content Engine', 'Advanced Estimating', 'Priority Support', 'Custom Branding'].map((feature, i) => (
                  <li key={i} className="flex items-center text-slate-300">
                    <CheckCircle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button onClick={() => window.location.href = '/register?plan=pro'} className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold">
                Start Pro Trial
              </Button>
            </div>

            {/* Max Tier */}
            <div className="p-8 rounded-2xl bg-[#0a0f1c] border border-white/5 flex flex-col">
              <h3 className="text-2xl font-bold text-white">Max</h3>
              <p className="text-slate-400 mt-2 h-12">Enterprise multi-state operations.</p>
              <div className="my-6">
                <span className="text-4xl font-bold text-white">$999</span><span className="text-slate-400">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Everything in Pro', 'Custom AI Voice Agent', 'Automated Dispatch', 'API Access', 'Dedicated Account Rep'].map((feature, i) => (
                  <li key={i} className="flex items-center text-slate-300">
                    <CheckCircle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button onClick={() => window.location.href = '/register?plan=max'} variant="outline" className="w-full h-12 border-slate-700 text-white hover:bg-slate-800">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Shield className="w-5 h-5 text-slate-600" />
            <span className="font-display font-bold text-sm tracking-wide">THE J. WORDEN STANDARD OS</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} The J. Worden Standard OS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
