from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from . import models

bearer_scheme = HTTPBearer(auto_error=False)

# in-memory OTP store: { phone: {"otp": str, "expires": datetime, "attempts": int} }
otp_store: dict[str, dict] = {}
# rate limit tracker: { phone: [timestamps]}
otp_rate_limit: dict[str, list] = {}


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
