"use client";

import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "#services", label: "Services" },
    { href: "#about", label: "About" },
    { href: "#why-us", label: "Why Us" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-brand-dark/95 backdrop-blur-sm border-b border-white/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-yellow font-bold text-brand-dark text-lg">
            CB
          </div>
          <div className="leading-tight">
            <span className="block text-lg font-bold text-white tracking-tight">
              Carolina Blacktop
            </span>
            <span className="block text-xs text-brand-yellow font-medium tracking-wide uppercase">
              Paving &amp; Sealcoating
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-300 transition-colors hover:text-brand-yellow"
            >
              {link.label}
            </a>
          ))}
          <a
            href="tel:+18005551234"
            className="rounded-lg bg-brand-yellow px-5 py-2.5 text-sm font-bold text-brand-dark transition-colors hover:bg-brand-yellow-dark"
          >
            (800) 555-1234
          </a>
        </nav>

        <button
          className="text-white md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 bg-brand-dark px-6 pb-4 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block py-3 text-sm font-medium text-zinc-300 hover:text-brand-yellow"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="tel:+18005551234"
            className="mt-2 block rounded-lg bg-brand-yellow px-5 py-2.5 text-center text-sm font-bold text-brand-dark"
          >
            (800) 555-1234
          </a>
        </div>
      )}
    </header>
  );
}
