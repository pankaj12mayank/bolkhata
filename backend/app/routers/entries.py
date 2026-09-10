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

    # Effective limit - Free / Standard / Paid
    if shop.plan_tier == "Free":
        limit = ps.free_entries_limit
        if shop.entries_used_this_month >= limit:
            raise HTTPException(status_code=402, detail="Free plan ki entries poori ho gayi — upgrade karein")
    elif shop.plan_tier == "Standard":
        std_limit = getattr(ps, 'standard_entries_limit', 500) or 500
        if shop.entries_used_this_month >= std_limit:
            raise HTTPException(status_code=402, detail="Standard plan limit khatam — Paid me upgrade karein")
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

    # --- Customer resolve: handles multiple Ramesh + phone_hint + customer_id ---
    customer = None
    is_new = False
    # If caller already disambiguated via customer_id, use it directly
    if getattr(payload, 'customer_id', None):
        customer = db.query(models.Customer).filter(models.Customer.shop_id==shop.id, models.Customer.id==payload.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Selected grahak nahi mila - dobara choose karein")
    else:
        # Try exact match first (case-insensitive)
        exact = db.query(models.Customer).filter(models.Customer.shop_id == shop.id, func.lower(models.Customer.name) == name_clean.lower()).first()
        if exact:
            customer = exact
        else:
            # No exact - search partial candidates for disambiguation
            # e.g. "Ramesh" -> matches "Ramesh Kumar", "Ramesh Tailor"
            like_pattern = f"%{name_clean.lower()}%"
            candidates = db.query(models.Customer).filter(
                models.Customer.shop_id == shop.id,
                func.lower(models.Customer.name).like(like_pattern)
            ).all()
            # Phone hint filtering if provided (e.g. "98" -> phone contains 98)
            phone_hint = getattr(payload, 'phone_hint', None)
            if phone_hint and candidates:
                filtered = [c for c in candidates if phone_hint in (c.phone or "")]
                if filtered:
                    candidates = filtered
            if len(candidates) > 1:
                # Ambiguous - return 409 with candidate list, do NOT create
                cand_out = [{"id": c.id, "name": c.name, "phone": c.phone or "", "balance": c.balance} for c in candidates[:5]]
                raise HTTPException(status_code=409, detail={"message": f"'{name_clean}' naam se {len(candidates)} grahak mile - kaunsa wala?", "candidates": cand_out})
            elif len(candidates) == 1:
                customer = candidates[0]
            else:
                # No candidate - will create new below
                pass
    if not customer:
        is_new = True
        customer = models.Customer(shop_id=shop.id, name=name_clean, phone="", balance=0)
        db.add(customer)
        db.flush()

    if not is_failed:
        delta = payload.amount if payload.type == "credit_given" else -payload.amount
        # Overpay guard: warn but allow negative? Keep balance can go negative but clamp huge
        new_balance = customer.balance + delta
        # Optional warning if overpay > 5000 negative? we just allow but log
        customer.balance = new_balance

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
