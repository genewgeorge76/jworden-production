import { useEffect, useState } from 'react'

/**
 * SmartImage — drop-in <img> with a clean branded fallback.
 *
 * Why this exists:
 *   We previously hot-linked photos from `github.com/user-attachments/...`,
 *   which 404 for public visitors and leave a broken-image icon on the live
 *   site. Even when a real photo is present we want explicit width/height to
 *   prevent layout shift, async decode, and lazy loading by default.
 *
 * If the image fails to load (or no `src` is supplied yet), the component
 * renders a labeled gradient panel that matches the site's brand palette so
 * the layout still looks intentional and presentable.
 *
 * Props:
 *   src            string  — image URL (local /work/*.jpg recommended)
 *   webpSrc        string  — optional .webp companion for <picture> source
 *   alt            string  — required for a11y
 *   label          string  — short label shown on the fallback panel
 *   sublabel       string  — optional secondary line on the fallback panel
 *   width/height   number  — intrinsic size (used by browser to reserve space)
 *   priority       bool    — true for above-the-fold LCP images
 *   className      string  — applied to the <img> / fallback wrapper
 *   gradient       string  — Tailwind gradient classes for the fallback bg
 */
export default function SmartImage({
  src,
  fallbackSrc,
  webpSrc,
  alt,
  label,
  sublabel,
  width = 800,
  height = 600,
  priority = false,
  className = '',
  gradient: _gradient = 'from-brand-navy via-brand-charcoal to-brand-navy',
  sizes,
}) {
  const [failed, setFailed] = useState(false)
  const [activeSrc, setActiveSrc] = useState(src)
  // When a derived AVIF/WebP sibling 404s (not every /work image has optimized
  // siblings generated), drop the modern <source>s and let the browser load the
  // original JPG/PNG directly instead of falling all the way to the placeholder.
  const [noModern, setNoModern] = useState(false)

  useEffect(() => {
    setActiveSrc(src)
    setFailed(false)
    setNoModern(false)
  }, [src])

  const showFallback = !activeSrc || failed
  const presentationStyle = className.includes('h-full')
    ? { width: '100%', maxWidth: '100%' }
    : { aspectRatio: `${width} / ${height}`, width: '100%', maxWidth: '100%' }

  const handleError = () => {
    // First failure on an image that emitted derived AVIF/WebP <source>s: the
    // optimized sibling is probably missing. Drop those sources and retry the
    // original JPG/PNG before giving up to the fallback panel.
    if (!noModern) {
      setNoModern(true)
      return
    }
    if (fallbackSrc && activeSrc !== fallbackSrc) {
      setActiveSrc(fallbackSrc)
      return
    }
    setFailed(true)
  }

  if (showFallback) {
    return (
      <div
        role="img"
        aria-label={alt || label || 'Project photo placeholder'}
        className={`image-presentation-premium flex items-center justify-center ${className}`}
        style={presentationStyle}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          aria-hidden="true"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #FFD700 0, #FFD700 1px, transparent 0, transparent 14px)',
            backgroundSize: '24px 24px',
          }}
        />
        {(label || sublabel) && (
          <div className="relative text-center px-8">
            {label && (
              <div className="font-editorial italic text-white/50 text-2xl lg:text-3xl leading-tight mb-2">
                {label}
              </div>
            )}
            {sublabel && (
              <div className="font-display tracking-[0.4em] uppercase text-primary text-[10px] mt-2 brightness-75">{sublabel}</div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`image-presentation-premium image-reveal-obsidian ${className}`} style={presentationStyle}>
      <picture>
        {(() => {
          // If a derived sibling already 404'd once, stop claiming modern
          // formats and let the <img> below load the original directly.
          if (noModern) return null
          // Auto-derive AVIF / WebP siblings for images under /work/* (the
          // portfolio + KFC + market galleries that scripts/optimize-images.mjs
          // generates modern-format siblings for at build time).
          // Skips other paths so we don't claim formats that don't exist.
          const m = typeof activeSrc === 'string' && activeSrc.match(/^(\/work\/.+)\.(jpe?g|png)(\?.*)?$/i)
          if (!m) return null
          const base = m[1]
          const query = m[3] || ''
          // If a -mobile sibling exists (only generated for true LCP heroes
          // like portfolio-010), use srcset+sizes so phones pull the smaller
          // variant. We can't feature-detect at runtime so we hard-list bases.
          const HAS_MOBILE = new Set(['/work/portfolio/portfolio-010'])
          if (HAS_MOBILE.has(base)) {
            const avifSet = `${base}-mobile.avif${query} 800w, ${base}.avif${query} 1600w`
            const webpSet = `${base}-mobile.webp${query} 800w, ${base}.webp${query} 1600w`
            const sz = sizes || '(max-width: 768px) 100vw, 1600px'
            return (
              <>
                <source type="image/avif" srcSet={avifSet} sizes={sz} />
                <source type="image/webp" srcSet={webpSet} sizes={sz} />
              </>
            )
          }
          return (
            <>
              <source type="image/avif" srcSet={`${base}.avif${query}`} sizes={sizes} />
              <source type="image/webp" srcSet={`${base}.webp${query}`} sizes={sizes} />
            </>
          )
        })()}
        {webpSrc && <source type="image/webp" srcSet={webpSrc} sizes={sizes} />}
        <img
          src={activeSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={() => setFailed(false)}
          onError={handleError}
          className="w-full h-full object-cover"
          sizes={sizes}
        />
      </picture>
    </div>
  )
}
