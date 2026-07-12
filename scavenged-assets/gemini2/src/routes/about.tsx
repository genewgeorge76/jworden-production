import { createFileRoute, Link } from '@tanstack/react-router';
import { useSeo } from '../lib/useSeo';
import SectionBackdrop from '../components/SectionBackdrop';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

const PHONE = '804-446-1296';
const PHONE_HREF = 'tel:+18044461296';

const TIMELINE = [
  { year: '1984', label: 'Founded in Chester, Virginia.' },
  { year: '1994', label: 'BBB A+ accreditation. Class A Virginia license.' },
  { year: '2014', label: 'First of four Best of Houzz awards.' },
  { year: '2018', label: 'Crossed 100 franchise sites paved (KFC, Taco Bell, Arby’s).' },
  { year: '2026', label: '4th-generation operation. 50-state licensure footprint.' },
];

function AboutPage() {
  useSeo({
    title: 'About J. Worden & Sons | 4th-Generation Asphalt Paving Contractor in Chester, VA',
    description:
      'Family-owned, fourth-generation asphalt paving contractor headquartered in Chester, Virginia. Class A licensed, BBB A+ accredited, four-time Best of Houzz, and national preferred contractor for KFC, Taco Bell, and Arby\u2019s. Serving Greater Richmond since 1984.',
    path: '/about',
  });

  return (
    <main className="bg-premium-black grain text-white antialiased">
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <SectionBackdrop video="/video/driveway-paving.mp4" opacity={0.7} />
        <div className="relative mx-auto max-w-7xl px-6 py-32 md:py-40">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-white/80">About the company</p>
          <h1 className="max-w-4xl text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl">
            Four generations of asphalt paving. One uncompromising standard.
          </h1>
          <p className="mt-8 max-w-3xl text-lg text-white/60 md:text-xl">
            J. Worden &amp; Sons Asphalt Paving has served Chester, Chesterfield County, and the Greater
            Richmond region since 1984. We are a Class A Virginia contractor, BBB A+ accredited,
            and a national preferred-contractor partner to Yum! Brands and Inspire Brands. Every
            estimate is walked, scoped, and approved by Mr. Worden — not a
            commissioned salesperson — and every crew on your property is a direct employee of
            this company.
          </p>
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">Company history</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-medium tracking-tight md:text-5xl">
            Forty-plus years of paving the Mid-Atlantic.
          </h2>
          <div className="mt-12 divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {TIMELINE.map((t) => (
              <div key={t.year} className="grid grid-cols-1 gap-4 px-2 py-8 md:grid-cols-[120px_1fr] md:gap-12">
                <div className="text-3xl font-medium tracking-tight text-white/90">{t.year}</div>
                <div className="text-lg text-white/70">{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <SectionBackdrop video="/video/parking-lot.mp4" opacity={0.6} />
        <div className="relative mx-auto max-w-5xl px-6 py-28 text-center md:py-36">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">Construction specifications</p>
          <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-medium tracking-tight md:text-6xl">
            Built to a documented standard.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base text-white/60">
            VDOT-spec construction, written into every contract, verified on site by a Worden.
          </p>
          <div className="mt-10">
            <Link to="/the-worden-standard" className="btn-ghost">
              Read the Worden Standard &rarr;
            </Link>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden">
        <SectionBackdrop video="/video/bg-awards.mp4" opacity={0.7} />
        <div className="relative mx-auto max-w-7xl px-6 py-32">
          <h2 className="max-w-3xl text-4xl font-medium tracking-tight md:text-5xl">
            Talk to a Worden.
          </h2>
          <p className="mt-6 max-w-xl text-lg text-white/60">
            No call center. Call {PHONE} and a family member picks up.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href={PHONE_HREF} className="btn-primary">
              Call {PHONE}
            </a>
            <Link to="/contact" className="btn-ghost">
              Request online &rarr;
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
