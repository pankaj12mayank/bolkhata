from datetime import datetime, timezone
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..security import get_current_shop
from ..services.settings_service import get_settings

router = APIRouter(prefix="/api/customers", tags=["customers"])
@router.get("", response_model=list[schemas.CustomerOut])
def list_customers(shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    return (
        db.query(models.Customer)
        .filter(models.Customer.shop_id == shop.id)
        .order_by(models.Customer.balance.desc())
        .all()
    )


@router.post("", response_model=schemas.CustomerOut)
def create_customer(payload: schemas.CustomerCreateIn, shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    if getattr(shop, 'is_active', 'true') == 'false':
        raise HTTPException(status_code=403, detail="Aapki dukaan Inactive hai — Admin se sampark karein")
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Grahak ka naam zaroori hai")
    customer = models.Customer(
        shop_id=shop.id,
        name=payload.name.strip(),
        phone=payload.phone or "",
        balance=payload.balance or 0,
    )
    db.add(customer)
    db.flush()
    if payload.balance:
        db.add(models.Entry(
            shop_id=shop.id, customer_id=customer.id, amount=payload.balance,
            type="credit_given", raw_voice_text="(manually joda gaya)", source="manual",
        ))
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=schemas.CustomerDetailOut)
def get_customer(customer_id: int, shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id, models.Customer.shop_id == shop.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Grahak nahi mila")
    entries = (
        db.query(models.Entry)
        .filter(models.Entry.customer_id == customer.id)
        .order_by(models.Entry.created_at.desc())
        .all()
    )
    out = schemas.CustomerDetailOut.model_validate(customer)
    out.entries = [schemas.EntryOut.model_validate(e) for e in entries]
    return out


@router.put("/{customer_id}", response_model=schemas.CustomerOut)
def update_customer(customer_id: int, payload: schemas.CustomerUpdateIn, shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id, models.Customer.shop_id == shop.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Grahak nahi mila")
    if payload.name is not None and payload.name.strip():
        customer.name = payload.name.strip()
    if payload.phone is not None:
        customer.phone = payload.phone
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}")
def delete_customer(customer_id: int, shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id, models.Customer.shop_id == shop.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Grahak nahi mila")
    db.delete(customer)
    db.commit()
    return {"deleted": True}


@router.post("/{customer_id}/remind")
def remind_customer(customer_id: int, shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id, models.Customer.shop_id == shop.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Grahak nahi mila")
    if customer.balance <= 0:
        raise HTTPException(status_code=400, detail="Is grahak ka koi udhaar baaki nahi — reminder ki zaroorat nahi")
    # Throttle: one reminder per customer per 24h? simple check last reminder
    from datetime import timezone, timedelta, datetime
    last = db.query(models.Reminder).filter(models.Reminder.customer_id == customer.id).order_by(models.Reminder.sent_at.desc()).first()
    if last and last.sent_at:
        # Ensure timezone aware comparison
        now = datetime.now(timezone.utc)
        last_time = last.sent_at
        if last_time.tzinfo is None:
            last_time = last_time.replace(tzinfo=timezone.utc)
        if (now - last_time).total_seconds() < 3600:
            raise HTTPException(status_code=429, detail="Abhi reminder bheja tha — 1 ghante baad try karein")
    db.add(models.Reminder(customer_id=customer.id, method="whatsapp"))
    db.commit()
    ps = get_settings(db)
    template = ps.wa_template or "Namaste {name} ji, aapka \u20b9{balance} udhaar baaki hai. Kripya jald bhugtan karein. Dhanyavaad \u2014 BolKhata"
    try:
        message = template.format(name=customer.name.split(' ')[0], balance=f"{customer.balance:.0f}", full_name=customer.name)
    except:
        message = template.replace("{name}", customer.name.split(' ')[0]).replace("{balance}", f"{customer.balance:.0f}")
    message = message.replace("{shop}", shop.shop_name)
    # Try auto-send if provider is not wa_me
    wa_link = f"https://wa.me/?text={quote(message)}"
    auto_sent = False
    auto_detail = ""
    try:
        from ..services.whatsapp_service import send_whatsapp_via_provider
        provider = getattr(ps, 'whatsapp_provider', 'wa_me') or 'wa_me'
        base_url = getattr(ps, 'whatsapp_base_url', '') or ''
        api_key = getattr(ps, 'whatsapp_api_key', '') or ''
        phone_id = getattr(ps, 'whatsapp_phone_id', '') or ''
        if provider not in ("wa_me", "disabled") and base_url and api_key:
            # Attempt auto-send
            ok, detail = send_whatsapp_via_provider(customer.phone or "", message, provider, base_url, api_key, phone_id)
            if ok and "https://wa.me" not in detail:
                auto_sent = True
                auto_detail = detail
                # Still provide wa.me as fallback link
                wa_link = get_whatsapp_link(customer.phone or "", message) if 'get_whatsapp_link' in dir() else wa_link
            elif ok:
                wa_link = detail
        else:
            # free wa.me link
            if customer.phone and customer.phone.strip():
                digits = "".join(c for c in customer.phone if c.isdigit())
                if len(digits) == 10:
                    digits = "91" + digits
                if len(digits) >= 12:
                    wa_link = f"https://wa.me/{digits}?text={quote(message)}"
    except Exception as e:
        auto_detail = str(e)[:200]
    # Fallback wa.me link if not auto_sent
    if not auto_sent:
        from ..services.whatsapp_service import get_whatsapp_link
        wa_link = get_whatsapp_link(customer.phone or "", message)
    return {"message": message, "wa_link": wa_link, "auto_sent": auto_sent, "detail": auto_detail, "provider": getattr(ps, 'whatsapp_provider', 'wa_me')}
