from datetime import date, datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from .. import models
from ..security import get_current_shop
from ..services.settings_service import get_settings

router = APIRouter(prefix="/api/insights", tags=["insights"])

@router.get("")
def get_insights(shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    today = date.today()
    week_ago = today - timedelta(days=7)
    start_week = datetime.combine(week_ago, datetime.min.time(), tzinfo=timezone.utc)
    entries = db.query(models.Entry).filter(models.Entry.shop_id==shop.id, models.Entry.created_at >= start_week).all()
    total_given = sum(e.amount for e in entries if e.type=='credit_given')
    total_recv = sum(e.amount for e in entries if e.type=='payment_received')
    # top defaulters
    from collections import Counter, defaultdict
    by_cust = defaultdict(float)
    for e in entries:
        if e.type=='credit_given':
            # need customer name
            cust = db.query(models.Customer).filter(models.Customer.id==e.customer_id).first()
            if cust:
                by_cust[cust.name] += e.amount
    top = sorted(by_cust.items(), key=lambda x: -x[1])[:3]
    # customers overall
    customers = db.query(models.Customer).filter(models.Customer.shop_id==shop.id).all()
    total_baki = sum(c.balance for c in customers if c.balance>0)
    riskiest = sorted([c for c in customers if c.balance>0], key=lambda x: -x.balance)[:3]
    risky = [{"name": c.name, "balance": c.balance, "phone": c.phone} for c in riskiest]

    # Generate summary text (local rule-based, no AI needed for offline)
    lines = []
    if total_given > 0:
        lines.append(f"Is hafte ₹{int(total_given)} udhaar diya, ₹{int(total_recv)} wapas mila.")
    if total_given > total_recv*1.5:
        lines.append("Warning: Udhaar wapas se jyada diya - recovery tez karo.")
    if top:
        lines.append(f"Sabse zyada: {top[0][0]} ko ₹{int(top[0][1])}.")
    if total_baki > 10000:
        lines.append(f"Kul baki ₹{int(total_baki)} - {len([c for c in customers if c.balance>0])} grahako se lena hai.")
    summary = " ".join(lines) if lines else "Is hafte koi khaas entry nahi. Naya entry bolo!"

    # Try AI enhance if configured
    ps = get_settings(db)
    ai_summary = None
    if ps.ai_provider != 'local' and (ps.ai_api_key or ps.ai_base_url):
        try:
            from ..services.parse_service import generic_ai_parse
            import asyncio
            # quick local prompt - we do simple AI call sync
            prompt_text = f"Shop {shop.shop_name} last 7 days: given {total_given}, received {total_recv}, top {top}. Give 2 line Hindi summary for shopkeeper, encouraging."
            # Use generic_ai_parse trick? Instead direct call
            # For now keep local summary; AI can be added later via settings test
            pass
        except: pass

    return {
        "week_given": total_given,
        "week_received": total_recv,
        "total_baki": total_baki,
        "top_week": [{"name": n, "amount": a} for n,a in top],
        "riskiest": risky,
        "summary": summary,
        "ai_summary": ai_summary,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

@router.get("/daily")
def daily_breakdown(days: int = 7, shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    out = []
    for i in range(days):
        d = date.today() - timedelta(days=i)
        start = datetime.combine(d, datetime.min.time(), tzinfo=timezone.utc)
        end = start + timedelta(days=1)
        entries = db.query(models.Entry).filter(models.Entry.shop_id==shop.id, models.Entry.created_at >= start, models.Entry.created_at < end).all()
        given = sum(e.amount for e in entries if e.type=='credit_given')
        recv = sum(e.amount for e in entries if e.type=='payment_received')
        out.append({"date": d.isoformat(), "given": given, "received": recv, "count": len(entries)})
    return list(reversed(out))
