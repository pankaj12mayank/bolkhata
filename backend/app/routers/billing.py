import random
import string
import hmac
import hashlib
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..security import get_current_shop, get_current_admin
from ..services.settings_service import get_settings, is_razorpay_configured
from ..services.razorpay_service import create_razorpay_order, verify_signature, generate_mock_ids

router = APIRouter(prefix="/api/billing", tags=["billing"])

def _effective_limit(shop: models.Shop, settings: models.PlatformSettings) -> int:
    # Free / Standard / Paid limit
    if shop.plan_tier == "Paid":
        if settings.paid_entries_limit == -1:
            return 999999
        return settings.paid_entries_limit
    if shop.plan_tier == "Standard":
        return getattr(settings, 'standard_entries_limit', 500) or 500
    return settings.free_entries_limit

def _check_monthly_reset(shop: models.Shop, db: Session):
    """Auto-reset monthly counter if month changed."""
    today = date.today()
    if shop.period_start is None:
        shop.period_start = today
        db.commit()
        return
    if shop.period_start.month != today.month or shop.period_start.year != today.year:
        shop.entries_used_this_month = 0
        shop.period_start = today
        db.commit()


@router.get("", response_model=schemas.BillingOut)
def get_billing(shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    ps = get_settings(db)
    _check_monthly_reset(shop, db)
    limit = _effective_limit(shop, ps)
    # For backward compat: keep shop.entries_limit in sync for Free
    if shop.plan_tier == "Free" and shop.entries_limit != ps.free_entries_limit:
        shop.entries_limit = ps.free_entries_limit
        db.commit()
    return {
        "tier": shop.plan_tier, "used": shop.entries_used_this_month, "limit": limit, "price": ps.paid_price_inr,
        "standard_price": getattr(ps, 'standard_price_inr', 49) or 49,
        "standard_limit": getattr(ps, 'standard_entries_limit', 500) or 500
    }


@router.post("/create-order", response_model=schemas.BillingOrderOut)
def create_order(payload: dict = {}, shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    """Create Razorpay order. If keys not configured, returns mock order. Frontend checks mock flag. payload: {tier: Standard|Paid}"""
    ps = get_settings(db)
    _check_monthly_reset(shop, db)
    if shop.plan_tier == "Paid":
        raise HTTPException(status_code=400, detail="Aap already Paid plan pe hain")
    # tier requested
    tier = (payload.get("tier") if isinstance(payload, dict) else None) or "Paid"
    if tier not in ("Standard","Paid"): tier="Paid"
    if tier == "Standard" and shop.plan_tier == "Standard":
        raise HTTPException(status_code=400, detail="Aap already Standard plan pe hain")

    amount = ps.paid_price_inr if tier=="Paid" else (getattr(ps,'standard_price_inr',49) or 49)
    if amount <= 0:
        raise HTTPException(status_code=500, detail="Paid price not configured")

    amount_paise = int(amount * 100)

    if not is_razorpay_configured(ps):
        # Mock flow — still create pending subscription for testing
        order_id, _ = generate_mock_ids()
        order_id = order_id.replace("order_mock_", "order_mock_")
        # Create pending subscription
        db.add(models.Subscription(shop_id=shop.id, amount=amount, razorpay_id="", razorpay_order_id=order_id, status="Pending"))
        db.commit()
        return {"order_id": order_id, "amount": amount_paise, "currency": ps.currency or "INR", "key_id": "", "mock": True}

    try:
        order = create_razorpay_order(ps.razorpay_key_id, ps.razorpay_key_secret, amount_paise, ps.currency or "INR", f"shop_{shop.id}")
        # Store pending subscription
        db.add(models.Subscription(shop_id=shop.id, amount=amount, razorpay_id="", razorpay_order_id=order["id"], status="Pending"))
        db.commit()
        return {"order_id": order["id"], "amount": order["amount"], "currency": order["currency"], "key_id": ps.razorpay_key_id, "mock": False}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Razorpay order fail: {str(e)[:300]}")


@router.post("/verify", response_model=schemas.BillingOut)
def verify_payment(payload: schemas.BillingVerifyIn, shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    """Verify Razorpay payment signature and upgrade. For mock orders, skip signature."""
    ps = get_settings(db)

    # Find pending subscription by order_id
    sub = db.query(models.Subscription).filter(
        models.Subscription.shop_id == shop.id,
        models.Subscription.razorpay_order_id == payload.razorpay_order_id,
        models.Subscription.status == "Pending"
    ).first()

    is_mock = payload.razorpay_order_id.startswith("order_mock_")

    # Determine tier from subscription amount if available
    pending_tier = "Paid"
    if sub and sub.amount == getattr(ps,'standard_price_inr',49):
        pending_tier = "Standard"

    if is_mock:
        # Mock verification — directly succeed
        if sub:
            sub.razorpay_id = payload.razorpay_payment_id or "pay_mock_" + "".join(random.choices(string.ascii_letters + string.digits, k=8))
            sub.status = "Success"
            # infer tier from amount
            if sub.amount == getattr(ps,'standard_price_inr',49):
                pending_tier = "Standard"
        else:
            # Create if not found (race)
            db.add(models.Subscription(shop_id=shop.id, amount=ps.paid_price_inr, razorpay_id=payload.razorpay_payment_id or "pay_mock", razorpay_order_id=payload.razorpay_order_id, status="Success"))
        shop.plan_tier = pending_tier
        db.commit()
        db.refresh(shop)
        return {"tier": shop.plan_tier, "used": shop.entries_used_this_month, "limit": _effective_limit(shop, ps), "price": ps.paid_price_inr, "standard_price": getattr(ps,'standard_price_inr',49), "standard_limit": getattr(ps,'standard_entries_limit',500)}

    # Real verification
    if not sub:
        raise HTTPException(status_code=404, detail="Order nahi mila — pehle /create-order karein")
    if not ps.razorpay_key_secret:
        raise HTTPException(status_code=500, detail="Razorpay secret not configured")

    valid = verify_signature(payload.razorpay_order_id, payload.razorpay_payment_id, payload.razorpay_signature, ps.razorpay_key_secret)
    if not valid:
        sub.status = "Failed"
        sub.razorpay_id = payload.razorpay_payment_id
        db.commit()
        raise HTTPException(status_code=400, detail="Payment signature galat — verification fail")

    sub.razorpay_id = payload.razorpay_payment_id
    sub.status = "Success"
    # upgrade tier based on amount
    if sub.amount == getattr(ps,'standard_price_inr',49):
        shop.plan_tier = "Standard"
    else:
        shop.plan_tier = "Paid"
    db.commit()
    db.refresh(shop)
    return {"tier": shop.plan_tier, "used": shop.entries_used_this_month, "limit": _effective_limit(shop, ps), "price": ps.paid_price_inr, "standard_price": getattr(ps,'standard_price_inr',49), "standard_limit": getattr(ps,'standard_entries_limit',500)}


@router.post("/upgrade", response_model=schemas.BillingOut)
def upgrade_plan(payload: dict = {}, shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    """Legacy mock upgrade — kept for backward compat, now uses settings price. Prefer /create-order + /verify"""
    ps = get_settings(db)
    if shop.plan_tier == "Paid":
        return {"tier": shop.plan_tier, "used": shop.entries_used_this_month, "limit": _effective_limit(shop, ps), "price": ps.paid_price_inr, "standard_price": getattr(ps,'standard_price_inr',49), "standard_limit": getattr(ps,'standard_entries_limit',500)}
    tier = (payload.get("tier") if isinstance(payload, dict) else None) or "Paid"
    # If no razorpay keys, allow instant mock upgrade (for demo/test mode when admin hasn't set keys)
    if not is_razorpay_configured(ps):
        shop.plan_tier = tier if tier in ("Standard","Paid") else "Paid"
        amount = ps.paid_price_inr if shop.plan_tier=="Paid" else getattr(ps,'standard_price_inr',49)
        mock_id = "pay_" + "".join(random.choices(string.ascii_letters + string.digits, k=14))
        db.add(models.Subscription(shop_id=shop.id, amount=amount, razorpay_id=mock_id, razorpay_order_id="order_mock_" + mock_id, status="Success"))
        db.commit()
        db.refresh(shop)
        return {"tier": shop.plan_tier, "used": shop.entries_used_this_month, "limit": _effective_limit(shop, ps), "price": ps.paid_price_inr, "standard_price": getattr(ps,'standard_price_inr',49), "standard_limit": getattr(ps,'standard_entries_limit',500)}
    else:
        raise HTTPException(status_code=400, detail="Use /api/billing/create-order + /verify for real payments. Keys configured hai.")

@router.post("/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """Razorpay webhook — verify signature and update subscription."""
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    # Get webhook secret from DB (first settings row)
    ps = db.query(models.PlatformSettings).filter(models.PlatformSettings.id == 1).first()
    webhook_secret = ps.razorpay_webhook_secret if ps and ps.razorpay_webhook_secret else ""
    if webhook_secret and signature:
        # Verify
        expected = hmac.new(webhook_secret.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=400, detail="Webhook signature invalid")
    import json
    try:
        payload = json.loads(body)
        event = payload.get("event", "")
        if event == "payment.captured":
            payment = payload.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment.get("order_id")
            payment_id = payment.get("id")
            if order_id and payment_id:
                sub = db.query(models.Subscription).filter(models.Subscription.razorpay_order_id == order_id).first()
                if sub and sub.status != "Success":
                    sub.status = "Success"
                    sub.razorpay_id = payment_id
                    # Upgrade shop
                    shop = db.query(models.Shop).filter(models.Shop.id == sub.shop_id).first()
                    if shop:
                        standard_price = getattr(ps, 'standard_price_inr', 49) or 49
                        shop.plan_tier = "Standard" if sub.amount == standard_price else "Paid"
                    db.commit()
        elif event == "payment.failed":
            payment = payload.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment.get("order_id")
            if order_id:
                sub = db.query(models.Subscription).filter(models.Subscription.razorpay_order_id == order_id).first()
                if sub:
                    sub.status = "Failed"
                    db.commit()
    except Exception:
        pass
    return {"status": "ok"}


# ---------- Public plans (no auth — powers Landing pricing) ----------
public = APIRouter(prefix="/api", tags=["public-plans"])

@public.get("/plans")
def public_plans(db: Session = Depends(get_db)):
    ps = get_settings(db)
    from ..services.plans_service import get_plans
    return {"plans": get_plans(ps)}


# ---------- User transaction history ----------
@router.get("/history")
def billing_history(shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    rows = (
        db.query(models.Subscription)
        .filter(models.Subscription.shop_id == shop.id)
        .order_by(models.Subscription.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": r.id,
            "amount": r.amount,
            "status": r.status,
            "razorpay_id": r.razorpay_id or "",
            "order_id": r.razorpay_order_id or "",
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]
