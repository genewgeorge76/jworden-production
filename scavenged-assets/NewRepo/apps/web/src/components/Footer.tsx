import React from 'react';
import { Link } from '@tanstack/react-router';
import {
  BUSINESS_NAME,
  BUSINESS_PHONE,
  BUSINESS_SINCE,
  SITE_URL,
} from '@jworden/core';

const SERVICES = [
  { label: 'Asphalt Paving', href: '/services' },
  { label: 'Sealcoating', href: '/services' },
  { label: 'Parking Lot Paving', href: '/services' },
  { label: 'Crack Filling', href: '/services' },
  { label: 'Concrete Work', href: '/services' },
  { label: 'Grading & Excavation', href: '/services' },
];

const AREAS = [
  'Richmond, VA', 'Chesterfield', 'Henrico',
  'Mechanicsville', 'Midlothian', 'Chester',
  'Colonial Heights', 'Glen Allen', 'Ashland',
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="text-white font-bold text-lg mb-2">{BUSINESS_NAME.split('Paving')[0] + 'Paving'}</div>
            <div className="text-yellow-500 text-xs font-semibold mb-3">& General Contracting</div>
            <p className="text-sm leading-relaxed mb-4">
              4th-generation excellence since {BUSINESS_SINCE}. Serving Central Virginia with municipal-grade asphalt paving.
            </p>
            <a
              href={`tel:+1${BUSINESS_PHONE.replace(/\D/g, '')}`}
              className="text-yellow-400 font-bold text-lg no-underline hover:text-yellow-300 transition-colors"
            >
              {BUSINESS_PHONE}
            </a>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">Services</h3>
            <ul className="space-y-2">
              {SERVICES.map((s) => (
                <li key={s.label}>
                  <Link to={s.href} className="text-sm hover:text-white transition-colors no-underline">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Areas */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">Service Areas</h3>
            <ul className="space-y-2">
              {AREAS.map((a) => (
                <li key={a} className="text-sm">{a}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">Contact</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Phone</div>
                <a href={`tel:+1${BUSINESS_PHONE.replace(/\D/g, '')}`} className="text-yellow-400 no-underline hover:text-yellow-300">
                  {BUSINESS_PHONE}
                </a>
              </div>
              <div>
                <div className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Headquarters</div>
                <div>Chester, VA 23836</div>
                <div>Serving 150-mile radius</div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Hours</div>
                <div>Mon–Fri 7 AM – 6 PM</div>
                <div>Sat 8 AM – 2 PM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <div>© {year} {BUSINESS_NAME}. All rights reserved.</div>
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-zinc-400 no-underline">About</Link>
            <Link to="/contact" className="hover:text-zinc-400 no-underline">Contact</Link>
            <a href={`${SITE_URL}/sitemap.xml`} className="hover:text-zinc-400 no-underline">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
