import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useShopData } from '../context/ShopDataContext'
import { apiFetch } from '../lib/api'
import { speak, stopSpeaking, detectLanguage } from '../lib/tts'
import { transcribeBrowser } from '../lib/stt'
import { useLang } from '../context/LangContext'
import { Mic, MicOff, Volume2, VolumeX, Loader2, HelpCircle } from 'lucide-react'

export default function VoiceCommand() {
  const { shopProfile } = useAuth()
  const { customers, homeEntries } = useShopData()
  const { t } = useLang()
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState('')
  const [showHint, setShowHint] = useState(false)

  const lang = shopProfile?.language || 'Hinglish'

  const getTotal = () => {
    const given = homeEntries.filter(e => e.type === 'credit_given').reduce((s, e) => s + e.amount, 0)
    const received = homeEntries.filter(e => e.type === 'payment_received').reduce((s, e) => s + e.amount, 0)
    const totalBal = customers.reduce((s, c) => s + (c.balance || 0), 0)
    return { given, received, totalBal }
  }

  const getCustomerCount = () => customers.length
  const getCustomerList = () => {
    if (customers.length === 0) return 'Tumhare shop mein koi customer nahi hai.'
    return customers.map(c => `${c.name} — balance Rs ${(c.balance || 0).toLocaleString('en-IN')}`).join('. ') + '.'
  }

  const processOffline = (text) => {
    const t = text.toLowerCase().trim()
    const { given, received, totalBal } = getTotal()
    const recent = homeEntries.slice(0, 3).map(e => `${e.name} — Rs ${e.amount} ${e.type === 'credit_given' ? 'udhaar diya' : 'payment mila'} (${e.time})`).join('. ')

    if (t.includes('total') || t.includes('kitna hua') || t.includes('kamaata')) {
      return `Total udhaar diya: Rs ${given.toLocaleString('en-IN')}. Wapas mila: Rs ${received.toLocaleString('en-IN')}. Sabka balance: Rs ${totalBal.toLocaleString('en-IN')}.${recent ? ' Recent: ' + recent + '.' : ''}`
    }

    if (t.includes('kitne user') || t.includes('kitne customer') || t.includes('how many')) {
      return `Tumhare shop mein total ${getCustomerCount()} customer hain.`
    }

    if (t.includes('user ka detail') || t.includes('customer ka detail') || t.includes('details')) {
      return getCustomerList()
    }

    if (t.includes('balance') || t.includes('baki') || t.includes('baccha')) {
      return `Tumhare sabka total balance Rs ${totalBal.toLocaleString('en-IN')} hai.`
    }

    if (t.includes('kitne entry') || t.includes('entry count') || t.includes('transactions')) {
      return `Tumhare shop mein total ${homeEntries.length} entries hain.${recent ? ' Recent: ' + recent + '.' : ''}`
    }

    if (t.includes('hello') || t.includes('hi') || t.includes('namaste')) {
      return `Namaste! Main BolKhata hun. Tum bol sakte ho: Total kitna hua, Kitne user hain, Balance batao — ya kuch bhi poochho, pura data bata dunga.`
    }

    if (t.includes('help')) {
      return `Bol sakte ho: Total kitna hua, Kitne user hain, User ka detail, Balance batao, Entry count. Kuch bhi bolo, jawab milega.`
    }

    return `Yeh raha tumhare shop ka pura data: total ${getCustomerCount()} customer. Sabka balance Rs ${totalBal.toLocaleString('en-IN')}. Udhaar diya Rs ${given.toLocaleString('en-IN')}, wapas mila Rs ${received.toLocaleString('en-IN')}. Total ${homeEntries.length} entries. ${getCustomerList()}`
  }

  const startListening = async () => {
    setListening(true)
    try {
      const text = await transcribeBrowser(lang)
      await sendQuery(text)
    } catch {
      setListening(false)
    }
  }

  const sendQuery = async (text) => {
    setLoading(true)
    setListening(false)
    setResponse('')

    const isOnline = navigator.onLine

    if (!isOnline) {
      const offlineAns = processOffline(text)
      if (offlineAns) {
        setResponse(offlineAns)
        setSpeaking(true)
          speak(offlineAns, { onEnd: () => setSpeaking(false), lang: detectLanguage(offlineAns) })
        setLoading(false)
        return
      }
      setResponse('Offline mode mein yeh pooch nahi sakte. Internet connect karo.')
      setLoading(false)
      return
    }

    try {
      const res = await apiFetch('/voice/query', {
        method: 'POST',
        body: { text, language: lang },
        auth: true,
      })
      const answer = res.answer || 'Koi response nahi mila'
      setResponse(answer)
setSpeaking(true)
          speak(answer, { onEnd: () => setSpeaking(false), lang: detectLanguage(answer) })
    } catch (e) {
      const offlineAns = processOffline(text)
      if (offlineAns) {
        setResponse(offlineAns)
        setSpeaking(true)
          speak(offlineAns, { onEnd: () => setSpeaking(false), lang: detectLanguage(offlineAns) })
      } else {
        setResponse('Puchne mein problem hui. Dobara try karo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const stopSpeak = () => {
    stopSpeaking()
    setSpeaking(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2">
      {response && (
        <div className="mb-2 px-4 py-3 rounded-2xl bg-[#1A1206] text-white text-sm max-w-xs shadow-soft animate-fadeUp">
          <div className="flex items-center gap-2 mb-1">
            {speaking ? (
              <Volume2 className="w-4 h-4 text-green-400 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4 text-amber-400" />
            )}
            <span className="font-bold text-xs text-amber-400">BolKhata</span>
          </div>
          <p className="text-sm">{response}</p>
        </div>
      )}

      {!listening && !loading && (
        <div className="mb-1 flex flex-col items-end animate-fadeUp">
          <button
            onClick={() => setShowHint(v => !v)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-bold border transition-all active:scale-95 ${showHint ? 'bg-[var(--gold)] text-[#1A1206] border-gold' : 'bg-[#1A1206]/95 backdrop-blur-md border border-[rgba(232,169,59,.35)] text-amber-300 hover:text-amber-200'}`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> Hint
          </button>
          {showHint && (
            <div className="mt-2 bg-[#1A1206]/95 backdrop-blur-md border border-[rgba(232,169,59,.35)] rounded-2xl shadow-soft px-4 py-3 max-w-[320px] animate-fadeUp">
              <div className="text-[11.5px] font-bold text-amber-300 mb-1.5">Kya pooch sakte ho — Hindi</div>
              <ul className="text-[12.5px] text-white/90 space-y-1 mb-3">
                <li>• "Total kitna hua?"</li>
                <li>• "Kitne customer hain?"</li>
                <li>• "Customer ka detail"</li>
                <li>• "Balance kitna bacha?"</li>
                <li>• "Hisaab batao — date aur time ke saath"</li>
                <li>• "Ramesh ka balance kya hai?"</li>
              </ul>
              <div className="text-[11.5px] font-bold text-amber-300 mb-1.5">What to ask — English</div>
              <ul className="text-[12.5px] text-white/90 space-y-1">
                <li>• "What is my total?"</li>
                <li>• "How many customers?"</li>
                <li>• "Customer details"</li>
                <li>• "Remaining balance?"</li>
                <li>• "Show entries with date and time"</li>
                <li>• "What is Ramesh's balance?"</li>
              </ul>
            </div>
          )}
        </div>
      )}

      <button
        onClick={listening ? stopSpeak : startListening}
        disabled={loading}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-soft transition-all ${
          listening ? 'bg-maroon text-white animate-micPulse ring-4 ring-maroon/30' :
          speaking ? 'bg-green-600 text-white animate-pulse' :
          'bg-[var(--gold)] text-[#1A1206] hover:bg-amber-400'
        }`}
      >
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> :
         listening ? <MicOff className="w-6 h-6" /> :
         speaking ? <Volume2 className="w-6 h-6" /> :
         <Mic className="w-6 h-6" />}
      </button>

      {listening && (
        <div className="bg-black/80 text-white px-4 py-2 rounded-full text-xs font-bold animate-fadeUp">
          🎙️ Bol rahe ho...
        </div>
      )}
    </div>
  )
}
