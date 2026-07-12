import { createFileRoute, Link } from '@tanstack/react-router';
import { useSeo } from '../lib/useSeo';
import SectionBackdrop from '../components/SectionBackdrop';
import { PHONE_DISPLAY as PHONE, PHONE_HREF } from '../lib/businessInfo';

export const Route = createFileRoute('/the-worden-standard')({
  component: WordenStandardPage,
});

const SPECS = [
  {
    title: '6-inch compacted #21A structural stone base',
    body:
      'Engineered aggregate base graded to slope and rolled to 95% Standard Proctor density on every project. The single largest predictor of long-term pavement life — and the first specification a low bidder cuts. We document base depth on closeout.',
  },
  {
    title: '96% Marshall mat density verification',
    body:
      'In-place density confirmed on site with nuclear gauge readings rather than estimated on the bid sheet. Density results, mix tickets, and compaction reports are delivered with your project closeout package.',
  },
  {
    title: 'VDOT Section 315 hot-mix asphalt',
    body:
      'Aggregate gradation, asphalt cement content, and lift thickness conform to current Virginia Department of Transportation highway-construction specification — public-works quality applied to every private job.',
  },
  {
    title: 'Self-performed crews, zero brokering',
    body:
      'Every grading operator, paver operator, screed hand, and roller operator on your project is a J. Worden & Sons employee. No subcontracted crews, no day-labor finish work, no brokered scope.',
  },
  {
    title: 'Class A Virginia contractor license',
    body:
      'Class A licensed in Virginia, Maryland, and North Carolina. $2 million general liability and full workers’ compensation insurance carried and verifiable on request.',
  },
  {
    title: 'BBB A+ accreditation since 1994',
    body:
      'Better Business Bureau A+ rated continuously since 1994. Four-time Best of Houzz award winner. National preferred contractor for KFC, Taco Bell, and Arby’s remodel programs.',
  },
];

const PROCESS = [
  {
    step: '01',
    title: 'On-site measurement and subgrade evaluation',
    body:
      'J. Worden & Sons walks every job, measures the work area, evaluates drainage and existing base condition, and identifies any required tear-out, undercut, or stabilization before quoting a number.',
  },
  {
    step: '02',
    title: 'Written, VDOT-referenced scope of work',
    body:
      'Every estimate documents lift thickness, base depth, aggregate gradation, mix design, and compaction targets in writing — referenced to current Virginia DOT specification. What you sign is what gets installed.',
  },
  {
    step: '03',
    title: 'Crew mobilization, base prep, and tack',
    body:
      'Self-performed crews mobilize from our Chester yard with our own paver, rollers, dump trucks, and skid-steers. Subgrade is graded and compacted, base stone is laid and rolled to spec, then a uniform tack coat is applied.',
  },
  {
    step: '04',
    title: 'Hot-mix placement and finish rolling',
    body:
      'Asphalt is placed at temperature with continuous load monitoring. Breakdown, intermediate, and finish rollers achieve target density before mat cools below specification. Joints are sealed; edges are formed by hand.',
  },
  {
    step: '05',
    title: 'In-place density verification and closeout',
    body:
      'Nuclear-gauge density readings are taken on the finished mat. Compaction results, mix tickets, weight tickets, and as-built measurements are compiled into a project closeout package delivered to the owner.',
  },
];

export default function WordenStandardPage() {
  useSeo({
    title: 'The Worden Standard | Asphalt Construction Specifications | J. Worden & Sons',
    description:
      'The construction specifications written into every J. Worden & Sons asphalt paving contract: 6-inch compacted #21A stone base, 96% Marshall density verified on site, VDOT Section 315 hot-mix asphalt, self-performed crews, Class A Virginia license, BBB A+ since 1994.',
    path: '/the-worden-standard',
  });

  return (
    <main className="bg-premium-black grain text-white antialiased">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <SectionBackdrop video="/video/hero-paving.mp4" opacity={0.7} />
        <div className="relative mx-auto max-w-5xl px-6 py-32 md:py-40">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-white/80">
            Construction specifications
          </p>
          <h1 className="max-w-4xl text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl">
            The Worden Standard.
          </h1>
          <p className="mt-8 max-w-3xl text-lg text-white/60 md:text-xl">
            The exact construction specifications written into every J. Worden &amp; Sons asphalt
            paving contract — from a single residential driveway to a multi-acre commercial parking
            lot. Documented to VDOT specification, verified on site, delivered with your project
            closeout package.
          </p>
        </div>
      </section>

      {/* Specs */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <div className="relative mx-auto max-w-5xl px-6 py-24">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">Six contract specifications</p>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
            What gets written into every project, regardless of size.
          </h2>
          <ul className="mt-16 divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {SPECS.map((s, i) => (
              <li key={s.title} className="grid grid-cols-1 gap-6 py-10 md:grid-cols-[80px_1fr] md:gap-12">
                <div className="text-xs font-medium uppercase tracking-[0.3em] text-white/75">0{i + 1}</div>
                <div>
                  <div className="text-2xl font-medium tracking-tight">{s.title}</div>
                  <p className="mt-3 text-base leading-relaxed text-white/60">{s.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Process */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <SectionBackdrop video="/video/parking-lot.mp4" opacity={0.6} />
        <div className="relative mx-auto max-w-5xl px-6 py-24">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">Construction process</p>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
            From measurement through compaction verification.
          </h2>
          <ol className="mt-16 space-y-12">
            {PROCESS.map((p) => (
              <li key={p.step} className="grid grid-cols-1 gap-6 md:grid-cols-[100px_1fr] md:gap-12">
                <div className="text-3xl font-medium tracking-tight text-white/70">{p.step}</div>
                <div>
                  <div className="text-2xl font-medium tracking-tight">{p.title}</div>
                  <p className="mt-3 text-base leading-relaxed text-white/60">{p.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate overflow-hidden">
        <SectionBackdrop video="/video/bg-awards.mp4" opacity={0.6} />
        <div className="relative mx-auto max-w-7xl px-6 py-32">
          <h2 className="max-w-3xl text-4xl font-medium tracking-tight md:text-5xl">
            Ready for a real number, not a guess?
          </h2>
          <p className="mt-6 max-w-xl text-lg text-white/60">
            Call {PHONE} and a J. Worden picks up. We&rsquo;ll come walk the job.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href={PHONE_HREF} className="btn-primary">Call {PHONE}</a>
            <Link to="/contact" className="btn-ghost">Request estimate &rarr;</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
