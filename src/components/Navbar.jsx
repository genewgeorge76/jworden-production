import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackPhoneClick } from '@/lib/analytics';
import { PRIMARY_LOGO_URL } from '@/lib/branding';
import SocialLinks from './SocialLinks';

const NAV_LINKS = [
  { label: 'Commercial', href: '/commercial' },
  { label: 'Residential', href: '/residential' },
  { label: 'Services', href: '/services' },
  { label: 'Locations', href: '/locations' },
  { label: 'Worden U', href: '/worden-university' },
  // Public proof of where the work actually is — every pin backed by dated,
  // GPS-tagged job photographs rather than a drawn coverage area.
  { label: 'Our Work', href: '/footprint' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showMiniLogo, setShowMiniLogo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
      setShowMiniLogo(y > 520);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href) => {
    setIsOpen(false);
    if (href.startsWith('/')) {
      navigate(href);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (window.location.pathname !== '/') {
      navigate('/' + href);
      return;
    }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white border-b border-border shadow-[0_12px_28px_rgba(24,24,24,0.12)]'
          : 'bg-white border-b border-border shadow-[0_8px_24px_rgba(24,24,24,0.08)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between md:h-20">
          {/* Logo — top left corner */}
          {/* Brand lockup. The logo file is a SQUARE 512x512 badge on a black
              ground — sizing it into a wide slot shrank it to a thumbnail
              floating in white space (the owner caught it on his phone,
              2026-08-28). The badge now sits at its true square shape with the
              name typeset beside it, so the lockup is crisp at every width and
              the name is readable before the image even loads. */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0" aria-label="J. Worden & Sons Paving LLC — Home">
            <img
              src={PRIMARY_LOGO_URL}
              alt="J. Worden & Sons Paving badge — dump truck, paver and roller over the company name"
              width={512}
              height={512}
              sizes="(max-width: 640px) 44px, 56px"
              className="h-11 w-11 sm:h-14 sm:w-14 rounded-lg object-cover shrink-0"
            />
            <span className="flex flex-col items-start leading-none min-w-0">
              <span className="font-display font-extrabold text-brand-navy text-[15px] sm:text-lg md:text-xl tracking-tight whitespace-nowrap">
                J. WORDEN <span className="text-amber-600">&amp;</span> SONS
              </span>
              <span className="font-display font-bold text-amber-600 text-[10px] sm:text-xs tracking-[0.28em] uppercase mt-1">
                Paving · Since 1984
              </span>
            </span>
          </button>

          {/* Mobile phone CTA */}
          <a
            href="tel:+18044461296"
            onClick={() => trackPhoneClick('navbar_mobile')}
            className="lg:hidden flex items-center gap-1.5 text-primary font-display font-bold text-xs tracking-wider ml-2 flex-shrink-0"
            aria-label="Call (804) 446-1296"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden xs:inline">804-446-1296</span>
          </a>

          {/* Desktop phone CTA (click-to-call) */}
          <a
            href="tel:+18044461296"
            onClick={() => trackPhoneClick('navbar_desktop')}
            className="hidden lg:flex items-center gap-2 text-primary font-display font-bold text-sm tracking-[0.06em] uppercase hover:text-primary/80 transition-colors ml-auto mr-6"
            aria-label="Call (804) 446-1296"
          >
            <Phone className="w-4 h-4" />
            (804) 446-1296
          </a>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-5">
            {NAV_LINKS.map((link) =>
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className="font-display text-xs tracking-[0.08em] uppercase text-muted-foreground hover:text-primary transition-colors duration-300 xl:text-sm">
              
                {link.label}
              </button>
            )}
            
            <SocialLinks 
              size="sm" 
              className="hidden xl:flex ml-2 mr-1 [&>a]:!bg-slate-100 [&>a]:!text-slate-600 hover:[&>a]:!bg-primary hover:[&>a]:!text-white" 
            />

            <button
              onClick={() => scrollTo('#quote')}
              className="premium-cta flex items-center gap-2 text-primary-foreground px-5 py-3 font-display font-bold text-sm tracking-[0.06em] uppercase transition-all min-h-[48px]">
              
              <Phone className="w-4 h-4" />
              Free Estimate
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-foreground p-2 min-h-[48px] min-w-[48px] flex items-center justify-center"
            aria-label="Toggle menu">
            
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden bg-white/98 backdrop-blur-xl border-b border-border overflow-hidden">
          
            <div className="px-6 py-6 space-y-1">
              {NAV_LINKS.map((link) =>
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className="block w-full text-left font-display text-lg tracking-[0.08em] uppercase text-muted-foreground hover:text-primary py-3 border-b border-border/70 transition-colors min-h-[48px]">
              
                  {link.label}
                </button>
            )}
              <div className="mt-4 flex justify-center pb-2">
                <SocialLinks 
                  size="md" 
                  className="[&>a]:!bg-slate-100 [&>a]:!text-slate-600 hover:[&>a]:!bg-primary hover:[&>a]:!text-white" 
                />
              </div>

              <button
              onClick={() => scrollTo('#quote')}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-4 font-display font-bold text-sm tracking-wider uppercase min-h-[48px]">
              
                <Phone className="w-4 h-4" />
                Free Estimate
              </button>
            </div>
          </motion.div>
        }
      </AnimatePresence>

      <AnimatePresence>
        {showMiniLogo && !isOpen &&
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.92 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-4 right-4 z-[70] hidden rounded-xl border border-border bg-white/94 px-3 py-2 shadow-[0_14px_36px_rgba(24,24,24,0.18)] backdrop-blur-lg md:bottom-6 md:right-6 md:block"
          aria-label="Back to top">

            <img
              src={PRIMARY_LOGO_URL}
              alt="J. Worden & Sons Paving LLC mini logo"
              width={560}
              height={120}
              sizes="160px"
              className="w-36 h-8 md:w-40 md:h-9 object-contain"
            />
          </motion.button>
        }
      </AnimatePresence>
    </nav>);

}
