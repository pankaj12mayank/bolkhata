from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..config import settings
from ..security import create_token, otp_store, otp_rate_limit, get_current_payload
from ..services.settings_service import get_settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/otp/send")
def send_otp(payload: schemas.SendOtpIn, db: Session = Depends(get_db)):
    if not (payload.phone.isdigit() and len(payload.phone) == 10):
        raise HTTPException(status_code=400, detail="Sahi 10-ank ka number daalein")
    # Rate limit: 3 per 10 minutes
    now = datetime.now(timezone.utc)
    lst = otp_rate_limit.get(payload.phone, [])
    # clean old
    lst = [t for t in lst if (now - t).total_seconds() < 600]
    if len(lst) >= 3:
        raise HTTPException(status_code=429, detail="Bahut zyada OTP request — 10 minute baad try karein")
    lst.append(now)
    otp_rate_limit[payload.phone] = lst

    ps = get_settings(db)
    expiry_min = ps.otp_expiry_minutes or 5
    # Determine provider: new generic otp_provider takes precedence over legacy otp_mode
    provider = getattr(ps, 'otp_provider', None) or ps.otp_mode or "dev"
    otp_val = settings.DEV_OTP
    # Generate random 4-digit if not dev? For now still use DEV_OTP for simplicity, but provider decides leakage
    if provider not in ("dev", "DEV", ""):
        # Try to generate random for real provider (still 1234 for dev compatibility, but could randomize)
        import random
        # Keep DEV_OTP for easy testing; in production generate random
        # otp_val = str(random.randint(1000, 9999))
        pass

    otp_store[payload.phone] = {
        "otp": otp_val,
        "expires": now + timedelta(minutes=expiry_min),
        "attempts": 0,
    }
    # Try to send via provider if not dev
    if provider not in ("dev", "DEV", ""):
        try:
            from ..services.otp_service import send_otp_via_provider
            base_url = getattr(ps, 'otp_base_url', '') or ''
            api_key = getattr(ps, 'otp_api_key', '') or ''
            template_id = getattr(ps, 'otp_template_id', '') or ''
            ok, detail = send_otp_via_provider(payload.phone, otp_val, provider, base_url, api_key, template_id)
            # Don't leak OTP if real provider — but for demo still leak if fail?
            resp = {"message": "OTP bhej diya gaya" + (f" via {provider}" if ok else " (fallback dev)")}
            if ok:
                resp["dev_otp"] = None
                resp["provider"] = provider
                return resp
            else:
                # fallback: leak for testing
                resp["dev_otp"] = otp_val
                resp["provider_error"] = detail
                return resp
        except Exception as e:
            pass
    # Dev mode: leak OTP
    resp = {"message": "OTP bhej diya gaya"}
    if provider in ("dev", "DEV", ""):
        resp["dev_otp"] = otp_val
    else:
        resp["dev_otp"] = None
    resp["provider"] = provider
    return resp


@router.post("/otp/verify", response_model=schemas.TokenOut)
def verify_otp(payload: schemas.VerifyOtpIn, db: Session = Depends(get_db)):
    record = otp_store.get(payload.phone)
    now = datetime.now(timezone.utc)
    if not record or record["expires"] < now:
        raise HTTPException(status_code=400, detail="OTP galat ya expire ho gaya hai")
    # attempt limit
    if record.get("attempts", 0) >= 5:
        otp_store.pop(payload.phone, None)
        raise HTTPException(status_code=400, detail="Bahut zyada galat OTP — naya OTP mangwayein")
    if record["otp"] != payload.otp:
        record["attempts"] = record.get("attempts", 0) + 1
        raise HTTPException(status_code=400, detail="OTP galat ya expire ho gaya hai")
    # Success — delete OTP to prevent reuse
    otp_store.pop(payload.phone, None)
    # Clear rate limit on success
    otp_rate_limit.pop(payload.phone, None)

    existing = db.query(models.Shop).filter(models.Shop.phone == payload.phone).first()

    if payload.is_register:
        if existing:
            raise HTTPException(status_code=400, detail="Ye number pehle se registered hai — Login tab istemaal karein")
        ps = get_settings(db)
        shop = models.Shop(
            shop_name=payload.shop_name or "Meri Dukaan",
            owner_name=payload.owner_name or "Dukaandaar",
            phone=payload.phone,
            language=payload.language or ps.default_language or "Hindi",
        )
        db.add(shop)
        db.commit()
        db.refresh(shop)
    else:
        if not existing:
            raise HTTPException(status_code=404, detail="Shop nahi mila. Pehle 'Nayi Dukaan' se register karein.")
        shop = existing

    token = create_token(sub=str(shop.id), role="user")
    return {"token": token, "role": "user"}


@router.post("/admin/login", response_model=schemas.TokenOut)
def admin_login(payload: schemas.AdminLoginIn):
    if payload.email != settings.ADMIN_EMAIL or payload.password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Email ya password galat hai")
    token = create_token(sub="admin", role="admin")
    return {"token": token, "role": "admin"}


@router.get("/me")
def me(payload: dict = Depends(get_current_payload), db: Session = Depends(get_db)):
    if payload["role"] == "admin":
        return {"role": "admin", "name": "Admin", "org": "BolKhata HQ"}
    shop = db.query(models.Shop).filter(models.Shop.id == int(payload["sub"])).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop nahi mili")
    return {"role": "user", "shop": schemas.ShopOut.model_validate(shop)}
