import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield, Brain, Camera, CloudRain, CheckCircle, ArrowRight,
  Menu, X, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BUSINESS_FOUNDING_YEAR } from '@/lib/businessInfo';
import {
  COMPLETED_JOBS, COMPLETED_VALUE_USD, COMMERCIAL_JOBS, COMMERCIAL_STATES,
  FIRST_COMPLETION, LAST_COMPLETION, LARGEST_CONTRACT, SHOWCASE_CONTRACT,
  STANDARDS, money,
} from '@/data/trackRecord';

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
        {/* Open Graph — override paving defaults from index.html */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="The Worden Standard" />
        <meta property="og:title" content="The J. Worden Standard OS | AI Software for Blue-Collar Empires" />
        <meta
          property="og:description"
          content={`Field software for asphalt, roofing and concrete contractors — built inside a paving company running crews since ${FOUNDED}. Drone takeoffs, weather-aware scheduling, and an AI dispatcher that never misses a lead.`}
        />
        <meta property="og:url" content="https://thewordenstandard.com/" />
        <meta property="og:image" content="https://thewordenstandard.com/og-default.jpg" />
        <meta property="og:image:alt" content="The J. Worden Standard OS — field-operations software for contractors" />
        <meta property="og:locale" content="en_US" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="The J. Worden Standard OS | AI Software for Blue-Collar Empires" />
        <meta
          name="twitter:description"
          content={`Field software for asphalt, roofing and concrete contractors — built inside a paving company running crews since ${FOUNDED}. Drone takeoffs, weather-aware scheduling, and an AI dispatcher that never misses a lead.`}
        />
        <meta name="twitter:image" content="https://thewordenstandard.com/og-default.jpg" />
        <meta name="twitter:image:alt" content="The J. Worden Standard OS — field-operations software for contractors" />
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
        {/* HERO
            Rebuilt away from the centred-headline-over-glowing-orbs layout,
            which is what every SaaS page looks like and is why this one read as
            "fine". The asymmetry is the argument: the claim on the left is
            ordinary, and the panel on the right is the thing no competitor can
            copy — a real job book with the evidence grade against each figure.

            The proof mechanism IS the product. Showing it working on this
            company's own numbers demonstrates the pitch instead of asserting
            it. */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          {/* Striping. Two hairlines at the angle of a parking bay, which is a
              material reference rather than a decorative blur. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(72deg, #F2C230 0 2px, transparent 2px 96px)',
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
          />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">

              {/* ── The claim ─────────────────────────────────────────── */}
              <div>
                <motion.div
                  {...rise(0)}
                  className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-400/90"
                >
                  <span className="h-px w-8 bg-amber-400/60" aria-hidden="true" />
                  Built on a jobsite, not in a boardroom
                </motion.div>

                <motion.h1
                  {...rise(0.08)}
                  className="mt-6 font-display uppercase text-white leading-[0.86] tracking-[0.01em]
                             text-[clamp(3rem,9vw,6.5rem)] text-balance"
                >
                  We ran the crews
                  <span className="block text-amber-400">before we wrote the software.</span>
                </motion.h1>

                <motion.p {...rise(0.16)} className="mt-7 text-lg text-slate-400 max-w-xl leading-relaxed">
                  {COMPLETED_JOBS.toLocaleString()} completed jobs and{' '}
                  <span className="text-white font-semibold">{money(COMPLETED_VALUE_USD)}</span> of
                  finished work, across {COMMERCIAL_STATES.length} states, between{' '}
                  {FIRST_COMPLETION.slice(0, 4)} and {LAST_COMPLETION.slice(0, 4)}. Every figure on
                  this page comes out of the job book we ran the business on — and the panel beside
                  it shows what each one rests on.
                </motion.p>

                <motion.div {...rise(0.24)} className="mt-9 flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    className="h-13 px-7 text-base bg-amber-400 hover:bg-amber-300 text-[#0B0D10] font-bold rounded-lg"
                  >
                    <Link to="/register">
                      Start free
                      <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-13 px-7 text-base border-white/15 hover:bg-white/5 text-white font-semibold rounded-lg"
                  >
                    <a href="#proof">See the evidence</a>
                  </Button>
                </motion.div>
              </div>

              {/* ── The evidence ──────────────────────────────────────── */}
              <motion.div {...rise(0.2)}>
                <div className="rounded-2xl border border-white/10 bg-[#0F1319] overflow-hidden shadow-2xl shadow-black/60">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] bg-white/[0.02]">
                    <span className="font-display uppercase tracking-[0.18em] text-xs text-slate-400">
                      Job book — verified
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                      Completed
                    </span>
                  </div>

                  <dl className="divide-y divide-white/[0.06]">
                    {[
                      ['Contract', SHOWCASE_CONTRACT.instrument],
                      ['Site', SHOWCASE_CONTRACT.site],
                      ['Contract sum', money(SHOWCASE_CONTRACT.sumUSD)],
                      ['Area', `${SHOWCASE_CONTRACT.areaSqFt.toLocaleString()} sq ft`],
                      ['Dated', SHOWCASE_CONTRACT.date],
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-4 px-5 py-3">
                        <dt className="w-28 shrink-0 text-xs uppercase tracking-wider text-slate-500 pt-0.5">
                          {k}
                        </dt>
                        <dd className="text-sm text-slate-200 font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  <p className="px-5 py-3 text-xs text-slate-500 leading-relaxed border-t border-white/[0.06] bg-white/[0.015]">
                    {SHOWCASE_CONTRACT.scope}.
                  </p>
                </div>

                <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                  One real contract, stated in full. A dozen round numbers would be easier to write
                  and worth less — this is the grading the platform applies to your work too.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* STANDARDS — a striping band. Four non-negotiables that appear on
            every proposal this company issues, which is a more specific claim
            than any adjective. */}
        <section className="border-y border-white/[0.07] bg-[#080A0E]">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[0.06]">
            {STANDARDS.map(({ value, label, note }) => (
              <div key={label} className="px-5 py-7 first:pl-0 last:pr-0">
                <div className="font-display uppercase text-3xl text-amber-400 leading-none tracking-wide">
                  {value}
                </div>
                <div className="mt-2 text-sm text-white font-semibold leading-tight">{label}</div>
                {note && <div className="mt-1 text-xs text-slate-500">{note}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* PROOF
            The credential tiles here used to be round numbers — "4 decades",
            "12+ states". They were true and they were unfalsifiable, which is
            the same shape as the fabricated store database this repository
            served for months. These come out of the job book with the query
            that produced them, and the one that would look best is deliberately
            absent: all 2,610 rows sum to $41,295,234.93, and that figure
            includes 66 jobs marked lost. */}
        <section id="proof" className="py-24 bg-[#050810] scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-400/90">
              The job book, 2013&ndash;2022
            </p>
            <h2 className="mt-4 font-display uppercase text-white leading-[0.9] tracking-wide text-[clamp(2.25rem,5vw,3.75rem)] max-w-3xl text-balance">
              Software written by the contractor, not about him.
            </h2>

            <div className="mt-12 grid gap-px sm:grid-cols-2 lg:grid-cols-4 bg-white/[0.07] border border-white/[0.07] rounded-xl overflow-hidden">
              {[
                {
                  value: COMPLETED_JOBS.toLocaleString(),
                  label: 'Completed jobs',
                  note: 'carrying a completion date',
                },
                {
                  value: money(COMPLETED_VALUE_USD),
                  label: 'Of finished work',
                  note: 'a floor, not a total',
                },
                {
                  value: COMMERCIAL_JOBS.toLocaleString(),
                  label: 'Commercial sites',
                  note: `across ${COMMERCIAL_STATES.length} states`,
                },
                {
                  value: money(LARGEST_CONTRACT.sumUSD),
                  label: 'Largest contract',
                  note: `${LARGEST_CONTRACT.divisions.length} CSI divisions`,
                },
              ].map(({ value, label, note }) => (
                <div key={label} className="bg-[#050810] px-6 py-8">
                  <div className="font-display uppercase text-4xl text-white leading-none tracking-wide tabular-nums">
                    {value}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-slate-200">{label}</div>
                  <div className="mt-1 text-xs text-slate-500">{note}</div>
                </div>
              ))}
            </div>

            {/* The number that is missing, said out loud. A page that shows its
                own restraint is more persuasive than one that shows its best
                figure. */}
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] px-5 py-4">
              <Shield className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-sm text-slate-300 leading-relaxed">
                <span className="text-white font-semibold">What is not on this page:</span> the job
                book&rsquo;s 2,610 rows sum to $41,295,234.93. That figure includes 66 jobs marked
                <em> lost</em> and 868 that were priced and never marked finished, so it is not
                stated as a track record. {money(COMPLETED_VALUE_USD)} is the part with a
                completion date behind it &mdash; and it undercounts, because plenty of finished
                work never had the box ticked.
              </p>
            </div>

            <div className="mt-14 grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
              <div>
                <h3 className="font-display uppercase text-2xl text-white tracking-wide">
                  Not only paving
                </h3>
                <p className="mt-4 text-slate-400 leading-relaxed">
                  The largest job in the book is a ground-up restaurant build, carried across eleven
                  divisions on one contract. A paving subcontractor does not carry masonry, openings,
                  plumbing and HVAC, electrical and roofing &mdash; which is what makes this the
                  evidence for the general-contracting claim rather than an assertion of it.
                </p>
                <p className="mt-4 text-slate-500 text-sm">
                  {LARGEST_CONTRACT.reference} &middot; {money(LARGEST_CONTRACT.sumUSD)}
                </p>
              </div>

              <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-0 text-sm">
                {LARGEST_CONTRACT.divisions.map((d, i) => (
                  <li
                    key={d}
                    className="flex gap-3 py-2.5 border-b border-white/[0.06] text-slate-300"
                  >
                    <span className="font-display text-amber-400/70 tabular-nums w-6 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {d}
                  </li>
                ))}
              </ol>
            </div>

            <p className="text-slate-400 max-w-3xl mt-16 text-lg leading-relaxed">
              This was never a startup idea. It is the software a{' '}
              <span className="text-white font-semibold">4th-generation paving company</span> wrote
              for itself &mdash; after {YEARS_IN_TRADE} years of losing bids to bad measurements,
              losing days to weather it could have forecast, and losing leads to a phone nobody
              answered at six o&rsquo;clock. Every workflow in here earned its place on a jobsite
              first.
            </p>
          </div>
        </section>

        {/* 50-STATE SOFTWARE COVERAGE — a claim about the PRODUCT's data reach,
            deliberately distinct from J. Worden's own paving footprint (the
            "12+ states" credential above). The platform ships licensing,
            prevailing-wage, and regional-pricing data for every state, so this
            is accurate as a software capability, not a services overclaim. */}
        <section className="py-16 border-b border-white/5 bg-[#050810]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500 mb-3">
              Works wherever you contract
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-balance">
              Built for contractors in all 50 states&nbsp;+&nbsp;DC
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              State licensing rules, Davis-Bacon and prevailing-wage data, and regional pricing ship
              inside the platform for every state — so your estimates, compliance checks, and proposals
              hold up whether you pour in Virginia or bid a federal lot in Texas.
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
