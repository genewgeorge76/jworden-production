/**
 * ElevenLabsService.js — voice for the "Mr. Worden" concierge.
 *
 * Synthesis happens on the backend (`/api/v1/tts/*`), never here.
 *
 * WHY THERE IS NO API KEY IN THIS FILE ANY MORE
 *
 * This module used to read VITE_ELEVENLABS_API_KEY and call
 * api.elevenlabs.io directly from the browser. Vite inlines every VITE_*
 * variable into the shipped bundle as a plain string, so that key was
 * readable by anyone who opened devtools and could be used to spend the
 * account's credits. The original comment here acknowledged it —
 * "Client-side usage for low-latency, though server-side is safer" — and took
 * the risk for latency that the backend stream already provides.
 *
 * It was also producing the wrong voice. The two paths disagreed:
 *
 *   frontend   voice pNInz6obpgH9PthW4RUI   model eleven_flash_v2_5
 *   backend    voice pNInz6obpgDQGcFmaJgB   model eleven_turbo_v2_5
 *
 * Same first ten characters, different tails — the frontend ID looks like a
 * corrupted copy of the backend's. A voice ID ElevenLabs does not recognise
 * returns an error, the catch below swallowed it, and playback fell through
 * to the backend anyway. So the "premium" path either failed silently or
 * spoke in a different voice at lower quality than the fallback it was meant
 * to improve on. That is the intermittent, generic-sounding voice.
 *
 * Voice and model now live in one place — app/services/tts_service.py,
 * configured by ELEVENLABS_VOICE_ID and ELEVENLABS_MODEL. Change the voice
 * there and every surface follows; there is no second copy to drift.
 */

class ElevenLabsService {
  constructor() {
    this.audioContext = null
    this.currentAudio = null
    this.currentObjectUrl = null
    this.cache = new Map()
    this.queue = []
    this.isPlaying = false
  }

  async play(text) {
    if (!text) return

    try {
      this.stop()

      // Simple cache to save credits/latency on repeat greetings
      if (this.cache.has(text)) {
        this._playBlob(this.cache.get(text))
        return
      }

      let blob = null

      // Backend neural TTS. Single path — see the header for why the direct
      // browser-to-ElevenLabs call was removed.
      {
        const apiBase = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

        // Preferred: direct provider streaming for lower time-to-first-audio.
        const streamResp = await fetch(`${apiBase}/api/v1/tts/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })

        if (streamResp.ok) {
          // /tts/stream is NOT chunked today — it returns the whole MP3 with a
          // Content-Length, identical in size to /tts/speak. Feeding a complete
          // file to MediaSource is fragile, and _playStreamResponse can report
          // success while nothing is audible; because it "succeeded", the
          // dependable /tts/speak path below never ran. That is silent voice
          // with no error in the console.
          //
          // So only take the MediaSource route when the body really is
          // progressive (no Content-Length => chunked/streamed). Otherwise play
          // the buffered blob, which is the path already proven to work.
          const declaredLength = streamResp.headers.get('content-length')
          if (!declaredLength) {
            const streamed = await this._playStreamResponse(streamResp)
            if (streamed) return
          }

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
