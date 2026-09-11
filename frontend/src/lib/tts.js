// Native Browser Text-to-Speech (100% Free, Offline, Zero Server Load)
// Human Voice Tone Optimization for Hindi (hi-IN) & English (en-IN/en-US)

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

function getBestVoice(targetLang) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  const voices = cachedVoices.length ? cachedVoices : (window.speechSynthesis.getVoices() || [])
  if (!voices.length) return null

  if (targetLang === 'hi') {
    // 1. High-quality Neural / Natural Hindi voices (Microsoft Swara, Google Hindi, etc.)
    const neuralHindi = voices.find(v =>
      (v.name.includes('Swara') || v.name.includes('Madhur') || v.name.includes('Google हिन्दी') || v.name.includes('Google Hindi') || v.name.includes('Natural')) &&
      (v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi'))
    )
    if (neuralHindi) return neuralHindi

    // 2. Any Hindi (hi-IN) voice
    const anyHindi = voices.find(v => v.lang.toLowerCase().replace('_', '-').includes('hi-in') || v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi'))
    if (anyHindi) return anyHindi

    // 3. Indian English voice as fallback for Hinglish
    const inEng = voices.find(v => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india'))
    if (inEng) return inEng
  } else {
    // English (India/US)
    const neuralEng = voices.find(v =>
      (v.name.includes('Neerja') || v.name.includes('Prabhat') || v.name.includes('Google') || v.name.includes('Natural')) &&
      (v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('en-us') || v.lang.toLowerCase().includes('en'))
    )
    if (neuralEng) return neuralEng

    const anyEng = voices.find(v => v.lang.toLowerCase().includes('en'))
    if (anyEng) return anyEng
  }

  return voices[0] || null
}

function normalizeTextForSpeech(text, lang) {
  if (!text) return ''
  let s = text
  // Replace currency symbols for smooth speech
  s = s.replace(/₹\s*([0-9,.]+)/g, '$1 rupaye')
  s = s.replace(/₹/g, 'rupaye')
  // Replace technical identifiers
  s = s.replace(/credit_given/gi, 'udhaar diya')
  s = s.replace(/payment_received/gi, 'wapas mila')
  // Replace symbols with natural conversational pauses
  s = s.replace(/[•|/_#—–]/g, ', ')
  // Clean double spaces
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

let currentUtterance = null

export function speak(text, { onEnd, onStart, lang } = {}) {
  if (!text || !text.trim()) {
    onEnd?.()
    return false
  }
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.()
    return false
  }

  stopSpeaking()

  try {
    const targetLang = lang || detectLanguage(text)
    const normalizedText = normalizeTextForSpeech(text, targetLang)

    const utterance = new SpeechSynthesisUtterance(normalizedText)
    utterance.lang = targetLang === 'hi' ? 'hi-IN' : 'en-IN'

    // Human tone adjustments: 0.90 speed rate & 1.02 pitch for natural warmth
    utterance.rate = 0.90
    utterance.pitch = 1.02

    const bestVoice = getBestVoice(targetLang)
    if (bestVoice) {
      utterance.voice = bestVoice
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
    console.warn('SpeechSynthesis error:', e)
    currentUtterance = null
    onEnd?.()
    return false
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try { window.speechSynthesis.cancel() } catch {}
  }
  currentUtterance = null
}

export function isSpeaking() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking
}

export default { speak, stopSpeaking, isSpeaking, detectLanguage }
