import { Link } from '@tanstack/react-router';
import { CITIES, SERVICES, buildSlug, type Service } from '../data/blog';

/**
 * Tiny SEO link grid — minimal on-site footprint, links to a full programmatic
 * blog post for every (service × city) pair.
 *
 * Variants:
 *   mode="services"   — group by service, list cities under each
 *   mode="locations"  — group by city, list services under each
 */

type Props = {
  mode: 'services' | 'locations';
  /** Limit number of cities shown per service (services mode) or services per city (locations mode). 0 = all. */
  limit?: number;
};

export function BlogImprint({ mode, limit = 0 }: Props) {
  if (mode === 'services') {
    return (
      <div className="mt-16 border-t border-white/10 pt-10">
        <p className="text-[10px] uppercase tracking-[0.32em] text-white/75">
          Field notes &middot; service area coverage
        </p>
        <div className="mt-6 grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <ServiceColumn key={s.slug} service={s} limit={limit} />
          ))}
        </div>
        <p className="mt-8 text-[10px] uppercase tracking-[0.28em] text-white/35">
          Each link opens a long-form post engineered for that city. Same crew, same standard, same phone.
        </p>
      </div>
    );
  }

  // locations mode — collapsible by region. Tight footprint, full coverage.
  const regions = Array.from(new Set(CITIES.map((c) => c.region)));
  return (
    <div className="mt-16 border-t border-white/10 pt-10">
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] uppercase tracking-[0.32em] text-white/75">
          Field notes &middot; city pages
        </p>
        <p className="text-[10px] uppercase tracking-[0.28em] text-white/70">
          {CITIES.length} cities &middot; {SERVICES.length} services &middot; {CITIES.length * SERVICES.length} posts
        </p>
      </div>
      <div className="mt-6 divide-y divide-white/[0.06] border-y border-white/[0.06]">
        {regions.map((region) => {
          const cities = CITIES.filter((c) => c.region === region);
          return (
            <details key={region} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 transition hover:bg-white/[0.02]">
                <span className="text-[11px] uppercase tracking-[0.28em] text-white/55 group-open:text-white/85">
                  {region}
                </span>
                <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.24em] text-white/35">
                  <span>{cities.length} cities</span>
                  <span className="inline-block h-px w-6 bg-white/15 transition group-open:rotate-90" />
                </span>
              </summary>
              <div className="grid grid-cols-2 gap-x-8 gap-y-5 pb-6 pt-2 sm:grid-cols-3 md:grid-cols-4">
                {cities.map((c) => (
                  <CityColumn key={c.name} city={c.name} />
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

function ServiceColumn({ service, limit }: { service: Service; limit: number }) {
  const cities = limit > 0 ? CITIES.slice(0, limit) : CITIES;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">{service.name}</p>
      <ul className="mt-3 space-y-1.5">
        {cities.map((c) => (
          <li key={c.name}>
            <Link
              to="/blog/$slug"
              params={{ slug: buildSlug(service.slug, c.name) }}
              className="text-[11px] leading-tight text-white/45 transition hover:text-white"
            >
              {service.name} in {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CityColumn({ city }: { city: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">{city}</p>
      <ul className="mt-3 space-y-1.5">
        {SERVICES.map((s) => (
          <li key={s.slug}>
            <Link
              to="/blog/$slug"
              params={{ slug: buildSlug(s.slug, city) }}
              className="text-[11px] leading-tight text-white/45 transition hover:text-white"
            >
              {s.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BlogImprint;
