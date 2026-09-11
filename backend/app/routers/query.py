from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from typing import Optional

from ..database import get_db
from .. import models, schemas
from ..security import get_current_shop

router = APIRouter(prefix="/api/voice", tags=["voice"])

IST_OFFSET = timedelta(hours=5, minutes=30)


def _ist(dt):
    if dt is None:
        return None
    if dt.tzinfo is None or dt.utcoffset() is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt + IST_OFFSET


def _when(dt):
    """'aaj 11 Sep ko 3:24pm' ya '2 din pehle (9 Sep) ko 5:10pm'"""
    ist = _ist(dt)
    if ist is None:
        return "kab ka"
    now = datetime.now(timezone.utc) + IST_OFFSET
    days = (now.date() - ist.date()).days
    if days < 0:
        days = 0
    tstr = ist.strftime("%I:%M").lstrip("0") + ist.strftime("%p").lower()
    dstr = ist.strftime("%d %b")
    if days == 0:
        return f"aaj {dstr} ko {tstr}"
    if days == 1:
        return f"kal {dstr} ko {tstr}"
    return f"{days} din pehle ({dstr}) ko {tstr}"


def _today():
    return (datetime.now(timezone.utc) + IST_OFFSET).strftime("%d %b %Y")


def _entry_phrase(cust_name, amount, etype):
    if etype == "credit_given":
        return f"{cust_name} ko Rs {amount:,.0f} udhaar diya"
    return f"{cust_name} se Rs {amount:,.0f} payment mila"


def _shop_totals(shop, db):
    total_given = db.query(func.sum(models.Entry.amount)).filter(
        models.Entry.shop_id == shop.id, models.Entry.type == 'credit_given'
    ).scalar() or 0
    total_received = db.query(func.sum(models.Entry.amount)).filter(
        models.Entry.shop_id == shop.id, models.Entry.type == 'payment_received'
    ).scalar() or 0
    total_balance = db.query(func.sum(models.Customer.balance)).filter(
        models.Customer.shop_id == shop.id
    ).scalar() or 0
    entry_count = db.query(models.Entry).filter(models.Entry.shop_id == shop.id).count()
    cust_count = db.query(models.Customer).filter(models.Customer.shop_id == shop.id).count()
    return total_given, total_received, total_balance, entry_count, cust_count


@router.post("/query", response_model=schemas.VoiceQueryOut)
def voice_query(
    payload: schemas.VoiceQueryIn,
    shop: models.Shop = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Query khali hai")

    lang = payload.language or "Hinglish"
    answer = _process_query(text, shop, db)
    return {"answer": answer, "type": "text"}


def _process_query(text: str, shop: models.Shop, db: Session) -> str:
    t = text.lower().strip()

    # --- Total / Sum queries ---
    if any(kw in t for kw in ['total', 'kitna hua', 'kitna bacha', 'kamaata', 'kamat', 'kharche', 'kharab', 'total income', 'total expense', 'kharida', 'debit', 'credit', 'deduction']):
        return _handle_total(shop, db)

    # --- Customer count ---
    if any(kw in t for kw in ['kitne user', 'kitne customer', 'kitne guest', 'customer kitne', 'user kitne', 'customers', 'total customer', 'how many', 'kitne']):
        return _handle_customer_count(shop, db)

    # --- User / Customer details ---
    if any(kw in t for kw in ['user ka detail', 'customer ka detail', 'customer detail', 'user detail', 'customer info', 'user info', 'user ka naam', 'customer ka naam', 'kaunse customer', 'kaunse user', 'customer list', 'user list', 'customers list', 'users list', 'sabka detail', 'sabka naam']):
        return _handle_customer_list(shop, db)

    # --- Specific customer query ---
    if any(kw in t for kw in ['ka balance', 'ka udhaar', 'ka kharab', 'kitna bacha', 'ka kamaata', 'ka kharida']):
        return _handle_specific_customer(t, shop, db)

    # --- Balance query ---
    if any(kw in t for kw in ['balance', 'baki', 'baccha', 'remain', 'bachega', 'mera balance']):
        return _handle_balance(shop, db)

    # --- Total sales/revenue ---
    if any(kw in t for kw in ['sales', 'revenue', 'income', 'gross']):
        return _handle_revenue(shop, db)

    # --- Entry / hisaab / deduction detail (date, din, samay ke saath) ---
    if any(kw in t for kw in ['entry', 'entries', 'entry count', 'kitne entry', 'transactions', 'kitne record', 'saare record', 'hisaab', 'hisab', 'kharab', 'kharch', 'kaam', 'log']):
        return _handle_entry_detail(shop, db)

    # --- Greeting ---
    if any(kw in t for kw in ['hello', 'hi', 'namaste', 'hii', 'salam', 'good morning', 'good evening']):
        shop_name = shop.shop_name or 'Dukaandaar'
        return f"Namaste {shop_name}! Main BolKhata hun. Tum koi bhi sawaal poochho — Total, Balance, Hisaab, Entry — date aur time ke saath pura data bata dunga!"

    # --- Help ---
    if any(kw in t for kw in ['help', 'help me', 'kaunse sawal', 'pooch sakte ho', 'kya pooch sakte']):
        return "Bol sakte ho: 'Total kitna hua', 'Kitne user hain', 'User ka detail', 'Balance batao', 'Hisaab batao', 'Entry ka detail'. Ye sab date aur time ke saath mil jayega!"

    # --- Default: full shop summary (koi bhi sawaal → pura data) ---
    return _handle_full_summary(shop, db)


def _handle_full_summary(shop: models.Shop, db: Session) -> str:
    total_given, total_received, total_balance, entry_count, count = _shop_totals(shop, db)
    customers = db.query(models.Customer).filter(models.Customer.shop_id == shop.id).all()
    detail = "Customers: " + (", ".join(f"{c.name} Rs {c.balance:,.0f}" for c in customers[:8]) if customers else "koi nahi")
    if len(customers) > 8:
        detail += f" aur {len(customers) - 8} aur."

    recent = db.query(models.Entry).filter(models.Entry.shop_id == shop.id).order_by(models.Entry.created_at.desc()).limit(3).all()
    recent_s = ""
    if recent:
        parts = []
        for e in recent:
            ename = e.customer.name if e.customer else ("'" + (e.raw_voice_text or "") + "'")
            if e.parse_status == "failed":
                parts.append(f"'{e.raw_voice_text}' samajh nahi aaya ({_when(e.created_at)})")
            else:
                parts.append(f"{_entry_phrase(ename, e.amount, e.type)} — {_when(e.created_at)}")
        recent_s = " Recent: " + ". ".join(parts) + "."

    return (f"Yeh raha tumhare shop ka pura data ({_today()}): total {count} customer, "
            f"sabka total balance Rs {total_balance:,.0f}. Total udhaar diya Rs {total_given:,.0f}, "
            f"total payment mila Rs {total_received:,.0f}. Total {entry_count} entries.{detail}{recent_s}")


def _handle_total(shop: models.Shop, db: Session) -> str:
    total_given, total_received, total_balance, _, _ = _shop_totals(shop, db)
    return f"Aaj {_today()}: total udhaar diya Rs {total_given:,.0f}. Total payment mila Rs {total_received:,.0f}. Sabka total balance (jama hua) Rs {total_balance:,.0f}." 


def _handle_customer_count(shop: models.Shop, db: Session) -> str:
    count = db.query(models.Customer).filter(models.Customer.shop_id == shop.id).count()
    return f"Tumhare shop mein total {count} customer hain."


def _handle_customer_list(shop: models.Shop, db: Session) -> str:
    customers = db.query(models.Customer).filter(models.Customer.shop_id == shop.id).all()
    if not customers:
        return "Tumhare shop mein koi customer nahi hai abhi."
    result = f"Tumhare {len(customers)} customer hain: "
    names = [f"{c.name} — balance Rs {c.balance:,.0f}" for c in customers]
    result += ". ".join(names) + "."
    return result


def _handle_specific_customer(text: str, shop: models.Shop, db: Session) -> str:
    parts = text.split()
    for i, word in enumerate(parts):
        if word in ['ka', 'ke', 'ki', 'ka']:
            name = ' '.join(parts[:i]) if i > 0 else ''
            if name:
                customer = db.query(models.Customer).filter(
                    models.Customer.shop_id == shop.id,
                    func.lower(models.Customer.name).like(f'%{name.lower()}%')
                ).first()
                if customer:
                    last = db.query(models.Entry).filter(
                        models.Entry.customer_id == customer.id
                    ).order_by(models.Entry.created_at.desc()).first()
                    extra = ""
                    if last and last.parse_status != "failed":
                        extra = f" Latest: {_entry_phrase(customer.name, last.amount, last.type)} — {_when(last.created_at)}."
                    return f"{customer.name} ka balance Rs {customer.balance:,.0f} hai.{extra}"
            break
    return "Customer nahi mila. Naam seedhi bolo jaise 'Ramesh ka balance'."


def _handle_balance(shop: models.Shop, db: Session) -> str:
    total = db.query(func.sum(models.Customer.balance)).filter(
        models.Customer.shop_id == shop.id
    ).scalar() or 0
    return f"Aaj {_today()} ko tumhare sabka total balance Rs {total:,.0f} rahega." 


def _handle_revenue(shop: models.Shop, db: Session) -> str:
    total_given, total_received, _, entry_count, _ = _shop_totals(shop, db)
    return f"Aaj {_today()} tak: udhaar diya Rs {total_given:,.0f}. Wapas/payment mila Rs {total_received:,.0f}. Total {entry_count} entries."


def _handle_entry_detail(shop: models.Shop, db: Session) -> str:
    entry_count = db.query(models.Entry).filter(models.Entry.shop_id == shop.id).count()
    entries = db.query(models.Entry).filter(
        models.Entry.shop_id == shop.id
    ).order_by(models.Entry.created_at.desc()).limit(6).all()
    if entry_count == 0:
        return "Abhi tak koi entry nahi hai."
    lines = [f"Total {entry_count} entries, recent hisaab:"]
    for e in entries:
        ename = e.customer.name if e.customer else "kisi ka"
        if e.parse_status == "failed":
            lines.append(f"'{e.raw_voice_text}' nahi samjha ({_when(e.created_at)})")
        else:
            lines.append(f"{_entry_phrase(ename, e.amount, e.type)} ({_when(e.created_at)})")
    return ". ".join(lines) + "."