from datetime import date, datetime, timezone, timedelta

from sqlalchemy.orm import Session

from .. import models
from .settings_service import get_settings

LOCAL_OFFSET = timedelta(hours=5, minutes=30)

DAY_INDEX = {"sun": 0, "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6}


def _now_local() -> datetime:
    return datetime.now(timezone.utc) + LOCAL_OFFSET


def run_daily_reminders(db: Session) -> dict:
    """Scheduled automatic WhatsApp reminders for Standard/Paid shops. Runs once
    per configured weekday+time. Reuses the shared remind dispatch (with UPI pay link)."""
    ps = get_settings(db)
    if getattr(ps, 'auto_reminder', 'true') != 'true':
        return {"sent": 0, "attempts": 0, "skipped": "auto_off"}

    now = _now_local()
    weekday = now.strftime("%a").lower()[:3]  # mon..sun
    configured_day = (getattr(ps, "auto_reminder_day", "mon") or "mon").lower()
    if weekday != configured_day:
        return {"sent": 0, "attempts": 0, "skipped": "day"}

    hhmm = now.strftime("%H:%M")
    configured_time = (getattr(ps, "auto_reminder_time", "09:00") or "09:00").strip()
    if hhmm != configured_time:
        return {"sent": 0, "attempts": 0, "skipped": "time"}

    if ps.last_reminder_run_date == now.date():
        return {"sent": 0, "attempts": 0, "skipped": "already_ran"}

    from .remind_service import dispatch

    shops = (
        db.query(models.Shop)
        .filter(models.Shop.plan_tier.in_(["Standard", "Paid"]), models.Shop.is_active == "true")
        .all()
    )
    attempts = 0
    sent = 0
    for shop in shops:
        customers = (
            db.query(models.Customer)
            .filter(models.Customer.shop_id == shop.id, models.Customer.balance > 0)
            .all()
        )
        if not customers:
            continue
        for c in customers:
            attempts += 1
            try:
                db.add(models.Reminder(customer_id=c.id, method="whatsapp"))
                res = dispatch(c, shop, ps, include_upi=True)
                if res.get("auto_sent"):
                    sent += 1
            except Exception as e:
                print(f"reminder sweep customer {c.id}: {e}")
    ps.last_reminder_run_date = now.date()
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"reminder sweep commit: {e}")
    return {"sent": sent, "attempts": attempts, "skipped": "ran"}