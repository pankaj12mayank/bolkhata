import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..security import get_current_shop

router = APIRouter(prefix="/api/export", tags=["export"])


def _require_export(shop: models.Shop):
    if shop.plan_tier == "Free":
        raise HTTPException(status_code=403, detail="CSV export sirf Standard/Paid plans ke liye hai — upgrade karein")


def _csv_response(rows: list[list], headers: list[str], filename: str) -> Response:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(headers)
    w.writerows(rows)
    # BOM so Excel shows Devanagari correctly
    body = "\ufeff" + buf.getvalue()
    return Response(
        content=body,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/ledger")
def export_ledger(shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    _require_export(shop)
    customers = (
        db.query(models.Customer)
        .filter(models.Customer.shop_id == shop.id)
        .order_by(models.Customer.balance.desc())
        .all()
    )
    rows = [[c.name, c.phone, c.upi_id or "", f"{c.balance:.2f}"] for c in customers]
    return _csv_response(rows, ["Customer", "Phone", "UPI", "Baaki (INR)"], f"bolkhata-ledger-{date.today().isoformat()}.csv")


@router.get("/entries")
def export_entries(shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    _require_export(shop)
    rows = (
        db.query(models.Entry, models.Customer.name)
        .outerjoin(models.Customer, models.Entry.customer_id == models.Customer.id)
        .filter(models.Entry.shop_id == shop.id)
        .order_by(models.Entry.created_at.desc())
        .all()
    )
    out = []
    for e, cust_name in rows:
        created = e.created_at.isoformat() if e.created_at else ""
        out.append([
            created,
            cust_name or e.product_name or "",
            e.type,
            f"{e.amount:.2f}",
            e.source or "",
            e.raw_voice_text or "",
            e.parse_status or "",
        ])
    return _csv_response(out, ["Date", "Customer", "Type", "Amount", "Source", "Raw", "Status"], f"bolkhata-entries-{date.today().isoformat()}.csv")