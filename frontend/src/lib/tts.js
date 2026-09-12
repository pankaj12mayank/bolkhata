// High-Quality Realistic AI Voice Engine (Google Assistant / Siri grade natural voice)
// Human Voice Tone Optimization for Hindi (hi-IN) & English (en-IN/en-US)

let currentAudio = null
let currentUtterance = null
let cachedVoices = []

function initVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    cachedVoices = window.speechSynthesis.getVoices() || []
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        cachedVoices = window.speechSynthesis.getVoices() || []
      }
    }
  }
}
initVoices()

export function detectLanguage(text) {
  const hindiChars = text && text.match(/[\u0900-\u097F]/)
  if (hindiChars) return 'hi'
  return 'en'
}

function normalizeTextForSpeech(text, lang) {
  if (!text) return ''
  let s = text
  // Replace currency symbols and abbreviations for smooth speech
  s = s.replace(/₹\s*([0-9,.]+)/g, '$1 rupaye')
  s = s.replace(/₹/g, 'rupaye')
  s = s.replace(/Rs\.?\s*([0-9,.]+)/gi, '$1 rupaye')
  s = s.replace(/credit_given/gi, 'udhaar diya')
  s = s.replace(/payment_received/gi, 'wapas mila')
  s = s.replace(/\bMRR\b/gi, 'M R R')
  s = s.replace(/\bpct\b/gi, 'percent')
  s = s.replace(/%/g, ' percent')
  // Replace symbols with natural conversational pauses
  s = s.replace(/[•|/_#—–]/g, ', ')
  // Clean double spaces
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

export function stopSpeaking() {
  if (currentAudio) {
    try {
      currentAudio.pause()
      currentAudio.currentTime = 0
    } catch {}
    currentAudio = null
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try { window.speechSynthesis.cancel() } catch {}
  }
  currentUtterance = null
}

export function isSpeaking() {
  if (currentAudio && !currentAudio.paused) return true
  return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking
}

/**
 * Split text into chunks <= 180 chars for TTS stream compatibility
 */
function splitTextIntoChunks(text) {
  if (text.length <= 180) return [text]

  const sentences = text.split(/(?<=[.?!,।])\s+/)
  const chunks = []
  let currentChunk = ''

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).length <= 180) {
      currentChunk = currentChunk ? (currentChunk + ' ' + sentence) : sentence
    } else {
      if (currentChunk) chunks.push(currentChunk)
      if (sentence.length > 180) {
        const words = sentence.split(' ')
        let temp = ''
        for (const w of words) {
          if ((temp + ' ' + w).length <= 180) {
            temp = temp ? (temp + ' ' + w) : w
          } else {
            chunks.push(temp)
            temp = w
          }
        }
        if (temp) currentChunk = temp
        else currentChunk = ''
      } else {
        currentChunk = sentence
      }
    }
  }
  if (currentChunk) chunks.push(currentChunk)
  return chunks
}

function speakFallbackWebSpeech(text, targetLang, onStart, onEnd) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.()
    return false
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = targetLang === 'hi' ? 'hi-IN' : 'en-IN'
    utterance.rate = 0.92
    utterance.pitch = 1.0

    const voices = cachedVoices.length ? cachedVoices : (window.speechSynthesis.getVoices() || [])
    if (voices.length > 0) {
      let bestVoice = null
      if (targetLang === 'hi') {
        bestVoice = voices.find(v =>
          (v.name.includes('Google हिन्दी') || v.name.includes('Google Hindi') || v.name.includes('Natural') || v.name.includes('Swara')) &&
          v.lang.toLowerCase().includes('hi')
        ) || voices.find(v => v.lang.toLowerCase().includes('hi')) || voices.find(v => v.lang.toLowerCase().includes('en-in'))
      } else {
        bestVoice = voices.find(v =>
          (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neerja')) &&
          (v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('en-us'))
        ) || voices.find(v => v.lang.toLowerCase().includes('en'))
      }
      if (bestVoice) utterance.voice = bestVoice
    }

    utterance.onstart = () => {
      currentUtterance = utterance
      onStart?.()
    }
    utterance.onend = () => {
      currentUtterance = null
      onEnd?.()
    }
    utterance.onerror = () => {
      currentUtterance = null
      onEnd?.()
    }

    currentUtterance = utterance
    window.speechSynthesis.speak(utterance)
    return true
  } catch (e) {
    console.warn('WebSpeech error:', e)
    currentUtterance = null
    onEnd?.()
    return false
  }
}

export function speak(text, { onEnd, onStart, lang } = {}) {
  if (!text || !text.trim()) {
    onEnd?.()
    return false
  }

  stopSpeaking()

  const targetLang = lang || detectLanguage(text)
  const normalizedText = normalizeTextForSpeech(text, targetLang)
  const langCode = targetLang === 'hi' ? 'hi' : 'en'

  if (!normalizedText) {
    onEnd?.()
    return false
  }

  // Primary: Google Assistant / Siri Realistic TTS Stream (when online)
  if (typeof window !== 'undefined' && navigator.onLine) {
    const chunks = splitTextIntoChunks(normalizedText)
    let chunkIndex = 0
    let started = false

    const playNextChunk = () => {
      if (chunkIndex >= chunks.length) {
        currentAudio = null
        onEnd?.()
        return
      }

      const chunkText = chunks[chunkIndex]
      chunkIndex++

      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunkText)}&tl=${langCode}&client=tw-ob`
      const audio = new Audio(url)
      currentAudio = audio

      audio.onplay = () => {
        if (!started) {
          started = true
          onStart?.()
        }
      }

      audio.onended = () => {
        playNextChunk()
      }

      audio.onerror = () => {
        console.warn('Google TTS audio stream error, falling back to WebSpeech')
        currentAudio = null
        speakFallbackWebSpeech(normalizedText, targetLang, onStart, onEnd)
      }

      audio.play().catch(err => {
        console.warn('Audio play error, falling back to WebSpeech', err)
        currentAudio = null
        speakFallbackWebSpeech(normalizedText, targetLang, onStart, onEnd)
      })
    }

    playNextChunk()
    return true
  } else {
    // Offline: Fallback to Neural WebSpeech
    return speakFallbackWebSpeech(normalizedText, targetLang, onStart, onEnd)
  }
}

export default { speak, stopSpeaking, isSpeaking, detectLanguage }

