from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from . import models

import hashlib, hmac

bearer_scheme = HTTPBearer(auto_error=False)

def hash_password(pw: str) -> str:
    return hmac.new(settings.JWT_SECRET.encode("utf-8"), pw.encode("utf-8"), hashlib.sha256).hexdigest()

def verify_password(pw: str, digest: str) -> bool:
    if not digest:
        return False
    return hmac.compare_digest(hash_password(pw), digest)

# in-memory OTP store fallback + DB persist (Phase 1.2: OTP now DB)
# Keeps backward compat: if DB table missing, falls back to memory
otp_store: dict[str, dict] = {}
# rate limit tracker: { phone: [timestamps]}
otp_rate_limit: dict[str, list] = {}

def _get_otp_db(phone: str, db: Session):
    try:
        row = db.query(models.OtpStore).filter(models.OtpStore.phone == phone).first()
        if row:
            # ensure timezone aware
            exp = row.expires_at
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            return {"otp": row.otp, "expires": exp, "attempts": row.attempts, "_db": True}
    except Exception:
        pass
    return otp_store.get(phone)

def _set_otp_db(phone: str, otp: str, expires, db: Session = None):
    # try DB, fallback mem
    try:
        if db is not None:
            row = db.query(models.OtpStore).filter(models.OtpStore.phone == phone).first()
            if row:
                row.otp = otp; row.expires_at = expires; row.attempts = 0
            else:
                db.add(models.OtpStore(phone=phone, otp=otp, expires_at=expires, attempts=0))
            db.commit()
            return
    except Exception as e:
        print(f"otp db set fail {e}")
    otp_store[phone] = {"otp": otp, "expires": expires, "attempts": 0}

def _inc_attempt_db(phone: str, db: Session = None):
    try:
        if db is not None:
            row = db.query(models.OtpStore).filter(models.OtpStore.phone == phone).first()
            if row:
                row.attempts = (row.attempts or 0) + 1
                db.commit()
                return row.attempts
    except: pass
    if phone in otp_store:
        otp_store[phone]["attempts"] = otp_store[phone].get("attempts",0)+1
        return otp_store[phone]["attempts"]
    return 0

def _del_otp_db(phone: str, db: Session = None):
    try:
        if db is not None:
            db.query(models.OtpStore).filter(models.OtpStore.phone == phone).delete()
            db.commit()
    except: pass
    otp_store.pop(phone, None)
    otp_rate_limit.pop(phone, None)


def create_token(sub: str, role: str) -> str:
    # Try to use DB settings for expiry if available, else env
    try:
        from .database import SessionLocal
        from .services.settings_service import get_settings
        db = SessionLocal()
        try:
            ps = get_settings(db)
            minutes = ps.jwt_expire_minutes
        finally:
            db.close()
    except:
        minutes = settings.JWT_EXPIRE_MINUTES
    expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    payload = {"sub": sub, "role": role, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Session expired ya invalid hai. Dobara login karein.")


def get_current_payload(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> dict:
    if creds is None:
        raise HTTPException(status_code=401, detail="Login zaroori hai.")
    return decode_token(creds.credentials)


def get_current_shop(
    payload: dict = Depends(get_current_payload),
    db: Session = Depends(get_db),
) -> models.Shop:
    if payload.get("role") != "user":
        raise HTTPException(status_code=403, detail="Ye sirf Dukaandaar ke liye hai.")
    shop = db.query(models.Shop).filter(models.Shop.id == int(payload["sub"])).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop nahi mili.")
    return shop


def get_current_admin(payload: dict = Depends(get_current_payload)) -> str:
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Ye sirf Admin ke liye hai.")
    return payload["sub"]
