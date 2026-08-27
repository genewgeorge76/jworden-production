import React from 'react';
import { ArrowRight, Phone, Shield, Home as HomeIcon, Building2, Droplets, Wrench, Layers, Hammer, MessageSquare, Ruler, Camera } from 'lucide-react';
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
import NetworkCoverage from '../components/NetworkCoverage';
import LegacyStory from '../components/LegacyStory';
import PublicRecords from '../components/PublicRecords';
import QuoteBlock from '../components/QuoteBlock';
import { BRAND_JWORDEN } from '@/data/publicRecords';
import { LOCAL_CLIMATE, CLIMATE_SPREAD } from '@/data/localClimate';

/*
 * THE HOMEPAGE, REBUILT AROUND TWO RULES
 * ──────────────────────────────────────
 * 1. The cut is the reference's, not the costume. rosepaving.com and
 *    atlanticsouthernpaving.com — now one company, the largest self-performing
 *    paving outfit in the country — run light ground, full-colour photography,
 *    plain title-case headlines, and a door for each kind of buyer. That is
 *    the structure here. What makes this page BETTER than theirs is not
 *    design: it is that every number on it can be checked, which theirs
 *    cannot say.
 *
 * 2. Nothing invented survives. The previous version of this file carried a
 *    "Class A VA Licensed Contractor" stat (the register does not currently
 *    support it), "$5M Liability Coverage" (the documented COI shows $1M/$2M),
 *    "5,000+ Projects Completed" (the record supports 2,263 customers and 920
 *    completed jobs), "No deposit until materials are ordered" (deposits are
 *    in fact required), and three named testimonials that appear nowhere in
 *    the Google review record. All deleted. The stats below are the ones the
 *    archive can produce a document for, and the reviews come from the live
 *    review component rather than from strings typed into this file.
 */

const HERO_IMAGE = '/images/real_jobs/great big driveway paving photo.JPG';
const RESIDENTIAL_IMAGE = '/images/real_jobs/asphalt driveways goochland va.jpg';
const COMMERCIAL_IMAGE = '/images/real_jobs/COMMERCIALPAVING 2026.jpg';

/* Every figure here traces to a record in this repository. */
const STATS = [
  { value: '40+', label: 'Years in the trade' },
  { value: '2,263', label: 'Customers on file' },
  { value: '920', label: 'Completed jobs documented' },
  { value: '33', label: 'Virginia service areas' },
];

const SERVICES = [
  { icon: HomeIcon, title: 'Residential Driveway Paving', href: '/residential', desc: 'New installs, overlays, full replacement — built for Virginia clay.' },
  { icon: Building2, title: 'Commercial Parking Lots', href: '/parking-lots', desc: 'Phased execution that keeps your business open during work.' },
  { icon: Droplets, title: 'Sealcoating', href: '/sealcoating', desc: 'Protects against UV, water, and oxidation. Applied on schedule.' },
  { icon: Wrench, title: 'Crack Repair', href: '/crack-repair', desc: 'Hot-pour rubberized filler before water reaches the base.' },
  { icon: Layers, title: 'Tar and Chip', href: '/tar-and-chip', desc: 'Lower-cost bound surface for rural and estate driveways.' },
  { icon: Hammer, title: 'Asphalt Milling', href: '/paving', desc: 'Mill and overlay resurfacing when the base is still sound.' },
];

/* The tools strip. "Softer" was the owner's word: these are presented as
   things the company provides, not as an AI product — and each one works. */
const TOOLS = [
  {
    icon: Ruler,
    title: 'Get a written estimate',
    desc: 'Tell us the job on this page and we will come look at it. Free, itemized, no obligation.',
    href: '#quote',
  },
  {
    icon: Camera,
    title: 'Text us a photo',
    desc: 'Send a picture of the worst of it and we will tell you honestly what it needs — repair, overlay, or nothing yet.',
    href: `sms:${SMS_E164}?&body=${encodeURIComponent(SMS_PREFILL)}`,
  },
  {
    icon: MessageSquare,
    title: 'See it before you build it',
    desc: 'Preview surface options on a photo of your own property with the visualizer.',
    href: '/visualizer',
  },
];

export default function Home() {
  const worstTown = CLIMATE_SPREAD.highest;
  const chester = LOCAL_CLIMATE.find((c) => c.slug === 'chester-va');

  return (
    <div className="min-h-screen bg-white font-body text-gray-800">
      <SEO
        title="Asphalt Paving Virginia | J. Worden & Sons — Chester, Richmond, Chesterfield"
        description="Virginia's trusted asphalt paving contractor since 1984. Driveways, parking lots, sealcoating, crack repair, and tar and chip across Richmond, Chesterfield, Hampton Roads, and all of Virginia."
        canonicalPath="/"
      />
      <HomeSchema />
      <Navbar />

      {/* ── HERO — full-colour photograph, navy overlay for legibility ──── */}
      <section className="relative min-h-[82vh] flex items-end overflow-hidden bg-[#112337]">
        <div className="absolute inset-0">
          {/* LCP hero — responsive AVIF/WebP matches the <link rel="preload">
              in index.html so the browser reuses the preloaded image. */}
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
              alt="J. Worden and Sons crew paving a Virginia driveway"
              width={1600}
              height={900}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </picture>
          {/* THE ALIVE PART, DONE WITH OUR OWN FOOTAGE
              The reference sites feel alive because their heroes move. Theirs
              move with stock clips; this is our crew sealcoating an actual
              job. Mechanics that keep it honest and fast:
                - the preloaded still above stays the LCP, so rankings never
                  pay for the motion; the video fades in over it when ready
                - 2.4MB, muted, looped, playsInline, preload="none" until the
                  still has already painted
                - motion-reduce hides it entirely for visitors who asked
                  their OS for less movement */}
          <video
            className="absolute inset-0 w-full h-full object-cover motion-reduce:hidden"
            src="/videos/sealcoating.mp4"
            poster="/work/portfolio/portfolio-010.webp"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
          />
          {/* One overlay, bottom-weighted, so the photograph stays a photograph. */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#112337] via-[#112337]/55 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pb-16 pt-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/25 text-white text-xs font-semibold uppercase tracking-[0.06em] px-4 py-2 mb-6 rounded">
              <Shield className="w-3.5 h-3.5 text-[#ff7a00]" />
              USDOT 2568168 · Family-Owned Since 1984
            </div>
            <h1 className="font-display text-white text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-5">
              Virginia&rsquo;s asphalt paving contractor,
              <br className="hidden md:block" /> four generations deep.
            </h1>
            <p className="text-white/85 text-lg md:text-xl leading-relaxed max-w-xl mb-8">
              Driveways, parking lots, sealcoating and crack repair — diagnosed honestly,
              built for the ground they sit on, from Richmond to the Blue Ridge.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={`tel:${PHONE_E164}`}
                onClick={() => trackPhoneClick('homepage_hero')}
                className="inline-flex items-center gap-3 bg-[#ff7a00] text-white font-display font-bold text-sm uppercase tracking-[0.04em] px-8 py-4 rounded hover:bg-[#e56d00] transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call {PHONE_DISPLAY}
              </a>
              <a
                href="#quote"
                className="inline-flex items-center gap-3 bg-white text-[#112337] font-display font-bold text-sm uppercase tracking-[0.04em] px-8 py-4 rounded hover:bg-gray-100 transition-colors"
              >
                Get a Free Estimate
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS — every figure has a document behind it ────────────────── */}
      <section className="bg-[#ff7a00]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="py-8 px-6 border-r border-black/10 last:border-r-0 text-center">
                <p className="font-display text-white text-4xl md:text-5xl font-bold tabular-nums">{s.value}</p>
                <p className="text-white/85 text-sm font-semibold uppercase tracking-[0.04em] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TWO DOORS — each buyer hears their own language ──────────────── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[#112337] tracking-tight mb-3">
              One company. Two kinds of work.
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              A homeowner and a property manager need different things from a paving
              contractor. Pick your door and we will talk about yours.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <a href="/residential" className="group relative overflow-hidden rounded-lg border border-gray-200 hover:border-[#ff7a00] transition-colors">
              <div className="aspect-[16/9] overflow-hidden">
                <img src={RESIDENTIAL_IMAGE} alt="Residential driveway paving in Goochland, Virginia" loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
              </div>
              <div className="p-8">
                <h3 className="font-display text-2xl font-bold text-[#112337] mb-2">Homeowners</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Driveways, sealcoating, crack repair. A written estimate, a straight answer
                  about what your driveway actually needs, and a crew that shows up.
                </p>
                <span className="inline-flex items-center gap-2 text-[#ff7a00] font-semibold">
                  Residential paving <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </a>
            <a href="/commercial" className="group relative overflow-hidden rounded-lg border border-gray-200 hover:border-[#ff7a00] transition-colors">
              <div className="aspect-[16/9] overflow-hidden">
                <img src={COMMERCIAL_IMAGE} alt="Commercial parking lot paving, Virginia" loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
              </div>
              <div className="p-8">
                <h3 className="font-display text-2xl font-bold text-[#112337] mb-2">Businesses &amp; Property Managers</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Parking lots, phased night work, multi-site programs. Documented specs,
                  federal motor-carrier registration, and permits you can verify yourself.
                </p>
                <span className="inline-flex items-center gap-2 text-[#ff7a00] font-semibold">
                  Commercial paving <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ── SERVICES — flat cards, real routes ───────────────────────────── */}
      <section id="services" className="py-16 md:py-24 bg-[#f5f6f7]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#112337] tracking-tight mb-10">
            What we do
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <a key={s.title} href={s.href} className="group bg-white rounded-lg border border-gray-200 p-7 hover:border-[#ff7a00] transition-colors">
                <s.icon className="w-8 h-8 text-[#ff7a00] mb-4" />
                <h3 className="font-display text-lg font-bold text-[#112337] mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE MEASURED DIFFERENCE — what the big consolidators cannot say ─ */}
      <section className="py-16 md:py-24 bg-[#112337] text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
          <div>
            <p className="text-[#ff7a00] text-sm font-bold uppercase tracking-[0.06em] mb-3">Measured, not estimated</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
              We spec by what your town&rsquo;s weather actually does.
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              A freeze-thaw cycle — a day that drops below freezing and climbs back out —
              is what turns a hairline crack into a pothole. Across our Virginia service
              areas the measured count runs from {CLIMATE_SPREAD.lowest.freezeThawAvg} cycles
              a year at {CLIMATE_SPREAD.lowest.city} to {worstTown.freezeThawAvg} at{' '}
              {worstTown.city} — thirty years of records, computed for every town we serve.
            </p>
            <p className="text-white/80 leading-relaxed">
              That is why our base and drainage specs change by location instead of
              following one state-wide rule{chester ? ` — and why a ${chester.city} driveway is built for ${chester.freezeThawAvg} cycles a winter, not a national average` : ''}.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[...LOCAL_CLIMATE].sort((a, b) => b.freezeThawAvg - a.freezeThawAvg).slice(0, 6).map((c) => (
              <a key={c.slug} href={`/service-areas/${c.slug}`} className="bg-white/5 border border-white/15 rounded-lg p-5 hover:border-[#ff7a00]/60 transition-colors">
                <p className="font-display text-3xl font-bold tabular-nums text-[#ff7a00]">{c.freezeThawAvg}</p>
                <p className="text-white/70 text-xs uppercase tracking-[0.04em] mt-1">cycles / yr</p>
                <p className="text-white font-semibold text-sm mt-2">{c.city}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOOLS — the abilities, spoken quietly, all functional ────────── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#112337] tracking-tight mb-3">
            Three ways to start
          </h2>
          <p className="text-gray-600 text-lg mb-10 max-w-2xl">
            No forms that go nowhere. Each of these reaches us directly.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {TOOLS.map((t) => (
              <a key={t.title} href={t.href} className="group bg-[#f5f6f7] rounded-lg border border-gray-200 p-7 hover:border-[#ff7a00] transition-colors">
                <t.icon className="w-8 h-8 text-[#ff7a00] mb-4" />
                <h3 className="font-display text-lg font-bold text-[#112337] mb-2">{t.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROOF — records, programme, photographs, reviews. All real. ──── */}
      <PublicRecords brand={BRAND_JWORDEN} />
      <DocumentedRecord />
      <CommercialClientAuthority />
      <CustomerProofGallery />

      <section className="bg-white border-y border-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <LiveReviewBadges />
        </div>
      </section>

      <LegacyStory />
      <NetworkCoverage />

      {/* ── THE ASK — on the page, after the proof ───────────────────────── */}
      <QuoteBlock
        source="homepage"
        heading="Tell Us About the Job"
        intro="Free written estimate anywhere in our Virginia service areas. We look at the ground before we quote the surface, and the number you get is the number it costs."
      />

      <Footer />
    </div>
  );
}
