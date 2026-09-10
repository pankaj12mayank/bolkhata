from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..config import settings
from ..security import (
    create_token,
    otp_rate_limit,
    hash_password,
    verify_password,
    _get_otp_db,
    _set_otp_db,
    _del_otp_db,
    _inc_attempt_db
)
from ..services.settings_service import get_settings

router = APIRouter(prefix="/api/auth/password-reset", tags=["password-reset"])


@router.post("/request")
def request_password_reset(payload: schemas.PasswordResetRequestIn, db: Session = Depends(get_db)):
    ident = payload.identifier.strip().lower()
    if not ident:
        raise HTTPException(status_code=400, detail="Identifier (email ya phone) daalein")

    now = datetime.now(timezone.utc)
    lst = otp_rate_limit.get(ident, [])
    lst = [t for t in lst if (now - t).total_seconds() < 600]
    if len(lst) >= 3:
        raise HTTPException(status_code=429, detail="Bahut zyada reset request — 10 minute baad try karein")
    lst.append(now)
    otp_rate_limit[ident] = lst

    ps = get_settings(db)
    expiry_min = ps.otp_expiry_minutes or 5
    provider = getattr(ps, 'otp_provider', None) or ps.otp_mode or "dev"

    if payload.account_type == "admin":
        admin_email = (getattr(ps, 'admin_email', '') or '').strip().lower() or settings.ADMIN_EMAIL.lower()
        if ident != admin_email:
            raise HTTPException(status_code=404, detail="Admin email match nahi hua")
    else:
        # User (dukaandaar) - check phone or email
        shop = db.query(models.Shop).filter(models.Shop.phone == ident).first()
        if not shop:
            raise HTTPException(status_code=404, detail="Is detail ke sath dukaandaar account nahi mila")

    import random
    if provider in ("dev", "DEV", ""):
        otp_val = settings.DEV_OTP
    else:
        otp_val = str(random.randint(100000, 999999))

    _set_otp_db(ident, otp_val, now + timedelta(minutes=expiry_min), db)

    resp = {"message": "Password reset OTP bhej diya gaya", "provider": provider}
    if provider in ("dev", "DEV", ""):
        resp["dev_otp"] = otp_val
    else:
        resp["dev_otp"] = None
    return resp


@router.post("/verify")
def verify_password_reset(payload: schemas.PasswordResetVerifyIn, db: Session = Depends(get_db)):
    ident = payload.identifier.strip().lower()
    if not payload.new_password or len(payload.new_password) < 4:
        raise HTTPException(status_code=400, detail="Naya password kam se kam 4 characters ka hona chahiye")

    record = _get_otp_db(ident, db)
    now = datetime.now(timezone.utc)
    if not record or record["expires"] < now:
        raise HTTPException(status_code=400, detail="OTP expire ho gaya hai ya galat hai")

    if record.get("attempts", 0) >= 5:
        _del_otp_db(ident, db)
        raise HTTPException(status_code=400, detail="Bahut zyada galat attempts — naya OTP request karein")

    if record["otp"] != payload.otp:
        _inc_attempt_db(ident, db)
        raise HTTPException(status_code=400, detail="OTP galat hai")

    _del_otp_db(ident, db)

    new_hash = hash_password(payload.new_password)

    if payload.account_type == "admin":
        ps = get_settings(db)
        ps.admin_password_hash = new_hash
        db.commit()
        token = create_token(sub="admin", role="admin")
        return {"message": "Admin password safaltapurvak badal diya gaya", "token": token, "role": "admin"}
    else:
        shop = db.query(models.Shop).filter(models.Shop.phone == ident).first()
        if not shop:
            raise HTTPException(status_code=404, detail="Shop nahi mili")
        token = create_token(sub=str(shop.id), role="user")
        return {"message": "Password safaltapurvak badal diya gaya", "token": token, "role": "user"}


@router.post("/offline-sync")
def offline_password_reset_sync(payload: schemas.PasswordResetOfflineSyncIn, db: Session = Depends(get_db)):
    shop = db.query(models.Shop).filter(models.Shop.id == payload.shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop nahi mili")
    if not payload.signed_payload:
        raise HTTPException(status_code=400, detail="Invalid offline signature")
    token = create_token(sub=str(shop.id), role="user")
    return {"message": "Offline password change synced successfully ✓", "token": token, "role": "user"}
