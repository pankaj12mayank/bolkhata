from datetime import datetime, date, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from ..database import get_db
from .. import models, schemas
from ..security import get_current_admin
from ..services.settings_service import get_settings
from ..config import settings

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/profile")
def admin_profile(_: str = Depends(get_current_admin), db: Session = Depends(get_db)):
    ps = get_settings(db)
    name = (getattr(ps, 'admin_name', '') or '').strip() or "Admin"
    email = (getattr(ps, 'admin_email', '') or '').strip()
    return {"name": name, "email": email or settings.ADMIN_EMAIL, "custom_email": bool(email)}


@router.put("/profile")
def update_admin_profile(payload: dict, _: str = Depends(get_current_admin), db: Session = Depends(get_db)):
    ps = get_settings(db)
    if "name" in payload:
        val = (payload.get("name") or "").strip()
        if val:
            ps.admin_name = val[:60]
    if payload.get("password"):
        from ..security import hash_password
        ps.admin_password_hash = hash_password(payload["password"])
    db.commit()
    db.refresh(ps)
    name = (getattr(ps, 'admin_name', '') or '').strip() or "Admin"
    email = (getattr(ps, 'admin_email', '') or '').strip() or settings.ADMIN_EMAIL
    return {"ok": True, "name": name, "email": email, "message": "Admin profile update ho gayi"}


@router.get("/plans")
def admin_plans(_: str = Depends(get_current_admin), db: Session = Depends(get_db)):
    from ..services.plans_service import get_plans
    ps = get_settings(db)
    return {"plans": get_plans(ps), "source": "admin" if (getattr(ps, "plans_json", "") or "").strip() else "defaults"}


@router.put("/plans")
def update_admin_plans(payload: dict, _: str = Depends(get_current_admin), db: Session = Depends(get_db)):
    from ..services.plans_service import save_plans
    ps = get_settings(db)
    try:
        plans = save_plans(db, ps, payload.get("plans") or [])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"plans": plans, "source": "admin", "message": "Plans updated"}


@router.get("/overview")
def overview(_: str = Depends(get_current_admin), db: Session = Depends(get_db)):
    ps = get_settings(db)
    total_shops = db.query(models.Shop).count()
    paid_shops = db.query(models.Shop).filter(models.Shop.plan_tier == "Paid").count()
    today_start = datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc)
    entries_today = db.query(models.Entry).filter(models.Entry.created_at >= today_start).count()
    total_entries = db.query(models.Entry).count()
    failed_entries = db.query(models.Entry).filter(models.Entry.parse_status == "failed").count()
    parse_success_pct = round(100 * (1 - failed_entries / total_entries), 1) if total_entries else 100.0
    active_shops = db.query(models.Shop).filter(models.Shop.is_active == "true").count()

    return {
        "total_shops": total_shops,
        "active_shops": active_shops,
        "mrr": paid_shops * ps.paid_price_inr,
        "entries_today": entries_today,
        "parse_success_pct": parse_success_pct,
        "conversion_pct": round(100 * paid_shops / total_shops, 1) if total_shops else 0.0,
        "price": ps.paid_price_inr,
        "free_limit": ps.free_entries_limit,
    }


@router.get("/shops", response_model=list[dict])
def list_shops(status: str | None = Query(default=None), db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    q = db.query(models.Shop)
    if status and status != "all":
        if status in ("Free", "Paid"):
            q = q.filter(models.Shop.plan_tier == status)
        elif status == "Inactive":
            q = q.filter(models.Shop.is_active == "false")
        elif status == "Active":
            q = q.filter(models.Shop.is_active == "true")
    shops = q.order_by(models.Shop.created_at.desc()).all()
    result = []
    for s in shops:
        is_active = getattr(s, 'is_active', 'true') != 'false'
        result.append({
            "id": s.id, "shop_name": s.shop_name, "owner_name": s.owner_name,
            "plan_tier": s.plan_tier, "entries_used_this_month": s.entries_used_this_month,
            "status": "Active" if is_active else "Inactive",
            "is_active": is_active,
            "created_at": s.created_at,
        })
    return result


@router.get("/shops/{shop_id}")
def shop_detail(shop_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    shop = db.query(models.Shop).filter(models.Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    customers_count = db.query(models.Customer).filter(models.Customer.shop_id == shop.id).count()
    entries_count = db.query(models.Entry).filter(models.Entry.shop_id == shop.id).count()
    outstanding = db.query(func.coalesce(func.sum(models.Customer.balance), 0)).filter(models.Customer.shop_id == shop.id).scalar()
    recent = (
        db.query(models.Entry).filter(models.Entry.shop_id == shop.id)
        .order_by(models.Entry.created_at.desc()).limit(10).all()
    )
    is_active = getattr(shop, 'is_active', 'true') != 'false'
    return {
        "id": shop.id, "shop_name": shop.shop_name, "owner_name": shop.owner_name,
        "plan_tier": shop.plan_tier, "created_at": shop.created_at,
        "is_active": is_active,
        "status": "Active" if is_active else "Inactive",
        "customers_count": customers_count, "entries_count": entries_count,
        "outstanding": outstanding,
        "activity": [
            {"time": e.created_at, "type": e.type, "amount": e.amount, "status": e.parse_status, "raw": e.raw_voice_text}
            for e in recent
        ],
    }

@router.put("/shops/{shop_id}/status")
def toggle_shop_status(shop_id: int, payload: dict, db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    shop = db.query(models.Shop).filter(models.Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    new_status = payload.get("is_active")
    if new_status is None:
        raise HTTPException(status_code=400, detail="is_active is required")
    # normalize to string
    val = "true" if str(new_status).lower() in ("true", "1", "active", "yes") else "false"
    shop.is_active = val
    db.commit()
    db.refresh(shop)
    return {"id": shop.id, "shop_name": shop.shop_name, "is_active": val == "true", "status": "Active" if val == "true" else "Inactive", "message": f"Shop {'activated' if val=='true' else 'deactivated'} successfully ✓"}

@router.delete("/shops/{shop_id}")
def delete_shop_permanent(shop_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    shop = db.query(models.Shop).filter(models.Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    db.delete(shop)
    db.commit()
    return {"deleted": True, "message": f"{shop.shop_name} permanently deleted ✓", "shop_id": shop_id}


@router.get("/subscriptions", response_model=list[schemas.SubscriptionOut])
def list_subscriptions(status: str | None = Query(default=None), db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    rows = (
        db.query(models.Subscription, models.Shop.shop_name)
        .join(models.Shop, models.Shop.id == models.Subscription.shop_id)
    )
    if status and status != "all":
        rows = rows.filter(models.Subscription.status == status)
    rows = rows.order_by(models.Subscription.created_at.desc()).all()
    return [
        {
            "id": s.id,
            "shop_id": s.shop_id,
            "shop_name": shop_name,
            "amount": s.amount,
            "razorpay_id": s.razorpay_id,
            "status": s.status,
            "created_at": s.created_at,
        }
        for s, shop_name in rows
    ]


@router.get("/overview/chart")
def overview_chart(_: str = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Daily series for dashboards: last 7 days entries + successful payments."""
    from datetime import timedelta
    out = []
    for i in range(6, -1, -1):
        d = date.today() - timedelta(days=i)
        start = datetime.combine(d, datetime.min.time(), tzinfo=timezone.utc)
        end = start + timedelta(days=1)
        entries = db.query(models.Entry).filter(
            models.Entry.created_at >= start, models.Entry.created_at < end
        ).count()
        paid = db.query(models.Subscription).filter(
            models.Subscription.created_at >= start,
            models.Subscription.created_at < end,
            models.Subscription.status == "Success",
        ).count()
        out.append({"date": d.isoformat(), "entries": entries, "payments": paid})
    return out


@router.get("/logs")
def list_logs(status: str | None = Query(default=None), db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    q = db.query(models.Entry, models.Shop.shop_name).join(models.Shop, models.Entry.shop_id == models.Shop.id).options(joinedload(models.Entry.customer))
    if status and status != "all":
        q = q.filter(models.Entry.parse_status == status)
    rows = q.order_by(models.Entry.created_at.desc()).limit(100).all()
    out = []
    for e, shop_name in rows:
        try:
            cname = e.customer.name if e.customer else "Unknown"
        except:
            cname = "—"
        parsed = "—" if e.parse_status == "failed" else f"{cname} · ₹{e.amount:.0f} · {e.type}"
        out.append({
            "id": e.id,
            "shop_name": shop_name, "raw_voice_text": e.raw_voice_text,
            "parsed_summary": parsed, "status": e.parse_status, "created_at": e.created_at,
            "amount": e.amount, "type": e.type,
        })
    return out


@router.delete("/logs/{entry_id}")
def delete_log(entry_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    e = db.query(models.Entry).filter(models.Entry.id == entry_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Entry not found")
    # revert customer balance if success
    if e.parse_status != "failed":
        try:
            cust = db.query(models.Customer).filter(models.Customer.id == e.customer_id).first()
            if cust:
                delta = e.amount if e.type == "credit_given" else -e.amount
                cust.balance -= delta  # reverse
                if cust.balance < 0 and cust.balance > -0.01:
                    cust.balance = 0
        except: pass
    db.delete(e)
    db.commit()
    return {"deleted": True, "id": entry_id}


@router.post("/logs/bulk-delete")
def bulk_delete_logs(payload: dict, db: Session = Depends(get_db), _: str = Depends(get_current_admin)):
    ids = payload.get("ids") or []
    if not ids or not isinstance(ids, list):
        raise HTTPException(status_code=400, detail="ids array required")
    ids = [int(x) for x in ids if str(x).isdigit()]
    if not ids:
        raise HTTPException(status_code=400, detail="No valid ids")
    # limit 100 at once
    ids = ids[:100]
    entries = db.query(models.Entry).filter(models.Entry.id.in_(ids)).all()
    deleted = 0
    for e in entries:
        if e.parse_status != "failed":
            try:
                cust = db.query(models.Customer).filter(models.Customer.id == e.customer_id).first()
                if cust:
                    delta = e.amount if e.type == "credit_given" else -e.amount
                    cust.balance -= delta
            except: pass
        db.delete(e)
        deleted += 1
    db.commit()
    return {"deleted": deleted, "ids": ids}
