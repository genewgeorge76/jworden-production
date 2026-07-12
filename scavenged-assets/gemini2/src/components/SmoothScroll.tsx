import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Global smooth-scroll engine.
 *
 * Wraps native scroll in a single rAF-driven Lenis instance so every
 * scroll-linked animation (SectionBackdrop reveal, SectionReveal fade,
 * sticky header, etc.) is sampled from the same eased clock. Result:
 * SpaceX-style "every section glides in on the same curve."
 *
 * Honors prefers-reduced-motion by no-opping.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 1.0,
      // SpaceX-style ease: deep ease-out, no overshoot
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      lerp: 0.12,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}

export default SmoothScroll;
