import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Menu, X, Phone } from 'lucide-react';
import { BUSINESS_SHORT, BUSINESS_PHONE } from '@jworden/core';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/estimator', label: 'Free Estimate' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center font-black text-black text-sm">W</div>
            <div>
              <div className="text-white font-bold text-sm leading-none">{BUSINESS_SHORT}</div>
              <div className="text-zinc-500 text-xs leading-none mt-0.5">Since 1984</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-zinc-400 hover:text-white text-sm font-medium transition-colors no-underline [&.active]:text-yellow-400"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Phone CTA */}
          <a
            href={`tel:+1${BUSINESS_PHONE.replace(/\D/g, '')}`}
            className="hidden md:flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold px-4 py-2 rounded transition-colors no-underline"
          >
            <Phone size={14} />
            {BUSINESS_PHONE}
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden text-zinc-400 hover:text-white p-2"
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950">
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="text-zinc-300 hover:text-white py-2 text-sm no-underline [&.active]:text-yellow-400"
              >
                {n.label}
              </Link>
            ))}
            <a
              href={`tel:+1${BUSINESS_PHONE.replace(/\D/g, '')}`}
              className="mt-2 flex items-center gap-2 bg-yellow-500 text-black text-sm font-bold px-4 py-2.5 rounded no-underline"
            >
              <Phone size={14} />
              {BUSINESS_PHONE}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
