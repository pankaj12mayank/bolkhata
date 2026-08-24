from datetime import datetime, date, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from .. import models, schemas
from ..security import get_current_shop
from ..services.settings_service import get_settings

router = APIRouter(prefix="/api/entries", tags=["entries"])

def _check_and_reset(shop: models.Shop, db: Session, settings: models.PlatformSettings):
    today = date.today()
    if shop.period_start is None:
        shop.period_start = today
    elif shop.period_start.month != today.month or shop.period_start.year != today.year:
        shop.entries_used_this_month = 0
        shop.period_start = today
        db.commit()
        db.refresh(shop)
    # Sync limit
    if shop.plan_tier == "Free" and shop.entries_limit != settings.free_entries_limit:
        shop.entries_limit = settings.free_entries_limit
        db.commit()


@router.post("", response_model=schemas.EntryResultOut)
def create_entry(payload: schemas.EntryCreateIn, shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    if getattr(shop, 'is_active', 'true') == 'false':
        raise HTTPException(status_code=403, detail="Aapki dukaan Inactive hai — Admin se sampark karein")
    from datetime import timezone as _tz
    ps = get_settings(db)
    _check_and_reset(shop, db, ps)

    # Effective limit
    if shop.plan_tier == "Free":
        limit = ps.free_entries_limit
        if shop.entries_used_this_month >= limit:
            raise HTTPException(status_code=402, detail="Free plan ki entries poori ho gayi — upgrade karein")
    else:
        if ps.paid_entries_limit != -1 and shop.entries_used_this_month >= ps.paid_entries_limit:
            raise HTTPException(status_code=402, detail="Paid plan limit reached — admin se contact karein")

    # Validate amount already via pydantic gt>0, but double-check
    if payload.amount <= 0 or payload.amount > 10000000:
        raise HTTPException(status_code=400, detail="Amount 1 se 1 crore ke beech hona chahiye")

    name_clean = payload.customer_name.strip()
    if not name_clean:
        raise HTTPException(status_code=400, detail="Grahak ka naam zaroori hai")
    if len(name_clean) > 100:
        raise HTTPException(status_code=400, detail="Naam bahut lamba")

    # If parse_status failed, don't mutate balance (audit only)
    is_failed = payload.parse_status == "failed"

    customer = (
        db.query(models.Customer)
        .filter(models.Customer.shop_id == shop.id, func.lower(models.Customer.name) == name_clean.lower())
        .first()
    )
    is_new = False
    if not customer:
        is_new = True
        # Don't use placeholder duplicate phone — use empty
        customer = models.Customer(shop_id=shop.id, name=name_clean, phone="", balance=0)
        db.add(customer)
        db.flush()

    if not is_failed:
        delta = payload.amount if payload.type == "credit_given" else -payload.amount
        customer.balance += delta

    entry = models.Entry(
        shop_id=shop.id, customer_id=customer.id, amount=payload.amount, type=payload.type,
        raw_voice_text=payload.raw_voice_text, source=payload.source, parse_status=payload.parse_status,
    )
    db.add(entry)
    shop.entries_used_this_month += 1
    db.commit()
    db.refresh(entry)
    db.refresh(customer)

    return {"entry": entry, "customer": customer, "is_new_customer": is_new}


@router.get("/today", response_model=list[schemas.HomeEntryOut])
def entries_today(shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    today_start = datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc)
    rows = (
        db.query(models.Entry, models.Customer.name)
        .join(models.Customer, models.Entry.customer_id == models.Customer.id)
        .filter(models.Entry.shop_id == shop.id, models.Entry.created_at >= today_start)
        .order_by(models.Entry.created_at.desc())
        .all()
    )
    return [
        schemas.HomeEntryOut(customer_name=name, amount=e.amount, type=e.type, created_at=e.created_at)
        for e, name in rows
    ]
