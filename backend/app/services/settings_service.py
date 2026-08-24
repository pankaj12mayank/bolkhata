from sqlalchemy.orm import Session
from .. import models

DEFAULTS = {
    "free_entries_limit": 15,
    "paid_price_inr": 99,
    "paid_entries_limit": -1,
    "currency": "INR",
    "default_language": "Hindi",
    "otp_mode": "dev",
    "otp_expiry_minutes": 5,
    "jwt_expire_minutes": 10080,
    "razorpay_key_id": "",
    "razorpay_key_secret": "",
    "razorpay_test_mode": "true",
    "razorpay_webhook_secret": "",
    "openai_api_key": "",
    "anthropic_api_key": "",
    "whisper_model": "whisper-1",
    "claude_model": "claude-3-haiku-20240307",
    "auto_reminder": "true",
    "wa_template": "Namaste {name} ji, aapka \u20b9{balance} udhaar baaki hai. Kripya jald bhugtan karein. Dhanyavaad \u2014 BolKhata",
    "maintenance_mode": "false",
    # generic providers
    "ai_provider": "local",
    "ai_base_url": "",
    "ai_api_key": "",
    "ai_model": "gpt-4o-mini",
    "stt_provider": "browser",
    "stt_base_url": "",
    "stt_api_key": "",
    "stt_model": "whisper-1",
    "whatsapp_provider": "wa_me",
    "whatsapp_base_url": "",
    "whatsapp_api_key": "",
    "whatsapp_phone_id": "",
    "otp_provider": "dev",
    "otp_base_url": "",
    "otp_api_key": "",
    "otp_template_id": "",
}

def _env_fallback(db_settings: models.PlatformSettings | None) -> dict:
    """Merge DB settings with env defaults for backward compatibility."""
    from ..config import settings as env_settings
    # If DB missing keys, fallback to env for razorpay/openai
    fallback = {
        "razorpay_key_id": env_settings.RAZORPAY_KEY_ID,
        "razorpay_key_secret": env_settings.RAZORPAY_KEY_SECRET,
        "openai_api_key": env_settings.OPENAI_API_KEY,
        "anthropic_api_key": env_settings.ANTHROPIC_API_KEY,
        "jwt_expire_minutes": env_settings.JWT_EXPIRE_MINUTES,
    }
    if not db_settings:
        return fallback
    out = {}
    for k, v in fallback.items():
        db_val = getattr(db_settings, k, "")
        # if DB empty but env has value, use env
        if (not db_val) and v:
            out[k] = v
    return out

def get_settings(db: Session) -> models.PlatformSettings:
    """Get or create singleton settings row (id=1)."""
    s = db.query(models.PlatformSettings).filter(models.PlatformSettings.id == 1).first()
    if s:
        # migrate env fallback for empty keys
        fallback = _env_fallback(s)
        changed = False
        for k, v in fallback.items():
            if v and not getattr(s, k):
                setattr(s, k, v)
                changed = True
        if changed:
            db.commit()
            db.refresh(s)
        # check period: also ensure defaults not None
        return s
    # create with defaults + env fallback
    s = models.PlatformSettings(id=1, **DEFAULTS)
    # overlay env
    from ..config import settings as env_settings
    if env_settings.RAZORPAY_KEY_ID:
        s.razorpay_key_id = env_settings.RAZORPAY_KEY_ID
    if env_settings.RAZORPAY_KEY_SECRET:
        s.razorpay_key_secret = env_settings.RAZORPAY_KEY_SECRET
    if env_settings.OPENAI_API_KEY:
        s.openai_api_key = env_settings.OPENAI_API_KEY
    if env_settings.ANTHROPIC_API_KEY:
        s.anthropic_api_key = env_settings.ANTHROPIC_API_KEY
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

def mask_secret(val: str) -> str:
    if not val:
        return ""
    if len(val) <= 8:
        return "****"
    return val[:4] + "****" + val[-4:]

def is_razorpay_configured(s: models.PlatformSettings) -> bool:
    return bool(s.razorpay_key_id and s.razorpay_key_secret)

def is_openai_configured(s: models.PlatformSettings) -> bool:
    return bool(s.openai_api_key)

def is_anthropic_configured(s: models.PlatformSettings) -> bool:
    return bool(s.anthropic_api_key)

def is_ai_configured(s: models.PlatformSettings) -> bool:
    # generic AI: if provider != local and has key or base_url
    if s.ai_provider and s.ai_provider != "local":
        return bool(s.ai_api_key or s.ai_base_url)
    # fallback to legacy keys
    return bool(s.openai_api_key or s.anthropic_api_key or s.ai_api_key)

def is_stt_configured(s: models.PlatformSettings) -> bool:
    if s.stt_provider == "browser":
        return False  # free, no key needed
    if s.stt_provider in ("openai","custom"):
        return bool(s.stt_api_key or s.openai_api_key)
    return bool(s.openai_api_key)

def is_whatsapp_configured(s: models.PlatformSettings) -> bool:
    if s.whatsapp_provider in ("wa_me","disabled"):
        return False  # free wa.me link
    return bool(s.whatsapp_api_key and s.whatsapp_base_url)
