import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Brain, Zap, Camera, CloudRain, CheckCircle, ArrowRight, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MarketingHome() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "The J. Worden Standard OS",
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "199.00",
      "priceCurrency": "USD"
    },
    "description": "The ultimate AI-powered operating system for blue-collar empires. Features Drone AI Scanning, Predictive Weather Risk, and Jarvis Tech Helper for asphalt, roofing, and concrete contractors."
  };

  return (
    <div className="min-h-screen bg-[#020408] text-slate-200 overflow-x-hidden font-sans">
      <Helmet>
        <title>The J. Worden Standard OS | AI Software for Blue-Collar Empires</title>
        <meta name="description" content="Scale your asphalt, roofing, or concrete business with The J. Worden Standard OS. Featuring Drone AI Scanning, Predictive Weather Risk, and Jarvis." />
        <link rel="canonical" href="https://thewordenstandard.com/" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-[#020408]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#020408]" />
            </div>
            <span className="font-display font-bold text-xl tracking-wide text-white">THE WORDEN STANDARD</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Pricing</a>
            <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign In</Link>
            <Link to="/register">
              <Button className="bg-amber-500 hover:bg-amber-400 text-[#020408] font-bold px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-amber-500/30 text-amber-500 text-sm font-medium mb-8"
          >
            <Zap className="w-4 h-4" />
            <span>Version 2.0 is now live</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black text-white tracking-tight leading-[1.1] mb-8"
          >
            The Operating System for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
              Blue-Collar Empires.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-slate-400 max-w-3xl mx-auto mb-12"
          >
            Stop guessing on bids. Stop losing leads. The J. Worden Standard OS uses military-grade AI, drone scanning, and predictive weather modeling to automate your asphalt, roofing, or concrete business.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            <Link to="/operations/register">
              <Button className="h-14 px-8 text-lg bg-amber-500 hover:bg-amber-400 text-[#020408] font-bold rounded-xl shadow-[0_0_40px_rgba(245,158,11,0.3)]">
                Start Your Empire
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="h-14 px-8 text-lg border-slate-700 hover:bg-slate-800 text-white font-medium rounded-xl">
                Access Cockpit
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-32 bg-[#050810] relative border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Built for the Field. Powered by AI.</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">We didn't just build a CRM. We built a fully autonomous intelligence suite that works as hard as your crews do.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-amber-500/50 transition-colors group">
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Drone AI Scanner</h3>
              <p className="text-slate-400 leading-relaxed">
                Upload aerial imagery from your drone. Our AI instantly calculates square footage, detects pavement degradation, and generates a line-item estimate in seconds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 transition-colors group">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CloudRain className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Predictive Weather</h3>
              <p className="text-slate-400 leading-relaxed">
                Stop losing days to bad weather. Our lifecycle AI predicts thermal windows for paving and routes crews to optimal jobsites based on micro-climate data.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 transition-colors group">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Jarvis Tech Helper</h3>
              <p className="text-slate-400 leading-relaxed">
                Your autonomous dispatcher and customer success agent. Jarvis manages inbound leads, qualifies customers, and actively monitors your business health.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Scale Your Operations</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Choose the tier that matches the size of your empire. Upgrade or downgrade anytime.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
            {/* LITE */}
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800">
              <h3 className="text-xl font-bold text-slate-300 mb-2">LITE TIER</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-black text-white">$199</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <p className="text-slate-400 mb-8 h-12">The essentials for growing contractors.</p>
              <Link to="/operations/register?plan=lite">
                <Button variant="outline" className="w-full h-12 border-slate-700 hover:bg-slate-800 mb-8">Start Free Trial</Button>
              </Link>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-300"><CheckCircle className="w-5 h-5 text-amber-500" /> Core Cockpit Dashboard</li>
                <li className="flex items-center gap-3 text-slate-300"><CheckCircle className="w-5 h-5 text-amber-500" /> Manual Estimate Builder</li>
                <li className="flex items-center gap-3 text-slate-300"><CheckCircle className="w-5 h-5 text-amber-500" /> Basic CRM & Leads</li>
                <li className="flex items-center gap-3 text-slate-500 opacity-50"><CheckCircle className="w-5 h-5" /> Local SEO Website Factory</li>
                <li className="flex items-center gap-3 text-slate-500 opacity-50"><CheckCircle className="w-5 h-5" /> Drone AI Scanner</li>
              </ul>
            </div>

            {/* PRO */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-amber-500/10 to-slate-900/50 border border-amber-500/50 relative transform scale-105 shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-[#020408] text-xs font-bold px-4 py-1 rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-bold text-amber-500 mb-2">PRO TIER</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-black text-white">$499</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <p className="text-slate-400 mb-8 h-12">Dominate your local market with SEO.</p>
              <Link to="/operations/register?plan=pro">
                <Button className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-[#020408] font-bold mb-8">Start Free Trial</Button>
              </Link>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-300"><CheckCircle className="w-5 h-5 text-amber-500" /> Everything in Lite</li>
                <li className="flex items-center gap-3 text-white font-bold"><CheckCircle className="w-5 h-5 text-amber-500" /> Local SEO Website Factory</li>
                <li className="flex items-center gap-3 text-white font-bold"><CheckCircle className="w-5 h-5 text-amber-500" /> AI Blog Generator</li>
                <li className="flex items-center gap-3 text-slate-300"><CheckCircle className="w-5 h-5 text-amber-500" /> Advanced Telemetry</li>
                <li className="flex items-center gap-3 text-slate-500 opacity-50"><CheckCircle className="w-5 h-5" /> Drone AI Scanner</li>
              </ul>
            </div>

            {/* MAX */}
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800">
              <h3 className="text-xl font-bold text-slate-300 mb-2">MAX TIER</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-black text-white">$999</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <p className="text-slate-400 mb-8 h-12">Complete autonomous operations & AI.</p>
              <Link to="/operations/register?plan=max">
                <Button variant="outline" className="w-full h-12 border-slate-700 hover:bg-slate-800 mb-8">Start Free Trial</Button>
              </Link>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-300"><CheckCircle className="w-5 h-5 text-amber-500" /> Everything in Pro</li>
                <li className="flex items-center gap-3 text-white font-bold"><CheckCircle className="w-5 h-5 text-amber-500" /> Drone AI Scanner</li>
                <li className="flex items-center gap-3 text-white font-bold"><CheckCircle className="w-5 h-5 text-amber-500" /> Predictive Weather Risk</li>
                <li className="flex items-center gap-3 text-white font-bold"><CheckCircle className="w-5 h-5 text-amber-500" /> Supply Chain Pricing API</li>
                <li className="flex items-center gap-3 text-slate-300"><CheckCircle className="w-5 h-5 text-amber-500" /> Dedicated Account Rep</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      <footer className="py-12 border-t border-white/5 bg-[#020408]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} J. Worden & Sons. Built for Blue-Collar Empires.</p>
        </div>
      </footer>
    </div>
  );
}
