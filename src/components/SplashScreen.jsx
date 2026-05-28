import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRIMARY_LOGO_URL, FALLBACK_LOGO_URL } from '@/lib/branding';

const SPLASH_KEY = 'jworden_splash_shown';

export default function SplashScreen() {
  // Initial state MUST match the prerendered HTML (which has no splash, since
  // `typeof window === 'undefined'` during prerender). We start as not-visible
  // and flip to visible inside useEffect after hydration completes — this
  // avoids React hydration error #418 (Text content does not match server).
  const [visible, setVisible] = useState(false);

  const dismiss = () => {
    sessionStorage.setItem(SPLASH_KEY, '1');
    setVisible(false);
  };

  useEffect(() => {
    // Decide whether to show the splash now that we're on the client.
    if (sessionStorage.getItem(SPLASH_KEY)) return;
    setVisible(true);
    sessionStorage.setItem(SPLASH_KEY, '1');
    const timer = setTimeout(() => setVisible(false), 2500);
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        setVisible(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const [logoSrc, setLogoSrc] = useState(PRIMARY_LOGO_URL);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-background flex items-center justify-center cursor-pointer"
          onClick={dismiss}
          role="button"
          tabIndex={0}
          aria-label="Tap or press any key to skip splash screen"
        >
          <motion.img
            src={logoSrc}
            alt="J. Worden & Sons Paving LLC"
            onError={() => setLogoSrc(FALLBACK_LOGO_URL)}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-[90%] max-w-5xl h-auto object-contain pointer-events-none"
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 rounded-full bg-white/10 hover:bg-white/20 text-white/90 text-xs font-semibold uppercase tracking-widest px-4 py-2 backdrop-blur-sm border border-white/20 transition-colors"
            aria-label="Skip splash"
          >
            Skip ✕
          </button>
          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-[10px] uppercase tracking-widest pointer-events-none">
            Tap anywhere to continue
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
