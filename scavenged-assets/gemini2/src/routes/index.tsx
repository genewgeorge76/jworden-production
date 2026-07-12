import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useSeo } from '../lib/useSeo';
import { VideoHero } from '../components/VideoHero';
import GoogleReviewsLive from '../components/GoogleReviewsLive';
import SectionBackdrop from '../components/SectionBackdrop';
import BlogImprint from '../components/BlogImprint';
import { PHONE_DISPLAY as PHONE, PHONE_HREF } from '../lib/businessInfo';

export const Route = createFileRoute('/')({
  component: Home,
});

/**
 * Drop video files into /public/video/ and they'll auto-load.
 * To add a smaller WebM later: re-encode and uncomment the line below.
 */
const HERO_VIDEO_SOURCES = [
  // { src: '/video/hero-paving.webm', type: 'video/webm' },
  { src: '/video/hero-paving.mp4', type: 'video/mp4' },
];
const HERO_POSTER = '/video/hero-paving-poster.jpg';

function Home() {
  useSeo({
    title: 'Asphalt Paving Contractor | Chester, Richmond, Virginia Beach, Charlottesville VA | J. Worden & Sons',
    description:
      'Fourth-generation asphalt paving contractor headquartered in Chester, VA. Serving the Richmond metro, I-95 corridor to Fredericksburg, I-64 east to Virginia Beach, and west to Charlottesville. Driveways, parking lots, sealcoating. Virginia Class A licensed since 1984. Call 804-446-1296.',
    path: '/',
  });

  return (
    <main className="bg-premium-black grain text-white antialiased">
      {/* HERO */}
      <VideoHero
        sources={HERO_VIDEO_SOURCES}
        poster={HERO_POSTER}
        posterAlt="Asphalt milling machine on a J. Worden & Sons jobsite in Virginia"
        overlayOpacity={60}
        className="border-b border-white/[0.04]"
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-32 md:py-48">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-white/90">
            Class A Licensed Asphalt Contractor &middot; Chester, VA &middot; Established 1984
          </p>
          <h1 className="max-w-5xl text-5xl font-light leading-[1.05] tracking-tight text-white/90 md:text-7xl lg:text-8xl">
            Asphalt paving engineered to outlast the building on top of it.
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-white/80 md:text-xl">
            Commercial parking lot construction, residential driveway installation, sealcoating,
            milling and overlay, and ADA striping. Headquartered in Chester, serving the Richmond
            metro, I-95 north to Fredericksburg, I-64 east to Virginia Beach, and west to
            Charlottesville. Family-owned for four generations. Self-performed crews. VDOT-spec
            construction on every project.
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <a
              href={PHONE_HREF}
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black hover:bg-white/90"
            >
              Call for an estimate
            </a>
            <Link
              to="/contact"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
            >
              Request online &rarr;
            </Link>
          </div>
        </div>
      </VideoHero>

      {/* PROOF */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-px bg-white/10 md:grid-cols-3">
          <Stat value="100+" label="Franchise sites paved" sub="KFC &middot; Taco Bell &middot; Arby's" />
          <Stat value="40+" label="Years in business" sub="Family-owned since 1984" />
          <Stat value="50yr" label="Engineered service life" sub="6-inch stone base standard" />
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <SectionBackdrop video="/video/bg-proof.mp4" poster="/images/bg-cta.jpg" opacity={0.8} />
        <div className="relative mx-auto max-w-7xl px-6 py-32 md:py-40">
          <h2 className="max-w-4xl text-4xl font-medium tracking-tight md:text-6xl">
            Ready for a real number?
          </h2>
          <p className="mt-6 max-w-xl text-lg text-white/60">
            Call {PHONE} and a J. Worden picks up. No phone tree, no callback queue.
          </p>
          <a
            href={PHONE_HREF}
            className="btn-primary mt-10"
          >
            Call {PHONE}
          </a>
        </div>
      </section>

      {/* DRIVEWAY FILM */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <FilmReel
          clips={[
            {
              src: '/video/driveway-paving.mp4',
              eyebrow: 'In the field',
              title: 'Residential driveway. Laid hot. Compacted true.',
            },
            {
              src: '/video/parking-lot.mp4',
              eyebrow: 'Commercial',
              title: 'Multi-acre parking lot. Multi-site rollouts.',
            },
            {
              src: '/video/chip-and-tar.mp4',
              eyebrow: 'Surface treatment',
              title: 'Chip & tar. Long-haul rural roads.',
            },
            {
              src: '/video/driveway-stratford-hills.mp4',
              eyebrow: 'Stratford Hills · VA',
              title: 'Estate driveway. Cut clean. Sealed tight.',
            },
            {
              src: '/video/segment-2.mp4',
              eyebrow: 'Production crew',
              title: 'Paver, roller, finishers — in sync.',
            },
            {
              src: '/video/export-1.mp4',
              eyebrow: 'On site',
              title: 'Drone view. Edge-to-edge coverage.',
            },
          ]}
          rate={0.5}
        />
      </section>

      {/* AWARDS & RECOGNITION */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.32em] text-white/45">
            Houzz Awards &amp; Recognition
          </p>
          <h2 className="mt-6 text-center text-3xl font-light tracking-tight text-white md:text-5xl">
            Industry-verified. Four years running.
          </h2>

          <div className="mt-14 flex flex-col items-stretch justify-center gap-8 md:flex-row md:items-center md:gap-10">
            <a
              href="https://www.houzz.com/professionals/paving-contractors/j-worden-sons-asphalt-paving-pfvwus-pf~48430947"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 self-center"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/20 text-base font-medium text-white transition group-hover:border-white">
                h
              </span>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white transition group-hover:text-white/90">
                  Houzz Pro Certified
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Recommended &middot; 4.8★ &middot; 12 reviews &middot; 500+ saves
                </p>
              </div>
            </a>

            <span aria-hidden className="hidden h-10 w-px bg-white/15 md:block" />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['2023', '2016', '2015', '2014'].map((year) => (
                <a
                  key={year}
                  href="https://www.houzz.com/professionals/paving-contractors/j-worden-sons-asphalt-paving-pfvwus-pf~48430947"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="surface-glass lift-hover flex flex-col items-center px-5 py-3"
                >
                  <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/80">
                    Best of Houzz
                  </span>
                  <span className="mt-1 text-2xl font-light tracking-tight text-white">{year}</span>
                </a>
              ))}
            </div>
          </div>

          <p className="mx-auto mt-14 max-w-2xl text-center text-sm leading-relaxed text-white/80">
            Pavement Magazine Top 75 Contractors &mdash; four separate categories. Best of Houzz Service
            Award, multiple years. Nominated, 2026 Pavement Magazine Top Contractor.
          </p>
        </div>
      </section>

      {/* GOOGLE REVIEWS — LIVE */}
      <GoogleReviewsLive />

      {/* SERVICES */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">Asphalt services</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-medium tracking-tight md:text-5xl">
            One Class A contractor for every phase of asphalt construction.
          </h2>
          <p className="mt-6 max-w-2xl text-base text-white/60">
            From subgrade preparation through final striping, J. Worden &amp; Sons self-performs every
            scope of asphalt work \u2014 no subcontracted crews, no broker mark-ups, one accountable
            contractor from bid to warranty.
          </p>
          <div className="mt-16 grid grid-cols-1 gap-px bg-white/10 md:grid-cols-2 lg:grid-cols-3">
            <ServiceCard to="/commercial" title="Commercial Parking Lot Paving" desc="New construction, full-depth reconstruction, and parking-lot expansions for retail, restaurants, medical, and industrial properties." />
            <ServiceCard to="/residential" title="Residential Driveway Paving" desc="Hot-mix asphalt driveway installation, replacement, and estate-grade circular drives on a 6-inch compacted #21A stone base." />
            <ServiceCard to="/sealcoating" title="Sealcoating & Pavement Maintenance" desc="Coal-tar and asphalt-emulsion sealcoats, hot-pour rubberized crack fill, and scheduled maintenance programs that double pavement life." />
            <ServiceCard to="/services" title="Asphalt Patching & Pothole Repair" desc="Saw-cut full-depth patches, base-failure remediation, drive-thru lane repair, and emergency mobilization." />
            <ServiceCard to="/services" title="Milling & Asphalt Overlay" desc="Cold-planed mill-and-fill resurfacing tied flush to existing curb, gutter, and concrete \u2014 no lip, no trip hazard." />
            <ServiceCard to="/services" title="Line Striping & ADA Layout" desc="High-build latex traffic paint, thermoplastic on request, and full ADA layout to current Virginia and federal accessibility code." />
          </div>
          <BlogImprint mode="services" limit={8} />
        </div>
      </section>

      {/* LOCATIONS — 4 CORRIDORS */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <SectionBackdrop video="/video/driveway-paving.mp4" opacity={0.6} />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">Service area</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-medium tracking-tight md:text-5xl">
            Chester to Charlottesville. Richmond to Virginia Beach. One crew, one standard.
          </h2>
          <p className="mt-6 max-w-2xl text-base text-white/80">
            Daily mobilization from our Chester yard. Four corridors, one Class A license,
            40+ years of Virginia paving.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#ffd740]">
                Home Base &middot; Richmond Metro
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {['chester', 'richmond', 'chesterfield', 'henrico', 'midlothian',
                  'colonial-heights', 'mechanicsville', 'glen-allen', 'short-pump',
                  'bon-air', 'tuckahoe', 'sandston', 'hopewell', 'petersburg'].map((s) => (
                  <Link key={s} to={`/locations/${s}`}
                    className="rounded-full border border-white/20 px-4 py-2 text-white/90 hover:bg-white/10 hover:text-white transition">
                    {s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#ffd740]">
                I-95 North Corridor
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {['ashland', 'hanover', 'caroline', 'spotsylvania', 'fredericksburg',
                  'stafford', 'king-george', 'culpeper', 'orange', 'warrenton'].map((s) => (
                  <Link key={s} to={`/locations/${s}`}
                    className="rounded-full border border-white/20 px-4 py-2 text-white/90 hover:bg-white/10 hover:text-white transition">
                    {s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#ffd740]">
                I-64 East &middot; Hampton Roads
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {['williamsburg', 'newportnews', 'hampton', 'norfolk',
                  'virginia-beach', 'chesapeake', 'portsmouth', 'suffolk'].map((s) => (
                  <Link key={s} to={`/locations/${s}`}
                    className="rounded-full border border-white/20 px-4 py-2 text-white/90 hover:bg-white/10 hover:text-white transition">
                    {s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#ffd740]">
                I-64 West &middot; Central Virginia
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {['goochland', 'powhatan', 'louisa', 'fluvanna', 'charlottesville', 'cumberland', 'amelia'].map((s) => (
                  <Link key={s} to={`/locations/${s}`}
                    className="rounded-full border border-white/20 px-4 py-2 text-white/90 hover:bg-white/10 hover:text-white transition">
                    {s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <BlogImprint mode="locations" />
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="surface-glass lift-hover p-10 md:p-12">
      <div className="text-5xl font-medium tracking-tight md:text-6xl">{value}</div>
      <div className="mt-4 text-sm font-medium text-white">{label}</div>
      <div className="mt-1 text-sm text-white/80">{sub}</div>
    </div>
  );
}

function ServiceCard({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="surface-glass lift-hover group block p-10 md:p-12">
      <div className="text-xl font-medium">{title}</div>
      <div className="mt-3 text-sm text-white/60">{desc}</div>
      <div className="mt-8 text-sm text-white/75 transition group-hover:text-white">Learn more &rarr;</div>
    </Link>
  );
}

type Clip = { src: string; eyebrow: string; title: string };

function FilmReel({ clips, rate = 1 }: { clips: Clip[]; rate?: number }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);   // is the current clip faded in?
  const [armed, setArmed] = useState(false);       // user has scrolled the reel into view
  const [holdDone, setHoldDone] = useState(false); // initial 4s black hold has elapsed
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const fadeTimer = useRef<number | null>(null);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const current = clips[idx];

  const FADE_MS = 900;       // fade in / out duration
  const BLACK_GAP_MS = 700;  // explicit black hold between clips
  const INITIAL_HOLD_MS = 4000; // black on first reveal

  // Pre-warm every clip on mount.
  useEffect(() => {
    videoRefs.current.forEach((v) => v && v.load());
  }, []);

  // Arm the reel the first time it scrolls into view.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || armed) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setArmed(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [armed]);

  // Once armed, hold black for 4 seconds before starting clip #1.
  useEffect(() => {
    if (!armed || holdDone) return;
    const t = window.setTimeout(() => setHoldDone(true), INITIAL_HOLD_MS);
    return () => window.clearTimeout(t);
  }, [armed, holdDone]);

  // Drive the active clip after the hold is done.
  useEffect(() => {
    if (!holdDone) return;
    if (fadeTimer.current) {
      window.clearTimeout(fadeTimer.current);
      fadeTimer.current = null;
    }
    setVisible(false);

    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      v.playbackRate = rate;
      if (i === idx) {
        v.currentTime = 0;
        const p = v.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      } else {
        v.pause();
      }
    });
  }, [idx, rate, clips, holdDone]);

  // Fade the active clip out as it nears its end.
  const handleTimeUpdate = (i: number) => {
    if (i !== idx) return;
    const v = videoRefs.current[i];
    if (!v || !isFinite(v.duration)) return;
    const remainingMs = ((v.duration - v.currentTime) / rate) * 1000;
    if (remainingMs <= FADE_MS && visible) setVisible(false);
  };

  const handleEnded = () => {
    if (fadeTimer.current) window.clearTimeout(fadeTimer.current);
    // Hold on solid black for the gap, then advance to next clip.
    fadeTimer.current = window.setTimeout(() => {
      setIdx((i) => (i + 1) % clips.length);
    }, BLACK_GAP_MS);
  };

  return (
    <div ref={sectionRef} className="relative">
      <div className="relative h-[60vh] w-full bg-black md:h-[78vh]">
        {clips.map((c, i) => (
          <video
            key={c.src}
            ref={(el) => {
              videoRefs.current[i] = el;
            }}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[900ms] ease-out [filter:brightness(1.2)_contrast(1.05)_saturate(1.05)] will-change-[opacity,transform] [transform:translateZ(0)] ${
              holdDone && i === idx && visible ? 'opacity-100' : 'opacity-0'
            }`}
            src={c.src}
            muted
            playsInline
            preload="auto"
            onEnded={i === idx ? handleEnded : undefined}
            onTimeUpdate={() => handleTimeUpdate(i)}
            onError={() => setIdx((cur) => (cur === i ? (cur + 1) % clips.length : cur))}
            aria-hidden="true"
          />
        ))}
      </div>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/40 transition-opacity duration-[900ms] ${
          holdDone && visible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-6 pb-10 transition-opacity duration-[900ms] md:pb-14 ${
          holdDone && visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/90">{current.eyebrow}</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-medium tracking-tight text-white md:text-5xl">
          {current.title}
        </h2>
        <div className="mt-6 flex gap-2">
          {clips.map((c, i) => (
            <span
              key={c.src}
              className={`h-px w-8 transition ${i === idx ? 'bg-white' : 'bg-white/25'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
