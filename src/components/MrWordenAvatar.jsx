/**
 * MrWordenAvatar — Animated SVG persona of Mr. J. Worden Sr.
 *
 * Renders a layered SVG caricature of the company founder with four
 * behavioral states driven by framer-motion animations:
 *
 *   idle     — gentle up/down float with ambient amber glow pulse
 *   talking  — rhythmic head nod + open-mouth; glow intensifies
 *   listening — slight head tilt, attentive expression
 *   wave     — transient peek/wave animation triggered when arriving on a new page
 *
 * Adds a true "4D" effect: the head subtly tilts and parallaxes toward the
 * user's cursor when it is near, giving the persona the felt presence of
 * watching the visitor wherever they go on the page.
 *
 * The component is deliberately lightweight (pure SVG + CSS transforms,
 * no WebGL/canvas) so it renders instantly on every page without blocking
 * the main thread or requiring a GPU context.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

/** The SVG character art for Mr. Worden, simplified to a minimalist, smart AI indicator. */
function JWordenSVG({ talking = false, state = 'idle', eyeDx = 0, eyeDy = 0, audioActive = false }) {
  const isActive = state === 'talking' || state === 'listening' || audioActive
  
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id="ai-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <radialGradient id="dot-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff9f1c" />
          <stop offset="70%" stopColor="#ff7a00" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
      </defs>

      {/* Outer focus rings */}
      <motion.circle
        cx="50" cy="50" r="42"
        stroke="#ff7a00"
        strokeWidth="1"
        strokeDasharray="4 8"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        opacity={isActive ? 0.6 : 0.2}
      />

      {/* Intelligence Core Dot */}
      <motion.circle
        cx="50" cy="50" r="18"
        fill="url(#dot-grad)"
        filter="url(#ai-glow)"
        animate={isActive ? {
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
          filter: ["blur(0px)", "blur(2px)", "blur(0px)"]
        } : {
          scale: [1, 1.05, 1],
          opacity: [0.6, 0.8, 0.6]
        }}
        transition={{
          repeat: Infinity,
          duration: isActive ? 1.5 : 4,
          ease: "easeInOut"
        }}
      />

      {/* Neural Activity Sparks */}
      <AnimatePresence>
        {(isActive || audioActive) && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[0, 72, 144, 216, 288].map((angle, i) => (
              <motion.circle
                key={i}
                cx={50 + Math.cos(angle * Math.PI / 180) * 30}
                cy={50 + Math.sin(angle * Math.PI / 180) * 30}
                r="2"
                fill="#ff7a00"
                animate={{
                  scale: audioActive ? [0, 2.5, 0] : [0, 1.5, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: audioActive ? 1.2 : 2,
                  delay: i * 0.4,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  )
}

/**
 * Exported avatar component.
 *
 * Props:
 *   state  — 'idle' | 'talking' | 'listening'
 *   size   — pixel size of the rendered character (default 44)
 *   onClick — click handler (opens/closes the chat panel)
 *   isOpen  — whether the chat panel is currently open (used for badge)
 *   unread  — number of unread messages (shows badge when > 0 and closed)
 */
export default function MrWordenAvatar({
  state = 'idle',
  size = 44,
  onClick,
  isOpen = false,
  unread = 0,
}) {
  const [audioActive, setAudioActive] = useState(false)

  useEffect(() => {
    const start = () => setAudioActive(true)
    const end = () => setAudioActive(false)
    window.addEventListener('mrworden:audio-start', start)
    window.addEventListener('mrworden:audio-end', end)
    return () => {
      window.removeEventListener('mrworden:audio-start', start)
      window.removeEventListener('mrworden:audio-end', end)
    }
  }, [])

  const isActive = state === 'talking' || state === 'listening' || audioActive
  
  // Minimalist float and glow
  const floatAnim = { y: [0, -3, 0] }
  const floatTransition = { repeat: Infinity, duration: 4, ease: 'easeInOut' }

  const glowColor = isActive ? 'rgba(255,122,0,0.4)' : 'rgba(255,122,0,0.1)'

  const buttonRef = useRef(null)

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={isOpen ? 'Close assistant' : 'Open Mr. Worden AI'}
      className="relative focus:outline-none group select-none transition-all duration-500"
      style={{ width: size, height: size }}
    >
      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: glowColor,
          filter: 'blur(12px)',
        }}
        animate={isActive ? { scale: [1, 1.4, 1] } : { scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      />

      {/* Core Component */}
      <motion.div
        animate={floatAnim}
        transition={floatTransition}
        whileHover={{ scale: 1.1 }}
        style={{ width: '100%', height: '100%' }}
      >
        <JWordenSVG state={state} audioActive={audioActive} />
      </motion.div>

      {/* Tiny clean label */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900/80 border border-white/10 text-[8px] font-bold text-brand-amber uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
        {audioActive ? 'SPEAKING' : 'AI'}
      </div>

      {/* Unread badge */}
      <AnimatePresence>
        {!isOpen && unread > 0 && (
          <motion.div
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 bg-brand-amber text-brand-navy text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg border border-slate-900"
          >
            {unread}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}
