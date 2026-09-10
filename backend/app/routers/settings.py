
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..database import get_db
from .. import models, schemas
from ..security import get_current_admin
from ..services.settings_service import get_settings, mask_secret

router = APIRouter(prefix="/api/admin/settings", tags=["admin-settings"])

def _to_out(s: models.PlatformSettings) -> dict:
    return {
        "free_entries_limit": s.free_entries_limit,
        "paid_price_inr": s.paid_price_inr,
        "paid_entries_limit": s.paid_entries_limit,
        "currency": s.currency,
        "default_language": s.default_language,
        "otp_mode": s.otp_mode,
        "otp_expiry_minutes": s.otp_expiry_minutes,
        "jwt_expire_minutes": s.jwt_expire_minutes,
        "razorpay_key_id": s.razorpay_key_id or "",
        "razorpay_key_secret": mask_secret(s.razorpay_key_secret) if s.razorpay_key_secret else "",
        "razorpay_test_mode": s.razorpay_test_mode,
        "razorpay_webhook_secret": mask_secret(s.razorpay_webhook_secret) if s.razorpay_webhook_secret else "",
        "openai_api_key": mask_secret(s.openai_api_key) if s.openai_api_key else "",
        "anthropic_api_key": mask_secret(s.anthropic_api_key) if s.anthropic_api_key else "",
        "whisper_model": s.whisper_model,
        "claude_model": s.claude_model,
        "auto_reminder": s.auto_reminder,
        "auto_reminder_day": getattr(s, "auto_reminder_day", "mon") or "mon",
        "auto_reminder_time": getattr(s, "auto_reminder_time", "09:00") or "09:00",
        "wa_template": s.wa_template,
        "maintenance_mode": s.maintenance_mode,
        # generic
        "ai_provider": s.ai_provider or "local",
        "ai_base_url": s.ai_base_url or "",
        "ai_api_key": mask_secret(s.ai_api_key) if getattr(s, 'ai_api_key', '') else "",
        "ai_model": s.ai_model or "gpt-4o-mini",
        "stt_provider": s.stt_provider or "browser",
        "stt_base_url": s.stt_base_url or "",
        "stt_api_key": mask_secret(s.stt_api_key) if getattr(s, 'stt_api_key', '') else "",
        "stt_model": s.stt_model or "whisper-1",
        "whatsapp_provider": s.whatsapp_provider or "wa_me",
        "whatsapp_base_url": s.whatsapp_base_url or "",
        "whatsapp_api_key": mask_secret(s.whatsapp_api_key) if getattr(s, 'whatsapp_api_key', '') else "",
        "whatsapp_phone_id": s.whatsapp_phone_id or "",
        "otp_provider": s.otp_provider or "dev",
        "otp_base_url": s.otp_base_url or "",
        "otp_api_key": mask_secret(s.otp_api_key) if getattr(s, 'otp_api_key', '') else "",
        "otp_template_id": s.otp_template_id or "",
        "updated_at": s.updated_at,
    }

@router.get("", response_model=schemas.PlatformSettingsOut)
def get_platform_settings(db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    s = get_settings(db)
    return _to_out(s)

@router.get("/raw")
def get_platform_settings_raw(db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    s = get_settings(db)
    d = _to_out(s)
    d["_razorpay_configured"] = bool(s.razorpay_key_id and s.razorpay_key_secret)
    d["_openai_configured"] = bool(s.openai_api_key)
    d["_anthropic_configured"] = bool(s.anthropic_api_key)
    d["_ai_configured"] = bool(getattr(s, 'ai_api_key', '') or getattr(s, 'ai_base_url', ''))
    d["_stt_configured"] = getattr(s, 'stt_provider', 'browser') != "browser" and bool(getattr(s, 'stt_api_key', '') or s.openai_api_key)
    d["_whatsapp_configured"] = getattr(s, 'whatsapp_provider', 'wa_me') not in ("wa_me", "disabled")
    d["_otp_configured"] = getattr(s, 'otp_provider', 'dev') != "dev"
    return d

@router.put("", response_model=schemas.PlatformSettingsOut)
def update_platform_settings(payload: schemas.PlatformSettingsUpdateIn, db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    s = get_settings(db)
    data = payload.model_dump(exclude_unset=True)
    masked_fields = ("razorpay_key_secret", "razorpay_webhook_secret", "openai_api_key", "anthropic_api_key", "ai_api_key", "stt_api_key", "whatsapp_api_key", "otp_api_key")
    for k, v in data.items():
        if v is None:
            continue
        if k in masked_fields:
            if isinstance(v, str) and "****" in v:
                continue
            if v == "":
                setattr(s, k, "")
                continue
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return _to_out(s)

# ---- Connection tests ----

@router.post("/test/razorpay", response_model=schemas.ConnectionTestOut)
def test_razorpay(payload: schemas.BillingTestIn | None = None, db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    from ..services.razorpay_service import create_razorpay_order
    import traceback
    s = get_settings(db)
    key_id = payload.key_id if payload and payload.key_id else s.razorpay_key_id
    key_secret = payload.key_secret if payload and payload.key_secret else s.razorpay_key_secret
    if not key_id or not key_secret:
        return {"success": False, "message": "Razorpay keys khali hain — pehle save karein", "detail": "Configure both Key ID and Secret"}
    try:
        order = create_razorpay_order(key_id, key_secret, 100, "INR", "test_razorpay")
        return {"success": True, "message": f"Razorpay Connected \u2713 — order {order.get('id')} bana", "detail": f"Amount {order.get('amount')} paise"}
    except Exception as e:
        return {"success": False, "message": f"Razorpay fail: {str(e)[:200]}", "detail": traceback.format_exc()[:500]}

@router.post("/test/whisper", response_model=schemas.ConnectionTestOut)
def test_whisper(db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    s = get_settings(db)
    # Use new stt fields if provider is openai
    api_key = getattr(s, 'stt_api_key', '') or s.openai_api_key
    if getattr(s, 'stt_provider', 'browser') == "browser":
        return {"success": True, "message": "Browser Free STT — koi key nahi chahiye \u2713", "detail": "Chrome me Web Speech API free hai, install ki zarurat nahi. OpenAI Whisper optional paid hai (~$0.006/min)."}
    if not api_key:
        return {"success": False, "message": "STT key khali hai", "detail": "Browser free use karein ya OpenAI key save karein"}
    try:
        import requests
        base = getattr(s, 'stt_base_url', '') or "https://api.openai.com/v1"
        if "openai.com" in base:
            headers = {"Authorization": f"Bearer {api_key}"}
            resp = requests.get(f"{base}/models", headers=headers, timeout=10)
            if resp.status_code == 200:
                return {"success": True, "message": "Whisper (OpenAI) Connected \u2713 — key valid", "detail": f"Model {s.stt_model or s.whisper_model} ready"}
            else:
                return {"success": False, "message": f"OpenAI error {resp.status_code}", "detail": resp.text[:500]}
        else:
            # generic
            headers = {"Authorization": f"Bearer {api_key}"}
            resp = requests.get(f"{base.rstrip('/')}/models", headers=headers, timeout=10)
            return {"success": resp.status_code==200, "message": "STT endpoint check", "detail": resp.text[:500]}
    except Exception as e:
        return {"success": False, "message": f"Whisper test fail: {str(e)[:200]}", "detail": str(e)[:500]}

@router.post("/test/claude", response_model=schemas.ConnectionTestOut)
def test_claude(db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    s = get_settings(db)
    # legacy: try anthropic first, then generic
    if s.anthropic_api_key:
        try:
            import requests
            headers = {"x-api-key": s.anthropic_api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
            body = {"model": s.claude_model, "max_tokens": 20, "messages": [{"role": "user", "content": "Say ok"}]}
            resp = requests.post("https://api.anthropic.com/v1/messages", json=body, headers=headers, timeout=10)
            if resp.status_code == 200:
                return {"success": True, "message": "Claude Connected \u2713 — key valid", "detail": f"Model {s.claude_model} ready"}
            else:
                return {"success": False, "message": f"Claude error {resp.status_code}", "detail": resp.text[:500]}
        except Exception as e:
            return {"success": False, "message": f"Claude test fail: {str(e)[:200]}", "detail": str(e)[:500]}
    # try generic AI
    return test_ai(db, _)

@router.post("/test/ai", response_model=schemas.ConnectionTestOut)
def test_ai(db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    s = get_settings(db)
    provider = getattr(s, 'ai_provider', 'local')
    if provider == "local":
        return {"success": True, "message": "Local parser \u2713 — bina AI ke Hinglish/Hindi/English basic parse chalega, AI se accuracy badhega", "detail": "Groq/OpenAI/OpenRouter ke liye Base URL + Key + Model set karein"}
    api_key = getattr(s, 'ai_api_key', '') or s.openai_api_key or s.anthropic_api_key
    base_url = getattr(s, 'ai_base_url', '') or ""
    model = getattr(s, 'ai_model', '') or "gpt-4o-mini"
    if not api_key and provider not in ("ollama",):
        return {"success": False, "message": "AI key khali hai", "detail": "Base URL + Key + Model set karein ya local par rakhein"}
    try:
        import requests, json, re
        # Try OpenAI-compatible chat
        if provider == "anthropic" or "anthropic" in (base_url or ""):
            headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
            body = {"model": model, "max_tokens": 20, "messages": [{"role": "user", "content": "Say ok in JSON {\"ok\": true}"}]}
            url = (base_url or "https://api.anthropic.com") + "/v1/messages"
            resp = requests.post(url, json=body, headers=headers, timeout=15)
            if resp.status_code == 200:
                return {"success": True, "message": f"AI Connected \u2713 ({provider} — {model})", "detail": resp.text[:300]}
            else:
                return {"success": False, "message": f"AI error {resp.status_code}", "detail": resp.text[:500]}
        else:
            # OpenAI-compatible
            if not base_url:
                if provider == "groq":
                    base_url = "https://api.groq.com/openai/v1"
                elif provider == "openrouter":
                    base_url = "https://openrouter.ai/api/v1"
                else:
                    base_url = "https://api.openai.com/v1"
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            body = {"model": model, "messages": [{"role": "user", "content": "Return JSON {\"ok\": true}"}], "max_tokens": 20}
            url = base_url.rstrip("/") + "/chat/completions"
            resp = requests.post(url, json=body, headers=headers, timeout=15)
            if resp.status_code == 200:
                return {"success": True, "message": f"AI Connected \u2713 ({provider} — {model})", "detail": f"Base {base_url}"}
            else:
                return {"success": False, "message": f"AI error {resp.status_code}", "detail": resp.text[:500]}
    except Exception as e:
        return {"success": False, "message": f"AI test fail: {str(e)[:200]}", "detail": str(e)[:500]}

@router.post("/test/whatsapp", response_model=schemas.ConnectionTestOut)
def test_whatsapp(db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    s = get_settings(db)
    provider = getattr(s, 'whatsapp_provider', 'wa_me')
    if provider in ("wa_me", "disabled"):
        return {"success": True, "message": "WhatsApp wa.me link \u2713 — free, click se WhatsApp khulta hai (auto-send nahi)", "detail": "Auto-send ke liye Twilio/Interakt/custom API set karein — Base URL + Key + Phone ID"}
    base = getattr(s, 'whatsapp_base_url', '')
    key = getattr(s, 'whatsapp_api_key', '')
    if not base or not key:
        return {"success": False, "message": "WhatsApp Base URL / Key khali hai", "detail": "Provider ke dashboard se URL + Token leke save karein"}
    try:
        import requests
        # Simple health check — try GET base
        headers = {"Authorization": f"Bearer {key}"}
        resp = requests.get(base, headers=headers, timeout=10)
        return {"success": resp.status_code < 500, "message": f"WhatsApp endpoint reachable ({resp.status_code})", "detail": resp.text[:500]}
    except Exception as e:
        return {"success": False, "message": f"WhatsApp test fail: {str(e)[:200]}", "detail": str(e)[:500]}

@router.post("/test/otp", response_model=schemas.ConnectionTestOut)
def test_otp(db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    s = get_settings(db)
    provider = getattr(s, 'otp_provider', 'dev')
    if provider == "dev":
        return {"success": True, "message": "OTP Dev mode \u2713 — hamesha 1234, SMS free, test ke liye best", "detail": "Production me MSG91/Twilio/Custom set karein"}
    base = getattr(s, 'otp_base_url', '')
    key = getattr(s, 'otp_api_key', '')
    if not base or not key:
        return {"success": False, "message": "OTP Base URL / Key khali", "detail": "Provider ke docs se URL + Key leke save karein"}
    try:
        import requests
        headers = {"Authorization": f"Bearer {key}"}
        resp = requests.get(base, headers=headers, timeout=10)
        return {"success": resp.status_code < 500, "message": f"OTP endpoint reachable ({resp.status_code})", "detail": resp.text[:500]}
    except Exception as e:
        return {"success": False, "message": f"OTP test fail: {str(e)[:200]}", "detail": str(e)[:500]}

@router.post("/test/razorpay-custom", response_model=schemas.ConnectionTestOut)
def test_razorpay_custom(payload: schemas.BillingTestIn, db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    from ..services.razorpay_service import create_razorpay_order
    try:
        order = create_razorpay_order(payload.key_id, payload.key_secret, 100, "INR", "test_custom")
        return {"success": True, "message": f"Keys valid \u2713 — order {order.get('id')}", "detail": "Test paise nahi katenge, sirf order banega"}
    except Exception as e:
        return {"success": False, "message": f"Invalid keys: {str(e)[:200]}", "detail": str(e)[:500]}

@router.post("/reset", response_model=dict)
def reset_all_data(payload: schemas.ResetConfirm, db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    if payload.confirm != "RESET":
        raise HTTPException(status_code=400, detail="Confirm ke liye RESET likhein")
    # Delete in order due to FK - KEEP demo shops (phone 9876543210 + 9998887771-74) so demo login always works
    try:
        # Delete non-demo shops and their related data (cascade will handle, but we do explicit for safety)
        db.execute(text("DELETE FROM reminders WHERE customer_id IN (SELECT id FROM customers WHERE shop_id IN (SELECT id FROM shops WHERE phone NOT IN ('9876543210','9998887771','9998887772','9998887773','9998887774')))"))
        db.execute(text("DELETE FROM entries WHERE shop_id IN (SELECT id FROM shops WHERE phone NOT IN ('9876543210','9998887771','9998887772','9998887773','9998887774'))"))
        db.execute(text("DELETE FROM customers WHERE shop_id IN (SELECT id FROM shops WHERE phone NOT IN ('9876543210','9998887771','9998887772','9998887773','9998887774'))"))
        db.execute(text("DELETE FROM subscriptions WHERE shop_id IN (SELECT id FROM shops WHERE phone NOT IN ('9876543210','9998887771','9998887772','9998887773','9998887774'))"))
        db.execute(text("DELETE FROM shops WHERE phone NOT IN ('9876543210','9998887771','9998887772','9998887773','9998887774')"))
        db.commit()
        # Ensure demo shops exist - if someone deleted demo manually, re-seed
        remaining = db.execute(text("SELECT COUNT(*) FROM shops")).scalar()
        if remaining == 0:
            db.commit()
            # import here to avoid circular
            from ..main import seed_demo_data
            seed_demo_data()
            return {"success": True, "message": "Reset ho gaya ✓ — user shops deleted, demo shops (9876543210) safe hain, demo re-created."}
        return {"success": True, "message": "Reset ho gaya ✓ — user ka data deleted, demo dukaan (9876543210) safe hai. Settings safe hai."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
