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


def is_english(lang_str: str) -> bool:
    if not lang_str:
        return False
    l = str(lang_str).lower()
    return 'en' in l or 'english' in l


@router.post("/query", response_model=schemas.VoiceQueryOut)
def voice_query(
    payload: schemas.VoiceQueryIn,
    shop: models.Shop = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Query khali hai")

    lang = payload.language or shop.language or "Hindi"
    answer = _process_query(text, shop, db, lang)
    return {"answer": answer, "type": "text"}


def _process_query(text: str, shop: models.Shop, db: Session, lang: str = "Hindi") -> str:
    t = text.lower().strip()
    use_en = is_english(lang)

    # 1. Direct Customer Name Matching (Match any registered customer name)
    customers = db.query(models.Customer).filter(models.Customer.shop_id == shop.id).all()
    for c in customers:
        name_parts = [p.lower() for p in c.name.split() if len(p) >= 2]
        if c.name.lower() in t or any(part in t for part in name_parts):
            last = db.query(models.Entry).filter(
                models.Entry.customer_id == c.id
            ).order_by(models.Entry.created_at.desc()).first()
            
            if use_en:
                extra = f" Latest entry: {c.name} {'credit ' + str(last.amount) if last.type=='credit_given' else 'received ' + str(last.amount)}." if last and last.parse_status != "failed" else ""
                return f"{c.name}'s balance is Rs {c.balance:,.0f}.{extra}"
            else:
                extra = f" हाल ही में: {_entry_phrase(c.name, last.amount, last.type, use_en)}।" if last and last.parse_status != "failed" else ""
                return f"{c.name} का कुल बैलेंस {c.balance:,.0f} रुपये है।{extra}"

    # 2. Total Credit / Udhaar Given queries
    if any(kw in t for kw in ['udhaar', 'credit', 'diya', 'baanta', 'loan', 'given', 'उधार', 'दिया', 'क्रेडिट', 'लोन']):
        total_given = db.query(func.sum(models.Entry.amount)).filter(
            models.Entry.shop_id == shop.id, models.Entry.type == 'credit_given'
        ).scalar() or 0
        if use_en:
            return f"Total credit given across your shop is Rs {total_given:,.0f}."
        return f"आपकी दुकान में कुल उधार दिया गया {total_given:,.0f} रुपये है।"

    # 3. Total Payment Received / Vasooli queries
    if any(kw in t for kw in ['vasool', 'received', 'wapas', 'mila', 'jama', 'payment', 'paid', 'वसूल', 'प्राप्त', 'जमा', 'वापस', 'मिला', 'भुगतान', 'पेमेंट']):
        total_received = db.query(func.sum(models.Entry.amount)).filter(
            models.Entry.shop_id == shop.id, models.Entry.type == 'payment_received'
        ).scalar() or 0
        if use_en:
            return f"Total payment received across your shop is Rs {total_received:,.0f}."
        return f"आपकी दुकान में कुल प्राप्त भुगतान {total_received:,.0f} रुपये है।"

    # 4. Total / Balance / Outstanding queries
    if any(kw in t for kw in ['total', 'balance', 'baki', 'baccha', 'remain', 'due', 'hisab', 'hisaab', 'sum', 'टोटल', 'बैलेंस', 'बाकी', 'बचा', 'हिसाब', 'बकाया', 'कुल']):
        return _handle_total(shop, db, use_en)

    # 5. Customer Count queries
    if any(kw in t for kw in ['kitne user', 'kitne customer', 'customer kitne', 'user kitne', 'customers', 'how many', 'total customer', 'count', 'grahak', 'ग्राहक', 'कस्टमर', 'यूजर']):
        return _handle_customer_count(shop, db, use_en)

    # 6. Customer List / Details queries
    if any(kw in t for kw in ['detail', 'info', 'list', 'naam', 'names', 'who are', 'विवरण', 'लिस्ट', 'नाम', 'जानकारी', 'डिटेल', 'सूची']):
        return _handle_customer_list(shop, db, use_en)

    # 7. Revenue / Sales queries
    if any(kw in t for kw in ['sales', 'revenue', 'income', 'gross', 'kamaai', 'kamai', 'कमाई', 'सेल', 'आय']):
        return _handle_revenue(shop, db, use_en)

    # 8. Entry / History queries
    if any(kw in t for kw in ['entry', 'entries', 'transactions', 'records', 'activity', 'history', 'aaj', 'एंट्री', 'लेनदेन', 'आज', 'इतिहास']):
        return _handle_entry_detail(shop, db, use_en)

    # 9. Greetings
    if any(kw in t for kw in ['hello', 'hi', 'namaste', 'hii', 'salam', 'good morning', 'good evening', 'नमस्ते', 'हेलो', 'प्रणाम']):
        shop_name = shop.shop_name or ('Dukaandaar' if not use_en else 'Shopkeeper')
        if use_en:
            return f"Hello {shop_name}! I am BolKhata. Ask me about your total, balance, customer details, or recent entries."
        return f"नमस्ते {shop_name}! मैं BolKhata हूँ। आप मुझसे अपनी दुकान का कुल हिसाब, बैलेंस, ग्राहक सूची या हाल की एंट्रीज़ पूछ सकते हैं।"

    # 10. Help
    if any(kw in t for kw in ['help', 'kaunse sawal', 'pooch sakte ho', 'what can i ask', 'मदद', 'सहायता', 'कैसे पूछें']):
        if use_en:
            return "You can ask: 'What is my total?', 'How many customers?', 'Customer details', 'What is remaining balance?', or ask about any customer name."
        return "आप पूछ सकते हैं: 'कुल कितना हुआ', 'कितने ग्राहक हैं', 'ग्राहक सूची', 'बैलेंस कितना बचा है', या किसी भी ग्राहक का नाम लेकर बैलेंस पूछें।"

    # 11. General Shop / System Query Fallback
    if any(kw in t for kw in ['shop', 'dukan', 'dukandaar', 'system', 'report', 'summary', 'sab', 'kya', 'kitna', 'batao', 'dene', 'lene', 'दुकान', 'सिस्टम', 'रिपोर्ट', 'सब', 'क्या', 'कितना', 'बताओ', 'डाटा', 'डेटा', 'हाल', 'हिसाब']):
        return _handle_total(shop, db, use_en)

    # 12. Unknown / Out-of-system fallback
    if use_en:
        return "Sorry, I don't have this information."
    return "माफ़ कीजिए, यह जानकारी मेरे पास उपलब्ध नहीं है।"


def _entry_phrase(cust_name, amount, etype, use_en=False):
    if use_en:
        if etype == "credit_given":
            return f"credited Rs {amount:,.0f} to {cust_name}"
        return f"received Rs {amount:,.0f} from {cust_name}"
    else:
        if etype == "credit_given":
            return f"{cust_name} को {amount:,.0f} रुपये उधार दिया"
        return f"{cust_name} से {amount:,.0f} रुपये प्राप्त हुए"


def _handle_total(shop: models.Shop, db: Session, use_en: bool) -> str:
    total_given, total_received, total_balance, _, _ = _shop_totals(shop, db)
    if use_en:
        return f"Today ({_today()}): Total credit given is Rs {total_given:,.0f}. Total payment received is Rs {total_received:,.0f}. Total customer balance is Rs {total_balance:,.0f}."
    return f"आज {_today()}: कुल उधार दिया {total_given:,.0f} रुपये। कुल भुगतान प्राप्त हुआ {total_received:,.0f} रुपये। कुल बकाया बैलेंस {total_balance:,.0f} रुपये है।"


def _handle_customer_count(shop: models.Shop, db: Session, use_en: bool) -> str:
    count = db.query(models.Customer).filter(models.Customer.shop_id == shop.id).count()
    if use_en:
        return f"You have a total of {count} customers in your shop."
    return f"आपकी दुकान में कुल {count} ग्राहक हैं।"


def _handle_customer_list(shop: models.Shop, db: Session, use_en: bool) -> str:
    customers = db.query(models.Customer).filter(models.Customer.shop_id == shop.id).all()
    if not customers:
        if use_en:
            return "There are currently no customers registered in your shop."
        return "आपकी दुकान में अभी कोई ग्राहक नहीं है।"
    if use_en:
        names = [f"{c.name} balance Rs {c.balance:,.0f}" for c in customers]
        return f"You have {len(customers)} customers: " + ", ".join(names) + "."
    else:
        names = [f"{c.name} का बैलेंस {c.balance:,.0f} रुपये" for c in customers]
        return f"आपकी दुकान में {len(customers)} ग्राहक हैं: " + "। ".join(names) + "।"


def _handle_balance(shop: models.Shop, db: Session, use_en: bool) -> str:
    total = db.query(func.sum(models.Customer.balance)).filter(
        models.Customer.shop_id == shop.id
    ).scalar() or 0
    if use_en:
        return f"Total remaining balance across all customers is Rs {total:,.0f}."
    return f"आपकी दुकान का कुल बकाया बैलेंस {total:,.0f} रुपये है।"


def _handle_revenue(shop: models.Shop, db: Session, use_en: bool) -> str:
    total_given, total_received, _, entry_count, _ = _shop_totals(shop, db)
    if use_en:
        return f"As of today ({_today()}): Total credit given Rs {total_given:,.0f}, total payment received Rs {total_received:,.0f} across {entry_count} entries."
    return f"आज {_today()} तक: उधार दिया {total_given:,.0f} रुपये, वापस प्राप्त हुआ {total_received:,.0f} रुपये। कुल {entry_count} एंट्रियां हैं।"


def _handle_entry_detail(shop: models.Shop, db: Session, use_en: bool) -> str:
    entry_count = db.query(models.Entry).filter(models.Entry.shop_id == shop.id).count()
    entries = db.query(models.Entry).filter(
        models.Entry.shop_id == shop.id
    ).order_by(models.Entry.created_at.desc()).limit(5).all()
    if entry_count == 0:
        if use_en:
            return "There are no transaction entries yet."
        return "अभी तक कोई एंट्री नहीं है।"
    
    if use_en:
        lines = [f"Total {entry_count} entries. Recent entries:"]
        for e in entries:
            ename = e.customer.name if e.customer else "Unknown"
            lines.append(f"{_entry_phrase(ename, e.amount, e.type, use_en)} ({_when(e.created_at)})")
        return ". ".join(lines) + "."
    else:
        lines = [f"कुल {entry_count} एंट्रियां हैं। हाल ही का हिसाब:"]
        for e in entries:
            ename = e.customer.name if e.customer else "अज्ञात"
            lines.append(f"{_entry_phrase(ename, e.amount, e.type, use_en)} ({_when(e.created_at)})")
        return "। ".join(lines) + "।"