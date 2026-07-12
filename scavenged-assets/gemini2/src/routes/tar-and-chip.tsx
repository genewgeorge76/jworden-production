import { createFileRoute, Link } from '@tanstack/react-router';
import { useSeo } from '../lib/useSeo';
import SectionBackdrop from '../components/SectionBackdrop';
import { CITIES } from '../data/cities';
import { PHONE_DISPLAY as PHONE, PHONE_HREF } from '../lib/businessInfo';

export const Route = createFileRoute('/tar-and-chip')({
  component: TarAndChipPage,
});

const RURAL = [
  'powhatan', 'goochland', 'hanover', 'new-kent', 'amelia', 'cumberland',
  'fluvanna', 'louisa', 'orange', 'king-william', 'charles-city', 'dinwiddie',
];

const APPLICATIONS = [
  {
    title: 'Long farm and agricultural lanes',
    body:
      'Sealed driving surface for grain hoppers, tractors, dually trucks, and equipment trailers. Eliminates the washouts and dust of gravel without the cost of full-depth hot-mix asphalt.',
  },
  {
    title: 'Equestrian and ranch driveways',
    body:
      'Quiet, low-glare surface that handles horse trailers, hay trucks, and farrier visits without raveling. Aggregate cover provides positive traction in wet weather.',
  },
  {
    title: 'Vineyard and orchard access roads',
    body:
      'Dust-controlled access for harvest equipment and visitor traffic without sealing the surrounding soil. Lower thermal mass than asphalt — important next to root zones.',
  },
  {
    title: 'HOA-maintained private lanes',
    body:
      'Cost-effective surface for private subdivision roads, common drives, and shared easements. Maintains a paved appearance at a fraction of hot-mix construction cost.',
  },
  {
    title: 'Estate and gated entry drives',
    body:
      'Distinctive textured finish appropriate for historic and country properties where a glossy black asphalt aesthetic would be out of place.',
  },
];

export default function TarAndChipPage() {
  useSeo({
    title: 'Tar & Chip / Chip Seal Driveways in Virginia | Farm, Estate & Rural | J. Worden & Sons',
    description:
      'Bituminous surface treatment (tar & chip / chip seal) for long farm lanes, equestrian properties, vineyard access roads, and HOA-maintained private lanes throughout Powhatan, Goochland, Hanover, New Kent, Amelia, Cumberland, Fluvanna, Louisa, and Orange counties. Class A licensed contractor. Call 804-446-1296.',
    path: '/tar-and-chip',
  });

  return (
    <main className="bg-premium-black grain text-white antialiased">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <SectionBackdrop video="/video/chip-and-tar.mp4" />
        <div className="relative mx-auto max-w-5xl px-6 py-32 md:py-40">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-white/80">
            Bituminous surface treatment
          </p>
          <h1 className="max-w-4xl text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl">
            Tar &amp; chip driveways for farms, estates &amp; private rural roads.
          </h1>
          <p className="mt-8 max-w-3xl text-lg text-white/60 md:text-xl">
            The most cost-effective durable surface for long rural driveways and private lanes
            across Central Virginia. A precisely metered asphalt-emulsion binder is sprayed over a
            compacted stone base, then locked in with a uniform aggregate cover and rolled to
            refusal.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href={PHONE_HREF} className="btn-primary">Call {PHONE}</a>
            <Link to="/contact" className="btn-ghost">Request estimate &rarr;</Link>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <div className="relative mx-auto max-w-3xl px-6 py-24">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">What it is</p>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
            A sealed, dust-free driving surface engineered for rural use.
          </h2>
          <div className="mt-10 space-y-6 text-lg leading-relaxed text-white/70">
            <p>
              Tar &amp; chip — technically known as a bituminous surface treatment, often called
              chip seal — is a paving method developed for low-volume rural and county roads.
              A controlled spray of asphalt emulsion is applied to a prepared aggregate base,
              followed immediately by a uniform layer of cover stone, then locked in place with
              a steel-wheel and rubber-tire rolling sequence.
            </p>
            <p>
              The result is a sealed driving surface that handles tractors, dually trucks,
              horse trailers, and grain hoppers without raveling. Aggregate provides positive
              traction in wet and freeze-thaw conditions, while the binder prevents the water
              infiltration that destroys gravel driveways and tracked-in stone aprons.
            </p>
            <p>
              Construction cost typically runs a fraction of full-depth hot-mix asphalt, making
              it the right specification for long lanes and access roads where hot-mix would be
              budget-prohibitive but gravel is no longer adequate.
            </p>
          </div>
        </div>
      </section>

      {/* Applications */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <SectionBackdrop video="/video/driveway-stratford-hills.mp4" />
        <div className="relative mx-auto max-w-5xl px-6 py-24">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">Where it fits</p>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
            The right surface for the right property.
          </h2>
          <ul className="mt-16 divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {APPLICATIONS.map((a, i) => (
              <li key={a.title} className="grid grid-cols-1 gap-6 py-10 md:grid-cols-[80px_1fr] md:gap-12">
                <div className="text-xs font-medium uppercase tracking-[0.3em] text-white/75">0{i + 1}</div>
                <div>
                  <div className="text-2xl font-medium tracking-tight">{a.title}</div>
                  <p className="mt-3 text-base leading-relaxed text-white/60">{a.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Service area */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04] bg-black">
        <div className="relative mx-auto max-w-5xl px-6 py-20">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">
            Rural service area
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-medium tracking-tight md:text-4xl">
            Counties we serve from our Chester, VA yard.
          </h2>
          <div className="mt-10 flex flex-wrap gap-2 text-sm">
            {RURAL.map((slug) => {
              const c = CITIES.find((x) => x.slug === slug);
              if (!c) return null;
              return (
                <Link
                  key={slug}
                  to={`/locations/${slug}` as string}
                  className="rounded-full border border-white/15 px-4 py-2 text-white/70 hover:bg-white/5 hover:text-white"
                >
                  {c.name}
                  {c.county ? <span className="text-white/75"> &middot; {c.county} Co.</span> : null}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate overflow-hidden">
        <SectionBackdrop video="/video/bg-awards.mp4" />
        <div className="relative mx-auto max-w-7xl px-6 py-32">
          <h2 className="max-w-3xl text-4xl font-medium tracking-tight md:text-5xl">
            Ready for a real number, not a guess?
          </h2>
          <p className="mt-6 max-w-xl text-lg text-white/60">
            Call {PHONE} and a J. Worden picks up. We&rsquo;ll come walk the lane — no commissioned
            salesperson, no obligation.
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
