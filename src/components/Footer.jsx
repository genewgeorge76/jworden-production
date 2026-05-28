import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { trackPhoneClick } from '@/lib/analytics';
import { PRIMARY_LOGO_URL } from '@/lib/branding';
import SocialLinks from './SocialLinks';

export default function Footer() {
  const scrollTo = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="relative overflow-hidden border-t border-border bg-[#eef4f1]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1 premium-panel p-6">
            <div className="flex items-center gap-3 mb-6">
              <img
                src={PRIMARY_LOGO_URL}
                alt="J. Worden & Sons Paving LLC logo"
                width={560}
                height={120}
                className="w-40 h-12 object-contain rounded-md border border-border bg-white p-1"
                sizes="160px"
              />
              <div>
                <p className="font-display font-bold text-foreground text-sm tracking-widest uppercase leading-none">
                  J. Worden & Sons
                </p>
                <p className="text-muted-foreground text-xs tracking-wider uppercase mt-0.5">
                  Asphalt Paving
                </p>
              </div>
            </div>
            <p className="font-body text-muted-foreground text-sm leading-relaxed mb-6">
              Family-owned and operated. 40+ years paving Virginia — from Hampton Roads to the Blue Ridge.
            </p>
            <SocialLinks size="sm" className="opacity-80 hover:opacity-100 transition-opacity" />
          </div>

          {/* Quick links */}
          <div className="premium-panel p-6">
            <h4 className="font-display font-bold text-foreground text-xs tracking-[0.2em] uppercase mb-6">Navigation</h4>
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
                  className="block font-body text-muted-foreground text-sm hover:text-primary transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <a
                href="/blog"
                className="block font-body text-muted-foreground text-sm hover:text-primary transition-colors"
              >
                Paving Blog
              </a>
              <a
                href="/locations"
                className="block font-body text-muted-foreground text-sm hover:text-primary transition-colors"
              >
                Service Areas
              </a>
              <a
                href="/crew-mode"
                className="block font-body text-muted-foreground text-[10px] uppercase font-black tracking-widest hover:text-primary transition-colors opacity-50 pt-4"
              >
                Crew Field Portal
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="premium-panel p-6">
            <h4 className="font-display font-bold text-foreground text-xs tracking-[0.2em] uppercase mb-6">Services</h4>
            <div className="space-y-3">
              {['Residential Paving', 'Commercial Paving', 'Industrial Paving', 'Sealcoating', 'Crack Repair', 'Line Striping'].map((s) => (
                <p key={s} className="font-body text-muted-foreground text-sm">{s}</p>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="premium-panel p-6">
            <h4 className="font-display font-bold text-foreground text-xs tracking-[0.2em] uppercase mb-6">Contact</h4>
            <div className="space-y-4">
              <a
                href="tel:+18044461296"
                onClick={() => trackPhoneClick('footer')}
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4 text-primary" />
                <span className="font-body text-sm">(804) 446-1296</span>
              </a>
              <a href="mailto:j.wordenandsonspaving@gmail.com" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-4 h-4 text-primary" />
                <span className="font-body text-sm">j.wordenandsonspaving@gmail.com</span>
              </a>
              <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <span className="font-body text-sm">
                  1601 Ware Bottom Spring Rd<br />
                  Suite 214<br />
                  Chester, VA 23836
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-body text-muted-foreground text-xs">
            © 2026 J. Worden & Sons Paving LLC. All rights reserved. Serving Richmond, VA and surrounding areas.
          </p>
          <p className="font-body text-muted-foreground text-xs">
            Licensed · Bonded · Insured · VA Contractor
          </p>
        </div>
        <p className="font-body text-muted-foreground/80 text-[11px] mt-4 text-center sm:text-left">
          Independent company notice: J. Worden & Sons Paving LLC operates at jwordenasphaltpaving.com and is not affiliated with Worden Paving.
        </p>
      </div>
    </footer>
  );
}
