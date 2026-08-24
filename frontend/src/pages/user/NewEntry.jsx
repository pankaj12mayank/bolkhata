import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useShopData } from "../../context/ShopDataContext"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import Button from "../../components/Button"
import AILoader from "../../components/AILoader"
import { api } from "../../lib/api"

const demoScript = { name: "Ramesh Kumar", amount: 500, type: "credit_given", spoken: "Ramesh ko paanch sau udhaar diya" }

export default function NewEntry() {
  const { customers, plan, addOrUpdateEntry } = useShopData()
  const { shopProfile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [phase, setPhase] = useState("idle")
  const [transcript, setTranscript] = useState("")
  const [parsed, setParsed] = useState(null)
  const [isNewCust, setIsNewCust] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualName, setManualName] = useState("")
  const [manualAmount, setManualAmount] = useState("")
  const [manualType, setManualType] = useState("credit_given")
  const [busy, setBusy] = useState(false)
  const [lang, setLang] = useState(shopProfile?.language || "Hinglish")
  const [useRealMic, setUseRealMic] = useState(true)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  const runDemo = async () => {
    if (phase !== "idle" && phase !== "confirm") return
    if (plan.tier === "Free" && plan.used >= plan.limit) {
      showToast("Free plan ki entries poori ho gayi — upgrade karein")
      navigate("/app/billing")
      return
    }
    setPhase("listening"); setTranscript(""); setParsed(null)
    await new Promise(r => setTimeout(r, 900))
    setPhase("thinking")
    const text = `"${demoScript.spoken}"`
    for (let i = 1; i <= text.length; i++) {
      await new Promise(r => setTimeout(r, 22))
      setTranscript(text.slice(0, i))
    }
    await new Promise(r => setTimeout(r, 200))
    const p = { customer_name: demoScript.name, amount: demoScript.amount, type: demoScript.type, raw_text: demoScript.spoken }
    setParsed(p)
    setIsNewCust(!customers.find(c => c.name.toLowerCase() === p.customer_name.toLowerCase()))
    setPhase("confirm")
  }

  const startBrowserSpeech = async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return false
    return new Promise((resolve) => {
      try {
        const rec = new SR()
        // Map lang to BCP47
        const map = { Hinglish: "hi-IN", Hindi: "hi-IN", English: "en-IN", Marathi: "mr-IN" }
        rec.lang = map[lang] || "hi-IN"
        rec.interimResults = false
        rec.maxAlternatives = 1
        rec.continuous = false
        let done = false
        rec.onresult = async (e) => {
          if (done) return; done = true
          const text = e.results[0][0].transcript
          setTranscript(`"${text}"`)
          setPhase("thinking")
          try {
            const parsedRes = await api.parseVoice(text, lang)
            setParsed(parsedRes)
            setIsNewCust(!customers.find(c => c.name.toLowerCase() === parsedRes.customer_name.toLowerCase()))
            setPhase("confirm")
          } catch (err) {
            showToast(err.message)
            setPhase("idle")
          }
          resolve(true)
        }
        rec.onerror = () => { if (!done) { done = true; resolve(false) } }
        rec.onend = () => { if (!done) { done = true; resolve(false) } }
        rec.start()
        setPhase("listening"); setTranscript(""); setParsed(null)
        showToast("Sun raha hoon (Browser Free) — boliye...")
        // timeout 6s
        setTimeout(()=>{ try{ rec.stop() }catch{} }, 6000)
      } catch { resolve(false) }
    })
  }

  const startRealRecording = async () => {
    if (plan.tier === "Free" && plan.used >= plan.limit) {
      showToast("Free plan ki entries poori ho gayi — upgrade karein")
      navigate("/app/billing")
      return
    }
    if (!useRealMic) { runDemo(); return }
    // Try browser free first (no install, no key) — recommended
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) {
      const ok = await startBrowserSpeech()
      if (ok) return
      // if browser speech failed, fall through to MediaRecorder + Whisper
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4" })
      chunksRef.current = []
      mediaRef.current = mr
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" })
        if (blob.size < 1000) { showToast("Audio bahut chhota — dobara boliye"); setPhase("idle"); return }
        await sendAudio(blob)
      }
      setPhase("listening"); setTranscript(""); setParsed(null)
      mr.start()
      showToast("Sun raha hoon... boliye: Ramesh ko paanch sau udhaar diya")
      setTimeout(() => {
        if (mr.state === "recording") { mr.stop(); setPhase("thinking"); setTranscript("Samajh raha hoon...") }
      }, 5000)
    } catch (e) {
      showToast("Mic permission nahi mila — demo chal raha hai")
      runDemo()
    }
  }

  const stopRecording = () => {
    if (mediaRef.current && mediaRef.current.state === "recording") {
      mediaRef.current.stop()
      setPhase("thinking")
      setTranscript("Samajh raha hoon...")
    }
  }

  const sendAudio = async (blob) => {
    try {
      setPhase("thinking")
      const file = new File([blob], "voice.webm", { type: blob.type || "audio/webm" })
      let data
      try {
        data = await api.transcribeAndParse(file, lang)
      } catch (err) {
        throw err
      }
      setTranscript(`"${data.raw_text || data.customer_name + " " + data.amount}"`)
      setParsed(data)
      setIsNewCust(!customers.find(c => c.name.toLowerCase() === data.customer_name.toLowerCase()))
      setPhase("confirm")
    } catch (e) {
      if (e.message.includes("not configured") || e.message.includes("Voice")) {
        showToast("Voice keys nahi lagi — Admin → Settings me OpenAI/Claude lagayein. Demo dikha raha hoon.")
        runDemo()
        return
      }
      showToast(e.message)
      setPhase("idle")
    }
  }

  const confirm = async () => {
    if (!parsed) return
    setBusy(true)
    try {
      await addOrUpdateEntry(parsed.customer_name, parsed.amount, parsed.type, parsed.raw_text || transcript, "voice")
      showToast(`Entry save \u2713 — ${parsed.customer_name} ka balance update`)
      setPhase("idle"); setTranscript(""); setParsed(null)
    } catch (e) {
      showToast(e.message)
      if (e.message.toLowerCase().includes("free plan")) navigate("/app/billing")
    } finally { setBusy(false) }
  }
  const cancel = () => { setPhase("idle"); setTranscript(""); setParsed(null) }

  const submitManual = async () => {
    if (!manualName.trim() || !manualAmount) { showToast("Naam aur amount dono bharein"); return }
    setBusy(true)
    try {
      await addOrUpdateEntry(manualName.trim(), parseFloat(manualAmount), manualType, "(manual entry)", "manual")
      setManualName(""); setManualAmount(""); setManualOpen(false)
      showToast("Entry save ho gayi \u2713")
    } catch (e) {
      showToast(e.message)
      if (e.message.toLowerCase().includes("free plan")) navigate("/app/billing")
    } finally { setBusy(false) }
  }

  const typeLabel = parsed?.type === "payment_received" ? "Vaapsi Mili" : "Udhaar Diya"

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display font-normal text-[24px] sm:text-[28px]">Naya Entry</h1>
          <p className="text-ink-dim text-[13px] sm:text-[14.5px] mt-1">Mic dabaiye aur boliye — Hinglish / Hindi / English sab chalega.</p>
        </div>
        <select value={lang} onChange={e=>setLang(e.target.value)} className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-line bg-surface text-sm">
          <option>Hinglish</option><option>Hindi</option><option>English</option><option>Marathi</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <div className="bg-surface border border-line rounded-3xl p-4 sm:p-9 flex flex-col items-center gap-4 sm:gap-5">
          <button
            onClick={phase==="listening" ? stopRecording : startRealRecording}
            className={`w-[110px] h-[110px] rounded-full flex items-center justify-center transition-transform active:scale-95 ${phase === "listening" ? "animate-micPulse" : ""}`}
            style={{ background: "radial-gradient(circle at 35% 30%, var(--gold), var(--gold-deep) 75%)", boxShadow: "0 14px 34px -10px rgba(232,169,59,.5)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" width="36" height="36"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" fill="#1A1206" /><path d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3" stroke="#1A1206" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
          <div className="font-mono text-[13px] text-ink-dim">
            {phase === "idle" && "Mic dabaiye — 5 sec tak boliye (real)"}
            {phase === "listening" && "Sun raha hoon... boliye, phir band karein"}
            {phase === "thinking" && "Samajh raha hoon..."}
            {phase === "confirm" && "Confirm karein"}
          </div>
          <div className="flex items-center justify-center gap-1 h-9">
            {phase === "listening" && Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="w-1 rounded bg-gold animate-wave" style={{ animationDelay: `${(i % 3) * 0.15}s` }} />
            ))}
          </div>
          <div className="font-hand text-xl text-center min-h-[30px]">{transcript}</div>
          <div className="flex gap-2 text-[11.5px] flex-wrap justify-center">
            <span className="px-2.5 py-1 rounded-full bg-[rgba(79,163,122,0.12)] border border-green text-green font-bold text-[11px]">Browser Free ✓ — No install</span>
            <button onClick={()=>setUseRealMic(v=>!v)} className={`px-3 py-1.5 rounded-full border ${useRealMic ? "bg-[rgba(232,169,59,.15)] border-gold text-gold" : "bg-surface-2 border-line"}`}>{useRealMic ? "Whisper Auto" : "Demo Mode"}</button>
            <button onClick={runDemo} className="text-gold font-bold">Demo →</button>
          </div>
          <button onClick={() => setManualOpen(o => !o)} className="text-gold font-bold text-[13.5px]">Awaaz samajh nahi aayi? Manual entry karein →</button>
          {manualOpen && (
            <div className="w-full">
              <div className="mb-3.5">
                <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Grahak ka Naam</label>
                <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Jaise: Anil Kirana Supply" className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
              </div>
              <div className="mb-3.5">
                <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Amount (₹)</label>
                <input type="number" value={manualAmount} onChange={e => setManualAmount(e.target.value)} placeholder="500" className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
              </div>
              <div className="mb-4">
                <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Type</label>
                <div className="flex gap-2.5">
                  <button onClick={() => setManualType("credit_given")} className={`flex-1 text-center py-3 rounded-xl border-[1.5px] font-bold text-[13.5px] ${manualType === "credit_given" ? "border-maroon bg-[rgba(229,83,61,.1)] text-maroon" : "border-line text-ink-dim"}`}>Udhaar Diya</button>
                  <button onClick={() => setManualType("payment_received")} className={`flex-1 text-center py-3 rounded-xl border-[1.5px] font-bold text-[13.5px] ${manualType === "payment_received" ? "border-green bg-[rgba(79,163,122,.1)] text-green" : "border-line text-ink-dim"}`}>Vaapsi Mili</button>
                </div>
              </div>
              <Button onClick={submitManual} disabled={busy} className="w-full">{busy ? "Save ho raha hai..." : "Entry Save Karein"}</Button>
            </div>
          )}
        </div>

        <div className="bg-surface border border-line rounded-3xl p-6">
          <h3 className="font-extrabold text-[16.5px] mb-4">Confirm Karein</h3>
          {phase === "thinking" ? (
            <AILoader text="AI samajh raha hai..." subtext="Hinglish • Hindi • English — cinematic" />
          ) : phase !== "confirm" || !parsed ? (
            <div className="text-center py-6">
              <p className="text-ink-dim text-[13.5px]">Entry yahan confirmation card ki tarah dikhegi.</p>
              <p className="text-[11.5px] text-ink-dim mt-2">Hinglish: &quot;Ramesh ko paanch sau udhaar diya&quot; → Ramesh | 500 | Udhaar<br/>English: &quot;Give 500 to John&quot; → John | 500 | Udhaar</p>
            </div>
          ) : (
            <div className="bg-surface-2 border border-line rounded-2xl p-6 max-w-[360px] mx-auto animate-fadeUp">
              <div className="flex justify-between py-2.5 border-b border-dashed border-line">
                <span className="text-ink-dim">Grahak</span>
                <b>{parsed.customer_name} {isNewCust && <span className="ml-2 text-[10.5px] bg-[rgba(232,169,59,.18)] text-gold px-2 py-0.5 rounded-full font-extrabold">Naya</span>}</b>
              </div>
              <div className="flex justify-between py-2.5 border-b border-dashed border-line"><span className="text-ink-dim">Type</span><b>{typeLabel}</b></div>
              <div className="flex justify-between py-2.5 border-b border-dashed border-line"><span className="text-ink-dim">Bhasha</span><b>{lang}</b></div>
              <div className="flex justify-between py-2.5"><span className="text-ink-dim">Amount</span><b className="font-mono text-xl text-maroon">₹{parsed.amount}</b></div>
              <div className="text-[11.5px] text-ink-dim mt-2 text-center">&quot;{parsed.raw_text}&quot;</div>
              <div className="flex gap-2.5 mt-4">
                <Button variant="ghost" onClick={cancel} disabled={busy} className="flex-1">Nahi</Button>
                <Button onClick={confirm} disabled={busy} className="flex-1">{busy ? "..." : "Confirm \u2713"}</Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="text-[11.5px] text-ink-dim mt-3 text-center">Browser Free me koi key/install nahi — Chrome me direct boliye, Hinglish/Hindi/English auto. Whisper cloud paid (~$0.006/min) optional hai, Admin → Settings → STT me change karein.</p>
    </div>
  )
}