import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Carousel — accessible image/content carousel.
 *
 * Features:
 *   • Autoplay with pause on hover, focus, or when tab is hidden
 *   • Touch swipe (drag) on mobile
 *   • Prev/next arrows + dot indicators
 *   • Keyboard navigation (←/→ when focused) and proper ARIA roles
 *   • Respects prefers-reduced-motion (no autoplay if user opts out)
 *   • Zero new deps — built on framer-motion (already in package.json)
 *
 * Props:
 *   items        array     — list of slide payloads (any shape)
 *   renderItem   function  — (item, index) => ReactNode for slide content
 *   intervalMs   number    — autoplay interval (default 5000); 0 disables
 *   ariaLabel    string    — label for the carousel region (a11y)
 *   className    string    — wrapper classes
 *   aspectClass  string    — Tailwind aspect class for the slide window
 */
export default function Carousel({
  items,
  renderItem,
  intervalMs = 5000,
  ariaLabel = 'Image carousel',
  className = '',
  aspectClass = 'aspect-[16/9]',
}) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = items.length

  const goTo = useCallback(
    (i) => {
      if (count === 0) return
      setIndex(((i % count) + count) % count)
    },
    [count],
  )
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])

  // Autoplay — paused when hovered/focused, when the tab is hidden, when
  // there's <= 1 slide, or when the user prefers reduced motion.
  useEffect(() => {
    if (!intervalMs || count <= 1 || paused) return
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const onVisChange = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVisChange)

    const id = window.setInterval(next, intervalMs)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisChange)
    }
  }, [intervalMs, count, paused, next])

  // Keyboard nav (when carousel region is focused/hovered)
  function onKeyDown(e) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      next()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      prev()
    }
  }

  if (count === 0) return null

  return (
    <section
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      className={`relative group ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {/* Slide window */}
      <div className={`relative overflow-hidden rounded-2xl bg-brand-navy/40 ${aspectClass}`}>
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            drag={count > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              // info.offset.x is the actual drag distance in pixels relative
              // to the gesture start point — the correct value for swipe
              // detection. (info.point.x is the global pointer position and
              // would yield wildly different thresholds depending on where
              // on the screen the gesture started.)
              const delta = info.offset.x
              const SWIPE_THRESHOLD_PX = 50
              if (delta < -SWIPE_THRESHOLD_PX) next()
              else if (delta > SWIPE_THRESHOLD_PX) prev()
            }}
            aria-roledescription="slide"
            aria-label={`Slide ${index + 1} of ${count}`}
          >
            {renderItem(items[index], index)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / next arrows — hidden when only one slide */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center shadow-md backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-amber"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center shadow-md backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-amber"
          >
            <span aria-hidden="true">›</span>
          </button>

          {/* Dot indicators */}
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5"
            role="tablist"
            aria-label="Select slide"
          >
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-brand-amber ${
                  i === index ? 'bg-brand-amber w-5' : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
