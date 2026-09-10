from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..config import settings
from ..security import create_token, otp_store, otp_rate_limit, get_current_payload, _get_otp_db, _set_otp_db, _del_otp_db
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
    import random
    if provider in ("dev", "DEV", ""):
        otp_val = settings.DEV_OTP
    else:
        otp_val = str(random.randint(1000, 9999))

    _set_otp_db(payload.phone, otp_val, now + timedelta(minutes=expiry_min), db)
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
    from ..security import _inc_attempt_db
    record = _get_otp_db(payload.phone, db)
    now = datetime.now(timezone.utc)
    if not record or record["expires"] < now:
        raise HTTPException(status_code=400, detail="OTP galat ya expire ho gaya hai")
    # attempt limit
    if record.get("attempts", 0) >= 5:
        _del_otp_db(payload.phone, db)
        raise HTTPException(status_code=400, detail="Bahut zyada galat OTP — naya OTP mangwayein")
    if record["otp"] != payload.otp:
        _inc_attempt_db(payload.phone, db)
        raise HTTPException(status_code=400, detail="OTP galat ya expire ho gaya hai")
    # Success — delete OTP to prevent reuse
    _del_otp_db(payload.phone, db)

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
def admin_login(payload: schemas.AdminLoginIn, db: Session = Depends(get_db)):
    ps = get_settings(db)
    admin_email = (getattr(ps, 'admin_email', '') or '').strip() or settings.ADMIN_EMAIL
    admin_password_hash = getattr(ps, 'admin_password_hash', '') or ''
    if str(payload.email).strip().lower() != str(admin_email).strip().lower():
        raise HTTPException(status_code=401, detail="Email ya password galat hai")
    if admin_password_hash:
        from ..security import verify_password
        pw_ok = verify_password(payload.password, admin_password_hash)
    else:
        pw_ok = payload.password == settings.ADMIN_PASSWORD
    if not pw_ok:
        raise HTTPException(status_code=401, detail="Email ya password galat hai")
    token = create_token(sub="admin", role="admin")
    return {"token": token, "role": "admin"}


@router.get("/me")
def me(payload: dict = Depends(get_current_payload), db: Session = Depends(get_db)):
    if payload["role"] == "admin":
        ps = get_settings(db)
        name = (getattr(ps, 'admin_name', '') or '').strip() or "Admin"
        email = (getattr(ps, 'admin_email', '') or '').strip() or settings.ADMIN_EMAIL
        return {"role": "admin", "name": name, "email": email, "org": "BolKhata HQ"}
    shop = db.query(models.Shop).filter(models.Shop.id == int(payload["sub"])).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop nahi mili")
    return {"role": "user", "shop": schemas.ShopOut.model_validate(shop)}
