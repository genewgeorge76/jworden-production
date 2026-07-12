import { useEffect, useState } from 'react';

/**
 * Quick page-load curtain — 200ms hold, 400ms fade.
 * Just enough to prevent flash of unstyled content.
 */
const HOLD_MS = 150;
const FADE_MS = 350;

export function PageLoadCurtain() {
  const [opacity, setOpacity] = useState(1);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const t1 = window.setTimeout(() => setOpacity(0), HOLD_MS);
    const t2 = window.setTimeout(() => setMounted(false), HOLD_MS + FADE_MS + 50);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (!mounted) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] bg-[#050507]"
      style={{
        opacity,
        transition: `opacity ${FADE_MS}ms ease-out`,
        willChange: 'opacity',
      }}
    />
  );
}

export default PageLoadCurtain;
