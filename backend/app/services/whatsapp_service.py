
import requests
from urllib.parse import quote

def send_whatsapp_via_provider(to_phone: str, message: str, provider: str, base_url: str, api_key: str, phone_id: str = "") -> tuple[bool, str]:
    """
    Try to send WhatsApp via configured provider. Returns (success, detail)
    Providers: wa_me (just link, no send), twilio, interakt, custom
    For custom, expects base_url to be a POST endpoint that accepts JSON {to, message} with Bearer token.
    """
    if provider in ("wa_me", "disabled", "link"):
        # Free wa.me link — no auto send, user clicks
        clean = "".join(c for c in to_phone if c.isdigit())
        if len(clean) == 10:
            clean = "91" + clean
        link = f"https://wa.me/{clean}?text={quote(message)}" if clean else f"https://wa.me/?text={quote(message)}"
        return True, link
    # Try generic custom
    try:
        if not base_url or not api_key:
            return False, "Base URL / Key missing"
        # Provider-specific handling
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {}
        url = base_url.rstrip("/")
        if provider == "twilio":
            # Twilio: https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json — needs auth basic, not bearer
            # For simplicity, use custom mapping: user should set base_url as Twilio endpoint + provide SID:TOKEN as api_key via "SID:TOKEN"
            # We'll try generic
            return False, "Twilio: set base_url to https://api.twilio.com/2010-04-01/Accounts/YOUR_SID/Messages.json and api_key as SID:TOKEN — auto-send not yet fully implemented, use wa.me for now"
        elif provider == "interakt":
            # Interakt: POST https://api.interakt.ai/v1/public/message/ with X-API-Key
            headers = {"Authorization": f"Basic {api_key}", "Content-Type": "application/json"}
            payload = {"countryCode": "+91", "phoneNumber": to_phone, "type": "Template", "template": {"name": "reminder", "languageCode": "en", "bodyValues": [message]}}
            # fallback to wa.me if fail
        else:
            # custom: {to, message}
            payload = {"to": to_phone, "message": message, "phone_id": phone_id}
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        if resp.status_code in (200, 201, 202):
            return True, f"Sent via {provider} — {resp.text[:200]}"
        else:
            return False, f"{provider} error {resp.status_code}: {resp.text[:300]}"
    except Exception as e:
        return False, str(e)[:300]

def get_whatsapp_link(to_phone: str, message: str) -> str:
    clean = "".join(c for c in to_phone if c.isdigit())
    if len(clean) == 10:
        clean = "91" + clean
    if clean:
        return f"https://wa.me/{clean}?text={quote(message)}"
    return f"https://wa.me/?text={quote(message)}"
