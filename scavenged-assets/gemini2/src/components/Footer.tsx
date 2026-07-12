import { Link } from '@tanstack/react-router';
import { PHONE_DISPLAY as PHONE, PHONE_HREF, EMAIL, ADDRESS } from '../lib/businessInfo';

const REGIONS: { name: string; cities: string[] }[] = [
  {
    name: 'Greater Richmond',
    cities: ['Richmond', 'Midlothian', 'Tuckahoe', 'Short Pump', 'Glen Allen', 'Mechanicsville', 'Bon Air', 'Lakeside'],
  },
  {
    name: 'Chesterfield & Tri-Cities',
    cities: ['Chester', 'Chesterfield', 'Petersburg', 'Hopewell', 'Colonial Heights', 'Moseley', 'Dinwiddie', 'Prince George'],
  },
  {
    name: 'Hampton Roads',
    cities: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Newport News', 'Hampton', 'Suffolk', 'Portsmouth', 'Williamsburg'],
  },
  {
    name: 'Surrounding Counties',
    cities: ['Hanover', 'Henrico', 'Powhatan', 'Goochland', 'New Kent', 'Amelia', 'Ashland', 'Charles City'],
  },
];

const SERVICE_LINKS = [
  { label: 'Commercial', to: '/commercial' },
  { label: 'Residential', to: '/residential' },
  { label: 'Sealcoating', to: '/sealcoating' },
  { label: 'Services', to: '/services' },
  { label: 'Work', to: '/gallery' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const SLUG_OVERRIDES: Record<string, string> = {
  'Newport News': 'newportnews',
};
const slug = (city: string) =>
  SLUG_OVERRIDES[city] ?? city.toLowerCase().replace(/\s+/g, '-');

const trackPhone = () => {
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (w.gtag) w.gtag('event', 'click', { event_category: 'phone_call', event_label: PHONE });
};

const META = 'text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-500/70';
const COL = 'text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500';

export default function Footer() {
  return (
    <footer className="relative isolate overflow-hidden border-t border-slate-800/50 bg-black/60 z-10 font-sans">
      <div className="relative mx-auto max-w-[1320px] px-8 py-4">
        {/* CTA row */}
        <div className="grid grid-cols-12 gap-8 border-b border-slate-800/50 py-12">
          <div className="col-span-12 md:col-span-7">
            <p className={META}>Ready when you are</p>
            <h2 className="mt-4 text-3xl font-light leading-[1.1] tracking-tight text-slate-300 md:text-4xl">
              Pavement built to last.
              <span className="text-slate-600"> Quoted in 24 hours.</span>
            </h2>
          </div>
          <div className="col-span-12 flex flex-wrap items-end gap-x-8 gap-y-3 md:col-span-5 md:justify-end">
            <a
              href={PHONE_HREF}
              onClick={trackPhone}
              className="group inline-flex items-baseline gap-3 text-sm text-slate-300"
            >
              <span className={META}>Call</span>
              <span className="text-base font-medium tracking-wide text-cyan-400 transition group-hover:text-cyan-300">
                {PHONE}
              </span>
            </a>
            <Link
              to="/contact"
              className="group inline-flex items-baseline gap-3 text-sm text-slate-300"
            >
              <span className={META}>Estimate</span>
              <span className="text-base font-medium tracking-wide text-cyan-400 transition group-hover:text-cyan-300">
                Request →
              </span>
            </Link>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-8 py-16">
          <div className="col-span-12 md:col-span-4">
            <p className="text-[12px] tracking-[0.32em] text-cyan-500 font-bold">J. WORDEN &amp; SONS</p>
            <p className="mt-6 max-w-[28ch] text-sm leading-relaxed text-slate-400">
              Family-owned asphalt paving since 1984. Headquartered in Chester, Virginia. Class A Contractor.
            </p>

            <dl className="mt-10 space-y-5 text-sm">
              <div>
                <dt className={COL}>Headquarters</dt>
                <dd className="mt-2 text-slate-300">
                  {ADDRESS.streetAddress}<br />
                  {ADDRESS.addressLocality}, {ADDRESS.addressRegion} {ADDRESS.postalCode}
                </dd>
              </div>
              <div>
                <dt className={COL}>Direct</dt>
                <dd className="mt-2">
                  <a
                    href={PHONE_HREF}
                    onClick={trackPhone}
                    className="text-cyan-400 transition hover:text-cyan-300"
                  >
                    {PHONE}
                  </a>
                </dd>
              </div>
              <div>
                <dt className={COL}>Estimates</dt>
                <dd className="mt-2">
                  <a
                    href={`mailto:${EMAIL}`}
                    className="text-cyan-400 transition hover:text-cyan-300"
                  >
                    {EMAIL}
                  </a>
                </dd>
              </div>
              <div>
                <dt className={COL}>Hours</dt>
                <dd className="mt-2 text-slate-300">
                  Mon – Fri · 7am – 6pm<br />
                  Sat · By appointment
                </dd>
              </div>
            </dl>
          </div>

          <div className="col-span-12 md:col-span-8">
            <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-5">
              <div className="col-span-2 md:col-span-1">
                <p className={COL}>Services</p>
                <ul className="mt-6 space-y-3 text-sm">
                  {SERVICE_LINKS.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to as string} className="text-slate-400 transition hover:text-cyan-400">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {REGIONS.map((region) => (
                <div key={region.name} className="col-span-1">
                  <p className={COL}>{region.name}</p>
                  <ul className="mt-6 space-y-3 text-sm">
                    {region.cities.map((city) => (
                      <li key={city}>
                        <Link
                          to={`/locations/${slug(city)}` as string}
                          className="text-slate-400 transition hover:text-cyan-400"
                        >
                          {city}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom hairline */}
        <div className="flex flex-col gap-4 border-t border-slate-800/50 py-8 text-[11px] uppercase tracking-[0.18em] text-slate-500 font-mono md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} J. Worden &amp; Sons Asphalt Paving</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>Class A Contractor</span>
            <span aria-hidden className="hidden h-px w-3 bg-slate-800 md:inline-block" />
            <span>VA · MD · NC</span>
            <span aria-hidden className="hidden h-px w-3 bg-slate-800 md:inline-block" />
            <span>Chester, Virginia</span>
          </div>
        </div>
      </div>
      
      {/* Bottom Data Strip - Immersive UI Theme */}
      <div className="h-12 border-t border-slate-800/50 flex items-center px-8 space-x-12 bg-black/60 z-10 w-full mt-4">
        <div className="flex items-center space-x-4 overflow-hidden">
          <span className="text-[10px] font-mono text-cyan-500 whitespace-nowrap">NODE-ALPHA: CONNECTED</span>
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-cyan-500/40"></div>
            <div className="w-1 h-3 bg-cyan-500/60"></div>
            <div className="w-1 h-3 bg-cyan-500/80"></div>
            <div className="w-1 h-3 bg-cyan-500"></div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden hidden md:block">
           <div className="flex space-x-16 text-[9px] font-mono tracking-widest text-slate-500 uppercase">
             <span>LOX PRESSURE: 104%</span>
             <span>EPS BUS VOLTAGE: 28.5V</span>
             <span>COMM LINK: STABLE [L-BAND]</span>
             <span>GNC STATE: PRECISION</span>
             <span>CREW STATUS: OPTIMAL</span>
           </div>
        </div>
        <div className="text-[10px] font-bold text-white whitespace-nowrap">v.04.15.71</div>
      </div>
    </footer>
  );
}
