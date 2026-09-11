import { useState } from 'react'
import { api } from '../lib/api'
import { speak, stopSpeaking, detectLanguage } from '../lib/tts'
import { transcribeBrowser } from '../lib/stt'
import { Mic, MicOff, Volume2, VolumeX, Loader2, HelpCircle } from 'lucide-react'

export default function AdminVoiceCommand() {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState('')
  const [showHint, setShowHint] = useState(false)

  const answerFor = (text, stats) => {
    const t = text.toLowerCase().trim()

    const f = (n) => 'Rs ' + (Number(n) || 0).toLocaleString('en-IN')
    const total = stats.total_shops || 0
    const active = stats.active_shops || 0
    const inactive = Math.max(total - active, 0)
    const paid = Math.round((stats.conversion_pct || 0) * total / 100)
    const free = Math.max(total - paid, 0)

    if (t.includes('help')) {
      return `Bol sakte ho: Total shops, Active kitne, MRR batao, Aaj ki entries, Parse safalta, Conversion, Overview full. Aur apne mann ka koi bhi sawaal poochho — pura data mil jayega.`
    }
    if (t.includes('hello') || t.includes('namaste') || t.includes('hi ') || t === 'hi' || t === 'hii' || t === 'hello') {
      return `Namaste! Main BolKhata Admin Assistant hun. Platform ki koi bhi cheez poochho — total ${total} dukaanein, MRR ${f(stats.mrr)}, aaj ki entries, parse safalta, conversion — sab bata dunga.`
    }
    if (t.includes('total shop') || t.includes('kitne shop') || t.includes('kitna shop') || t.includes('kitni dukaan') || t.includes('how many shop')
        || t.includes('dukaan') || t.includes('shops') || t.includes('user') || t.includes('merchants') || t.includes('vyapari')) {
      return `Platform par total ${total} dukaanein hain — ${active} active, ${inactive} inactive.`
    }
    if (t.includes('inactive') || t.includes('band') || t.includes('nakar') || t.includes('kam active')) {
      return `${inactive} dukaanein abhi inactive hain — total ${total} mein se ${active} active kaam kar rahi hain.`
    }
    if (t.includes('active') || t.includes('sakriy') || t.includes('chalu')) {
      return `${active} dukaanein abhi active hain — total ${total} mein se.`
    }
    if (t.includes('mrr') || t.includes('em ar ar') || t.includes('revenue') || t.includes('kamai') || t.includes('income')
        || t.includes('earning') || t.includes('money') || t.includes('paise') || t.includes('kitna kamaya')) {
      return `Monthly recurring revenue ${f(stats.mrr)} hai.`
    }
    if (t.includes('entry') || t.includes('aaj ki entry') || t.includes('aaj') || t.includes("today's") || t.includes('aaj kitni')) {
      return `Aaj total ${stats.entries_today} voice entries hui hain.`
    }
    if (t.includes('parse') || t.includes('success') || t.includes('safalta') || t.includes('voice rate')
        || t.includes('transcribe') || t.includes('pichan')) {
      return `Voice parse safalta ${stats.parse_success_pct}% hai.`
    }
    if (t.includes('conversion') || t.includes('convert') || t.includes('conv') || t.includes('paid kitne')) {
      return `Free se Paid conversion ${stats.conversion_pct}% hai — total ${paid} paid dukaanein, ${free} free.`
    }
    if (t.includes('free') || t.includes('free kitne')) {
      return `${free} dukaanein free plan par hain — ${paid} paid.`
    }
    if (t.includes('paid') || t.includes('pro')) {
      return `${paid} dukaanein paid plan par hain — ${free} free.`
    }
    if (t.includes('overview') || t.includes('full') || t.includes('sab') || t.includes('summary') || t.includes('saransh')
        || t.includes('report') || t.includes('poora')) {
      return `Full overview: total ${total} dukaanein, ${active} active, MRR ${f(stats.mrr)}, aaj ${stats.entries_today} entries, voice parse safalta ${stats.parse_success_pct}%, conversion ${stats.conversion_pct}%.`
    }
    return `Yeh raha pura data: total ${total} dukaanein — ${active} active, ${inactive} inactive. MRR ${f(stats.mrr)}. Aaj ${stats.entries_today} voice entries. Voice parse safalta ${stats.parse_success_pct}%. Free se paid conversion ${stats.conversion_pct}% — ${paid} paid, ${free} free. Aur kuch poochho to bata dunga!`
  }

  const runQuery = async (text) => {
    setLoading(true)
    setListening(false)
    setResponse('')

    if (!navigator.onLine) {
      setResponse('Offline mode mein admin stats nahi mil sakte. Internet connect karo.')
      setLoading(false)
      return
    }

    try {
      const stats = await api.adminOverview()
      const ans = answerFor(text, stats)
      setResponse(ans)
      setSpeaking(true)
      speak(ans, { onEnd: () => setSpeaking(false), lang: detectLanguage(ans) })
    } catch (e) {
      setResponse(e.message?.includes('OFFLINE') ? 'Internet connect nahi hai. Data refresh nahi ho paya.' : 'Admin stats fetch hone mein problem hui.')
    } finally {
      setLoading(false)
    }
  }

  const startListening = async () => {
    setListening(true)
    try {
      const text = await transcribeBrowser('hi-IN')
      await runQuery(text)
    } catch {
      setListening(false)
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
            <span className="font-bold text-xs text-amber-400">BolKhata Admin</span>
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
                <li>• "Total shops kitne hain?"</li>
                <li>• "Aaj kitni voice entries hui?"</li>
                <li>• "MRR kya hai?"</li>
                <li>• "Voice parse safalta kitni hai?"</li>
                <li>• "Conversion rate batao"</li>
                <li>• Koi bhi sawaal — pura platform data milega</li>
              </ul>
              <div className="text-[11.5px] font-bold text-amber-300 mb-1.5">What to ask — English</div>
              <ul className="text-[12.5px] text-white/90 space-y-1">
                <li>• "How many total shops?"</li>
                <li>• "How many entries today?"</li>
                <li>• "What is the MRR?"</li>
                <li>• "What is parse success?"</li>
                <li>• "What is the conversion rate?"</li>
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