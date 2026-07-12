import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { trackPhoneClick } from '@/lib/analytics';
import { PRIMARY_LOGO_URL } from '@/lib/branding';
import SocialLinks from './SocialLinks';
import { LOCATIONS } from '@/lib/locations';

export default function Footer() {
  const scrollTo = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Take top 24 locations for the SEO footer grid
  const seoLocations = LOCATIONS.slice(0, 24);

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <img
                src={PRIMARY_LOGO_URL}
                alt="J. Worden & Sons Paving LLC logo"
                width={560}
                height={120}
                className="w-40 h-12 object-contain rounded-md border border-white/20 bg-white p-1"
                sizes="160px"
              />
              <div>
                <p className="font-display font-bold text-white text-sm tracking-widest uppercase leading-none">
                  J. Worden & Sons
                </p>
                <p className="text-[#ff7a00] text-xs tracking-wider uppercase mt-0.5">
                  Asphalt Paving
                </p>
              </div>
            </div>
            <p className="font-body text-gray-400 text-sm leading-relaxed mb-6">
              Family-owned and operated. 40+ years paving Virginia — from Hampton Roads to the Blue Ridge.
            </p>
            <SocialLinks size="sm" className="opacity-80 hover:opacity-100 transition-opacity" />
          </div>

          {/* Quick links */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
            <h4 className="font-display font-bold text-white text-xs tracking-[0.2em] uppercase mb-6">Navigation</h4>
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
                className="block font-body text-gray-600 text-[10px] uppercase font-black tracking-widest hover:text-[#ff7a00] transition-colors pt-4"
              >
                Crew Field Portal
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
            <h4 className="font-display font-bold text-white text-xs tracking-[0.2em] uppercase mb-6">Services</h4>
            <div className="space-y-3">
              {['Residential Paving', 'Commercial Paving', 'Industrial Paving', 'Sealcoating', 'Crack Repair', 'Line Striping'].map((s) => (
                <p key={s} className="font-body text-gray-400 text-sm">{s}</p>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
            <h4 className="font-display font-bold text-white text-xs tracking-[0.2em] uppercase mb-6">Contact</h4>
            <div className="space-y-4">
              <a
                href="tel:+18044461296"
                onClick={() => trackPhoneClick('footer')}
                className="flex items-center gap-3 text-gray-400 hover:text-[#ff7a00] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#ff7a00]" />
                <span className="font-body text-sm">(804) 446-1296</span>
              </a>
              <a href="mailto:j.wordenandsonspaving@gmail.com" className="flex items-center gap-3 text-gray-400 hover:text-[#ff7a00] transition-colors">
                <Mail className="w-4 h-4 text-[#ff7a00]" />
                <span className="font-body text-sm">j.wordenandsonspaving@gmail.com</span>
              </a>
              <div className="flex items-start gap-3 text-gray-400">
                <MapPin className="w-4 h-4 text-[#ff7a00] mt-0.5" />
                <span className="font-body text-sm">
                  1601 Ware Bottom Spring Rd<br />
                  Suite 214<br />
                  Chester, VA 23836
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Local Flair Block - Satisfies Google Helpful Content Local Density */}
        <div className="mt-16 pt-10 border-t border-white/10">
          <h4 className="font-display font-bold text-white text-sm tracking-[0.2em] uppercase mb-6">Virginia Service Areas</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3">
            {seoLocations.map((loc) => (
              <a 
                key={loc.slug} 
                href={`/locations/${loc.slug}`}
                className="text-xs text-gray-500 hover:text-[#ff7a00] transition-colors truncate"
                title={`Asphalt Paving in ${loc.city}, ${loc.stateAbbr}`}
              >
                {loc.city}, {loc.stateAbbr}
              </a>
            ))}
          </div>
          <div className="mt-4">
             <a href="/locations" className="text-xs text-[#ff7a00] hover:text-white transition-colors">View All 50+ Virginia Service Areas &rarr;</a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-body text-gray-500 text-xs text-center sm:text-left">
            © 2026 J. Worden & Sons Paving LLC. All rights reserved. Serving Richmond, VA and surrounding areas.
          </p>
          <p className="font-body text-gray-500 text-xs">
            Licensed · Bonded · Insured · VA Contractor
          </p>
        </div>
        <p className="font-body text-gray-600 text-[11px] mt-4 text-center sm:text-left">
          Independent company notice: J. Worden & Sons Paving LLC operates at jwordenasphaltpaving.com and is not affiliated with Worden Paving.
        </p>
      </div>
    </footer>
  );
}
