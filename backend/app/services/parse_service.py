import re
from typing import Literal

# Hindi/Hinglish number words map
HINDI_NUMBERS = {
    "ek": 1, "do": 2, "teen": 3, "chaar": 4, "char": 4, "paanch": 5, "panch": 5,
    "cheh": 6, "chhah": 6, "saat": 7, "aath": 8, "nau": 9, "das": 10,
    "gyarah": 11, "barah": 12, "terah": 13, "chaudah": 14, "pandrah": 15,
    "solah": 16, "satrah": 17, "atharah": 18, "unnis": 19, "bees": 20,
    "tees": 30, "chalis": 40, "pachas": 50, "saath": 60, "sattar": 70,
    "assi": 80, "nabbe": 90,
    "sau": 100, "sou": 100, "hazaar": 1000, "hazaaar": 1000, "lakh": 100000,
}

ENGLISH_MULTIPLIERS = {"hundred": 100, "thousand": 1000, "lakh": 100000, "lac": 100000}

def _hindi_words_to_number(text: str) -> int | None:
    """Parse Hindi/Hinglish incl dedh=1.5, dhai/adhai=2.5, paune, sade, adha etc"""
    orig_lower = text.lower()
    # Normalize - dedh = 1.5 hundred =150, dhai/adhai =2.5 hundred =250, paune=0.75
    # Handle dedh sau =150, dhai sau =250, adhai sau =250, paune chaar sau =350, paune 500=375 etc
    dedh = 'dedh' in orig_lower or 'dhedh' in orig_lower
    dhai = 'dhai' in orig_lower or 'adhai' in orig_lower or 'adai' in orig_lower
    paune = 'paune' in orig_lower or 'pone' in orig_lower or 'paune' in orig_lower
    saade = 'saade' in orig_lower or 'sade' in orig_lower or 'sadhe' in orig_lower

    words = re.findall(r"[a-z\u0900-\u097F]+", orig_lower)
    # Remove modifiers for numeric calc
    filtered = [w for w in words if w not in ('saade','sade','sadhe','aadhe','aadha','adha','dedh','dhedh','dhai','adhai','adai','paune','pone')]
    words = filtered
    total = 0
    current = 0
    found = False
    for w in words:
        w = w.strip()
        if w in HINDI_NUMBERS:
            found = True
            val = HINDI_NUMBERS[w]
            if val == 100:
                if current == 0:
                    current = 1
                current *= 100
            elif val == 1000:
                if current == 0:
                    current = 1
                current *= 1000
                total += current
                current = 0
            elif val == 100000:
                if current == 0:
                    current = 1
                current *= 100000
                total += current
                current = 0
            else:
                current += val
        elif w.isdigit():
            found = True
            current += int(w)
    total += current
    result = total if found and total > 0 else None

    # Apply half modifiers
    if result is None:
        # dedh/dhai alone: dedh sau without sau word? handle
        if dedh:
            return 150
        if dhai:
            return 250
        if paune and total==0:
            return None
    if result:
        base = result
        if dedh:
            # dedh sau =150 if base 100 => we already counted 1*100=100, need +50
            # dedh hazaar =1500 if base 1000 => +500
            if 'sau' in orig_lower or 'sou' in orig_lower:
                if base == 100:
                    result = 150
                else:
                    result = base + 50 if base % 100 == 0 else base  # fallback
            elif 'hazaar' in orig_lower or 'hazaaar' in orig_lower:
                if base == 1000:
                    result = 1500
                else:
                    result += 500
        elif dhai:
            if 'sau' in orig_lower or 'sou' in orig_lower:
                if base == 100:
                    result = 250
                elif base % 100 == 0:
                    # e.g. 2 sau =200 but dhai => 250, so  dhai sau =>250
                    result = (base - 100) + 250 if base>=100 else 250
                else:
                    result += 50  # rough
            elif 'hazaar' in orig_lower:
                if base == 1000:
                    result = 2500
                else:
                    result += 500
        elif paune:
            # paune chaar sau =350 (4*100 -50), paune 500 =375? but Hindi paune = -quarter
            # paune 4 sau = 350, paune 500? treat as base -50 or -25%
            if 'sau' in orig_lower or 'sou' in orig_lower:
                # if we parsed "chaar sau"=400 -> paune => 350
                result -= 50
                if result < 0: result = 0
            elif 'hazaar' in orig_lower:
                result -= 500
            else:
                # paune 2 hazaar? 1500? assume -25%
                result = int(result * 0.75) if result else result
        elif saade:
            if 'sau' in orig_lower or 'sou' in orig_lower:
                result += 50
            elif 'hazaar' in orig_lower or 'hazaaar' in orig_lower:
                result += 500
    # Special solo checks
    if result is None:
        if 'dedh sau' in orig_lower: return 150
        if 'dhai sau' in orig_lower or 'adhai sau' in orig_lower: return 250
        if 'paune do sau' in orig_lower: return 150
        if 'sava sau' in orig_lower: return 125  # 100+25
        if 'sava hazaar' in orig_lower: return 1250
    # also handle sava = + quarter
    if 'sava' in orig_lower and result:
        if 'sau' in orig_lower:
            result += 25
        elif 'hazaar' in orig_lower:
            result += 250
    return result

def _extract_amount(text: str) -> float | None:
    # 1. Try digits with separators
    # Match 1,500 or 1500 or 1.5k? keep simple
    m = re.search(r"[\u20b9₹]?\s*([\d,]+(?:\.\d+)?)\s*(?:rupees?|rs\.?|rupaye)?", text, re.IGNORECASE)
    if m:
        raw = m.group(1).replace(",", "")
        try:
            val = float(raw)
            if val > 0:
                # Heuristic: if text contains lakh/hazaar/sau near digits, multiply?
                # e.g. "500" in "paanch sau" already digits found, but also words — prefer larger?
                return val
        except:
            pass
    # 2. Hindi words
    hw = _hindi_words_to_number(text)
    if hw:
        return float(hw)
    # 3. Look for patterns like "paanch sau" as digits words mix
    # Already handled
    return None

def _extract_type(text: str) -> Literal["credit_given", "payment_received"]:
    text_l = text.lower()
    # Normalize - remove extra spaces
    tl = " " + text_l + " "
    # Strong payment patterns: "se ... wapas/mila/jama/vasool/loutaya" or standalone vasool
    # Must check se + verb proximity more accurately
    has_se = " se " in tl or " se," in tl
    has_ko = " ko " in tl
    has_ne = " ne " in tl
    has_ko_diya = " ko " in tl and "diya" in tl
    # Expanded cues - real dukaan language
    payment_cues = ["wapas", "mila", "mile", "liye", "liya wapas", "jama", "jma", "bhugtan", "payment", "lautaya", "lautaye", "chuka", "chukaye", "paid", "vasool", "vasul", "wasool", "de gaya", "lautaya", "return", "vaapas"]
    credit_cues = ["udhaar", "udhar", "udhaari", "baaki", "lena", "dena"]
    # Special: "se ... diya/liye/mila" is strong payment signal even if diya present
    # e.g. "Ramesh se 500 liye" / "Ramesh ne 500 de diye wapas" => payment
    # e.g. "Ramesh ko 500 diya" => credit
    # Rule 1: if has "se" + payment verb OR "ne ... de diye" + wapas -> payment
    if has_se:
        for cue in ["wapas","mila","mile","jama","vasool","vasul","wasool","lautaya","chuka","bhugtan","paid","liye","liya","return"]:
            if cue in tl:
                # but exclude "se udhaar liya" -> that is credit (customer took udhaar)
                if "udhaar liya" in tl or "udhar liya" in tl:
                    # "Ramesh ne udhaar liya" is credit_given (shop gave)
                    return "credit_given"
                return "payment_received"
    # "ne ... diya wapas" pattern
    if has_ne and ("wapas" in tl or "vasool" in tl or "jama" in tl or "lautaya" in tl):
        return "payment_received"
    # Generic payment cues (without se) - but be careful with "diya"
    for cue in payment_cues:
        if cue in tl:
            # If explicit "udhaar diya" with ko -> credit wins over generic
            if "udhaar diya" in tl or "udhar diya" in tl:
                # but if also wapas -> payment
                if "wapas" in tl or "vasool" in tl:
                    return "payment_received"
                return "credit_given"
            return "payment_received"
    # Credit cues
    for cue in credit_cues:
        if cue in tl:
            return "credit_given"
    # ko + diya/liya heuristic
    if "diya" in tl or "diye" in tl:
        if has_ko:
            return "credit_given"
        if has_se or has_ne:
            # ambiguous "Ramesh se 500 diya" -> likely payment received if not udhaar
            return "payment_received"
        return "credit_given"
    if "liya" in tl or "liye" in tl:
        if has_se:
            return "payment_received"
        # "udhaar liya" -> credit
        return "credit_given"
    return "credit_given"

def _extract_name(text: str) -> str:
    # Extract phone hint first - keep for candidate logic but strip from name
    # e.g. "Ramesh 98 wale ko" -> name Ramesh
    # We try to capture name before ko/se/ke/ji, allowing up to 3 words, ignoring numbers
    text_clean = re.sub(r"[^\w\s\u0900-\u097F]", " ", text)
    # Remove phone-like fragments for name capture? keep but filter digits later
    # Pattern 1: "<Name> ko/se/ke/ne/ji" - most reliable for Hinglish
    m = re.search(r"([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+){0,2})\s+(?:ko|se|ke|ne|ji|wale)\b", text_clean, re.IGNORECASE)
    if m:
        name = m.group(1).strip()
        stop = {"aur", "ko", "se", "ne", "ke", "ji", "koi", "yeh", "woh", "usko", "isko", "give", "gave", "take", "took", "wala", "wale", "wali"}
        words = [w for w in name.split() if w.lower() not in stop and not w.isdigit() and len(w)>1]
        # Also filter amount words to avoid capturing "paanch sau" as name
        amount_words = {"paanch","panch","sau","sou","hazaar","hazaaar","lakh","ek","do","teen","chaar","dedh","dhai","paune","saade","sade","hundred","thousand"}
        words = [w for w in words if w.lower() not in amount_words]
        if words:
            return " ".join(w.capitalize() for w in words)
    # Pattern 1b: English "to <Name>" / "for <Name>"
    m_to = re.search(r"\b(?:to|for)\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})\b", text, re.IGNORECASE)
    if m_to:
        name = m_to.group(1).strip()
        if not name.replace(" ","").isdigit():
            amount_words = {'hundred','thousand','rupees','rs'}
            if name.lower() not in amount_words:
                return " ".join(w.capitalize() for w in name.split()[:2])
    # Pattern 2: first capitalized phrase (ignore Give)
    m2 = re.search(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b", text)
    if m2:
        cand = m2.group(1).strip()
        if cand.lower() not in ("give","gave","take","took","pay","paid","ramesh","anil","sunita"):
            # Actually allow common names - don't block, just check stop
            pass
        if cand.lower() not in ("give","gave","take","took","pay","paid"):
            return cand
        m2b = re.search(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b", text[m2.end():])
        if m2b:
            return m2b.group(1).strip()
    # Fallback: first non-stop word
    words = text_clean.strip().split()
    stops = {"give","gave","take","to","for","ko","se","ne","ke","ji","aur","paanch","panch","sau","sou","hazaar","udhaar","udhar","diya","diye","wapas","mile","mila","vasool","jama","hundred","thousand"}
    for w in words:
        if w.lower() not in stops and not w.isdigit() and not w.lower() in HINDI_NUMBERS:
            return w.capitalize()
    if words:
        return words[0].capitalize()
    return "Unknown"

def _extract_phone_hint(text: str) -> str | None:
    """Extract phone hint only if wale/wala context, e.g. '98 wale', '9876 wale'"""
    low = text.lower()
    if "wale" in low or "wala" in low or "vale" in low:
        # 2-4 digits before wale
        m = re.search(r"\b(\d{2,4})\s*(?:wale|wala|vale)\b", low)
        if m:
            return m.group(1)
        # also "98 wale Ramesh"
        m2 = re.search(r"(\d{2,4})\s*wale", low)
        if m2:
            return m2.group(1)
    # also explicit "phone 98" not needed
    return None

def _extract_amount_with_phone(text: str, phone_hint: str | None) -> float | None:
    """Extract amount ignoring phone_hint digits"""
    # If phone_hint present, mask it before search
    tmp = text
    if phone_hint:
        # remove phone_hint + wale fragment to avoid amount confusion
        tmp = re.sub(rf"\b{re.escape(phone_hint)}\s*(?:wale|wala|vale)\b", " ", tmp, flags=re.IGNORECASE)
        tmp = re.sub(rf"\b{re.escape(phone_hint)}\b", " ", tmp, count=1)
    # now extract amount from tmp
    # 1. digits with separators
    m = re.search(r"[\u20b9₹]?\s*([\d,]+(?:\.\d+)?)\s*(?:rupees?|rs\.?|rupaye)?", tmp, re.IGNORECASE)
    if m:
        raw = m.group(1).replace(",", "")
        try:
            v = float(raw)
            if v > 0:
                return v
        except:
            pass
    hw = _hindi_words_to_number(tmp)
    if hw:
        return float(hw)
    return None

def local_parse(text: str, language: str = "Hinglish") -> dict:
    """Local heuristic parse for Hindi/Hinglish/English without AI. Returns dict."""
    phone_hint = _extract_phone_hint(text)
    amount = _extract_amount_with_phone(text, phone_hint)
    if amount is None:
        amount = _extract_amount(text)  # fallback
    if amount is None:
        # ultimate fallback: find numbers ignoring phone
        tmp = text
        if phone_hint:
            tmp = re.sub(rf"\b{re.escape(phone_hint)}\b", " ", tmp, count=1)
        nums = re.findall(r"\d+", tmp)
        if nums:
            # pick last number as amount (after wale)
            amount = float(nums[-1])
        else:
            amount = 0
    typ = _extract_type(text)
    name = _extract_name(text)
    if name.isdigit():
        name = "Unknown"
    return {
        "customer_name": name,
        "amount": float(amount),
        "type": typ,
        "confidence": 0.6 if amount > 0 else 0.3,
        "raw_text": text,
        "phone_hint": phone_hint,
    }

async def claude_parse(text: str, api_key: str, model: str = "claude-3-haiku-20240307", language_hint: str = "Hinglish") -> dict | None:
    """Legacy Claude — calls generic with anthropic endpoint."""
    return await generic_ai_parse(text, api_key, model, language_hint, provider="anthropic", base_url="https://api.anthropic.com")

async def generic_ai_parse(text: str, api_key: str, model: str, language_hint: str = "Hinglish", provider: str = "openai", base_url: str = "") -> dict | None:
    """Generic OpenAI-compatible parse — works with OpenAI, Groq, OpenRouter, Ollama, custom."""
    if not api_key and provider not in ("local","ollama"):
        return None
    # If no base_url, infer from provider
    if not base_url:
        if provider == "anthropic":
            base_url = "https://api.anthropic.com"
        elif provider == "groq":
            base_url = "https://api.groq.com/openai/v1"
        elif provider == "openrouter":
            base_url = "https://openrouter.ai/api/v1"
        elif provider == "openai":
            base_url = "https://api.openai.com/v1"
        else:
            base_url = "https://api.openai.com/v1"
    try:
        import requests
        prompt = f"You are BolKhata parser. Parse this Indian shop voice entry in Hindi/Hinglish/English. Text: \"{text}\" Language hint: {language_hint} Return ONLY JSON: {{\"customer_name\": \"Name\", \"amount\": number, \"type\": \"credit_given\"|\"payment_received\", \"phone_hint\": \"digits or null\"}} Rules: - \"udhaar diya\", \"ko ... diya\" => credit_given - \"wapas mila\", \"se ... mila/vasool/jama/bhugtan\" => payment_received - \"se ... liya\" => payment_received - \"ne ... wapas diya\" => payment_received - amount: convert Hindi words (paanch sau=500, ek hazaar=1000, do hazaar=2000, saade chaar sau=450, dedh sau=150, dhai sau=250, paune chaar sau=350) - customer_name: person/shop name before ko/se/ke/ne/to (2-3 words max, ignore amount words) - phone_hint: if text has 2-10 digit fragment like 98, 9876 etc near 'wale', extract. Only JSON, no explanation."
        # Anthropic path
        if provider == "anthropic" or "anthropic" in base_url:
            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            }
            body = {"model": model, "max_tokens": 300, "messages": [{"role": "user", "content": prompt}]}
            url = base_url.rstrip("/") + "/v1/messages"
            # normalize
            if url.endswith("/v1/v1/messages"):
                url = url.replace("/v1/v1/messages","/v1/messages")
            resp = requests.post(url, json=body, headers=headers, timeout=15)
            if resp.status_code != 200:
                return None
            data = resp.json()
            text_out = ""
            for c in data.get("content", []):
                if c.get("type") == "text":
                    text_out += c.get("text", "")
        else:
            # OpenAI-compatible /v1/chat/completions
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            # For Ollama local, no auth needed
            if not api_key:
                headers = {"Content-Type": "application/json"}
            body = {
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are a JSON-only parser. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1,
                "max_tokens": 300,
            }
            url = base_url.rstrip("/") + "/chat/completions"
            # Avoid double /v1
            if "/v1/chat" not in url and base_url.rstrip("/").endswith("/v1"):
                pass
            resp = requests.post(url, json=body, headers=headers, timeout=15)
            if resp.status_code != 200:
                # try without /v1 prefix fallback
                if resp.status_code in (404, 405):
                    alt = base_url.rstrip("/") + "/v1/chat/completions"
                    if alt != url:
                        resp = requests.post(alt, json=body, headers=headers, timeout=15)
                        if resp.status_code != 200:
                            return None
                    else:
                        return None
                else:
                    return None
            data = resp.json()
            choices = data.get("choices", [])
            if not choices:
                return None
            text_out = choices[0].get("message", {}).get("content", "") or choices[0].get("text", "")
        m = re.search(r"\{.*?\}", text_out, re.DOTALL)
        if not m:
            return None
        import json
        parsed = json.loads(m.group(0))
        if "customer_name" not in parsed or "amount" not in parsed or "type" not in parsed:
            return None
        parsed["amount"] = float(parsed["amount"])
        if parsed["type"] not in ("credit_given", "payment_received"):
            parsed["type"] = _extract_type(text)
        parsed["confidence"] = 0.95
        parsed["raw_text"] = text
        return parsed
    except Exception as e:
        # print(f"AI parse err {e}")
        return None

def parse(text: str, language: str = "Hinglish", claude_result: dict | None = None) -> dict:
    """Combine Claude + local fallback."""
    if claude_result and claude_result.get("amount", 0) > 0 and claude_result.get("customer_name"):
        # Validate amount reasonable
        return claude_result
    local = local_parse(text, language)
    # If Claude gave something but local amount differs wildly, prefer local if Claude amount 0?
    if claude_result and claude_result.get("amount", 0) == 0 and local["amount"] > 0:
        return local
    if claude_result:
        # Merge: prefer Claude name if more specific
        return claude_result
    return local
