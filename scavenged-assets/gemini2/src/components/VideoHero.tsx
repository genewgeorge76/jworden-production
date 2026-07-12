import { useEffect, useRef, useState, type ReactNode } from 'react';

type VideoSource = {
  /** Public-folder path or full URL to the video file. */
  src: string;
  /** MIME type, e.g. "video/mp4", "video/webm". */
  type: string;
};

type VideoHeroProps = {
  /**
   * One or more video sources (browser picks the first it can play).
   * Order best-compressed first (e.g., AV1/WebM before H.264/MP4).
   * If empty or all fail to load, the poster image is shown full-bleed.
   */
  sources?: VideoSource[];
  /** Still image shown before video loads & as fallback if video is missing. */
  poster: string;
  /** Optional alt text for the poster image fallback. */
  posterAlt?: string;
  /** Overlay content (headline, CTAs). Rendered above the video. */
  children: ReactNode;
  /** Tailwind classes for the outer <section>. */
  className?: string;
  /** Darken overlay strength 0–100 (default 55). Improves text legibility. */
  overlayOpacity?: number;
  /** Force a min-height (default "min-h-[80vh] md:min-h-[90vh]"). */
  minHeightClass?: string;
};

/**
 * Cinematic full-bleed video hero (SpaceX / Linear pattern).
 *
 * Behavior:
 * - Lazy-loads the video only when the section enters the viewport
 *   (preserves Largest Contentful Paint score).
 * - Autoplays muted+loop+playsinline (mobile-safe).
 * - Falls back silently to the poster image if no sources are provided
 *   or every source fails to load.
 * - Respects `prefers-reduced-motion`: skips video, shows poster only.
 */
export function VideoHero({
  sources = [],
  poster,
  posterAlt = '',
  children,
  className = '',
  overlayOpacity = 55,
  minHeightClass = 'min-h-[80vh] md:min-h-[90vh]',
}: VideoHeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const hasSources = sources.length > 0;

  useEffect(() => {
    if (!hasSources) return;

    // Respect reduced-motion preference: never load video.
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      // No IO support → load immediately.
      setShouldLoadVideo(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldLoadVideo(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasSources]);

  const showVideo = hasSources && shouldLoadVideo && !videoFailed;
  const overlayAlpha = Math.max(0, Math.min(100, overlayOpacity)) / 100;

  return (
    <section
      ref={sectionRef}
      className={`relative isolate overflow-hidden bg-black ${minHeightClass} ${className}`}
    >
      {/* Media layer */}
      <div className="absolute inset-0 -z-10">
        {/* Poster always rendered: serves as LCP image and as fallback.
            Auto-derives modern WebP/AVIF siblings if poster is .jpg/.jpeg/.png
            (e.g. /a/b.jpg → also /a/b.webp + /a/b.avif). */}
        {(() => {
          const m = poster.match(/^(.*)\.(jpe?g|png)$/i);
          if (!m) {
            return (
              <img
                src={poster}
                alt={posterAlt}
                aria-hidden={posterAlt ? undefined : true}
                className="h-full w-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
            );
          }
          const base = m[1];
          return (
            <picture>
              <source srcSet={`${base}.avif`} type="image/avif" />
              <source srcSet={`${base}.webp`} type="image/webp" />
              <img
                src={poster}
                alt={posterAlt}
                aria-hidden={posterAlt ? undefined : true}
                className="h-full w-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
            </picture>
          );
        })()}
        {showVideo && (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={poster}
            onError={() => setVideoFailed(true)}
          >
            {sources.map((s) => (
              <source key={s.src} src={s.src} type={s.type} />
            ))}
          </video>
        )}
        {/* Darkening overlay for text legibility */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0,0,0,${overlayAlpha})` }}
          aria-hidden
        />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex h-full w-full items-center">
        {children}
      </div>
    </section>
  );
}

export default VideoHero;
