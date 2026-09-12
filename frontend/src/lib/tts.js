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

export function detectLanguage(text, userPrefLang) {
  if (userPrefLang) {
    const l = String(userPrefLang).toLowerCase()
    if (l.includes('en') || l === 'english') return 'en'
    if (l.includes('hi') || l === 'hindi') return 'hi'
  }
  const hindiChars = text && text.match(/[\u0900-\u097F]/)
  if (hindiChars) return 'hi'
  return 'en'
}

function cleanTextForSpeech(text) {
  if (!text) return ''
  let s = text
  s = s.replace(/₹\s*([0-9,.]+)/g, '$1 rupaye')
  s = s.replace(/Rs\.?\s*([0-9,.]+)/gi, '$1 rupaye')
  s = s.replace(/₹/g, 'rupaye')
  s = s.replace(/credit_given/gi, 'udhaar diya')
  s = s.replace(/payment_received/gi, 'wapas mila')
  s = s.replace(/\bMRR\b/gi, 'M R R')
  s = s.replace(/%/g, ' percent')
  s = s.replace(/[•|/_#—–]/g, ', ')
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

export function stopSpeaking() {
  if (currentAudio) {
    try {
      currentAudio.pause()
      currentAudio.onplay = null
      currentAudio.onended = null
      currentAudio.onerror = null
      currentAudio.currentTime = 0
    } catch {}
    currentAudio = null
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
    } catch {}
  }
  currentUtterance = null
}

export function isSpeaking() {
  if (currentAudio && !currentAudio.paused) return true
  return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking
}

export function speak(text, { onEnd, onStart, lang } = {}) {
  if (!text || !text.trim()) {
    onEnd?.()
    return false
  }

  stopSpeaking()

  const targetLang = detectLanguage(text, lang)
  const cleanedText = cleanTextForSpeech(text)
  const langCode = targetLang === 'hi' ? 'hi' : 'en'

  if (!cleanedText) {
    onEnd?.()
    return false
  }

  // 1. Primary Engine: Browser WebSpeech API (Works 100% reliably offline & online)
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }

      const utterance = new SpeechSynthesisUtterance(cleanedText)
      utterance.lang = langCode === 'hi' ? 'hi-IN' : 'en-IN'
      utterance.rate = 0.92
      utterance.pitch = 1.0

      const voices = cachedVoices.length ? cachedVoices : (window.speechSynthesis.getVoices() || [])
      if (voices.length > 0) {
        let bestVoice = null
        if (langCode === 'hi') {
          bestVoice = voices.find(v =>
            (v.name.includes('Google हिन्दी') || v.name.includes('Google Hindi') || v.name.includes('Natural') || v.name.includes('Swara') || v.name.includes('Kalpana')) &&
            (v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi'))
          ) || voices.find(v => v.lang.toLowerCase().includes('hi')) || voices.find(v => v.lang.toLowerCase().includes('en-in'))
        } else {
          bestVoice = voices.find(v =>
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neerja') || v.name.includes('Samantha')) &&
            (v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('en-us'))
          ) || voices.find(v => v.lang.toLowerCase().includes('en'))
        }
        if (bestVoice) utterance.voice = bestVoice
      }

      let hasEnded = false
      const safeEnd = () => {
        if (!hasEnded) {
          hasEnded = true
          currentUtterance = null
          onEnd?.()
        }
      }

      utterance.onstart = () => {
        currentUtterance = utterance
        onStart?.()
      }
      utterance.onend = safeEnd
      utterance.onerror = safeEnd

      currentUtterance = utterance
      window.speechSynthesis.speak(utterance)

      // Fallback timer safety to guarantee onEnd triggers
      const estimatedMs = Math.max(2000, Math.ceil(cleanedText.length / 8) * 1000)
      setTimeout(() => {
        if (currentUtterance === utterance) {
          safeEnd()
        }
      }, estimatedMs + 2000)

      return true
    } catch (e) {
      console.warn('SpeechSynthesis error:', e)
    }
  }

  // 2. Audio Stream Fallback
  if (typeof window !== 'undefined' && navigator.onLine) {
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanedText.slice(0, 180))}&tl=${langCode}&client=tw-ob`
      const audio = new Audio(url)
      currentAudio = audio

      audio.onplay = () => onStart?.()
      audio.onended = () => {
        currentAudio = null
        onEnd?.()
      }
      audio.onerror = () => {
        currentAudio = null
        onEnd?.()
      }

      audio.play().catch(err => {
        console.warn('Audio play error:', err)
        currentAudio = null
        onEnd?.()
      })
      return true
    } catch (e) {
      console.warn('Audio fallback error:', e)
    }
  }

  onEnd?.()
  return false
}

export default { speak, stopSpeaking, isSpeaking, detectLanguage }


