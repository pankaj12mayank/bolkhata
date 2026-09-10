import json

from sqlalchemy.orm import Session

from .. import models

DEFAULT_PLANS = [
    {
        "id": "free",
        "name": "Free",
        "price": 0,
        "entries_limit": 100,
        "highlight": False,
        "tag": None,
        "features_en": [
            "100 entries every month",
            "Manual & voice udhaar entry",
            "Customers & baaki ledger",
            "WhatsApp payment reminders (wa.me)",
        ],
        "features_hi": [
            "हर महीने 100 एंट्री तक",
            "मैन्युअल व वॉइस उधार एंट्री",
            "ग्राहक व बाकी की बही",
            "व्हाट्सऐप payment रिमाइंडर (wa.me)",
        ],
    },
    {
        "id": "standard",
        "name": "Standard",
        "price": 49,
        "entries_limit": 500,
        "highlight": False,
        "tag": "starter",
        "features_en": [
            "Everything in Free, plus:",
            "500 entries every month",
            "Unlimited customers & old ledger",
            "CSV export of ledger & entries",
            "Scheduled auto WhatsApp reminders",
        ],
        "features_hi": [
            "Free के सब कुछ, plus:",
            "हर महीने 500 एंट्री",
            "अनलिमिटेड ग्राहक व पुरानी बही",
            "बही व एंट्री का CSV निर्यात (export)",
            "शेड्यूल्ड auto WhatsApp रिमाइंडर",
        ],
    },
    {
        "id": "paid",
        "name": "Paid",
        "price": 99,
        "entries_limit": None,  # None = unlimited
        "highlight": True,
        "tag": "popular",
        "features_en": [
            "Everything in Standard, plus:",
            "Unlimited entries",
            "UPI payment links in reminders",
            "Priority support",
            "Access to upcoming pro features",
        ],
        "features_hi": [
            "Standard के सब कुछ, plus:",
            "अनलिमिटेड एंट्री",
            "रिमाइंडर में UPI payment लिंक",
            "Priority सपोर्ट",
            "आने वाले Pro फीचर का access",
        ],
    },
]

PLAN_IDS = {"free", "standard", "paid"}


def _legacy_plan(pid: str, s: models.PlatformSettings) -> dict:
    base = next((p for p in DEFAULT_PLANS if p["id"] == pid), None) or {}
    cfg = {
        "free": {"price": 0, "entries_limit": s.free_entries_limit, "highlight": False, "tag": None},
        "standard": {
            "price": getattr(s, "standard_price_inr", 49) or 49,
            "entries_limit": getattr(s, "standard_entries_limit", 500) or 500,
            "highlight": False,
            "tag": "starter",
        },
        "paid": {
            "price": s.paid_price_inr,
            "entries_limit": None if (s.paid_entries_limit is not None and s.paid_entries_limit < 0) else s.paid_entries_limit,
            "highlight": True,
            "tag": "popular",
        },
    }[pid]
    return {
        "id": pid,
        "name": base.get("name", pid.capitalize()),
        "price": cfg["price"],
        "entries_limit": cfg["entries_limit"],
        "highlight": cfg["highlight"],
        "tag": cfg["tag"],
        "features_en": base.get("features_en", []),
        "features_hi": base.get("features_hi", []),
    }


def get_plans(s: models.PlatformSettings) -> list[dict]:
    """Return the live plan list. Uses admin-edited plans_json when present,
    otherwise builds from legacy price/limit settings with default features."""
    raw = getattr(s, "plans_json", "") or ""
    if raw:
        try:
            plans = json.loads(raw)
            if isinstance(plans, list) and len(plans) == 3:
                # normalize missing keys from defaults
                defaults = {p["id"]: p for p in DEFAULT_PLANS}
                out = []
                for p in plans:
                    d = defaults.get(p.get("id"), {})
                    merged = {**d, **p}
                    merged.setdefault("features_en", d.get("features_en", []))
                    merged.setdefault("features_hi", d.get("features_hi", []))
                    merged.setdefault("entries_limit", d.get("entries_limit"))
                    out.append(merged)
                # enforce order free, standard, paid
                order = {"free": 0, "standard": 1, "paid": 2}
                out.sort(key=lambda x: order.get(x.get("id"), 9))
                return out
        except Exception:
            pass
    return [_legacy_plan("free", s), _legacy_plan("standard", s), _legacy_plan("paid", s)]


def save_plans(db: Session, s: models.PlatformSettings, plans: list[dict]) -> list[dict]:
    """Validate + persist admin plan edits, and sync legacy price/limit columns
    so billing limits, orders and the subscription measure stay in sync."""
    if not isinstance(plans, list) or len(plans) != 3:
        raise ValueError("3 plans chahiye (Free, Standard, Paid)")
    by_id = {}
    for p in plans:
        pid = str(p.get("id", ""))
        if pid not in PLAN_IDS:
            raise ValueError(f"Invalid plan id: {pid}")
        p["name"] = str(p.get("name", "")).strip() or pid.capitalize()
        p["price"] = int(p.get("price", 0) or 0)
        if p["price"] < 0:
            p["price"] = 0
        entries = p.get("entries_limit")
        if entries is None or (isinstance(entries, str) and str(entries).strip() in ("", "-1")):
            p["entries_limit"] = None
        else:
            p["entries_limit"] = int(entries)
        p["highlight"] = bool(p.get("highlight", False))
        p["tag"] = p.get("tag") or None
        p["features_en"] = [str(x).strip() for x in (p.get("features_en") or []) if str(x).strip()]
        p["features_hi"] = [str(x).strip() for x in (p.get("features_hi") or []) if str(x).strip()]
        by_id[pid] = p
    ordered = [by_id["free"], by_id["standard"], by_id["paid"]]
    s.plans_json = json.dumps(ordered, ensure_ascii=False)

    free = by_id["free"]
    std = by_id["standard"]
    paid = by_id["paid"]
    s.free_entries_limit = int(free["entries_limit"] or 100)
    s.standard_price_inr = int(std["price"])
    s.standard_entries_limit = int(std["entries_limit"] or 500)
    s.paid_price_inr = int(paid["price"])
    s.paid_entries_limit = -1 if paid["entries_limit"] is None else int(paid["entries_limit"])
    db.commit()
    db.refresh(s)
    return ordered