import { useEffect } from 'react';

/**
 * Global section reveal-from-darkness effect.
 *
 * Finds every <section> inside <main> on the current page, starts each one
 * fully dark and slightly down, then fades + lifts it into view as it
 * scrolls into the viewport. Re-observes on route changes via MutationObserver.
 */
export function SectionReveal() {
  useEffect(() => {
    const armed = new WeakSet<Element>();

    const arm = (el: HTMLElement) => {
      if (armed.has(el)) return;
      armed.add(el);
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition =
        'opacity 600ms cubic-bezier(.16,1,.3,1), transform 600ms cubic-bezier(.22,1,.36,1)';
      el.style.willChange = 'opacity, transform';

      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting && e.intersectionRatio >= 0.08) {
              const t = e.target as HTMLElement;
              t.style.opacity = '1';
              t.style.transform = 'translateY(0)';
              io.unobserve(t);
            }
          }
        },
        { threshold: [0, 0.08, 0.2] },
      );
      io.observe(el);
    };

    const scan = () => {
      document.querySelectorAll<HTMLElement>('main section').forEach(arm);
    };

    scan();
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  return null;
}

export default SectionReveal;
