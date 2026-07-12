import { createFileRoute, Link } from '@tanstack/react-router';
import { useSeo } from '../lib/useSeo';
import SectionBackdrop from '../components/SectionBackdrop';

export const Route = createFileRoute('/gallery')({
  component: GalleryPage,
});

const PHONE = '804-446-1296';
const PHONE_HREF = 'tel:+18044461296';

interface Project {
  src: string;
  alt: string;
  title: string;
  meta: string;
}

const PROJECTS: Project[] = [
  {
    src: '/parking-lot-pave-richmond-va.jpg',
    alt: 'Commercial parking lot paving in Richmond VA',
    title: 'Commercial parking lot',
    meta: 'Richmond, VA',
  },
  {
    src: '/cvs-asphalt-paving.jpg',
    alt: 'CVS pharmacy asphalt parking lot',
    title: 'National retail rollout',
    meta: 'CVS Pharmacy',
  },
  {
    src: '/asphalt-paving-car-lot-on-midlothian.jpg',
    alt: 'Auto dealer car lot paving in Midlothian VA',
    title: 'Auto dealer car lot',
    meta: 'Midlothian, VA',
  },
  {
    src: '/asphalt-driveway-chesterfield-va.jpg',
    alt: 'Residential asphalt driveway in Chesterfield VA',
    title: 'Residential driveway',
    meta: 'Chesterfield, VA',
  },
  {
    src: '/asphalt-paving-with-paver.jpg',
    alt: 'Asphalt paver laying fresh hot mix',
    title: 'Hot-mix lay-down',
    meta: 'Worden crew',
  },
  {
    src: '/jwordenandsonspaving-maidstone-photo.jpeg',
    alt: 'Maidstone estate paving by J. Worden & Sons',
    title: 'Estate driveway',
    meta: 'Maidstone',
  },
];

function GalleryPage() {
  useSeo({
    title: 'Asphalt Paving Work & Project Gallery',
    description:
      'See parking lots, drive-thrus, residential driveways, and estate work paved by J. Worden & Sons across Virginia.',
    path: '/gallery',
  });

  return (
    <main className="bg-premium-black grain text-white antialiased">
      <section className="relative isolate overflow-hidden border-b border-white/[0.04]">
        <SectionBackdrop video="/video/driveway-paving.mp4" opacity={0.65} />
        <div className="relative mx-auto max-w-7xl px-6 py-32 md:py-40">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-white/80">Work</p>
          <h1 className="max-w-4xl text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl">
            Forty years of asphalt across Central Virginia.
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-white/60 md:text-xl">
            Commercial lots for national brands. Residential driveways and historic estates.
          </p>
        </div>
      </section>

      <section className="border-b border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-1 gap-px bg-white/10 md:grid-cols-2 lg:grid-cols-3">
            {PROJECTS.map((p) => (
              <figure key={p.src} className="group bg-black">
                <div className="aspect-[4/3] overflow-hidden bg-white/5">
                  <img
                    src={p.src}
                    alt={p.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <figcaption className="px-2 py-5">
                  <div className="text-base font-medium text-white">{p.title}</div>
                  <div className="text-sm text-white/80">{p.meta}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-32">
          <h2 className="max-w-3xl text-4xl font-medium tracking-tight md:text-5xl">
            Want yours next?
          </h2>
          <p className="mt-6 max-w-xl text-lg text-white/60">
            Call {PHONE} or request an estimate online.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href={PHONE_HREF}
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black hover:bg-white/90"
            >
              Call {PHONE}
            </a>
            <Link
              to="/contact"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white hover:bg-white/5"
            >
              Request online &rarr;
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
