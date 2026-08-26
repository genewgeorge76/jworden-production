import React from 'react';
import { ArrowRight, CheckCircle, Phone, MessageSquare, Star, Shield, Award, Clock, Users, Wrench, Home as HomeIcon, Building2, Droplets, Layers, Hammer, ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HomeSchema from '../components/HomeSchema';
import { PHONE_E164, PHONE_DISPLAY, SMS_E164, SMS_PREFILL } from '@/lib/businessInfo';
import { trackPhoneClick } from '@/lib/analytics';
import LiveReviewBadges from '../components/LiveReviewBadges';
import CustomerProofGallery from '../components/CustomerProofGallery';
import CommercialClientAuthority from '../components/CommercialClientAuthority';
import DocumentedRecord from '../components/DocumentedRecord';
import EstimateForm from '../components/EstimateForm';
import NetworkCoverage from '../components/NetworkCoverage';
import LegacyStory from '../components/LegacyStory';
import PublicRecords from '../components/PublicRecords';
import { BRAND_JWORDEN } from '@/data/publicRecords';

const HERO_IMAGE = '/images/real_jobs/great big driveway paving photo.JPG';
const RESIDENTIAL_IMAGE = '/images/real_jobs/asphalt driveways goochland va.jpg';
const COMMERCIAL_IMAGE = '/images/real_jobs/COMMERCIALPAVING 2026.jpg';

const STATS = [
  { value: '40+', label: 'Years in Business' },
  { value: '5,000+', label: 'Projects Completed' },
  { value: 'Class A', label: 'VA Licensed Contractor' },
  { value: '$5M', label: 'Liability Coverage' },
];

const SERVICES = [
  { icon: HomeIcon, title: 'Residential Driveway Paving', href: '/residential', desc: 'New installs, overlays, full replacement — built for Virginia clay.' },
  { icon: Building2, title: 'Commercial Parking Lots', href: '/parking-lots', desc: 'Phased execution that keeps your business open during work.' },
  { icon: Droplets, title: 'Sealcoating', href: '/sealcoating', desc: 'Protects against UV, water, and oxidation. Applied on schedule.' },
  { icon: Wrench, title: 'Crack Repair', href: '/crack-repair', desc: 'Hot-pour rubberized filler before water reaches the base.' },
  { icon: Layers, title: 'Tar and Chip', href: '/tar-and-chip', desc: 'Lower-cost bound surface for rural and estate driveways.' },
  { icon: Hammer, title: 'Asphalt Milling', href: '/paving', desc: 'Mill and overlay resurfacing when the base is still sound.' },
];

const TRUST_POINTS = [
  'Virginia Class A Contractor License',
  'NASCLA certified',
  '$5M general liability + workers\' comp',
  'Family-owned since 1984 — Chester, VA',
  'Written estimates with line-item breakdown',
  'No deposit until materials are ordered',
];

const REVIEWS = [
  {
    name: 'Michael T.',
    location: 'Midlothian, VA',
    stars: 5,
    text: 'They diagnosed a base failure before they quoted me — saved me from resurfacing over a problem. Honest and thorough.',
  },
  {
    name: 'Sandra R.',
    location: 'Short Pump, VA',
    stars: 5,
    text: 'Best looking driveway on the street. Clean edges, proper slope — no standing water after rain for the first time in years.',
  },
  {
    name: 'James K.',
    location: 'Chester, VA',
    stars: 5,
    text: 'They paved our church parking lot in two phases so we never had to close. Crew was professional and the job came in on budget.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] font-body text-gray-200">
      <SEO
        title="Asphalt Paving Virginia | J. Worden & Sons — Chester, Richmond, Chesterfield"
        description="Virginia's trusted asphalt paving contractor since 1984. Driveways, parking lots, sealcoating, crack repair, and tar and chip across Richmond, Chesterfield, Hampton Roads, and all of Virginia."
        canonicalPath="/"
      />
      <HomeSchema />
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-end bg-[#0f0f0f] overflow-hidden">
        {/* background image */}
        <div className="absolute inset-0">
          {/* LCP hero — responsive AVIF/WebP matches the <link rel="preload">
              in index.html so the browser reuses the preloaded image (mobile
              AVIF ~55KB vs the 161KB JPG). fetchPriority + eager keep it the
              prioritized LCP element. */}
          <picture>
            <source
              type="image/avif"
              srcSet="/work/portfolio/portfolio-010-mobile.avif 800w, /work/portfolio/portfolio-010.avif 1600w"
              sizes="(max-width: 768px) 100vw, 1600px"
            />
            <source
              type="image/webp"
              srcSet="/work/portfolio/portfolio-010-mobile.webp 800w, /work/portfolio/portfolio-010.webp 1600w"
              sizes="(max-width: 768px) 100vw, 1600px"
            />
            <img
              src={HERO_IMAGE}
              alt="J. Worden and Sons asphalt paving — Virginia"
              width={1600}
              height={900}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover opacity-35"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pb-20 pt-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 border border-[#ff7a00]/40 text-[#ff7a00] text-xs font-display uppercase tracking-[0.2em] px-4 py-2 mb-8">
              <Shield className="w-3.5 h-3.5" />
              USDOT 2568168 · Family-Owned Since 1984
            </div>
            <h1 className="font-display text-white text-5xl md:text-7xl lg:text-8xl uppercase leading-none tracking-tight mb-6">
              Asphalt Paving<br />
              <span className="text-[#ff7a00]">in Virginia</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-xl mb-3">
              Driveways, parking lots, sealcoating, and crack repair built on honest diagnosis and 40 years of Virginia soil experience.
            </p>
            <p className="text-gray-400 text-sm mb-10">Driveways from <strong className="text-white">$4/sq ft</strong> · Parking lots from <strong className="text-white">$2.50/sq ft</strong> · Free written estimate</p>
            <div className="flex flex-wrap gap-4">
              <a
                href={`tel:${PHONE_E164}`}
                onClick={() => trackPhoneClick('homepage_hero')}
                className="inline-flex items-center gap-3 bg-[#ff7a00] text-black font-display font-bold text-sm uppercase tracking-[0.12em] px-8 py-4 hover:bg-[#ff9a30] transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call {PHONE_DISPLAY}
              </a>
              <a
                href="/quote"
                className="inline-flex items-center gap-3 border border-white/30 text-white font-display font-bold text-sm uppercase tracking-[0.12em] px-8 py-4 hover:border-white/60 hover:bg-white/5 transition-colors"
              >
                Free Estimate
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────── */}
      <section className="bg-[#ff7a00]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="py-8 px-6 border-r border-black/10 last:border-r-0 text-center">
                <p className="font-display text-black text-4xl md:text-5xl font-bold">{s.value}</p>
                <p className="text-black/70 text-sm font-display uppercase tracking-[0.14em] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEW BADGES ────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="max-w-4xl mx-auto px-6">
          <LiveReviewBadges />
        </div>
      </section>

      {/* ── LEGACY STORY ─────────────────────────────────────────── */}
      <LegacyStory />

      {/* ── SERVICES GRID ────────────────────────────────────────── */}
      <section id="services" className="py-20 md:py-28 relative overflow-hidden border-t border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,122,0,0.05),transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-[#ff7a00] font-display uppercase tracking-[0.22em] text-sm mb-3">What We Do</p>
            <h2 className="font-display text-white text-4xl md:text-5xl uppercase tracking-tight">
              Paving Services Across Virginia
            </h2>
            <p className="text-gray-400 mt-4 max-w-2xl text-lg">
              Every scope starts with an on-site base assessment — not a quick look from the truck.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
            {SERVICES.map((svc) => (
              <a
                key={svc.href}
                href={svc.href}
                className="group bg-[#0f0f0f] p-8 flex flex-col gap-4 hover:bg-white/5 transition-colors duration-300"
              >
                <div className="w-12 h-12 bg-[#ff7a00]/10 flex items-center justify-center group-hover:bg-[#ff7a00]/20 transition-colors rounded-xl">
                  <svc.icon className="w-6 h-6 text-[#ff7a00]" />
                </div>
                <h3 className="font-display text-white group-hover:text-[#ff7a00] text-xl uppercase tracking-wide transition-colors">
                  {svc.title}
                </h3>
                <p className="text-gray-400 group-hover:text-gray-300 text-sm leading-relaxed transition-colors flex-1">
                  {svc.desc}
                </p>
                <span className="inline-flex items-center gap-2 text-[#ff7a00] font-display text-xs uppercase tracking-[0.16em] group-hover:gap-3 transition-all">
                  Learn More <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESIDENTIAL FOCUS ────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-white/10 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-[#ff7a00] font-display uppercase tracking-[0.22em] text-sm mb-3">Residential</p>
              <h2 className="font-display text-white text-4xl md:text-5xl uppercase tracking-tight leading-none mb-6">
                Your Driveway<br />Done Right
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                Virginia clay is the #1 cause of early driveway failure. We diagnose the sub-base before we quote — so what we build stays stable through 40 freeze-thaw cycles and summer heat.
              </p>
              <div className="space-y-3 mb-10">
                {['6" compacted aggregate base minimum on clay subsoil', 'Crowned cross-section so water drains off edges', 'Hot-mix asphalt or tar-and-chip matched to your traffic and budget', 'Clean cut edges — no ragged borders', 'Written warranty on workmanship'].map((pt) => (
                  <div key={pt} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#ff7a00] shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">{pt}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                <a href="/residential" className="inline-flex items-center gap-2 bg-[#ff7a00] text-black font-display text-sm uppercase tracking-[0.12em] px-6 py-3 hover:bg-[#ff9a30] transition-colors">
                  Residential Paving <ArrowRight className="w-4 h-4" />
                </a>
                <a href="/blog/info/driveway-paving-cost-virginia" className="inline-flex items-center gap-2 border border-white/20 text-white font-display text-sm uppercase tracking-[0.12em] px-6 py-3 hover:border-white/40 hover:bg-white/5 transition-colors">
                  2026 Cost Guide
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] w-full bg-slate-950 p-2 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center">
                <img
                  src={RESIDENTIAL_IMAGE}
                  alt="Residential asphalt driveway paving in Virginia by J. Worden and Sons"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div className="absolute -bottom-5 -left-5 bg-[#ff7a00] text-black p-5 hidden md:block rounded-xl shadow-xl">
                <p className="font-display text-3xl font-bold">20–30</p>
                <p className="font-display text-xs uppercase tracking-wide">Year Expected Lifespan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMERCIAL STRIP ─────────────────────────────────────── */}
      <section className="bg-[#0f0f0f] py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/3] w-full bg-slate-950 p-2 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center">
                <img
                  src={COMMERCIAL_IMAGE}
                  alt="Commercial parking lot paving by J. Worden and Sons"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-[#ff7a00] font-display uppercase tracking-[0.22em] text-sm mb-3">Commercial</p>
              <h2 className="font-display text-white text-4xl md:text-5xl uppercase tracking-tight leading-none mb-6">
                Commercial Lots<br />That Stay Open
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                We phase parking lot projects around your business hours, execute with production crew discipline, and document every job for your property records.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-10">
                {['Retail & QSR', 'HOA Roads', 'Church Lots', 'Industrial Yards', 'ADA Striping', 'Mill & Overlay'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-gray-300 text-sm">
                    <div className="w-1.5 h-1.5 bg-[#ff7a00] rounded-full" />
                    {item}
                  </div>
                ))}
              </div>
              <a href="/parking-lots" className="inline-flex items-center gap-2 bg-[#ff7a00] text-black font-display text-sm uppercase tracking-[0.12em] px-6 py-3 hover:bg-[#ff9a30] transition-colors">
                Commercial Paving <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST / CREDENTIALS ──────────────────────────────────── */}
      <section className="py-20 md:py-24 border-t border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,122,0,0.05),transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#ff7a00] font-display uppercase tracking-[0.22em] text-sm mb-3">Why J. Worden & Sons</p>
              <h2 className="font-display text-white text-4xl md:text-5xl uppercase tracking-tight leading-none mb-6">
                Licensed.<br />Insured.<br />Family-Owned.
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                Based in Chester, VA. Serving all of Virginia since 1984. We carry the licensing, insurance, and documentation that protect you — not just promises.
              </p>
              <div className="space-y-3">
                {TRUST_POINTS.map((pt) => (
                  <div key={pt} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#ff7a00] shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">{pt}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Award, title: '40+ Years', sub: 'Family-owned since 1984' },
                { icon: Shield, title: 'Class A', sub: 'Virginia licensed contractor' },
                { icon: Users, title: '5,000+', sub: 'Projects completed' },
                { icon: Clock, title: 'Same-Week', sub: 'Quotes in Central Virginia' },
              ].map((item) => (
                <div key={item.title} className="bg-white/5 border border-white/10 backdrop-blur-md p-6 flex flex-col gap-3 rounded-xl hover:bg-white/10 transition-colors">
                  <item.icon className="w-8 h-8 text-[#ff7a00]" />
                  <p className="font-display text-white text-2xl uppercase">{item.title}</p>
                  <p className="text-gray-400 text-sm">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── REVIEWS ──────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-white/10 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="mb-14">
            <p className="text-[#ff7a00] font-display uppercase tracking-[0.22em] text-sm mb-3">Customer Reviews</p>
            <h2 className="font-display text-white text-4xl md:text-5xl uppercase tracking-tight">
              What Virginia Homeowners Say
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {REVIEWS.map((r) => (
              <div key={r.name} className="border border-white/10 bg-white/5 backdrop-blur-md rounded-xl p-8 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#ff7a00] text-[#ff7a00]" />
                  ))}
                </div>
                <p className="text-gray-300 text-base leading-relaxed flex-1">"{r.text}"</p>
                <div>
                  <p className="font-display font-bold text-white text-sm uppercase tracking-wide">{r.name}</p>
                  <p className="text-gray-500 text-xs">{r.location}</p>
                </div>
              </div>
            ))}
          </div>
          <LiveReviewBadges />
        </div>
      </section>

      {/* ── PROJECT GALLERY ───────────────────────────────────────── */}
      <PublicRecords brand={BRAND_JWORDEN} />

      <section className="py-20 md:py-24 border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-[#ff7a00] font-display uppercase tracking-[0.22em] text-sm mb-3">Our Work</p>
            <h2 className="font-display text-white text-4xl md:text-5xl uppercase tracking-tight">
              Recent Projects
            </h2>
          </div>
          <DocumentedRecord />
      <CommercialClientAuthority />
          <CustomerProofGallery />
        </div>
      </section>

      {/* ── ESTIMATE FORM ────────────────────────────────────────── */}
      <section id="quote" className="py-20 md:py-28 border-t border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,122,0,0.08),transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-[#ff7a00] font-display uppercase tracking-[0.22em] text-sm mb-3">Free Estimate</p>
            <h2 className="font-display text-white text-4xl md:text-5xl uppercase tracking-tight mb-4">
              Get a Written Quote
            </h2>
            <p className="text-gray-400 text-lg">
              Or reach us directly — same-day response guaranteed.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <a
                href={`tel:${PHONE_E164}`}
                onClick={() => trackPhoneClick('homepage_quote')}
                className="inline-flex items-center gap-2 bg-[#ff7a00] text-black font-display text-sm uppercase tracking-[0.12em] px-6 py-3 hover:bg-[#ff9a30] transition-colors"
              >
                <Phone className="w-4 h-4" /> {PHONE_DISPLAY}
              </a>
              <a
                href={`sms:${SMS_E164}?&body=${encodeURIComponent(SMS_PREFILL)}`}
                className="inline-flex items-center gap-2 border border-white/20 text-white font-display text-sm uppercase tracking-[0.12em] px-6 py-3 hover:border-white/40 hover:bg-white/5 transition-colors"
              >
                <MessageSquare className="w-4 h-4" /> Text Us
              </a>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 md:p-10">
            <EstimateForm source="homepage_quote_section" />
          </div>
        </div>
      </section>


      {/* ── COVERAGE NETWORK ──────────────────────────────────────── */}
      <NetworkCoverage />

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 border-t border-white/10 bg-black/20">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <p className="text-[#ff7a00] font-display uppercase tracking-[0.22em] text-sm mb-3">Common Questions</p>
          <h2 className="font-display text-white text-4xl md:text-5xl uppercase tracking-tight mb-10">Virginia Paving FAQs</h2>
          <div className="space-y-0 divide-y divide-white/10">
            {[
              {
                q: 'How much does asphalt driveway paving cost in Virginia?',
                a: 'Most residential driveways in Virginia run $4–$7 per square foot installed. The biggest cost variables are base condition (poor compaction or clay pumping adds $2–$5/sq ft to fix), grade complexity, and tear-out of an existing surface (+$1–$3/sq ft). A 1,000 sq ft driveway in average condition typically runs $4,500–$6,500 all-in. We provide free written estimates with a line-item breakdown — not just a number.',
              },
              {
                q: 'Why do driveways fail early in Virginia?',
                a: "Virginia's Piedmont clay is the #1 culprit. Clay swells with moisture in winter and shrinks in summer — that expansion cycle pumps base material upward and cracks the surface from below. Contractors who skip the geotextile fabric separator or pour less than 4–6 inches of compacted aggregate base will see failure in 5–8 years instead of 20–30. We diagnose the base before we quote so we're fixing the actual problem, not covering it.",
              },
              {
                q: 'What areas of Virginia do you serve?',
                a: 'We operate statewide from our Chester, VA headquarters — with full crews regularly working Richmond, Chesterfield, Henrico, Midlothian, Hampton Roads, Williamsburg, Northern Virginia, Fredericksburg, the Shenandoah Valley, and rural Southside and Piedmont counties. Central Virginia and the I-95 corridor typically get same-week estimates.',
              },
              {
                q: 'Are you licensed and insured to pave in Virginia?',
                a: 'Yes. Virginia Class A Contractor license (Board for Contractors, 9960 Mayland Drive, Richmond), NASCLA certified, $5M general liability, and workers\' compensation. We can provide certificates of insurance naming your property as additional insured — common for HOA and commercial projects.',
              },
              {
                q: 'When is the best time of year to pave in Virginia?',
                a: "Virginia's paving season runs mid-April through early November. May, June, September, and October give the best cure conditions — warm days, cool nights, low rain probability. We require a minimum 50°F ambient temperature (rising, not falling) and a 24-hour rain-free window on both sides. Scheduling in April or late October often means faster availability and sometimes off-peak pricing.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="py-6">
                <p className="font-display text-white text-lg uppercase tracking-wide mb-2">{q}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="bg-[#0f0f0f] py-20 md:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-white text-4xl md:text-6xl uppercase tracking-tight leading-none mb-6">
            Ready to Get<br />
            <span className="text-[#ff7a00]">Started?</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Free on-site assessment. Written estimate within 48 hours. No deposit until materials are ordered.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`tel:${PHONE_E164}`}
              onClick={() => trackPhoneClick('homepage_bottom')}
              className="inline-flex items-center gap-3 bg-[#ff7a00] text-black font-display font-bold text-sm uppercase tracking-[0.12em] px-10 py-4 hover:bg-[#ff9a30] transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call {PHONE_DISPLAY}
            </a>
            <a
              href="/locations"
              className="inline-flex items-center gap-3 border border-white/20 text-white font-display text-sm uppercase tracking-[0.12em] px-10 py-4 hover:border-white/50 hover:bg-white/5 transition-colors"
            >
              View Service Areas
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
