import json
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..security import get_current_shop

router = APIRouter(prefix="/api/cash", tags=["cash"])

DENOMS = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1]

def _calc_total(denoms: dict) -> float:
    total = 0
    for k, v in denoms.items():
        try:
            d = int(k); c = int(v)
            total += d * c
        except: pass
    return float(total)

@router.get("/today")
def get_today(shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    today = date.today()
    row = db.query(models.CashDay).filter(models.CashDay.shop_id==shop.id, models.CashDay.date==today).first()
    if not row:
        # auto calc from today's entries
        from sqlalchemy import func
        # entries today
        start = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
        entries = db.query(models.Entry).filter(models.Entry.shop_id==shop.id, models.Entry.created_at >= start).all()
        given = sum(e.amount for e in entries if e.type=='credit_given')
        received = sum(e.amount for e in entries if e.type=='payment_received')
        return {
            "date": today.isoformat(),
            "denominations": {},
            "total_cash": 0,
            "udhaar_given": given,
            "payment_received": received,
            "expected_cash": received - given,
            "diff": 0,
            "note": ""
        }
    return {
        "date": row.date.isoformat(),
        "denominations": json.loads(row.denominations) if row.denominations else {},
        "total_cash": row.total_cash,
        "udhaar_given": row.udhaar_given,
        "payment_received": row.payment_received,
        "expected_cash": row.expected_cash,
        "diff": row.diff,
        "note": row.note or ""
    }

@router.post("/today")
def save_today(payload: dict, shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    today = date.today()
    denoms = payload.get("denominations") or {}
    # sanitize
    clean = {}
    for k, v in denoms.items():
        try:
            dk = str(int(k)); cv = int(v)
            if cv < 0: cv = 0
            if int(dk) in DENOMS:
                clean[dk] = cv
        except: pass
    total = _calc_total(clean)
    # calc entries today
    start = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
    entries = db.query(models.Entry).filter(models.Entry.shop_id==shop.id, models.Entry.created_at >= start).all()
    given = sum(e.amount for e in entries if e.type=='credit_given')
    received = sum(e.amount for e in entries if e.type=='payment_received')
    # For cash business, expected_cash is more complex: opening + received - given
    # For now simple: received (cash in) - but keep given for info
    expected = payload.get("expected_cash")
    if expected is None:
        expected = received  # cash in from customers today
    diff = total - float(expected) if expected else total
    note = payload.get("note") or ""

    row = db.query(models.CashDay).filter(models.CashDay.shop_id==shop.id, models.CashDay.date==today).first()
    if row:
        row.denominations = json.dumps(clean)
        row.total_cash = total
        row.udhaar_given = given
        row.payment_received = received
        row.expected_cash = float(expected)
        row.diff = diff
        row.note = note
    else:
        row = models.CashDay(
            shop_id=shop.id, date=today,
            denominations=json.dumps(clean),
            total_cash=total, udhaar_given=given, payment_received=received,
            expected_cash=float(expected), diff=diff, note=note
        )
        db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "date": row.date.isoformat(),
        "denominations": clean,
        "total_cash": row.total_cash,
        "udhaar_given": row.udhaar_given,
        "payment_received": row.payment_received,
        "expected_cash": row.expected_cash,
        "diff": row.diff,
        "note": row.note
    }

@router.get("/history")
def history(limit: int = 30, shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    rows = db.query(models.CashDay).filter(models.CashDay.shop_id==shop.id).order_by(models.CashDay.date.desc()).limit(limit).all()
    out = []
    for r in rows:
        out.append({
            "date": r.date.isoformat(),
            "denominations": json.loads(r.denominations) if r.denominations else {},
            "total_cash": r.total_cash,
            "udhaar_given": r.udhaar_given,
            "payment_received": r.payment_received,
            "expected_cash": r.expected_cash,
            "diff": r.diff,
            "note": r.note
        })
    return out

@router.post("/sync")
def sync_offline(payload: dict, shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    # For offline queue: payload is same as POST today but with date field
    date_str = payload.get("date")
    try:
        d = date.fromisoformat(date_str) if date_str else date.today()
    except: d = date.today()
    denoms = payload.get("denominations") or {}
    clean = {}
    for k, v in denoms.items():
        try:
            dk = str(int(k)); cv = int(v)
            if int(dk) in DENOMS: clean[dk]=cv
        except: pass
    total = _calc_total(clean)
    row = db.query(models.CashDay).filter(models.CashDay.shop_id==shop.id, models.CashDay.date==d).first()
    if row:
        row.denominations = json.dumps(clean)
        row.total_cash = total
        row.note = payload.get("note") or row.note
    else:
        row = models.CashDay(shop_id=shop.id, date=d, denominations=json.dumps(clean), total_cash=total, note=payload.get("note") or "")
        db.add(row)
    db.commit()
    return {"ok": True, "date": d.isoformat(), "total": total}
