from datetime import datetime, timezone
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
        upi_id=payload.upi_id or "",
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
    if payload.upi_id is not None:
        customer.upi_id = payload.upi_id or ""
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
    # Throttle: one reminder per customer per hour
    last = db.query(models.Reminder).filter(models.Reminder.customer_id == customer.id).order_by(models.Reminder.sent_at.desc()).first()
    if last and last.sent_at:
        now = datetime.now(timezone.utc)
        last_time = last.sent_at
        if last_time.tzinfo is None:
            last_time = last_time.replace(tzinfo=timezone.utc)
        if (now - last_time).total_seconds() < 3600:
            raise HTTPException(status_code=429, detail="Abhi reminder bheja tha — 1 ghante baad try karein")
    db.add(models.Reminder(customer_id=customer.id, method="whatsapp"))
    db.commit()
    ps = get_settings(db)
    from ..services.remind_service import dispatch
    # UPI pay link: Free = off, Standard/Paid = on
    return dispatch(customer, shop, ps, include_upi=shop.plan_tier in ("Standard", "Paid"))
