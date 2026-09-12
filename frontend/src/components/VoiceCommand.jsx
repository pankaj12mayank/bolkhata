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
  const { lang: portalLangCode } = useLang()
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const isEn = portalLangCode === 'en' || (shopProfile?.language || '').toLowerCase().includes('en')
  const activeLangCode = isEn ? 'en' : 'hi'

  const getTotal = () => {
    const given = homeEntries.filter(e => e.type === 'credit_given').reduce((s, e) => s + e.amount, 0)
    const received = homeEntries.filter(e => e.type === 'payment_received').reduce((s, e) => s + e.amount, 0)
    const totalBal = customers.reduce((s, c) => s + (c.balance || 0), 0)
    return { given, received, totalBal }
  }

  const getCustomerCount = () => customers.length
  const getCustomerList = () => {
    if (customers.length === 0) {
      return isEn ? 'There are no customers in your shop.' : 'आपकी दुकान में कोई ग्राहक नहीं है।'
    }
    if (isEn) {
      return 'Customers: ' + customers.map(c => `${c.name} balance Rs ${(c.balance || 0).toLocaleString('en-IN')}`).join(', ') + '.'
    }
    return 'ग्राहक: ' + customers.map(c => `${c.name} का बैलेंस ${(c.balance || 0).toLocaleString('en-IN')} रुपये`).join('। ') + '।'
  }

  const processOffline = (text) => {
    const tStr = text.toLowerCase().trim()
    const { given, received, totalBal } = getTotal()

    // 1. Customer Name search
    for (const c of customers) {
      if (tStr.includes(c.name.toLowerCase()) || c.name.split(' ').some(part => part.length >= 2 && tStr.includes(part.toLowerCase()))) {
        if (isEn) {
          return `${c.name}'s balance is Rs ${(c.balance || 0).toLocaleString('en-IN')}.`
        }
        return `${c.name} का कुल बैलेंस ${(c.balance || 0).toLocaleString('en-IN')} रुपये है।`
      }
    }

    // 2. Total Udhaar Given
    if (tStr.includes('udhaar') || tStr.includes('credit') || tStr.includes('diya') || tStr.includes('loan') || tStr.includes('उधार') || tStr.includes('दिया') || tStr.includes('क्रेडिट') || tStr.includes('लोन')) {
      if (isEn) {
        return `Total credit given across your shop is Rs ${given.toLocaleString('en-IN')}.`
      }
      return `आपकी दुकान में कुल उधार दिया गया ${given.toLocaleString('en-IN')} रुपये है।`
    }

    // 3. Total Payment Received / Vasooli
    if (tStr.includes('vasool') || tStr.includes('received') || tStr.includes('wapas') || tStr.includes('mila') || tStr.includes('jama') || tStr.includes('payment') || tStr.includes('वसूल') || tStr.includes('प्राप्त') || tStr.includes('जमा') || tStr.includes('वापस') || tStr.includes('पेमेंट')) {
      if (isEn) {
        return `Total payment received across your shop is Rs ${received.toLocaleString('en-IN')}.`
      }
      return `आपकी दुकान में कुल प्राप्त भुगतान ${received.toLocaleString('en-IN')} रुपये है।`
    }

    // 4. Total / Balance / Outstanding
    if (tStr.includes('total') || tStr.includes('balance') || tStr.includes('baki') || tStr.includes('due') || tStr.includes('hisab') || tStr.includes('टोटल') || tStr.includes('बैलेंस') || tStr.includes('बाकी') || tStr.includes('हिसाब') || tStr.includes('बकाया') || tStr.includes('कुल')) {
      if (isEn) {
        return `Total credit given: Rs ${given.toLocaleString('en-IN')}. Total payment received: Rs ${received.toLocaleString('en-IN')}. Total balance: Rs ${totalBal.toLocaleString('en-IN')}.`
      }
      return `कुल उधार दिया: ${given.toLocaleString('en-IN')} रुपये। कुल भुगतान प्राप्त: ${received.toLocaleString('en-IN')} रुपये। कुल बकाया: ${totalBal.toLocaleString('en-IN')} रुपये।`
    }

    // 5. Customer Count
    if (tStr.includes('kitne user') || tStr.includes('kitne customer') || tStr.includes('how many') || tStr.includes('customer count') || tStr.includes('grahak') || tStr.includes('ग्राहक') || tStr.includes('कस्टमर')) {
      if (isEn) {
        return `You have a total of ${getCustomerCount()} customers.`
      }
      return `आपकी दुकान में कुल ${getCustomerCount()} ग्राहक हैं।`
    }

    // 6. Details / List
    if (tStr.includes('detail') || tStr.includes('info') || tStr.includes('list') || tStr.includes('naam') || tStr.includes('विवरण') || tStr.includes('लिस्ट') || tStr.includes('नाम') || tStr.includes('सूची')) {
      return getCustomerList()
    }

    // 7. Entry count / history
    if (tStr.includes('kitne entry') || tStr.includes('entry count') || tStr.includes('transactions') || tStr.includes('history') || tStr.includes('aaj') || tStr.includes('एंट्री') || tStr.includes('आज')) {
      if (isEn) {
        return `You have a total of ${homeEntries.length} entries.`
      }
      return `आपकी दुकान में कुल ${homeEntries.length} एंट्रियां हैं।`
    }

    // 8. Greetings
    if (tStr.includes('hello') || tStr.includes('hi') || tStr.includes('namaste') || tStr.includes('नमस्ते') || tStr.includes('हेलो')) {
      if (isEn) {
        return "Hello! I am BolKhata. You can ask about your total, balance, customer details, or specific customer names."
      }
      return "नमस्ते! मैं BolKhata हूँ। आप मुझसे कुल हिसाब, बैलेंस, ग्राहक सूची या किसी ग्राहक का नाम लेकर पूछ सकते हैं।"
    }

    // 9. Help
    if (tStr.includes('help') || tStr.includes('मदद')) {
      if (isEn) {
        return "You can ask: 'What is my total?', 'How many customers?', 'Customer details', 'What is remaining balance?'."
      }
      return "आप पूछ सकते हैं: 'कुल कितना हुआ', 'कितने ग्राहक हैं', 'ग्राहक विवरण', 'बैलेंस बताओ'।"
    }

    // 10. General Shop Query Fallback
    if (['shop', 'dukan', 'system', 'report', 'summary', 'sab', 'kya', 'kitna', 'batao', 'दुकान', 'सिस्टम', 'रिपोर्ट', 'सब', 'क्या', 'कितना', 'बताओ', 'डाटा', 'डेटा', 'हाल'].some(kw => tStr.includes(kw))) {
      if (isEn) {
        return `Total credit given: Rs ${given.toLocaleString('en-IN')}. Total payment received: Rs ${received.toLocaleString('en-IN')}. Total balance: Rs ${totalBal.toLocaleString('en-IN')}.`
      }
      return `कुल उधार दिया: ${given.toLocaleString('en-IN')} रुपये। कुल भुगतान प्राप्त: ${received.toLocaleString('en-IN')} रुपये। कुल बकाया: ${totalBal.toLocaleString('en-IN')} रुपये।`
    }

    // 11. Unknown / Out-of-system fallback
    if (isEn) {
      return "Sorry, I don't have this information."
    }
    return "माफ़ कीजिए, यह जानकारी मेरे पास उपलब्ध नहीं है।"
  }

  const startListening = async () => {
    stopSpeaking()
    setListening(true)
    try {
      const text = await transcribeBrowser(isEn ? 'en-IN' : 'hi-IN')
      await sendQuery(text)
    } catch {
      setListening(false)
    }
  }

  const sendQuery = async (text) => {
    stopSpeaking()
    setLoading(true)
    setListening(false)

    const isOnline = navigator.onLine
    let answer = ''

    if (!isOnline) {
      answer = processOffline(text)
    } else {
      try {
        const res = await apiFetch('/voice/query', {
          method: 'POST',
          body: { text, language: isEn ? 'English' : 'Hindi' },
          auth: true,
        })
        answer = res.answer || (isEn ? "Sorry, I don't have this information." : "माफ़ कीजिए, यह जानकारी मेरे पास उपलब्ध नहीं है।")
      } catch (e) {
        answer = processOffline(text)
      }
    }

    setLoading(false)
    setSpeaking(true)
    speak(answer, {
      onEnd: () => setSpeaking(false),
      lang: activeLangCode
    })
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
                {isEn ? 'How to ask questions:' : 'प्रश्न कैसे पूछें:'}
              </div>
              <p className="text-[#E6D5B8] leading-relaxed mb-2 text-[11.5px]">
                {isEn ? 'Tap the mic orb below and speak naturally:' : 'नीचे माइक बटन दबाएं और सहजता से बोलें:'}
              </p>
              <ul className="text-[11.5px] text-amber-100/90 space-y-1.5 bg-[#251B0F] p-2.5 rounded-xl border border-amber-500/20">
                <li>• {isEn ? '"What is my total?"' : '"Total kitna hua?"'}</li>
                <li>• {isEn ? '"How many customers?"' : '"Kitne customer hain?"'}</li>
                <li>• {isEn ? '"Show customer details"' : '"Customer ka detail"'}</li>
                <li>• {isEn ? '"What is remaining balance?"' : '"Balance kitna bacha?"'}</li>
                <li>• {isEn ? '"What is Ramesh\'s balance?"' : '"Ramesh ka balance kya hai?"'}</li>
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
          title={speaking ? (isEn ? 'AI is speaking (Tap to stop)' : 'AI बोल रहा है (रोकने के लिए दबाएं)') : listening ? (isEn ? 'Listening...' : 'सुन रहा हूँ...') : (isEn ? 'Tap to speak to AI' : 'AI से बात करने के लिए दबाएं')}
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
