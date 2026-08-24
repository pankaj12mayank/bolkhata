import io

async def transcribe_with_whisper(file_bytes: bytes, filename: str, api_key: str, model: str = "whisper-1", language_hint: str = "hi", base_url: str = "") -> str | None:
    """Transcribe audio via OpenAI-compatible Whisper. Supports custom base_url, Hindi/Hinglish/English auto-detect."""
    if not api_key and not base_url:
        return None
    # Browser free mode: no api_key and provider == browser => return None to signal frontend to use Web Speech
    if not api_key:
        return None
    try:
        import requests
        # Determine endpoint: base_url or default OpenAI
        if base_url:
            url = base_url.rstrip("/") + "/audio/transcriptions"
            # Handle if base_url already includes /v1
            if not url.endswith("/audio/transcriptions"):
                if "/v1" not in url:
                    url = base_url.rstrip("/") + "/v1/audio/transcriptions"
        else:
            url = "https://api.openai.com/v1/audio/transcriptions"
        headers = {"Authorization": f"Bearer {api_key}"}
        lang_map = {"Hindi": "hi", "Hinglish": "hi", "Marathi": "mr", "English": "en"}
        lang_code = lang_map.get(language_hint, "hi")
        data = {"model": model}
        if language_hint == "Hinglish":
            pass  # auto detect for Hinglish
        elif lang_code:
            data["language"] = lang_code
        files = {"file": (filename or "audio.webm", file_bytes, "audio/webm")}
        resp = requests.post(url, headers=headers, data=data, files=files, timeout=30)
        if resp.status_code != 200:
            return None
        j = resp.json()
        return j.get("text", "").strip()
    except Exception:
        return None

async def transcribe_generic(file_bytes: bytes, filename: str, provider: str, api_key: str, base_url: str, model: str, language_hint: str) -> str | None:
    """Wrapper that respects provider. browser => free, no backend call."""
    if provider == "browser":
        return None  # signal frontend to use Web Speech API free
    return await transcribe_with_whisper(file_bytes, filename, api_key, model, language_hint, base_url)
