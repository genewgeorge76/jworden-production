/**
 * useJarvisVoice — speaks Jarvis's replies in his real voice.
 *
 * Prefers the backend ElevenLabs pipeline (`POST /api/v1/tts/speak`, which
 * returns MP3) and falls back to the browser's built-in speechSynthesis only if
 * that is unreachable or unconfigured. The fallback exists so voice never goes
 * completely dead, but it is explicitly a downgrade — the browser voice is the
 * flat robotic one, and `provider` reports which you actually got.
 *
 * Usage:
 *   const { speak, stop, speaking, provider } = useJarvisVoice(enabled)
 *   speak(assistantReplyText)
 */

import { useCallback, useEffect, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

// ElevenLabs bills per character and rejects very long payloads; the backend
// caps at 4000. Trim to the first few paragraphs — spoken answers should be the
// summary, not a recitation of a long written breakdown.
const MAX_SPEAK_CHARS = 1200

/**
 * Strip markdown so the voice doesn't read asterisks and backticks aloud.
 * Deliberately conservative: it removes syntax, never content.
 */
function forSpeech(raw) {
  if (!raw) return ''
  let t = String(raw)
  t = t.replace(/```[\s\S]*?```/g, ' (code omitted) ') // fenced code
  t = t.replace(/`([^`]+)`/g, '$1') // inline code
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → label
  t = t.replace(/^#{1,6}\s+/gm, '') // headings
  t = t.replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
  t = t.replace(/(\*|_)(.*?)\1/g, '$2') // italic
  t = t.replace(/^\s*[-*+]\s+/gm, '') // bullets
  t = t.replace(/^\s*\d+\.\s+/gm, '') // numbered
  t = t.replace(/\|/g, ' ') // table pipes
  t = t.replace(/\s+/g, ' ').trim()
  if (t.length > MAX_SPEAK_CHARS) {
    const cut = t.slice(0, MAX_SPEAK_CHARS)
    const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '))
    t = (lastStop > 400 ? cut.slice(0, lastStop + 1) : cut) + ' …'
  }
  return t
}

export default function useJarvisVoice(enabled = true) {
  const [speaking, setSpeaking] = useState(false)
  const [provider, setProvider] = useState(null) // 'elevenlabs' | 'browser' | null
  const audioRef = useRef(null)
  const urlRef = useRef(null)

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause()
      } catch {
        // ignore teardown races
      }
      audioRef.current = null
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    cleanupAudio()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
  }, [cleanupAudio])

  useEffect(() => stop, [stop])

  const speakBrowser = useCallback((text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 1.0
      u.pitch = 0.9
      // Prefer a deeper male en-* voice to stay in register when we're degraded.
      const voices = window.speechSynthesis.getVoices() || []
      const pick =
        voices.find((v) => /daniel|david|guy|roger|andrew|matthew/i.test(v.name || '')) ||
        voices.find((v) => (v.lang || '').toLowerCase().startsWith('en')) ||
        null
      if (pick) u.voice = pick
      u.onstart = () => {
        setProvider('browser')
        setSpeaking(true)
      }
      u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(u)
    } catch {
      setSpeaking(false)
    }
  }, [])

  const speak = useCallback(
    async (raw) => {
      if (!enabled) return
      const text = forSpeech(raw)
      if (!text) return

      stop()

      try {
        const resp = await fetch(`${API_BASE}/api/v1/tts/speak`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })

        // 503 = no TTS provider configured on the server; anything else non-OK is
        // an outage. Both degrade to the browser voice rather than going silent.
        if (!resp.ok) throw new Error(`tts ${resp.status}`)

        const blob = await resp.blob()
        if (!blob || blob.size === 0) throw new Error('empty audio')

        const url = URL.createObjectURL(blob)
        urlRef.current = url
        const audio = new Audio(url)
        audioRef.current = audio
        setProvider(resp.headers.get('X-TTS-Provider') || 'elevenlabs')

        audio.onplay = () => setSpeaking(true)
        audio.onended = () => {
          setSpeaking(false)
          cleanupAudio()
        }
        audio.onerror = () => {
          setSpeaking(false)
          cleanupAudio()
        }
        await audio.play()
      } catch {
        speakBrowser(text)
      }
    },
    [enabled, stop, cleanupAudio, speakBrowser],
  )

  return { speak, stop, speaking, provider }
}
