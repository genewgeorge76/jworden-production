import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield, Brain, Zap, Camera, CloudRain, CheckCircle, ArrowRight,
  Menu, X, Globe, HardHat, Award, MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BUSINESS_FOUNDING_YEAR } from '@/lib/businessInfo';

/**
 * MarketingHome — the storefront for The Worden Standard OS.
 *
 * Every claim here traces to src/lib/businessInfo.js, the canonical credentials
 * record. Nothing asserts a customer count, a testimonial or a metric that
 * cannot be pointed at: the thing being sold is judgement about paving, and a
 * contractor who catches one invented number stops believing the whole page.
 */

// Derived, not typed in. The old footer hardcoded a year that had already
// drifted (the homepage says 1985, the canonical record says 1984), so the
// number is computed and cannot rot.
const FOUNDED = Number(BUSINESS_FOUNDING_YEAR);
const YEARS_IN_TRADE = new Date().getFullYear() - FOUNDED;

const NAV_LINKS = [
  { href: '#proof', label: 'Why Us' },
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

const FEATURES = [
  {
    icon: Camera,
    tone: 'amber',
    title: 'Drone AI Scanner',
    body:
      'Upload aerial imagery from your drone. The scanner measures square footage, flags pavement distress, and turns it into a line-item estimate you can edit before it goes out.',
  },
  {
    icon: CloudRain,
    tone: 'blue',
    title: 'Predictive Weather',
    body:
      'Paving has a temperature window and a moisture window. The scheduler reads micro-climate forecasts against those windows so you stop burning days you could have worked.',
  },
  {
    icon: Brain,
    tone: 'emerald',
    title: 'Jarvis',
    body:
      'Answers inbound leads the moment they land, qualifies them against your service area and job minimums, and escalates the ones worth your phone call.',
  },
];

const TONE = {
  amber:   { ring: 'hover:border-amber-500/50',   bg: 'bg-amber-500/10',   fg: 'text-amber-500' },
  blue:    { ring: 'hover:border-blue-500/50',    bg: 'bg-blue-500/10',    fg: 'text-blue-500' },
  emerald: { ring: 'hover:border-emerald-500/50', bg: 'bg-emerald-500/10', fg: 'text-emerald-500' },
};

// Straight from businessInfo.js. No rounding up, no "trusted by thousands".
const CREDENTIALS = [
  { icon: HardHat, stat: `${YEARS_IN_TRADE} years`, label: `Family-run since ${FOUNDED}, 4th generation` },
  { icon: Shield,  stat: 'Class A',                 label: 'Virginia Contractor · A+ BBB since 1994' },
  { icon: MapPin,  stat: '12+ states',              label: 'Residential, commercial, QSR, REIT, municipal' },
  { icon: Award,   stat: 'Top 75',                  label: 'Pavement Magazine · Best of Houzz 4×' },
];

const TIERS = [
  {
    id: 'lite',
    name: 'LITE TIER',
    price: '$199',
    blurb: 'The essentials for growing contractors.',
    featured: false,
    features: [
      { label: 'Core Cockpit Dashboard', included: true },
      { label: 'Manual Estimate Builder', included: true },
      { label: 'Basic CRM & Leads', included: true },
      { label: 'Local SEO Website Factory', included: false },
      { label: 'Drone AI Scanner', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'PRO TIER',
    price: '$499',
    blurb: 'Dominate your local market with SEO.',
    featured: true,
    features: [
      { label: 'Everything in Lite', included: true },
      { label: 'Local SEO Website Factory', included: true, emphasis: true },
      { label: 'AI Blog Generator', included: true, emphasis: true },
      { label: 'Advanced Telemetry', included: true },
      { label: 'Drone AI Scanner', included: false },
    ],
  },
  {
    id: 'max',
    name: 'MAX TIER',
    price: '$999',
    blurb: 'Complete autonomous operations & AI.',
    featured: false,
    features: [
      { label: 'Everything in Pro', included: true },
      { label: 'Drone AI Scanner', included: true, emphasis: true },
      { label: 'Predictive Weather Risk', included: true, emphasis: true },
      { label: 'Supply Chain Pricing API', included: true, emphasis: true },
      { label: 'Dedicated Account Rep', included: true },
    ],
  },
];

const FAQS = [
  {
    q: 'Do I need a drone to use this?',
    a: 'No. The estimator works from manual measurements on every tier. The Drone AI Scanner is an accelerator on Max — it turns imagery you already fly into a takeoff faster than you can walk the lot. If you do not fly, nothing else changes.',
  },
  {
    q: 'Will this replace my crew or my estimator?',
    a: 'No, and it is not built to. It removes the after-hours work — the follow-up that never got sent, the lot you measured twice, the lead that sat in voicemail until Monday. The judgement calls stay yours.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'You export it and it is yours. Your customer list, your estimates and your job history are your business, not our leverage.',
  },
  {
    q: 'Who actually built this?',
    a: `A paving company that has been running crews since ${FOUNDED}, for itself, before it was ever sold to anyone else. Every workflow in here solved a problem on a real jobsite first.`,
  },
];

export default function MarketingHome() {
  const [menuOpen, setMenuOpen] = useState(false);
  // Respect the OS setting. Large translate-and-fade entrances are a common
  // vestibular trigger and this page opens with several at once.
  const reduce = useReducedMotion();

  const rise = (delay = 0) =>
    reduce
      ? { initial: false, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay },
        };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'The J. Worden Standard OS',
    operatingSystem: 'Web',
    applicationCategory: 'BusinessApplication',
    // Three published tiers, so advertise the range rather than one price.
    offers: TIERS.map((t) => ({
      '@type': 'Offer',
      name: t.name,
      price: t.price.replace('$', ''),
      priceCurrency: 'USD',
    })),
    description:
      'Field-operations software for asphalt, roofing and concrete contractors: drone-assisted takeoffs, weather-aware scheduling, and an AI dispatcher that answers leads the moment they arrive.',
    provider: {
      '@type': 'Organization',
      name: 'J. Worden & Sons',
      foundingDate: BUSINESS_FOUNDING_YEAR,
    },
  };

  return (
    <div className="min-h-screen bg-[#020408] text-slate-200 overflow-x-hidden font-sans">
      <Helmet>
        <title>The J. Worden Standard OS | AI Software for Blue-Collar Empires</title>
        <meta
          name="description"
          content={`Field software for asphalt, roofing and concrete contractors — built inside a paving company running crews since ${FOUNDED}. Drone takeoffs, weather-aware scheduling, and an AI dispatcher that never misses a lead.`}
        />
        <link rel="canonical" href="https://thewordenstandard.com/" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      {/* Keyboard users land here first; the nav is fixed and would otherwise
          cost four tabs to clear on every page load. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-lg focus:bg-amber-500 focus:px-4 focus:py-2 focus:font-bold focus:text-[#020408]"
      >
        Skip to content
      </a>

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-[#020408]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" aria-label="The Worden Standard — home">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-[#020408]" aria-hidden="true" />
            </div>
            <span className="font-display font-bold text-lg sm:text-xl tracking-wide text-white">
              THE WORDEN STANDARD
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
            <Link to="/command-center" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Button asChild className="bg-amber-500 hover:bg-amber-400 text-[#020408] font-bold px-6">
              <Link to="/register">Get Started</Link>
            </Button>
          </div>

          {/* Mobile toggle — the old nav had none, so on a phone the links
              collided with the wordmark. Crews read this on a phone. */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 -mr-2 text-slate-300 hover:text-white"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div id="mobile-nav" className="md:hidden border-t border-white/5 bg-[#020408] px-6 py-4 space-y-3">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-base text-slate-300 hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/command-center"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-base text-slate-300 hover:text-white"
            >
              Sign In
            </Link>
            <Button asChild className="w-full bg-amber-500 hover:bg-amber-400 text-[#020408] font-bold">
              <Link to="/register" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </Button>
          </div>
        )}
      </nav>

      <main id="main">
        {/* HERO */}
        <section className="relative pt-40 pb-24 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] max-w-[100vw] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] max-w-[100vw] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <motion.div
              {...rise(0)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-amber-500/30 text-amber-500 text-sm font-medium mb-8"
            >
              <Zap className="w-4 h-4" aria-hidden="true" />
              {/* Was "Version 2.0 is now live" — unverifiable, and it ages badly.
                  This says something true and permanent instead. */}
              <span>Built on a jobsite, not in a boardroom</span>
            </motion.div>

            <motion.h1
              {...rise(0.1)}
              className="text-5xl sm:text-6xl md:text-8xl font-black text-white tracking-tight leading-[1.05] mb-8"
            >
              The Operating System for
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                Blue-Collar Empires.
              </span>
            </motion.h1>

            <motion.p {...rise(0.2)} className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-12">
              Stop guessing on bids. Stop losing leads to voicemail. Drone-assisted takeoffs,
              weather-aware scheduling and an AI dispatcher — built inside a working paving company
              that has been running crews since {FOUNDED}.
            </motion.p>

            <motion.div {...rise(0.3)} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Every CTA on this page pointed at /operations/register, which is
                  not a route — all four conversion paths fell through to the SPA
                  catch-all. They go to /register now, which is real. */}
              <Button
                asChild
                className="h-14 px-8 text-lg bg-amber-500 hover:bg-amber-400 text-[#020408] font-bold rounded-xl shadow-[0_0_40px_rgba(245,158,11,0.3)] w-full sm:w-auto"
              >
                <Link to="/register">
                  Start Your Empire
                  <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-14 px-8 text-lg border-slate-700 hover:bg-slate-800 text-white font-medium rounded-xl w-full sm:w-auto"
              >
                <Link to="/command-center">Access Cockpit</Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* PROOF — what the page was missing entirely.
            A contractor deciding whether to hand over $199-999 a month is asking
            one question: who are you. Four decades, a Class A licence and a QSR
            portfolio answer it better than any feature list. */}
        <section id="proof" className="py-20 border-y border-white/5 bg-[#050810] scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {CREDENTIALS.map(({ icon: Icon, stat, label }) => (
                <div key={stat} className="text-center">
                  <Icon className="w-6 h-6 text-amber-500 mx-auto mb-3" aria-hidden="true" />
                  <div className="text-2xl sm:text-3xl font-black text-white">{stat}</div>
                  <div className="text-xs sm:text-sm text-slate-500 mt-1 leading-snug">{label}</div>
                </div>
              ))}
            </div>

            <p className="text-center text-slate-400 max-w-3xl mx-auto mt-16 text-lg leading-relaxed">
              This was never a startup idea. It is the software a{' '}
              <span className="text-white font-semibold">4th-generation paving company</span> wrote
              for itself — after {YEARS_IN_TRADE} years of losing bids to bad measurements, losing
              days to weather it could have forecast, and losing leads to a phone nobody answered at
              six o&apos;clock. Every workflow in here earned its place on a jobsite first.
            </p>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-32 relative scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Built for the Field. Powered by AI.
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Not another CRM with a paving skin. Three things that take real hours off your week.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {FEATURES.map(({ icon: Icon, tone, title, body }) => {
                const t = TONE[tone];
                return (
                  <div
                    key={title}
                    className={`p-8 rounded-3xl bg-slate-900/50 border border-slate-800 ${t.ring} transition-colors group`}
                  >
                    <div
                      className={`w-14 h-14 ${t.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform motion-reduce:transform-none`}
                    >
                      <Icon className={`w-7 h-7 ${t.fg}`} aria-hidden="true" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
                    <p className="text-slate-400 leading-relaxed">{body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-32 relative border-t border-white/5 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Scale Your Operations</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Choose the tier that matches the size of your empire. Upgrade or downgrade anytime.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
              {TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className={
                    tier.featured
                      ? 'p-8 rounded-3xl bg-gradient-to-b from-amber-500/10 to-slate-900/50 border border-amber-500/50 relative md:scale-105 shadow-2xl'
                      : 'p-8 rounded-3xl bg-slate-900/50 border border-slate-800'
                  }
                >
                  {tier.featured && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-[#020408] text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className={`text-xl font-bold mb-2 ${tier.featured ? 'text-amber-500' : 'text-slate-300'}`}>
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-5xl font-black text-white">{tier.price}</span>
                    <span className="text-slate-500">/mo</span>
                  </div>
                  <p className="text-slate-400 mb-8 min-h-[3rem]">{tier.blurb}</p>

                  <Button
                    asChild
                    variant={tier.featured ? 'default' : 'outline'}
                    className={
                      tier.featured
                        ? 'w-full h-12 bg-amber-500 hover:bg-amber-400 text-[#020408] font-bold mb-8'
                        : 'w-full h-12 border-slate-700 hover:bg-slate-800 mb-8'
                    }
                  >
                    <Link to={`/register?plan=${tier.id}`}>Start Free Trial</Link>
                  </Button>

                  <ul className="space-y-4">
                    {tier.features.map((f) => (
                      <li
                        key={f.label}
                        className={
                          f.included
                            ? `flex items-center gap-3 ${f.emphasis ? 'text-white font-bold' : 'text-slate-300'}`
                            : 'flex items-center gap-3 text-slate-500 opacity-50'
                        }
                      >
                        <CheckCircle
                          className={`w-5 h-5 shrink-0 ${f.included ? 'text-amber-500' : ''}`}
                          aria-hidden="true"
                        />
                        {/* The old markup conveyed "not included" with opacity
                            alone, which a screen reader announces identically to
                            an included row. */}
                        <span>
                          {f.label}
                          {!f.included && <span className="sr-only"> — not included in this tier</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ — the objections a contractor actually raises before buying. */}
        <section id="faq" className="py-32 border-t border-white/5 bg-[#050810] scroll-mt-20">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-16 text-center">
              Straight Answers
            </h2>
            <div className="space-y-4">
              {FAQS.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-2xl bg-slate-900/50 border border-slate-800 open:border-amber-500/40 transition-colors"
                >
                  <summary className="cursor-pointer list-none p-6 flex items-center justify-between gap-4 text-lg font-semibold text-white">
                    {q}
                    <ArrowRight
                      className="w-5 h-5 text-amber-500 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="px-6 pb-6 text-slate-400 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CLOSER */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] max-w-[100vw] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
            <Globe className="w-10 h-10 text-amber-500 mx-auto mb-8" aria-hidden="true" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Run tomorrow like you meant it.
            </h2>
            <p className="text-lg text-slate-400 mb-12">
              Start on any tier. Move up or down as the season turns. Take your data with you if you
              leave.
            </p>
            <Button
              asChild
              className="h-14 px-10 text-lg bg-amber-500 hover:bg-amber-400 text-[#020408] font-bold rounded-xl shadow-[0_0_40px_rgba(245,158,11,0.3)]"
            >
              <Link to="/register">
                Start Your Empire
                <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-white/5 bg-[#020408]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} J. Worden &amp; Sons · Family-run since {FOUNDED} · Built
            for Blue-Collar Empires.
          </p>
        </div>
      </footer>
    </div>
  );
}
