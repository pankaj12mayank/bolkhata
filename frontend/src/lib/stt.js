// 100% Offline STT - local whisper tiny + Browser Web Speech hybrid
// Net hai -> Browser fast (hi-IN), fail -> server Whisper, offline -> local tiny
// Model: Xenova/whisper-tiny (39M) quantized, 12MB cached via PWA

let localPipeline = null
let loadingPromise = null
let modelReady = false
let loadProgress = 0

export function isLocalReady() { return modelReady }
export function getLoadProgress() { return loadProgress }

async function getAudioBuffer(blob) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 })
  const arrayBuf = await blob.arrayBuffer()
  const audioBuf = await ctx.decodeAudioData(arrayBuf.slice(0))
  // whisper expects 16k mono Float32Array
  let data = audioBuf.getChannelData(0)
  // resample if needed already 16k via ctx, else downsample simple
  if (audioBuf.sampleRate !== 16000) {
    const ratio = audioBuf.sampleRate / 16000
    const newLen = Math.floor(data.length / ratio)
    const res = new Float32Array(newLen)
    for (let i = 0; i < newLen; i++) res[i] = data[Math.floor(i * ratio)]
    data = res
  }
  await ctx.close()
  return data
}

export async function loadLocalWhisper(onProgress) {
  if (modelReady) return localPipeline
  if (loadingPromise) return loadingPromise
  loadingPromise = (async () => {
    try {
      // dynamic import to avoid bundling node deps
      const { pipeline, env } = await import('@xenova/transformers')
      // allow local + remote, cache in IndexedDB via browser cache
      env.allowRemoteModels = true
      // use wasm, not webgpu for wider support
      // env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/'
      onProgress?.(10, 'Model download...')
      const pipe = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
        quantized: true,
        progress_callback: (p) => {
          // p: {status, progress, file}
          if (p.progress != null) {
            loadProgress = Math.round(p.progress)
            onProgress?.(loadProgress, p.status || 'loading')
          }
        }
      })
      localPipeline = pipe
      modelReady = true
      loadProgress = 100
      onProgress?.(100, 'Ready')
      return pipe
    } catch (e) {
      console.error('local whisper load fail', e)
      onProgress?.(0, 'fail: ' + e.message)
      throw e
    } finally {
      loadingPromise = null
    }
  })()
  return loadingPromise
}

export async function transcribeLocal(blob, langHint = 'hi', onProgress) {
  // langHint: hi-IN -> hi, en-IN -> en
  const lang = (langHint || 'Hinglish').toLowerCase().includes('en') ? 'english' : 'hindi'
  // For Hinglish, use hindi but translate false, whisper auto
  const pipe = await loadLocalWhisper(onProgress)
  onProgress?.(95, 'Audio decode...')
  const audioData = await getAudioBuffer(blob)
  if (audioData.length < 8000) throw new Error('Audio bahut chhota')
  onProgress?.(98, 'Transcribe local...')
  // whisper tiny: set language via generation_config? transformers handles auto
  // Force language: pass language param
  const opts = {
    language: lang === 'english' ? 'english' : 'hindi',
    task: 'transcribe',
    chunk_length_s: 30,
    stride_length_s: 5,
  }
  // For Hinglish, we try hindi first, if confidence low fallback to english is handled by model auto
  const out = await pipe(audioData, opts)
  const text = (out?.text || '').trim()
  if (!text) throw new Error('Local STT khali - dobara saaf bolo')
  return text
}

// Browser Web Speech wrapper
export function transcribeBrowser(langHint = 'hi-IN') {
  return new Promise((resolve, reject) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return reject(new Error('Browser Speech not supported'))
    const rec = new SR()
    const map = { Hindi: 'hi-IN', English: 'en-IN', hi: 'hi-IN', en: 'en-IN' }
    rec.lang = map[langHint] || langHint || 'hi-IN'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.continuous = false
    let done = false
    let timer = null
    rec.onresult = (e) => {
      if (done) return; done = true; clearTimeout(timer)
      const t = e.results[0][0].transcript
      resolve(t)
    }
    rec.onerror = (e) => {
      if (done) return; done = true; clearTimeout(timer)
      reject(new Error(e.error || 'Speech error'))
    }
    rec.onend = () => {
      if (done) return; done = true; clearTimeout(timer)
      reject(new Error('No speech'))
    }
    try {
      rec.start()
      timer = setTimeout(()=>{ try{ rec.stop()}catch{} }, 8000)
    } catch (e) { reject(e) }
  })
}

// Unified: try browser if online, else local; net pe bhi local fallback
export async function transcribeWithFallback(blobOrNull, langHint, { preferLocal = false, onProgress } = {}) {
  // If blob is null, we are in browser mode (live mic), try browser first
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true
  // 1. If not preferLocal and online, try browser live STT (no blob needed)
  if (!preferLocal && online && !blobOrNull) {
    try {
      const t = await transcribeBrowser(langHint)
      return { text: t, source: 'browser' }
    } catch (e) {
      // browser fail -> if offline-like, go local requires blob, so need to fallback to recorder path
      throw e // caller will go to MediaRecorder path
    }
  }
  // 2. If blob given, we have audio. Try local if offline or preferLocal
  if (blobOrNull) {
    // If online and not preferLocal, caller may have tried server first; we are fallback
    // Try local whisper
    try {
      const text = await transcribeLocal(blobOrNull, langHint, onProgress)
      return { text, source: 'local' }
    } catch (e) {
      throw e
    }
  }
  throw new Error('No audio')
}

export async function transcribeServerWhisper(blob, langHint, token) {
  const base = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
  const fd = new FormData()
  fd.append('file', blob, 'voice.webm')
  fd.append('language', langHint || 'Hinglish')
  const r = await fetch(base + '/voice/transcribe-and-parse', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd
  })
  const data = await r.json().catch(()=>null)
  if (!r.ok) throw new Error(data?.detail || 'Server STT fail')
  return data
}
