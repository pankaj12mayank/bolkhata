import { useEffect, useState } from 'react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { useToast } from '../../context/ToastContext'
import { api } from '../../lib/api'

function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} className={`w-11 h-6 rounded-full relative flex-shrink-0 border transition-colors ${on ? 'bg-[rgba(79,163,122,.2)] border-green' : 'bg-surface-2 border-line'}`}>
      <div className={`absolute top-0.5 w-[18px] h-[18px] rounded-full transition-transform ${on ? 'translate-x-5 bg-green' : 'translate-x-0.5 bg-ink-dim'}`} />
    </button>
  )
}
function Field({ label, value, onChange, type="text", placeholder, hint }) {
  return (
    <div className="mb-3">
      <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
      {hint && <span className="text-[11px] text-ink-dim mt-1 block">{hint}</span>}
    </div>
  )
}
const AI_PROVIDERS = [
  { id:"local", label:"Local Free (Rule-based) — No key, basic Hinglish", base:"", model:"" },
  { id:"groq", label:"Groq — Cheap & Fast (OpenAI-compatible)", base:"https://api.groq.com/openai/v1", model:"llama-3.1-8b-instant" },
  { id:"openai", label:"OpenAI — Paid, Best", base:"https://api.openai.com/v1", model:"gpt-4o-mini" },
  { id:"openrouter", label:"OpenRouter — 1 key, 100 models", base:"https://openrouter.ai/api/v1", model:"openai/gpt-4o-mini" },
  { id:"anthropic", label:"Anthropic Claude", base:"https://api.anthropic.com", model:"claude-3-haiku-20240307" },
  { id:"ollama", label:"Ollama Local — Free, Self-host", base:"http://localhost:11434/v1", model:"llama3" },
  { id:"custom", label:"Custom — Any OpenAI-compatible", base:"", model:"" },
]
const STT_PROVIDERS = [
  { id:"browser", label:"Browser Free — No install, free in Chrome (Recommended)", hint:"Web Speech API — no key, Hinglish/Hindi/English auto" },
  { id:"openai", label:"OpenAI Whisper — Paid (~$0.006/min, better Hindi)", hint:"Requires API key, cloud, no install" },
  { id:"custom", label:"Custom STT", hint:"Self-hosted Whisper or other" },
]

export default function Settings() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [diag, setDiag] = useState({})
  const [resetConfirm, setResetConfirm] = useState("")

  const [limit, setLimit] = useState(15)
  const [price, setPrice] = useState(99)
  const [paidLimit, setPaidLimit] = useState(-1)
  const [defaultLang, setDefaultLang] = useState("Hinglish")
  const [waTemplate, setWaTemplate] = useState("")
  const [autoReminder, setAutoReminder] = useState(true)
  const [maintenance, setMaintenance] = useState(false)

  const [aiProvider, setAiProvider] = useState("local")
  const [aiBase, setAiBase] = useState("")
  const [aiKey, setAiKey] = useState("")
  const [aiModel, setAiModel] = useState("gpt-4o-mini")
  const [sttProvider, setSttProvider] = useState("browser")
  const [sttBase, setSttBase] = useState("")
  const [sttKey, setSttKey] = useState("")
  const [sttModel, setSttModel] = useState("whisper-1")
  const [waProvider, setWaProvider] = useState("wa_me")
  const [waBase, setWaBase] = useState("")
  const [waKey, setWaKey] = useState("")
  const [waPhoneId, setWaPhoneId] = useState("")
  const [otpProvider, setOtpProvider] = useState("dev")
  const [otpBase, setOtpBase] = useState("")
  const [otpKey, setOtpKey] = useState("")
  const [otpTemplate, setOtpTemplate] = useState("")
  const [otpExpiry, setOtpExpiry] = useState(5)
  const [jwtExpiry, setJwtExpiry] = useState(10080)

  const [razorKey, setRazorKey] = useState("")
  const [razorSecret, setRazorSecret] = useState("")
  const [razorTestMode, setRazorTestMode] = useState("true")
  const [webhookSecret, setWebhookSecret] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const s = await api.getSettings()
      const r = await api.getSettingsRaw().catch(()=>null)
      if(r) setDiag(r)
      setLimit(s.free_entries_limit)
      setPrice(s.paid_price_inr)
      setPaidLimit(s.paid_entries_limit)
      setDefaultLang(s.default_language || "Hinglish")
      setWaTemplate(s.wa_template || "")
      setAutoReminder(s.auto_reminder === "true")
      setMaintenance(s.maintenance_mode === "true")
      setAiProvider(s.ai_provider || "local")
      setAiBase(s.ai_base_url || "")
      setAiKey(s.ai_api_key || "")
      setAiModel(s.ai_model || "gpt-4o-mini")
      setSttProvider(s.stt_provider || "browser")
      setSttBase(s.stt_base_url || "")
      setSttKey(s.stt_api_key || "")
      setSttModel(s.stt_model || "whisper-1")
      setWaProvider(s.whatsapp_provider || "wa_me")
      setWaBase(s.whatsapp_base_url || "")
      setWaKey(s.whatsapp_api_key || "")
      setWaPhoneId(s.whatsapp_phone_id || "")
      setOtpProvider(s.otp_provider || s.otp_mode || "dev")
      setOtpBase(s.otp_base_url || "")
      setOtpKey(s.otp_api_key || "")
      setOtpTemplate(s.otp_template_id || "")
      setOtpExpiry(s.otp_expiry_minutes || 5)
      setJwtExpiry(s.jwt_expire_minutes || 10080)
      setRazorKey(s.razorpay_key_id || "")
      setRazorSecret(s.razorpay_key_secret || "")
      setRazorTestMode(s.razorpay_test_mode || "true")
      setWebhookSecret(s.razorpay_webhook_secret || "")
    } catch(e){ showToast(e.message, "error")} finally{ setLoading(false)}
  }
  useEffect(()=>{ load() }, [])

  const handleAiProvider = (v)=>{
    setAiProvider(v)
    const p = AI_PROVIDERS.find(x=>x.id===v)
    if(p && p.base && !aiBase) setAiBase(p.base)
    if(p && p.model && !aiModel) setAiModel(p.model)
  }

  const save = async () => {
    setSaving(true)
    try{
      const payload = {
        free_entries_limit: parseInt(limit),
        paid_price_inr: parseInt(price),
        paid_entries_limit: parseInt(paidLimit),
        default_language: defaultLang,
        wa_template: waTemplate,
        auto_reminder: autoReminder ? "true" : "false",
        maintenance_mode: maintenance ? "true" : "false",
        ai_provider: aiProvider, ai_base_url: aiBase, ai_model: aiModel,
        stt_provider: sttProvider, stt_base_url: sttBase, stt_model: sttModel,
        whatsapp_provider: waProvider, whatsapp_base_url: waBase, whatsapp_phone_id: waPhoneId,
        otp_provider: otpProvider, otp_base_url: otpBase, otp_template_id: otpTemplate,
        otp_mode: otpProvider,
        otp_expiry_minutes: parseInt(otpExpiry),
        jwt_expire_minutes: parseInt(jwtExpiry),
        razorpay_key_id: razorKey,
        razorpay_test_mode: razorTestMode,
      }
      if(razorSecret && !razorSecret.includes("****")) payload.razorpay_key_secret = razorSecret
      if(webhookSecret && !webhookSecret.includes("****")) payload.razorpay_webhook_secret = webhookSecret
      if(aiKey && !aiKey.includes("****")) payload.ai_api_key = aiKey
      if(sttKey && !sttKey.includes("****")) payload.stt_api_key = sttKey
      if(waKey && !waKey.includes("****")) payload.whatsapp_api_key = waKey
      if(otpKey && !otpKey.includes("****")) payload.otp_api_key = otpKey
      await api.updateSettings(payload)
      showToast("Settings saved successfully ✓", "success")
      load()
    } catch(e){ showToast(e.message, "error")} finally{ setSaving(false)}
  }

  const test = async (kind)=>{
    setTesting(kind)
    try{
      let res
      if(kind==="razorpay"){
        if(razorKey && razorSecret && !razorSecret.includes("****")) res = await api.testRazorpayCustom({key_id: razorKey, key_secret: razorSecret})
        else res = await api.testRazorpay()
      } else if(kind==="ai") res = await api.testAi()
      else if(kind==="stt") res = await api.testWhisper()
      else if(kind==="whatsapp") res = await api.testWhatsapp()
      else if(kind==="otp") res = await api.testOtp()
      else res = await api.testAi()
      showToast(res.message, res.success ? "success" : "error")
    } catch(e){ showToast(e.message, "error")} finally{ setTesting(null)}
  }

  const doReset = async ()=>{
    if(resetConfirm !== "RESET"){ showToast("Please type RESET", "error"); return}
    if(!confirm("Are you sure you want to delete all data? Shops, customers, entries will be permanently deleted!")) return
    try{
      const r = await api.resetAllData({confirm:"RESET"})
      showToast(r.message || "All data reset successfully ✓", "success")
      setResetConfirm("")
    } catch(e){ showToast(e.message, "error")}
  }

  if(loading) return <div className="py-10 text-center text-ink-dim">Loading...</div>

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display font-normal text-[26px] sm:text-[28px]">Settings</h1>
          <p className="text-ink-dim text-[13px] sm:text-[14px] mt-1">Kept simple — open <b>Advanced</b> if needed. Free options work without keys.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="ghost" onClick={()=>setShowAdvanced(v=>!v)} className="flex-1 sm:flex-none justify-center">{showAdvanced ? "Show Simple" : "Show Advanced"}</Button>
          <Button onClick={save} disabled={saving} className="flex-1 sm:flex-none justify-center">{saving ? "Saving..." : "Save Changes ✓"}</Button>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-3xl p-4 sm:p-6 mb-5">
        <h3 className="font-extrabold text-[16px] sm:text-[16.5px] mb-1">Business Rules</h3>
        <p className="text-[12.5px] text-ink-dim mb-4">Applies instantly across the app.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Free entries / month" value={limit} onChange={setLimit} type="number" hint="Free tier limit" />
          <Field label="Paid price ₹ / month" value={price} onChange={setPrice} type="number" hint="Same in Razorpay" />
          <Field label="Paid limit (-1 = unlimited)" value={paidLimit} onChange={setPaidLimit} type="number" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Default Language</label>
            <select value={defaultLang} onChange={e=>setDefaultLang(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none">
              <option>Hinglish</option><option>Hindi</option><option>English</option><option>Marathi</option>
            </select>
          </div>
          <Field label="JWT expiry (min)" value={jwtExpiry} onChange={setJwtExpiry} type="number" hint="How long login stays valid" />
        </div>
        <div className="mb-3">
          <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">WhatsApp template — {"{name} {balance} {shop}"}</label>
          <textarea value={waTemplate} onChange={e=>setWaTemplate(e.target.value)} rows={2} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[13.5px] outline-none" />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm font-bold"><Toggle on={autoReminder} onClick={()=>setAutoReminder(v=>!v)} /> Auto Reminder</label>
          <label className="flex items-center gap-2 text-sm font-bold"><Toggle on={maintenance} onClick={()=>setMaintenance(v=>!v)} /> Maintenance</label>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-3xl p-4 sm:p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <h3 className="font-extrabold text-[16px]">Razorpay — Billing</h3>
          <Badge tone={diag._razorpay_configured ? "green" : "gold"}>{diag._razorpay_configured ? "Live" : "Mock (free test)"}</Badge>
        </div>
        <p className="text-[12.5px] text-ink-dim mb-3">Without keys, mock mode runs — no charge. Add live keys to go live.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Key ID (rzp_...)" value={razorKey} onChange={setRazorKey} placeholder="rzp_test_xxx" />
          <Field label="Key Secret" value={razorSecret} onChange={setRazorSecret} placeholder="****" hint="Shows as **** after save" />
          <Field label="Webhook Secret" value={webhookSecret} onChange={setWebhookSecret} placeholder="whsec_..." />
        </div>
        <Button variant="ghost" onClick={()=>test("razorpay")} disabled={testing==="razorpay"} className="w-full mt-3">{testing==="razorpay" ? "Testing..." : "Test Razorpay →"}</Button>
      </div>

      {showAdvanced && (
        <>
          <div className="bg-surface border border-line rounded-3xl p-4 sm:p-6 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <h3 className="font-extrabold text-[16px]">AI Brain — Entry Parsing</h3>
              <span className="text-[11.5px] px-2.5 py-1 rounded-full bg-[rgba(79,163,122,0.15)] text-green font-bold text-center">Free = Local (no key) | Paid = More accurate</span>
            </div>
            <p className="text-[12.5px] text-ink-dim mb-3">Use any AI — Groq is cheap & fast, OpenAI, OpenRouter, Ollama local free, or custom. Set Base URL + Key + Model.</p>
            <div className="mb-3">
              <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Provider</label>
              <select value={aiProvider} onChange={e=>handleAiProvider(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none">
                {AI_PROVIDERS.map(p=> <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Base URL" value={aiBase} onChange={setAiBase} placeholder="https://api.groq.com/openai/v1" hint="From provider docs" />
              <Field label="Model" value={aiModel} onChange={setAiModel} placeholder="llama-3.1-8b-instant / gpt-4o-mini" />
            </div>
            <Field label="API Key" value={aiKey} onChange={setAiKey} placeholder="gsk_xxx / sk-xxx" hint={aiProvider==="local" ? "No key needed for local" : "Shows as **** after save"} />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={()=>test("ai")} disabled={testing==="ai"} variant="ghost" className="w-full sm:flex-1">{testing==="ai" ? "Testing..." : "Test AI →"}</Button>
              <span className="text-[11.5px] text-ink-dim flex-1 flex items-center justify-center sm:justify-start text-center">Local = rule-based, Groq/OpenAI = 95% accuracy.</span>
            </div>
          </div>

          <div className="bg-surface border border-line rounded-3xl p-4 sm:p-6 mb-5">
            <h3 className="font-extrabold text-[16px]">Voice (STT) — Whisper</h3>
            <div className="bg-[rgba(232,169,59,0.1)] border border-[var(--gold)] rounded-xl p-3 mb-3">
              <b className="text-[13px]">Browser Free ✓ — No install, no cost</b>
              <p className="text-[12.5px] text-ink-dim">Chrome/Edge <code>Web Speech API</code> converts mic to text directly — Hinglish/Hindi/English auto. New Entry tries this first. Whisper is a paid alternative (~$0.006/min) with slightly better Hindi. For free offline, use <b>Ollama + Whisper local</b> or keep <b>Browser</b>.</p>
            </div>
            <div className="mb-3">
              <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Provider</label>
              <select value={sttProvider} onChange={e=>setSttProvider(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none">
                {STT_PROVIDERS.map(s=> <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <span className="text-[11px] text-ink-dim">{STT_PROVIDERS.find(s=>s.id===sttProvider)?.hint}</span>
            </div>
            {sttProvider !== "browser" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="STT Base URL" value={sttBase} onChange={setSttBase} placeholder="https://api.openai.com/v1" />
                <Field label="STT Model" value={sttModel} onChange={setSttModel} placeholder="whisper-1" />
                <Field label="STT API Key" value={sttKey} onChange={setSttKey} placeholder="sk-..." />
              </div>
            )}
            <Button onClick={()=>test("stt")} variant="ghost" className="w-full mt-2" disabled={testing==="stt"}>{testing==="stt" ? "Testing..." : sttProvider==="browser" ? "Test Browser Free (no key)" : "Test Whisper →"}</Button>
          </div>

          <div className="bg-surface border border-line rounded-3xl p-4 sm:p-6 mb-5">
            <h3 className="font-extrabold text-[16px]">WhatsApp — How will reminders be sent?</h3>
            <div className="bg-surface-2 border border-line rounded-xl p-3 mb-3">
              <p className="text-[13px]"><b>wa.me Link (Free, Default):</b> Clicking the button opens WhatsApp with a pre-filled message — shopkeeper taps Send. No API key, no cost. Not auto-sent (WhatsApp policy).</p>
              <p className="text-[13px] mt-1"><b>Auto API (Paid):</b> Twilio / Interakt / WATI / Gupshup / Custom — Add Base URL + Key, backend will send automatically (template approval required).</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Provider</label>
                <select value={waProvider} onChange={e=>setWaProvider(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none">
                  <option value="wa_me">wa.me Link — Free (recommended)</option>
                  <option value="twilio">Twilio</option>
                  <option value="interakt">Interakt</option>
                  <option value="custom">Custom API</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <Field label="Base URL" value={waBase} onChange={setWaBase} placeholder="https://api.interakt.ai/..." />
              <Field label="API Key" value={waKey} onChange={setWaKey} placeholder="token" />
            </div>
            <Field label="Phone ID / Sender" value={waPhoneId} onChange={setWaPhoneId} placeholder="For Interakt/Custom" />
            <Button onClick={()=>test("whatsapp")} variant="ghost" className="w-full" disabled={testing==="whatsapp"}>{testing==="whatsapp" ? "Testing..." : "Test WhatsApp →"}</Button>
          </div>

          <div className="bg-surface border border-line rounded-3xl p-4 sm:p-6 mb-5">
            <h3 className="font-extrabold text-[16px]">Login OTP — Auth System</h3>
            <div className="bg-surface-2 border border-line rounded-xl p-3 mb-3">
              <p className="text-[13px]"><b>Dev (Free):</b> Always <code>1234</code> — for testing, no SMS.</p>
              <p className="text-[13px] mt-1"><b>MSG91 / Twilio / Custom:</b> Real SMS — Add Base URL + Key + Template ID, OTP will be sent to phone.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Provider</label>
                <select value={otpProvider} onChange={e=>setOtpProvider(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none">
                  <option value="dev">Dev — 1234 Free</option>
                  <option value="msg91">MSG91</option>
                  <option value="twilio">Twilio Verify</option>
                  <option value="custom">Custom API</option>
                </select>
              </div>
              <Field label="Base URL" value={otpBase} onChange={setOtpBase} placeholder="https://control.msg91.com/..." />
              <Field label="API Key" value={otpKey} onChange={setOtpKey} placeholder="authkey" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Template ID" value={otpTemplate} onChange={setOtpTemplate} placeholder="For MSG91" />
              <Field label="OTP Expiry (min)" value={otpExpiry} onChange={setOtpExpiry} type="number" />
            </div>
            <Button onClick={()=>test("otp")} variant="ghost" className="w-full" disabled={testing==="otp"}>{testing==="otp" ? "Testing..." : "Test OTP →"}</Button>
          </div>
        </>
      )}

      <div className="bg-surface border border-maroon rounded-3xl p-4 sm:p-6">
        <h3 className="font-extrabold text-[16px] text-maroon mb-2">Danger Zone — Reset All Data</h3>
        <p className="text-[13px] text-ink-dim mb-3">This will delete: <b>User shops, Customers, Entries, Reminders, Subscriptions</b>. <span className="text-green font-bold">Demo shops (9876543210, 9998887771-74) and Settings will remain safe ✓</span> — demo login will still work. Type <code>RESET</code> then click.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={resetConfirm} onChange={e=>setResetConfirm(e.target.value)} placeholder="RESET" className="flex-1 px-3.5 py-3 rounded-xl border border-maroon bg-surface-2 text-ink text-[14.5px] outline-none" />
          <Button variant="danger" onClick={doReset} disabled={resetConfirm!=="RESET"} className="w-full sm:w-auto justify-center">Reset All Data</Button>
        </div>
      </div>
    </div>
  )
}
