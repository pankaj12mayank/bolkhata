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
    """Try to parse Hindi/Hinglish number words like 'paanch sau', 'ek hazaar do sau', 'do hazaar', 'saade chaar sau'=450"""
    text = text.lower()
    # Handle saade -> half extra: saade chaar sau = 450, saade teen sau = 350
    saade = 'saade' in text or 'sade' in text or 'sadhe' in text
    # Replace commas and extra
    words = re.findall(r"[a-z\u0900-\u097F]+", text.lower())
    # Remove saade words from list for numeric calc, but remember flag
    filtered = [w for w in words if w not in ('saade','sade','sadhe','aadhe','aadha')]
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
    if saade and result:
        # Add half of last unit: if text has sau -> +50, hazaar -> +500
        if 'sau' in text or 'sou' in text:
            result += 50
        elif 'hazaar' in text or 'hazaaar' in text:
            result += 500
        else:
            result += 0  # no unit
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
    # Payment received cues (wapas, jama, liya, mila, de gaya payment, bhugtan)
    payment_cues = ["wapas", "mila", "liye", "jama", "bhugtan", "payment", "de gaya wapas", "lautaya", "chuka", "paid"]
    credit_cues = ["udhaar", "udhar", "diya", "diye", "liya udhaar", "baaki", "lena", "dena"]
    # More precise: if contains wapas/mila and not udhaar => payment
    # If both, prefer wapas/mila as payment
    # Check payment first
    for cue in payment_cues:
        if cue in text_l:
            # But if also udhaar diya strongly -> credit
            # e.g. "Ramesh ko paanch sau udhaar diya" -> credit
            # "Ramesh se paanch sau wapas mile" -> payment
            if "udhaar diya" in text_l or "udhar diya" in text_l:
                return "credit_given"
            return "payment_received"
    # Default credit for udhaar keywords
    for cue in credit_cues:
        if cue in text_l:
            return "credit_given"
    # Default to credit if ambiguous (safer for shop: udhaar)
    return "credit_given"

def _extract_name(text: str) -> str:
    # Try patterns: "Ramesh ko ...", "Anil se ...", "Sunita ko", "X ko Y diya", "Give 500 to John"
    text_clean = re.sub(r"[^\w\s\u0900-\u097F]", " ", text)
    # Pattern 1: "<Name> ko/se/ke/to/for"
    m = re.search(r"([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+){0,2})\s+(?:ko|se|ke|ji)\b", text_clean, re.IGNORECASE)
    if m:
        name = m.group(1).strip()
        stop = {"aur", "ko", "se", "ne", "koi", "yeh", "woh", "usko", "isko", "give", "gave", "take", "took"}
        words = [w for w in name.split() if w.lower() not in stop]
        # Filter out numbers
        words = [w for w in words if not w.isdigit()]
        if words:
            return " ".join(w.capitalize() for w in words)
    # Pattern 1b: English "to <Name>" / "for <Name>"
    m_to = re.search(r"\b(?:to|for)\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})\b", text, re.IGNORECASE)
    if m_to:
        name = m_to.group(1).strip()
        # Avoid capturing amount
        if not name.replace(" ","").isdigit():
            # Stop if next word is verb
            return " ".join(w.capitalize() for w in name.split()[:2])
    # Pattern 2: first capitalized phrase (ignore Give)
    m2 = re.search(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b", text)
    if m2:
        cand = m2.group(1).strip()
        if cand.lower() not in ("give","gave","take","took","pay","paid"):
            return cand
        # try next
        m2b = re.search(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b", text[m2.end():])
        if m2b:
            return m2b.group(1).strip()
    # Fallback: first non-stop word
    words = text_clean.strip().split()
    # filter stop
    stops = {"give","gave","take","to","for","ko","se","ne","aur","paanch","sau","hazaar","udhaar","diya","wapas","mile"}
    for w in words:
        if w.lower() not in stops and not w.isdigit():
            return w.capitalize()
    if words:
        return words[0].capitalize()
    return "Unknown"

def local_parse(text: str, language: str = "Hinglish") -> dict:
    """Local heuristic parse for Hindi/Hinglish/English without AI. Returns dict."""
    amount = _extract_amount(text)
    if amount is None:
        # ultimate fallback: find any number
        nums = re.findall(r"\d+", text)
        if nums:
            amount = float(nums[0])
        else:
            amount = 0
    typ = _extract_type(text)
    name = _extract_name(text)
    # Clean name: ensure not numeric
    if name.isdigit():
        name = "Unknown"
    return {
        "customer_name": name,
        "amount": float(amount),
        "type": typ,
        "confidence": 0.6 if amount > 0 else 0.3,
        "raw_text": text,
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
        # Handle LiteLLM / Ollama local without key
        prompt = f"You are BolKhata parser. Parse this Indian shop voice entry in Hindi/Hinglish/English. Text: \"{text}\" Language hint: {language_hint} Return ONLY JSON: {{\"customer_name\": \"Name\", \"amount\": number, \"type\": \"credit_given\"|\"payment_received\"}} Rules: - \"udhaar diya\", \"ko ... diya\" => credit_given - \"wapas mila\", \"se ... mila\", \"bhugtan\", \"jama\" => payment_received - amount: convert Hindi words (paanch sau=500, ek hazaar=1000, do hazaar=2000, saade chaar sau=450) - customer_name: person/shop name before ko/se/ke/to - If unclear, guess best. Only JSON, no explanation."
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
