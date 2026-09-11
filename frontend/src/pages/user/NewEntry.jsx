import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useShopData } from "../../context/ShopDataContext"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import Button from "../../components/Button"
import AILoader from "../../components/AILoader"
import Select from "../../components/Select"
import { api } from "../../lib/api"
import { localParse, findCandidates } from "../../lib/parse"
import { fmt } from "../../lib/format"
import { transcribeLocal, loadLocalWhisper, transcribeBrowser } from "../../lib/stt"
import { useLang } from "../../context/LangContext"

const demoScript = { name: "Ramesh Kumar", amount: 500, type: "credit_given", spoken: "Ramesh ko paanch sau udhaar diya" }

export default function NewEntry() {
  const { customers, plan, addOrUpdateEntry } = useShopData()
  const { shopProfile } = useAuth()
  const { showToast } = useToast()
  const { t } = useLang()
  const navigate = useNavigate()

  const [phase, setPhase] = useState("idle") // idle|listening|thinking|confirm|pick
  const [transcript, setTranscript] = useState("")
  const [parsed, setParsed] = useState(null)
  const [candidates, setCandidates] = useState(null) // [{id,name,phone,balance}]
  const [selectedId, setSelectedId] = useState(null) // chosen customer id or 'new'
  const [isNewCust, setIsNewCust] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualName, setManualName] = useState("")
  const [manualAmount, setManualAmount] = useState("")
  const [manualType, setManualType] = useState("credit_given")
  const [busy, setBusy] = useState(false)
  const [lang, setLang] = useState(shopProfile?.language || "Hindi")
  const [useRealMic, setUseRealMic] = useState(true)
  const [sttProgress, setSttProgress] = useState(null) // {pct, msg, source}
  const [localReady, setLocalReady] = useState(false)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  const runDemo = async () => {
    if (phase !== "idle" && phase !== "confirm") return
    if (plan.tier === "Free" && plan.used >= plan.limit) {
      showToast("toast_entry_limit")
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

  // Preload local whisper when idle (first time net pe download, phir offline cached)
  const ensureLocal = async () => {
    if (localReady) return true
    try {
      setSttProgress({ pct: 5, msg: t('ne_stt_local_load'), source: 'local' })
      await loadLocalWhisper((pct, msg)=> setSttProgress({ pct, msg, source: 'local' }))
      setLocalReady(true)
      setSttProgress(null)
      return true
    } catch (e) {
      setSttProgress(null)
      return false
    }
  }

  const handleTranscript = async (text, source) => {
    setTranscript(`"${text}"`)
    setPhase("thinking")
    setSttProgress({ pct: 90, msg: t('ne_stt_understand', { source }), source })
    try {
      let parsedRes
      const online = navigator.onLine
      if (online) {
        try {
          parsedRes = await api.parseVoice(text, lang)
        } catch (err) {
          if (err.message==='OFFLINE' || err.message.includes('Failed to fetch') || err.message.includes('Network')) {
            parsedRes = localParse(text)
            if (parsedRes.amount<=0) throw new Error(t('ne_err_amount_offline'))
            parsedRes.raw_text = text
            const offCands = findCandidates(parsedRes.customer_name, customers, parsedRes.phone_hint)
            if (offCands.length>0) parsedRes.candidates = offCands.map(c=>({id:c.id,name:c.name,phone:c.phone||'',balance:c.balance}))
            showToast("toast_offline_parse")
          } else throw err
        }
      } else {
        parsedRes = localParse(text)
        if (parsedRes.amount<=0) throw new Error(t('ne_err_amount'))
        parsedRes.raw_text = text
        const offCands = findCandidates(parsedRes.customer_name, customers, parsedRes.phone_hint)
        if (offCands.length>0) parsedRes.candidates = offCands.map(c=>({id:c.id,name:c.name,phone:c.phone||'',balance:c.balance}))
        showToast("toast_offline_source")
      }
      setSttProgress(null)
      if (parsedRes.candidates && parsedRes.candidates.length>0) {
        setParsed(parsedRes)
        setCandidates(parsedRes.candidates)
        setSelectedId(null)
        setPhase("pick")
        showToast("toast_pick_candidates")
      } else {
        const localCands = findCandidates(parsedRes.customer_name, customers, parsedRes.phone_hint)
        if (localCands.length>1) {
          setParsed(parsedRes)
          setCandidates(localCands.map(c=>({id:c.id,name:c.name,phone:c.phone||'',balance:c.balance})))
          setSelectedId(null)
          setPhase("pick")
          showToast("toast_pick_candidates")
        } else {
          setParsed(parsedRes)
          setCandidates(null)
          setIsNewCust(!customers.find(c => c.name.toLowerCase() === parsedRes.customer_name.toLowerCase()))
          setPhase("confirm")
        }
      }
    } catch (err) {
      setSttProgress(null)
      showToast(err.message)
      setPhase("idle")
    }
  }

  const startBrowserSpeech = async () => {
    // Only try browser if online - offline pe direct recorder + local
    const online = navigator.onLine
    if (!online) return false
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return false
    return new Promise((resolve) => {
      try {
        const rec = new SR()
        const map = { Hinglish: "hi-IN", Hindi: "hi-IN", English: "en-IN", Marathi: "mr-IN", Gujarati: "gu-IN", Bengali: "bn-IN", Tamil: "ta-IN" }
        rec.lang = map[lang] || "hi-IN"
        rec.interimResults = false
        rec.maxAlternatives = 1
        rec.continuous = false
        let done = false
        rec.onresult = async (e) => {
          if (done) return; done = true
          const text = e.results[0][0].transcript
          setSttProgress({ pct: 80, msg: t('ne_stt_browser_heard'), source: 'browser' })
          await handleTranscript(text, 'browser')
          resolve(true)
        }
        rec.onerror = () => { if (!done) { done = true; resolve(false) } }
        rec.onend = () => { if (!done) { done = true; resolve(false) } }
        rec.start()
        setPhase("listening"); setTranscript(""); setParsed(null); setSttProgress({ pct: 20, msg: t('ne_stt_browser_listen'), source: 'browser' })
        showToast("toast_browser_listening")
        setTimeout(()=>{ try{ rec.stop() }catch{} }, 8000)
      } catch { resolve(false) }
    })
  }

  const startRealRecording = async () => {
    if (plan.tier === "Free" && plan.used >= plan.limit) {
      showToast("toast_entry_limit")
      navigate("/app/billing")
      return
    }
    if (!useRealMic) { runDemo(); return }
    const online = navigator.onLine
    // Net hai to browser fast path try karo (Chrome cloud) - sabse tez <2 sec
    if (online) {
      const ok = await startBrowserSpeech()
      if (ok) return
      // browser fail -> fallback to recorder (server or local)
    }
    // Offline ya browser fail -> MediaRecorder 8sec -> local whisper or server
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4" })
      chunksRef.current = []
      mediaRef.current = mr
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" })
        if (blob.size < 1000) { showToast("toast_audio_short"); setPhase("idle"); setSttProgress(null); return }
        await sendAudio(blob)
      }
      setPhase("listening"); setTranscript(""); setParsed(null); setSttProgress({ pct: 10, msg: t(online ? 'ne_stt_rec_server' : 'ne_stt_rec_offline'), source: online?'server':'local' })
      mr.start()
      showToast(online? "toast_recording_prompt" : "toast_offline_record")
      setTimeout(() => {
        if (mr.state === "recording") { mr.stop(); setPhase("thinking"); setTranscript(t('ne_stt_understanding')) }
      }, 8000)
    } catch (e) {
      showToast("toast_mic_permission")
      runDemo()
    }
  }

  const stopRecording = () => {
    if (mediaRef.current && mediaRef.current.state === "recording") {
      mediaRef.current.stop()
      setPhase("thinking")
      setTranscript(t('ne_stt_understanding'))
    }
  }

  const sendAudio = async (blob) => {
    const online = navigator.onLine
    const token = localStorage.getItem('bolkhata_token')
    setPhase("thinking")
    setSttProgress({ pct: 30, msg: t(online ? 'ne_stt_server_send' : 'ne_stt_local_hear'), source: online?'server':'local' })
    // 1. Net hai -> try server whisper first (Groq/OpenAI) - best accuracy
    if (online) {
      try {
        const file = new File([blob], "voice.webm", { type: blob.type || "audio/webm" })
        const data = await api.transcribeAndParse(file, lang)
        setSttProgress(null)
        setTranscript(`"${data.raw_text || data.customer_name + " " + data.amount}"`)
        // candidates from server
        if (data.candidates && data.candidates.length>0) {
          setParsed(data); setCandidates(data.candidates); setSelectedId(null); setPhase("pick"); return
        }
        const localCands = findCandidates(data.customer_name, customers, data.phone_hint)
        if (localCands.length>1) { setParsed(data); setCandidates(localCands.map(c=>({id:c.id,name:c.name,phone:c.phone||'',balance:c.balance}))); setSelectedId(null); setPhase("pick"); return }
        setParsed(data)
        setIsNewCust(!customers.find(c => c.name.toLowerCase() === data.customer_name.toLowerCase()))
        setPhase("confirm")
        return
      } catch (e) {
        // server fail (no keys / offline) -> fallback to local
        if (e.message.includes("not configured") || e.message.includes("Browser Free")) {
          // try local
        } else if (!e.message.includes("OFFLINE") && !e.message.includes("Failed to fetch") && !e.message.includes("Server")) {
          // real server error but not network -> show?
          // still try local
        }
      }
    }
    // 2. Local whisper (100% offline) - tiny model, Hinglish supported
    try {
      setSttProgress({ pct: 40, msg: t('ne_stt_local_model'), source: 'local' })
      const text = await transcribeLocal(blob, lang, (pct, msg)=> setSttProgress({ pct, msg, source: 'local' }))
      await handleTranscript(text, 'local')
    } catch (e) {
      setSttProgress(null)
      if (online) {
        showToast("toast_local_fail")
        runDemo()
      } else {
        showToast("toast_offline_fail")
        setPhase("idle")
      }
    }
  }

  const confirm = async () => {
    if (!parsed) return
    // If we are in pick mode but no selection, need pick first
    if (phase==='pick' && !selectedId) { showToast("toast_pick_required"); return }
    let finalName = parsed.customer_name
    let finalId = null
    if (phase==='pick' && selectedId && selectedId!=='new') {
      const chosen = candidates.find(c=>String(c.id)===String(selectedId))
      if (chosen) { finalName = chosen.name; finalId = chosen.id }
    }
    if ((plan.tier==='Free' || plan.tier==='Standard') && plan.used >= plan.limit && !navigator.onLine) {
      showToast("toast_offline_limit")
    }
    setBusy(true)
    try {
      const res = await addOrUpdateEntry(finalName, parsed.amount, parsed.type, parsed.raw_text || transcript, "voice", finalId, parsed.phone_hint)
      if (res && res._offline) showToast("toast_offline_save", 'success', { name: finalName })
      else showToast("toast_entry_saved")
      setPhase("idle"); setTranscript(""); setParsed(null); setCandidates(null); setSelectedId(null)
    } catch (e) {
      // Handle 409 candidate from API (server disambiguation)
      const msg = e.message || ""
      if (msg.includes("candidates") || e.candidates) {
        try {
          let cands = e.candidates
          if (!cands && msg.includes("{")) {
            const m=msg.match(/\{.*\}/s); if(m) { const j=JSON.parse(m[0]); cands=j.candidates }
          }
          if (cands && cands.length) {
            setCandidates(cands)
            setPhase("pick")
            showToast("toast_pick_candidates")
            return
          }
        } catch {}
      }
      // Try parse 409 detail JSON from apiFetch
      if (msg.includes("kaunsa") || msg.includes("mile")) {
        // fallback: try to get candidates from local find
        const localCands = findCandidates(parsed.customer_name, customers, parsed.phone_hint)
        if (localCands.length>1) {
          setCandidates(localCands.map(c=>({id:c.id,name:c.name,phone:c.phone||'',balance:c.balance})))
          setPhase("pick")
          return
        }
      }
      showToast(e.message)
      if (e.message.toLowerCase().includes("free plan")) navigate("/app/billing")
    } finally { setBusy(false) }
  }
  const cancel = () => { setPhase("idle"); setTranscript(""); setParsed(null); setCandidates(null); setSelectedId(null) }
  const pickNew = () => { setSelectedId('new'); }

  const submitManual = async () => {
    if (!manualName.trim() || !manualAmount) { showToast("toast_manual_fields"); return }
    setBusy(true)
    try {
      await addOrUpdateEntry(manualName.trim(), parseFloat(manualAmount), manualType, "(manual entry)", "manual")
      setManualName(""); setManualAmount(""); setManualOpen(false)
      showToast("toast_entry_saved")
    } catch (e) {
      showToast(e.message)
      if (e.message.toLowerCase().includes("free plan")) navigate("/app/billing")
    } finally { setBusy(false) }
  }

  const typeLabel = parsed?.type === "payment_received" ? t('ne_manual_wapas') : t('ne_manual_udhaar')

  return (
    <div className="w-full">
      <div className="mb-6 flex justify-end">
        <Select value={lang} onChange={e=>setLang(e.target.value)} className="w-full sm:w-auto">
          <option>Hinglish</option><option>Hindi</option><option>English</option><option>Marathi</option><option>Gujarati</option><option>Bengali</option>
        </Select>
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
            {phase === "idle" && t('ne_idle')}
            {phase === "listening" && t('ne_listening')}
            {phase === "thinking" && t('ne_thinking')}
            {phase === "confirm" && t('ne_confirm_phase')}
          </div>
          <div className="flex items-center justify-center gap-1 h-9">
            {phase === "listening" && Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="w-1 rounded bg-gold animate-wave" style={{ animationDelay: `${(i % 3) * 0.15}s` }} />
            ))}
          </div>
          <div className="font-hand text-xl text-center min-h-[30px]">{transcript}</div>
          {sttProgress && (
            <div className="w-full max-w-[320px]">
              <div className="flex justify-between text-[11px] font-mono text-ink-dim mb-1"><span>{sttProgress.msg}</span><span>{sttProgress.pct}% • {sttProgress.source}</span></div>
              <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden"><div className="h-full bg-[var(--gold)] transition-all" style={{ width: `${sttProgress.pct}%` }} /></div>
            </div>
          )}
          <div className="flex gap-2 text-[11.5px] flex-wrap justify-center">
            <span className={`px-2.5 py-1 rounded-full border font-bold text-[11px] ${!navigator.onLine ? 'bg-maroon text-white border-maroon' : 'bg-[rgba(79,163,122,0.12)] border-green text-green'}`}>{!navigator.onLine ? t('ne_status_offline') : t('ne_status_auto')}</span>
            <button onClick={()=>setUseRealMic(v=>!v)} className={`px-3 py-1.5 rounded-full border ${useRealMic ? "bg-[rgba(232,169,59,.15)] border-gold text-gold" : "bg-surface-2 border-line"}`}>{useRealMic ? t('ne_whisper_auto') : t('ne_demo_mode')}</button>
            <button onClick={runDemo} className="text-gold font-bold">{t('ne_demo')}</button>
          </div>
          {!localReady && <button onClick={ensureLocal} className="text-[11px] text-ink-dim underline">{t('ne_download_local')}</button>}
          <button onClick={() => setManualOpen(o => !o)} className="text-gold font-bold text-[13.5px]">{t('ne_manual_link')}</button>
          {manualOpen && (
            <div className="w-full">
              <div className="mb-3.5">
                <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('ne_lbl_name')}</label>
                <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder={t('ne_lbl_name_ph')} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
              </div>
              <div className="mb-3.5">
                <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('ne_amount')}</label>
                <input type="number" value={manualAmount} onChange={e => setManualAmount(e.target.value)} placeholder="500" className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
              </div>
              <div className="mb-4">
                <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('ne_lbl_type')}</label>
                <div className="flex gap-2.5">
                  <button onClick={() => setManualType("credit_given")} className={`flex-1 text-center py-3 rounded-xl border-[1.5px] font-bold text-[13.5px] ${manualType === "credit_given" ? "border-maroon bg-[rgba(229,83,61,.1)] text-maroon" : "border-line text-ink-dim"}`}>{t('ne_manual_udhaar')}</button>
                  <button onClick={() => setManualType("payment_received")} className={`flex-1 text-center py-3 rounded-xl border-[1.5px] font-bold text-[13.5px] ${manualType === "payment_received" ? "border-green bg-[rgba(79,163,122,.1)] text-green" : "border-line text-ink-dim"}`}>{t('ne_manual_wapas')}</button>
                </div>
              </div>
              <Button onClick={submitManual} disabled={busy} className="w-full">{busy ? t('ne_btn_saving') : t('ne_btn_save')}</Button>
            </div>
          )}
        </div>

        <div className="bg-surface border border-line rounded-3xl p-6">
          <h3 className="font-extrabold text-[16.5px] mb-4">{phase==='pick' ? t('ne_pick_heading') : t('ne_confirm_heading')}</h3>
          {phase === "thinking" ? (
            <AILoader text={t('ne_ai_thinking')} subtext={t('ne_ai_sub')} />
          ) : phase === "pick" && parsed && candidates ? (
            <div className="space-y-3">
              <div className="bg-surface-2 border border-gold rounded-2xl p-4">
                <div className="flex justify-between text-sm"><span className="text-ink-dim">{t('ne_bola')}</span><b>"{parsed.raw_text}"</b></div>
                <div className="flex justify-between py-1.5 mt-2"><span className="text-ink-dim">{t('ne_lbl_amount')}</span><b className="font-mono text-maroon">₹{parsed.amount}</b></div>
                <div className="flex justify-between"><span className="text-ink-dim">{t('ne_lbl_type')}</span><b>{typeLabel}</b> <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${parsed.type==='payment_received'?'bg-green text-white':'bg-maroon text-white'}`}>{parsed.type==='payment_received'?t('ne_bal_minus'):t('ne_bal_plus')}</span></div>
              </div>
              <p className="text-[13px] font-bold text-maroon">{t('ne_multi_found', { name: parsed.customer_name, n: candidates.length })}</p>
              <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
                {candidates.map(c=>(
                  <button key={c.id} onClick={()=>setSelectedId(String(c.id))} className={`w-full text-left p-3 rounded-2xl border-2 flex items-center justify-between ${String(selectedId)===String(c.id)?'border-[var(--gold)] bg-[rgba(232,169,59,.10)]':'border-line bg-surface-2'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${String(selectedId)===String(c.id)?'bg-[var(--gold)] text-[#1A1206]':'bg-surface border border-line'}`}>{c.name.slice(0,2).toUpperCase()}</div>
                      <div><div className="font-bold text-sm">{c.name}</div><div className="text-xs text-ink-dim">{c.phone||t('ne_no_phone')} • {t('ne_baki', { amount: fmt(c.balance) })}</div></div>
                    </div>
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${String(selectedId)===String(c.id)?'border-[var(--gold)] bg-[var(--gold)]':'border-line'}`}>{String(selectedId)===String(c.id) && <span className="text-[#1A1206] text-xs">✓</span>}</span>
                  </button>
                ))}
                <button onClick={pickNew} className={`w-full p-3 rounded-2xl border-2 border-dashed flex items-center gap-3 ${selectedId==='new'?'border-[var(--gold)] bg-[rgba(232,169,59,.10)]':'border-line'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedId==='new'?'bg-[var(--gold)] text-[#1A1206]':'bg-surface-2 border border-line'}`}>+</div>
                  <div className="text-left"><div className="font-bold text-sm">{t('ne_new_cust', { name: parsed.customer_name })}</div><div className="text-xs text-ink-dim">{t('ne_new_cust_sub')}</div></div>
                </button>
              </div>
              {parsed.phone_hint && <p className="text-[11px] text-ink-dim">{t('ne_phone_hint', { phone: parsed.phone_hint })}</p>}
              <div className="flex gap-2.5">
                <Button variant="ghost" onClick={cancel} disabled={busy} className="flex-1">{t('ne_btn_cancel')}</Button>
                <Button onClick={confirm} disabled={busy || !selectedId} className="flex-1">{busy?'...': selectedId==='new'? t('ne_btn_make', { amount: parsed.amount }) : t('ne_btn_confirm')}</Button>
              </div>
              <p className="text-[11px] text-ink-dim text-center">{t('ne_tip')}</p>
            </div>
          ) : phase !== "confirm" || !parsed ? (
            <div className="text-center py-6">
              <p className="text-ink-dim text-[13.5px]">{t('ne_placeholder_card')}</p>
              <p className="text-[11.5px] text-ink-dim mt-2">{t('ne_placeholder_ex1')}<br />{t('ne_placeholder_ex2')}<br />{t('ne_placeholder_ex3')}</p>
            </div>
          ) : (
            <div className="bg-surface-2 border border-line rounded-2xl p-6 max-w-[360px] mx-auto animate-fadeUp">
              <div className="flex justify-between py-2.5 border-b border-dashed border-line">
                <span className="text-ink-dim">{t('ne_grahak')}</span>
                <b>{parsed.customer_name} {isNewCust && <span className="ml-2 text-[10.5px] bg-[rgba(232,169,59,.18)] text-gold px-2 py-0.5 rounded-full font-extrabold">{t('ne_new_badge')}</span>}</b>
              </div>
              <div className="flex justify-between py-2.5 border-b border-dashed border-line"><span className="text-ink-dim">{t('ne_lbl_type')}</span><b>{typeLabel}</b> <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${parsed.type==='payment_received'?'bg-green text-white':'bg-maroon text-white'}`}>{parsed.type==='payment_received'?t('ne_bal_minus'):t('ne_bal_plus')}</span></div>
              <div className="flex justify-between py-2.5 border-b border-dashed border-line"><span className="text-ink-dim">{t('ne_bhasha')}</span><b>{lang}</b></div>
              <div className="flex justify-between py-2.5"><span className="text-ink-dim">{t('ne_lbl_amount')}</span><b className={`font-mono text-xl ${parsed.type==='payment_received'?'text-green':'text-maroon'}`}>₹{parsed.amount}</b></div>
              {(() => {
                const cust = customers.find(c=>c.name.toLowerCase()===parsed.customer_name.toLowerCase())
                const before = cust ? cust.balance : 0
                const after = parsed.type==='payment_received' ? before - parsed.amount : before + parsed.amount
                return isNewCust ? <div className="text-[11px] text-ink-dim text-center">{t('ne_first_balance', { amount: fmt(parsed.amount) })}</div> :
                  <div className="text-[11px] text-ink-dim text-center mt-1">{fmt(before)} → {fmt(after)} {parsed.type==='payment_received'?t('ne_flow_tag_wapas'):t('ne_flow_tag_udhaar')} • {cust? cust.name : ''}</div>
              })()}
              <div className="text-[11.5px] text-ink-dim mt-2 text-center">"{parsed.raw_text}" {parsed.phone_hint && <span className="text-gold">• phone:{parsed.phone_hint}</span>}</div>
              {parsed.type==='payment_received' && (()=>{ const c=customers.find(x=>x.name.toLowerCase()===parsed.customer_name.toLowerCase()); if(c && parsed.amount > c.balance) return <div className="mt-2 p-2 rounded-xl bg-[rgba(229,83,61,.08)] border border-maroon text-xs text-maroon text-center">{t('ne_overpay', { amount: fmt(parsed.amount), balance: fmt(c.balance) })}</div>; return null })()}
              <div className="flex gap-2.5 mt-4">
                <Button variant="ghost" onClick={cancel} disabled={busy} className="flex-1">{t('ne_btn_no')}</Button>
                <Button onClick={confirm} disabled={busy} className="flex-1">{busy ? "..." : t('ne_btn_confirm')}</Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="text-[11.5px] text-ink-dim mt-3 text-center" dangerouslySetInnerHTML={{ __html: t('ne_footer_offline') }} />
    </div>
  )
}