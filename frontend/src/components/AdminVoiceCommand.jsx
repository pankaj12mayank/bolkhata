import { useState } from 'react'
import { api } from '../lib/api'
import { speak, stopSpeaking, detectLanguage } from '../lib/tts'
import { transcribeBrowser } from '../lib/stt'
import { useLang } from '../context/LangContext'
import { Mic, MicOff, Volume2, VolumeX, Loader2, HelpCircle } from 'lucide-react'

export default function AdminVoiceCommand() {
  const { lang: portalLangCode } = useLang()
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const isEn = portalLangCode === 'en'
  const activeLangCode = isEn ? 'en' : 'hi'

  const answerFor = (text, stats) => {
    const t = text.toLowerCase().trim()

    const f = (n) => 'Rs ' + (Number(n) || 0).toLocaleString('en-IN')
    const total = stats.total_shops || 0
    const active = stats.active_shops || 0
    const inactive = Math.max(total - active, 0)
    const paid = Math.round((stats.conversion_pct || 0) * total / 100)
    const free = Math.max(total - paid, 0)

    // 1. Shops / Merchant count
    if (t.includes('total shop') || t.includes('kitne shop') || t.includes('kitna shop') || t.includes('kitni dukaan') || t.includes('how many shop')
        || t.includes('dukaan') || t.includes('shops') || t.includes('user') || t.includes('merchants') || t.includes('vyapari')
        || t.includes('शॉप') || t.includes('दुकान') || t.includes('व्यापारी')) {
      return isEn
        ? `Total ${total} shops registered — ${active} active, ${inactive} inactive.`
        : `प्लेटफ़ॉर्म पर कुल ${total} दुकानें दर्ज हैं — ${active} एक्टिव, ${inactive} इनएक्टिव।`
    }

    // 2. Inactive Shops
    if (t.includes('inactive') || t.includes('band') || t.includes('nakar') || t.includes('kam active') || t.includes('इनएक्टिव') || t.includes('बंद')) {
      return isEn
        ? `${inactive} shops are currently inactive out of ${total} total.`
        : `कुल ${total} में से ${inactive} दुकानें अभी इनएक्टिव हैं।`
    }

    // 3. Active Shops
    if (t.includes('active') || t.includes('sakriy') || t.includes('chalu') || t.includes('एक्टिव') || t.includes('सक्रिय')) {
      return isEn
        ? `${active} shops are active out of ${total} total.`
        : `कुल ${total} में से ${active} दुकानें अभी एक्टिव हैं।`
    }

    // 4. MRR / Earnings / Revenue
    if (t.includes('mrr') || t.includes('em ar ar') || t.includes('revenue') || t.includes('kamai') || t.includes('income')
        || t.includes('earning') || t.includes('money') || t.includes('paise') || t.includes('kitna kamaya')
        || t.includes('एमआरआर') || t.includes('एम आर आर') || t.includes('कमाई') || t.includes('आय') || t.includes('रेवेन्यू')) {
      return isEn
        ? `Monthly recurring revenue is ${f(stats.mrr)}.`
        : `मंथली रिकरिंग रेवेन्यू ${f(stats.mrr)} है।`
    }

    // 5. Today's Voice Entries
    if (t.includes('entry') || t.includes('aaj ki entry') || t.includes('aaj') || t.includes("today's") || t.includes('aaj kitni')
        || t.includes('एंट्री') || t.includes('एंट्रियां') || t.includes('आज')) {
      return isEn
        ? `Total ${stats.entries_today} voice entries recorded today.`
        : `आज कुल ${stats.entries_today} वॉयस एंट्रियां दर्ज हुई हैं।`
    }

    // 6. Voice Parse Success Rate
    if (t.includes('parse') || t.includes('success') || t.includes('safalta') || t.includes('voice rate')
        || t.includes('transcribe') || t.includes('pichan') || t.includes('पार्स') || t.includes('सफलता')) {
      return isEn
        ? `Voice parse success rate is ${stats.parse_success_pct} percent.`
        : `वॉयस पार्स सफलता ${stats.parse_success_pct} प्रतिशत है।`
    }

    // 7. Conversion Rate / Subscriptions
    if (t.includes('conversion') || t.includes('convert') || t.includes('conv') || t.includes('paid kitne') || t.includes('कन्वर्शन') || t.includes('रूपांतरण')) {
      return isEn
        ? `Free to paid conversion rate is ${stats.conversion_pct} percent — ${paid} paid shops, ${free} free shops.`
        : `फ्री से पेड कन्वर्शन ${stats.conversion_pct} प्रतिशत है — कुल ${paid} पेड दुकानें, ${free} फ्री दुकानें।`
    }

    // 8. Free Shops
    if (t.includes('free') || t.includes('free kitne') || t.includes('फ्री')) {
      return isEn
        ? `${free} shops are on free tier, ${paid} paid.`
        : `${free} दुकानें फ्री प्लान पर हैं, ${paid} पेड।`
    }

    // 9. Paid Shops
    if (t.includes('paid') || t.includes('pro') || t.includes('पेड')) {
      return isEn
        ? `${paid} shops are on paid tier, ${free} free.`
        : `${paid} दुकानें पेड प्लान पर हैं, ${free} फ्री।`
    }

    // 10. Help
    if (t.includes('help') || t.includes('मदद') || t.includes('हेल्प')) {
      return isEn
        ? `You can ask: Total shops, Active count, MRR, Today's entries, Parse success rate, Conversion rate, or Full overview.`
        : `आप पूछ सकते हैं: कुल दुकानें, एक्टिव दुकानें, MRR कितना है, आज की एंट्रियां, पार्स सफलता, कन्वर्शन दर, या फुल रिपोर्ट।`
    }

    // 11. Greetings
    if (t.includes('hello') || t.includes('namaste') || t.includes('hi ') || t === 'hi' || t === 'hii' || t === 'hello' || t.includes('नमस्ते') || t.includes('हेलो')) {
      return isEn
        ? `Hello! I am BolKhata Admin AI. Ask me anything about the platform — total ${total} shops, MRR ${f(stats.mrr)}, entries today, or conversion.`
        : `नमस्ते! मैं BolKhata Admin AI हूँ। प्लेटफ़ॉर्म का कुछ भी पूछें — कुल ${total} दुकानें, MRR ${f(stats.mrr)}, आज की एंट्रियां, या कन्वर्शन दर।`
    }

    // 12. Full Overview / Default Platform Report for Admin
    // Since Admin has full platform access, any general question about platform status returns full overview
    return isEn
      ? `Full overview: total ${total} shops, ${active} active, MRR ${f(stats.mrr)}, ${stats.entries_today} entries today, parse success ${stats.parse_success_pct} percent, conversion ${stats.conversion_pct} percent.`
      : `फुल रिपोर्ट: कुल ${total} दुकानें, ${active} एक्टिव, MRR ${f(stats.mrr)}, आज ${stats.entries_today} एंट्रियां, पार्स सफलता ${stats.parse_success_pct} प्रतिशत, कन्वर्शन ${stats.conversion_pct} प्रतिशत।`
  }

  const runQuery = async (text) => {
    stopSpeaking()
    setLoading(true)
    setListening(false)

    if (!navigator.onLine) {
      setLoading(false)
      const errAns = isEn ? 'Offline mode: Admin stats unavailable.' : 'ऑफ़लाइन मोड: एडमिन आंकड़े उपलब्ध नहीं हैं।'
      setSpeaking(true)
      speak(errAns, { onEnd: () => setSpeaking(false), lang: activeLangCode })
      return
    }

    try {
      const stats = await api.adminOverview()
      const ans = answerFor(text, stats)
      setSpeaking(true)
      speak(ans, { onEnd: () => setSpeaking(false), lang: activeLangCode })
    } catch (e) {
      const errAns = isEn ? 'Failed to fetch admin stats.' : 'एडमिन डेटा लाने में समस्या हुई।'
      setSpeaking(true)
      speak(errAns, { onEnd: () => setSpeaking(false), lang: activeLangCode })
    } finally {
      setLoading(false)
    }
  }

  const startListening = async () => {
    stopSpeaking()
    setListening(true)
    try {
      const text = await transcribeBrowser(isEn ? 'en-IN' : 'hi-IN')
      await runQuery(text)
    } catch {
      setListening(false)
    }
  }

  const stopSpeak = () => {
    stopSpeaking()
    setSpeaking(false)
    setListening(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
      {/* Icon-Only Hint Button (No Text) */}
      {!listening && !loading && (
        <div className="flex flex-col items-end animate-fadeUp">
          <button
            onClick={() => setShowHint(v => !v)}
            aria-label="How to ask"
            title={isEn ? "How to ask questions" : "प्रश्न कैसे पूछें"}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-95 shadow-md ${showHint ? 'bg-[var(--gold)] text-[#1A1206] border-gold' : 'bg-[#1A1206]/90 backdrop-blur-md border border-[rgba(232,169,59,.35)] text-amber-300 hover:text-amber-200'}`}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          {showHint && (
            <div className="mt-2 bg-[#1A1206]/95 backdrop-blur-md border border-[rgba(232,169,59,.35)] rounded-2xl shadow-2xl p-4 max-w-[280px] animate-fadeUp text-white text-xs">
              <div className="font-bold text-amber-300 text-sm mb-1.5">
                {isEn ? 'Ask Admin AI:' : 'एडमिन प्रश्न कैसे पूछें:'}
              </div>
              <p className="text-[#E6D5B8] leading-relaxed mb-2 text-[11.5px]">
                {isEn ? 'Tap mic orb and ask about platform stats:' : 'माइक बटन दबाएं और प्लेटफ़ॉर्म आंकड़े पूछें:'}
              </p>
              <ul className="text-[11.5px] text-amber-100/90 space-y-1.5 bg-[#251B0F] p-2.5 rounded-xl border border-amber-500/20">
                <li>• {isEn ? '"Total shops count?"' : '"Total shops kitne hain?"'}</li>
                <li>• {isEn ? '"What is the MRR?"' : '"MRR kya hai?"'}</li>
                <li>• {isEn ? '"Today\'s voice entries?"' : '"Aaj kitni entries hui?"'}</li>
                <li>• {isEn ? '"Parse success rate?"' : '"Voice parse safalta kitni hai?"'}</li>
                <li>• {isEn ? '"Full overview report"' : '"Full report batao"'}</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Main Siri/Google Style Interactive AI Voice Orb */}
      <div className="relative group">
        {/* Animated Expanding Aura Rings */}
        {speaking && (
          <>
            <div className="absolute -inset-3 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
            <div className="absolute -inset-6 rounded-full bg-emerald-500/10 animate-pulse pointer-events-none" />
          </>
        )}
        {listening && (
          <>
            <div className="absolute -inset-3 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
            <div className="absolute -inset-6 rounded-full bg-rose-500/15 animate-pulse pointer-events-none" />
          </>
        )}
        {loading && (
          <div className="absolute -inset-2 rounded-full border-2 border-amber-400/60 border-t-transparent animate-spin pointer-events-none" />
        )}

        <button
          onClick={speaking || listening ? stopSpeak : startListening}
          disabled={loading}
          title={speaking ? 'Admin AI is speaking (Tap to stop)' : listening ? 'Listening...' : 'Tap to speak to Admin AI'}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95 ${
            speaking
              ? 'bg-gradient-to-tr from-emerald-600 via-green-500 to-emerald-400 text-white ring-4 ring-emerald-400/50 shadow-emerald-500/50'
              : listening
              ? 'bg-gradient-to-tr from-rose-600 via-red-500 to-pink-500 text-white ring-4 ring-rose-500/50 shadow-rose-500/50 animate-pulse'
              : loading
              ? 'bg-[#1A1206] text-amber-400 border border-amber-500/40'
              : 'bg-gradient-to-tr from-[#2A1D0B] via-[var(--gold)] to-amber-300 text-[#1A1206] hover:scale-105 hover:shadow-amber-500/30 border border-amber-400/50'
          }`}
        >
          {loading ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : speaking ? (
            <div className="flex items-center justify-center gap-1">
              <span className="w-1 h-5 bg-white rounded-full animate-[bounce_0.6s_infinite_100ms]" />
              <span className="w-1 h-7 bg-white rounded-full animate-[bounce_0.6s_infinite_200ms]" />
              <span className="w-1 h-4 bg-white rounded-full animate-[bounce_0.6s_infinite_300ms]" />
            </div>
          ) : listening ? (
            <MicOff className="w-7 h-7 animate-bounce" />
          ) : (
            <Mic className="w-7 h-7" />
          )}
        </button>
      </div>
    </div>
  )
}