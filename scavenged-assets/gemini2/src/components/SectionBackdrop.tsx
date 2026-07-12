import { useEffect, useRef, useState } from 'react';

/**
 * Full-bleed section backdrop:
 *  - Stays pure black until the section is 35% in view
 *  - Holds black for 4 seconds, then fades the media in over 2 seconds
 *  - Works for either a video src or an image src
 *  - Always renders a dim/wash overlay so foreground text stays readable
 */

const HOLD_MS = 4000;
const FADE_MS = 2000;

type Props = {
  video?: string;
  image?: string;
  poster?: string;
  /** 0 = pure black, 1 = full image. Default 0.85 for a bright, dynamic look. */
  opacity?: number;
};

export function SectionBackdrop({ video, image, poster, opacity = 0.85 }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [armed, setArmed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.15) {
            setArmed(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: [0, 0.15, 0.35, 0.6] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => {
      setVisible(true);
      const v = videoRef.current;
      if (v) {
        v.muted = true;
        v.playsInline = true;
        v.playbackRate = 0.5; // 60% slower than the prior 0.5 baseline
        v.play().catch(() => {});
      }
    }, HOLD_MS);
    return () => window.clearTimeout(t);
  }, [armed]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden bg-black"
    >
      {video ? (
        <video
          ref={videoRef}
          src={video}
          poster={poster}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          onLoadedMetadata={(e) => {
            (e.currentTarget as HTMLVideoElement).playbackRate = 0.5;
          }}
          onCanPlay={(e) => {
            (e.currentTarget as HTMLVideoElement).playbackRate = 0.5;
          }}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: visible ? opacity : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
            filter: 'brightness(1.18) contrast(1.12) saturate(1.18)',
            willChange: 'opacity',
          }}
        />
      ) : null}
      {image ? (
        <div
          className="absolute inset-0 h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${image})`,
            opacity: visible ? opacity : 0,
            transition: `opacity ${FADE_MS}ms cubic-bezier(.22,1,.36,1)`,
            filter: 'brightness(1.18) contrast(1.12) saturate(1.18)',
            willChange: 'opacity',
          }}
        />
      ) : null}
      {/* Always-on wash so text stays legible (lighter so video reads through) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/35" />
    </div>
  );
}

export default SectionBackdrop;
