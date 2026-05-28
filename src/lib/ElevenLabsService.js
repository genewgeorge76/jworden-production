/**
 * ElevenLabsService.js — High-end AI voice synthesis for the "Mr. Worden" concierge.
 *
 * This service uses ElevenLabs (Flash v2.5 models) to generate premium,
 * human-like speech that matches the high-end minimalist UI.
 *
 * Requirements:
 * - VITE_ELEVENLABS_API_KEY (Client-side usage for low-latency, though server-side is safer)
 * - VITE_ELEVENLABS_VOICE_ID (Default: 'JBFqnCBsd6RMkjVDRZzb' — "George" style, or a custom clone)
 */

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY
const VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'pNInz6obpgH9PthW4RUI' // "George" - Mature, professional, authoritative

// Map of voice styles if we want to switch contextually
export const VOICES = {
  PREMIUM_MALE: 'pNInz6obpgH9PthW4RUI', // George - Deep, professional
  FRIENDLY_MALE: 'N2lVS1wzCLpce5hCq99G', // Callum - Friendly, relatable
  ELDER_MALE: 'JBFqnCBsd6RMkjVDRZzb', // George (Alternate)
}

class ElevenLabsService {
  constructor() {
    this.audioContext = null
    this.currentAudio = null
    this.currentObjectUrl = null
    this.cache = new Map()
    this.queue = []
    this.isPlaying = false
  }

  async play(text, voiceId = VOICE_ID) {
    if (!text) return

    try {
      this.stop()

      // Simple cache to save credits/latency on repeat greetings
      if (this.cache.has(text)) {
        this._playBlob(this.cache.get(text))
        return
      }

      let blob = null

      // ── Path A: Direct ElevenLabs (only if key is exposed to browser) ────
      if (ELEVENLABS_API_KEY) {
        try {
          const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY,
              },
              body: JSON.stringify({
                text: text,
                model_id: 'eleven_flash_v2_5',
                voice_settings: {
                  stability: 0.5,
                  similarity_boost: 0.75,
                  style: 0.05,
                  use_speaker_boost: true,
                },
              }),
            }
          )
          if (!response.ok) throw new Error(`ElevenLabs API error: ${response.statusText}`)
          blob = await response.blob()
        } catch (err) {
          console.warn('[voiceService] ElevenLabs direct failed, falling back to backend:', err)
        }
      }

      // ── Path B: Backend neural TTS (OpenAI onyx / ElevenLabs server-side) ─
      if (!blob) {
        const apiBase = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

        // Preferred: direct provider streaming for lower time-to-first-audio.
        const streamResp = await fetch(`${apiBase}/api/v1/tts/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })

        if (streamResp.ok) {
          const streamed = await this._playStreamResponse(streamResp)
          if (streamed) return

          // Older browsers: same endpoint, buffered fallback.
          blob = await streamResp.blob()
        } else {
          // Final fallback endpoint if stream route fails.
          const resp = await fetch(`${apiBase}/api/v1/tts/speak`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
          })
          if (!resp.ok) throw new Error(`backend TTS ${resp.status}`)
          blob = await resp.blob()
        }
      }

      this.cache.set(text, blob)
      this._playBlob(blob)
    } catch (error) {
      console.error('Failed to play voice:', error)
    }
  }

  async _playStreamResponse(response) {
    if (!response?.body) return false
    if (typeof window === 'undefined' || typeof MediaSource === 'undefined') return false
    if (!MediaSource.isTypeSupported('audio/mpeg')) return false

    const mediaSource = new MediaSource()
    const objectUrl = URL.createObjectURL(mediaSource)
    const audio = new Audio(objectUrl)

    this.currentObjectUrl = objectUrl
    this.currentAudio = audio

    const chunks = []
    let sourceBuffer = null
    let streamEnded = false

    const flush = () => {
      if (!sourceBuffer || sourceBuffer.updating) return
      if (chunks.length > 0) {
        const next = chunks.shift()
        try {
          sourceBuffer.appendBuffer(next)
        } catch (err) {
          console.warn('[voiceService] stream append failed:', err)
        }
        return
      }
      if (streamEnded && mediaSource.readyState === 'open') {
        try {
          mediaSource.endOfStream()
        } catch {
          // Ignore EOS races.
        }
      }
    }

    mediaSource.addEventListener('sourceopen', () => {
      try {
        sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg')
        sourceBuffer.mode = 'sequence'
      } catch {
        streamEnded = true
        return
      }

      sourceBuffer.addEventListener('updateend', flush)
      const reader = response.body.getReader()

      ;(async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (!value || !value.byteLength) continue

          const copy = value.byteOffset === 0 && value.byteLength === value.buffer.byteLength
            ? value.buffer
            : value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)
          chunks.push(copy)
          flush()
        }
        streamEnded = true
        flush()
      })().catch((err) => {
        console.warn('[voiceService] stream reader failed:', err)
        streamEnded = true
        flush()
      })
    }, { once: true })

    audio.addEventListener('play', () => {
      window.dispatchEvent(new CustomEvent('mrworden:audio-start'))
    })

    audio.addEventListener('ended', () => {
      window.dispatchEvent(new CustomEvent('mrworden:audio-end'))
      this._teardownAudio()
    })

    audio.addEventListener('error', () => {
      window.dispatchEvent(new CustomEvent('mrworden:audio-end'))
      this._teardownAudio()
    })

    await audio.play()
    return true
  }

  _teardownAudio() {
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl)
      this.currentObjectUrl = null
    }
    this.currentAudio = null
  }

  _playBlob(blob) {
    const url = URL.createObjectURL(blob)
    this.currentObjectUrl = url
    this.currentAudio = new Audio(url)
    
    // Dispatch event for UI synchronization (visualizer sparks)
    this.currentAudio.addEventListener('play', () => {
      window.dispatchEvent(new CustomEvent('mrworden:audio-start'))
    })

    this.currentAudio.addEventListener('ended', () => {
      window.dispatchEvent(new CustomEvent('mrworden:audio-end'))
      this._teardownAudio()
    })

    this.currentAudio.play().catch(err => {
      console.error('Audio playback failed:', err)
    })
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      window.dispatchEvent(new CustomEvent('mrworden:audio-end'))
      this._teardownAudio()
    }
  }
}

export const voiceService = new ElevenLabsService()
