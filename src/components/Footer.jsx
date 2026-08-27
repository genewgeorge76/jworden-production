import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import { trackPhoneClick } from '@/lib/analytics';
import { PRIMARY_LOGO_URL } from '@/lib/branding';
import SocialLinks from './SocialLinks';
import { LOCATIONS } from '@/lib/locations';
import { getRegionalMarketProfile } from '@/data/regionalMarketProfiles';

// Full state name -> USPS two-letter code. The footer used to derive the
// abbreviation with placename.split(', ')[1].substring(0, 2), which is wrong
// for every state: "Virginia" -> "VI", "North Carolina" -> "No",
// "Georgia" -> "Ge", "Missouri" -> "Mi". Map the real name instead.
const STATE_ABBR = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', 'district of columbia': 'DC',
  florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL',
  indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA',
  maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI',
  minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT',
  nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC',
  'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR',
  pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY',
};

// Resolve the correct two-letter state code from a "City, State" placename.
// Accepts a full state name ("Virginia") or an already-correct code ("VA").
function stateAbbrFromPlacename(placename) {
  const part = (placename || '').split(',')[1]?.trim() || '';
  if (!part) return '';
  if (/^[A-Za-z]{2}$/.test(part)) return part.toUpperCase(); // already an abbr
  return STATE_ABBR[part.toLowerCase()] || part.slice(0, 2).toUpperCase();
}

// Copyright year — derived, not hardcoded, so the footer never goes stale.
const YEAR = new Date().getFullYear();

export default function Footer() {
  const navigate = useNavigate();

  const scrollTo = (href) => {
    if (window.location.pathname !== '/') {
      navigate('/' + href);
      return;
    }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Detect regional market and use its service areas + brand identity,
  // falling back to the J. Worden hub.
  const {
    seoLocations, regionLabel, phoneDisplay, phoneTel,
    brandName, brandTagline, brandBlurb, servingLine, legalNotice,
  } = useMemo(() => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const profile = getRegionalMarketProfile(hostname);

    if (profile?.serviceAreas) {
      const stateAbbr = stateAbbrFromPlacename(profile.geo?.placename);
      const name = profile.marketName || 'J. Worden & Sons';
      const metro = profile.primaryMetro || profile.primaryRegion || 'your area';
      return {
        seoLocations: profile.serviceAreas.map((city) => ({
          city,
          slug: city.toLowerCase().replace(/['\s]+/g, '-'),
          stateAbbr,
        })),
        regionLabel: profile.primaryRegion || 'Regional',
        phoneDisplay: profile.phoneDisplay ? `(${profile.phoneDisplay.slice(0,3)}) ${profile.phoneDisplay.slice(4,7)}-${profile.phoneDisplay.slice(8)}` : '(804) 446-1296',
        phoneTel: `tel:+1${(profile.phoneDisplay || '804-446-1296').replace(/-/g, '')}`,
        brandName: name,
        brandTagline: profile.primaryRegion || 'Asphalt Paving',
        brandBlurb: `Family-owned and operated. 40+ years of asphalt and site work, serving ${profile.primaryRegion || metro}.`,
        // Trade name up front, operating entity disclosed — this is a
        // J. Worden brand, not a separate company, and saying so is both
        // honest and what the FTC/state trade-name rules expect.
        servingLine: `© ${YEAR} ${name} — a brand of J. Worden & Sons Paving LLC. All rights reserved. Serving ${metro} and surrounding areas.`,
        legalNotice: `${name} is a trade name of J. Worden & Sons Paving LLC, an independent Virginia contractor operating at jwordenasphaltpaving.com. Not affiliated with Worden Paving.`,
      };
    }

    // Default: main J. Worden site — Virginia locations
    return {
      seoLocations: LOCATIONS.slice(0, 24),
      regionLabel: 'Virginia',
      phoneDisplay: '(804) 446-1296',
      phoneTel: 'tel:+18044461296',
      brandName: 'J. Worden & Sons',
      brandTagline: 'Asphalt Paving',
      brandBlurb: 'Family-owned and operated. 40+ years paving Virginia — from Hampton Roads to the Blue Ridge.',
      servingLine: `© ${YEAR} J. Worden & Sons Paving LLC. All rights reserved. Serving Richmond, VA and surrounding areas.`,
      legalNotice: 'Independent company notice: J. Worden & Sons Paving LLC operates at jwordenasphaltpaving.com and is not affiliated with Worden Paving.',
    };
  }, []);

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <img
                src={PRIMARY_LOGO_URL}
                alt={`${brandName} logo`}
                width={560}
                height={120}
                className="w-40 h-12 object-contain rounded-md border border-white/20 bg-white p-1"
                sizes="160px"
              />
              <div>
                <p className="font-display font-bold text-white text-sm tracking-[0.08em] uppercase leading-none">
                  {brandName}
                </p>
                <p className="text-[#ff7a00] text-xs tracking-wider uppercase mt-0.5">
                  {brandTagline}
                </p>
              </div>
            </div>
            <p className="font-body text-gray-400 text-sm leading-relaxed mb-6">
              {brandBlurb}
            </p>
            <SocialLinks size="sm" className="opacity-80 hover:opacity-100 transition-opacity" />
          </div>

          {/* Quick links */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
            <h4 className="font-display font-bold text-white text-xs tracking-[0.08em] uppercase mb-6">Navigation</h4>
            <div className="space-y-3">
              {[
                { label: 'Services', href: '#services' },
                { label: 'Our Work', href: '#proof' },
                { label: 'About', href: '#about' },
                { label: 'Get Estimate', href: '#quote' },
              ].map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.href)}
                  className="block font-body text-gray-400 text-sm hover:text-[#ff7a00] transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <a
                href="/blog"
                className="block font-body text-gray-400 text-sm hover:text-[#ff7a00] transition-colors"
              >
                Paving Blog
              </a>
              <a
                href="/locations"
                className="block font-body text-gray-400 text-sm hover:text-[#ff7a00] transition-colors"
              >
                Service Areas
              </a>
              <a
                href="/crew-mode"
                className="block font-body text-gray-600 text-[10px] uppercase font-bold tracking-[0.08em] hover:text-[#ff7a00] transition-colors pt-4"
              >
                Crew Field Portal
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
            <h4 className="font-display font-bold text-white text-xs tracking-[0.08em] uppercase mb-6">Services</h4>
            <div className="space-y-3">
              {['Residential Paving', 'Commercial Paving', 'Industrial Paving', 'Sealcoating', 'Crack Repair', 'Line Striping'].map((s) => (
                <p key={s} className="font-body text-gray-400 text-sm">{s}</p>
              ))}
            </div>
          </div>

          {/* Contact — now uses region-aware phone */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
            <h4 className="font-display font-bold text-white text-xs tracking-[0.08em] uppercase mb-6">Contact</h4>
            <div className="space-y-4">
              <a
                href={phoneTel}
                onClick={() => trackPhoneClick('footer')}
                className="flex items-center gap-3 text-gray-400 hover:text-[#ff7a00] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#ff7a00]" />
                <span className="font-body text-sm">{phoneDisplay}</span>
              </a>
              <a href="mailto:j.wordenandsonspaving@gmail.com" className="flex items-center gap-3 text-gray-400 hover:text-[#ff7a00] transition-colors">
                <Mail className="w-4 h-4 text-[#ff7a00]" />
                <span className="font-body text-sm">j.wordenandsonspaving@gmail.com</span>
              </a>
              {/* Home office. Deliberately the same on every regional brand:
                  all of them are operated by the one Virginia entity, and
                  inventing a local street address would be both untrue and a
                  Google Business Profile violation. */}
              <div className="flex items-start gap-3 text-gray-400">
                <MapPin className="w-4 h-4 text-[#ff7a00] mt-0.5" />
                <span className="font-body text-sm">
                  <span className="block text-[10px] uppercase tracking-[0.08em] text-gray-500 mb-1">Home Office</span>
                  1601 Ware Bottom Spring Rd<br />
                  Suite 214<br />
                  Chester, VA 23836
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Local Flair Block — now region-aware */}
        <div className="mt-16 pt-10 border-t border-white/10">
          <h4 className="font-display font-bold text-white text-sm tracking-[0.08em] uppercase mb-6">{regionLabel} Service Areas</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3">
            {seoLocations.map((loc) => (
              <a 
                key={loc.slug} 
                href={`/locations/${loc.slug}`}
                className="text-xs text-gray-500 hover:text-[#ff7a00] transition-colors truncate"
                title={`Asphalt Paving in ${loc.city}${loc.stateAbbr ? `, ${loc.stateAbbr}` : ''}`}
              >
                {loc.city}{loc.stateAbbr ? `, ${loc.stateAbbr}` : ''}
              </a>
            ))}
          </div>
          <div className="mt-4">
             <a href="/locations" className="text-xs text-[#ff7a00] hover:text-white transition-colors">View All {seoLocations.length}+ {regionLabel} Service Areas &rarr;</a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-body text-gray-500 text-xs text-center sm:text-left">
            {servingLine}
          </p>
          <p className="font-body text-gray-500 text-xs">
            Licensed · Bonded · Insured · Virginia Contractor
          </p>
        </div>
        <p className="font-body text-gray-600 text-[11px] mt-4 text-center sm:text-left">
          {legalNotice}
        </p>
      </div>
    </footer>
  );
}
