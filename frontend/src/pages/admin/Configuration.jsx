import { useEffect, useState } from 'react'
import { Cpu, Mic, MessageCircle, KeyRound, Save } from 'lucide-react'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import Card from '../../components/Card'
import Select from '../../components/Select'
import { useToast } from '../../context/ToastContext'
import { useLang } from '../../context/LangContext'
import { api } from '../../lib/api'

import SecretInput from '../../components/SecretInput'

function Field({ label, value, onChange, type="text", placeholder, hint, isSecret=false }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
      {isSecret ? (
        <SecretInput value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-amber-300 dark:focus:border-amber-600 focus:ring-4 focus:ring-amber-50 dark:focus:ring-amber-900/20" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-amber-300 dark:focus:border-amber-600 focus:ring-4 focus:ring-amber-50 dark:focus:ring-amber-900/20" />
      )}
      {hint && <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">{hint}</span>}
    </div>
  )
}
const AI_PROVIDERS = [
  { id:"local", label:"local" },
  { id:"groq", label:"groq", base:"https://api.groq.com/openai/v1", model:"llama-3.1-8b-instant" },
  { id:"openai", label:"openai", base:"https://api.openai.com/v1", model:"gpt-4o-mini" },
  { id:"openrouter", label:"openrouter", base:"https://openrouter.ai/api/v1", model:"openai/gpt-4o-mini" },
  { id:"anthropic", label:"anthropic", base:"https://api.anthropic.com", model:"claude-3-haiku-20240307" },
  { id:"ollama", label:"ollama", base:"http://localhost:11434/v1", model:"llama3" },
  { id:"custom", label:"custom" },
]
const STT_PROVIDERS = [
  { id:"browser", label:"browser" },
  { id:"openai", label:"openai_stt" },
  { id:"custom", label:"custom" },
]

export default function Configuration() {
  const { showToast } = useToast()
  const { t } = useLang()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(null)
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

  const aiLabel = (id) => id === 'local' ? t('prov_local') : id === 'groq' ? t('prov_groq') : id === 'openai' ? t('prov_openai') : id === 'openrouter' ? t('prov_openrouter') : id === 'anthropic' ? t('prov_anthropic') : id === 'ollama' ? t('prov_ollama') : t('prov_custom')
  const sttLabel = (id) => id === 'browser' ? t('stt_browser') : id === 'openai' ? t('stt_openai') : t('stt_custom')
  const waLabel = (id) => id === 'wa_me' ? t('wa_me') : id === 'twilio' ? t('wa_twilio') : id === 'interakt' ? t('wa_interakt') : id === 'custom' ? t('wa_custom') : t('wa_disabled')
  const otpLabel = (id) => id === 'dev' ? t('otp_dev') : id === 'msg91' ? t('otp_msg91') : id === 'twilio' ? t('wa_twilio') : t('wa_custom')

  const load = async () => {
    setLoading(true)
    try {
      const s = await api.getSettings()
      setAiProvider(s.ai_provider || "local"); setAiBase(s.ai_base_url || ""); setAiKey(s.ai_api_key || ""); setAiModel(s.ai_model || "gpt-4o-mini")
      setSttProvider(s.stt_provider || "browser"); setSttBase(s.stt_base_url || ""); setSttKey(s.stt_api_key || ""); setSttModel(s.stt_model || "whisper-1")
      setWaProvider(s.whatsapp_provider || "wa_me"); setWaBase(s.whatsapp_base_url || ""); setWaKey(s.whatsapp_api_key || ""); setWaPhoneId(s.whatsapp_phone_id || "")
      setOtpProvider(s.otp_provider || s.otp_mode || "dev"); setOtpBase(s.otp_base_url || ""); setOtpKey(s.otp_api_key || ""); setOtpTemplate(s.otp_template_id || ""); setOtpExpiry(s.otp_expiry_minutes || 5); setJwtExpiry(s.jwt_expire_minutes || 10080)
    } catch(e){ showToast(e.message) } finally{ setLoading(false)}
  }
  useEffect(()=>{ load() }, [])

  const handleAiProvider = (v)=>{ setAiProvider(v); const p=AI_PROVIDERS.find(x=>x.id===v); if(p?.base && !aiBase) setAiBase(p.base); if(p?.model && !aiModel) setAiModel(p.model) }

  const save = async ()=>{
    setSaving(true)
    try{
      const payload = {
        ai_provider: aiProvider, ai_base_url: aiBase, ai_model: aiModel,
        stt_provider: sttProvider, stt_base_url: sttBase, stt_model: sttModel,
        whatsapp_provider: waProvider, whatsapp_base_url: waBase, whatsapp_phone_id: waPhoneId,
        otp_provider: otpProvider, otp_base_url: otpBase, otp_template_id: otpTemplate,
        otp_mode: otpProvider, otp_expiry_minutes: parseInt(otpExpiry), jwt_expire_minutes: parseInt(jwtExpiry),
      }
      if(aiKey && !aiKey.includes("****")) payload.ai_api_key = aiKey
      if(sttKey && !sttKey.includes("****")) payload.stt_api_key = sttKey
      if(waKey && !waKey.includes("****")) payload.whatsapp_api_key = waKey
      if(otpKey && !otpKey.includes("****")) payload.otp_api_key = otpKey
      await api.updateSettings(payload)
      showToast("toast_config_saved")
      load()
    } catch(e){ showToast(e.message) } finally{ setSaving(false)}
  }
  const test = async (kind)=>{
    setTesting(kind)
    try{
      let res
      if(kind==="ai") res = await api.testAi()
      else if(kind==="stt") res = await api.testWhisper()
      else if(kind==="whatsapp") res = await api.testWhatsapp()
      else if(kind==="otp") res = await api.testOtp()
      showToast(res.message, res.success ? "success" : "error")
    } catch(e){ showToast(e.message) } finally{ setTesting(null)}
  }

  if(loading) return <div className="py-10 text-center text-slate-500">{t('common_loading')}</div>

  return (
    <div className="w-full">
      <div className="flex justify-end gap-3 mb-6">
        <Button onClick={save} disabled={saving} className="ml-auto"><Save size={16} />{saving?t('cf_saving'):t('cf_save')}</Button>
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-3"><Cpu size={18} className="text-amber-600" /><h3 className="font-semibold">{t('cf_ai_h')}</h3><Badge tone="amber">{t('cf_advanced')}</Badge></div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t('cf_ai_sub')}</p>
        <div className="mb-3">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('cf_provider')}</label>
          <Select value={aiProvider} onChange={e=>handleAiProvider(e.target.value)}>
            {AI_PROVIDERS.map(p=> <option key={p.id} value={p.id}>{aiLabel(p.id)}</option>)}
            </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t('cf_base_url')} value={aiBase} onChange={setAiBase} placeholder="https://api.groq.com/openai/v1" />
          <Field label={t('cf_model')} value={aiModel} onChange={setAiModel} placeholder="llama-3.1-8b-instant" />
        </div>
        <Field label={t('cf_api_key')} value={aiKey} onChange={setAiKey} placeholder="gsk_xxx / sk-xxx" hint={aiProvider==="local"?t('cf_key_none'):t('cf_key_masked')} isSecret />
        <Button variant="secondary" onClick={()=>test("ai")} disabled={testing==="ai"} className="w-full">{testing==="ai"?t('cf_saving'):t('cf_test_ai')}</Button>
      </Card>

      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-3"><Mic size={18} className="text-amber-600" /><h3 className="font-semibold">{t('cf_stt_h')}</h3></div>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-3 mb-3">
          <b className="text-sm dark:text-amber-300">{t('cf_stt_free_t')}</b>
          <p className="text-xs text-slate-600 dark:text-slate-400">{t('cf_stt_free_d')}</p>
        </div>
        <div className="mb-3">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('cf_provider')}</label>
          <Select value={sttProvider} onChange={e=>setSttProvider(e.target.value)}>
            {STT_PROVIDERS.map(s=> <option key={s.id} value={s.id}>{sttLabel(s.id)}</option>)}
            </Select>
        </div>
        {sttProvider!=="browser" && <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><Field label={t('cf_stt_base')} value={sttBase} onChange={setSttBase} /><Field label={t('cf_model')} value={sttModel} onChange={setSttModel} /><Field label={t('cf_api_key')} value={sttKey} onChange={setSttKey} isSecret /></div>}
        <Button variant="secondary" onClick={()=>test("stt")} disabled={testing==="stt"} className="w-full mt-2">{testing==="stt"?t('cf_saving'):t('cf_test_stt')}</Button>
      </Card>

      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-3"><MessageCircle size={18} className="text-amber-600" /><h3 className="font-semibold">{t('cf_wa_h')}</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('cf_provider')}</label>
            <Select value={waProvider} onChange={e=>setWaProvider(e.target.value)}>
              <option value="wa_me">{t('wa_me')}</option><option value="twilio">{t('wa_twilio')}</option><option value="interakt">{t('wa_interakt')}</option><option value="custom">{t('wa_custom')}</option><option value="disabled">{t('wa_disabled')}</option>
            </Select>
          </div>
          <Field label={t('cf_base_url')} value={waBase} onChange={setWaBase} />
          <Field label={t('cf_api_key')} value={waKey} onChange={setWaKey} isSecret />
        </div>
        <Field label={t('cf_wa_phone')} value={waPhoneId} onChange={setWaPhoneId} />
        <Button variant="secondary" onClick={()=>test("whatsapp")} disabled={testing==="whatsapp"} className="w-full">{testing==="whatsapp"?t('cf_saving'):t('cf_test_wa')}</Button>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3"><KeyRound size={18} className="text-amber-600" /><h3 className="font-semibold">{t('cf_otp_h')}</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('cf_provider')}</label>
            <Select value={otpProvider} onChange={e=>setOtpProvider(e.target.value)}>
              <option value="dev">{t('otp_dev')}</option><option value="msg91">{t('otp_msg91')}</option><option value="twilio">{t('wa_twilio')}</option><option value="custom">{t('wa_custom')}</option>
            </Select>
          </div>
          <Field label={t('cf_base_url')} value={otpBase} onChange={setOtpBase} />
          <Field label={t('cf_api_key')} value={otpKey} onChange={setOtpKey} isSecret />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label={t('cf_otp_tmpl')} value={otpTemplate} onChange={setOtpTemplate} />
          <Field label={t('cf_otp_exp')} value={otpExpiry} onChange={setOtpExpiry} type="number" />
          <Field label={t('cf_jwt_exp')} value={jwtExpiry} onChange={setJwtExpiry} type="number" />
        </div>
        <Button variant="secondary" onClick={()=>test("otp")} disabled={testing==="otp"} className="w-full">{testing==="otp"?t('cf_saving'):t('cf_test_otp')}</Button>
      </Card>
    </div>
  )
}