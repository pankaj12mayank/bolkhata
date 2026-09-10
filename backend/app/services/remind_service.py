from urllib.parse import quote

from .. import models


def build_message(customer: models.Customer, shop: models.Shop, ps: models.PlatformSettings, include_upi: bool = True) -> str:
    template = ps.wa_template or "Namaste {name} ji, aapka \u20b9{balance} udhaar baaki hai. Kripya jald bhugtan karein. Dhanyavaad \u2014 BolKhata"
    try:
        message = template.format(name=customer.name.split(' ')[0], balance=f"{customer.balance:.0f}", full_name=customer.name)
    except Exception:
        message = template.replace("{name}", customer.name.split(' ')[0]).replace("{balance}", f"{customer.balance:.0f}")
    message = message.replace("{shop}", shop.shop_name)

    if include_upi and customer.balance > 0:
        payee = getattr(customer, 'upi_id', '') or ''
        upi = getattr(shop, 'upi_id', '') or ''
        pa = payee or upi
        if pa:
            link = f"upi://pay?pa={pa}&am={customer.balance:.0f}&tn={quote(f'BolKhata {customer.name}')}"
            message += f"\n\n{link}"
    return message


def get_wa_link(phone: str, message: str) -> str:
    prefix = f"https://wa.me/"
    query = f"?text={quote(message)}"
    digits = "".join(c for c in (phone or "") if c.isdigit())
    if len(digits) == 10:
        digits = "91" + digits
    if len(digits) >= 12:
        return f"{prefix}{digits}{query}"
    return f"{prefix}{query}"


def dispatch(customer: models.Customer, shop: models.Shop, ps: models.PlatformSettings, include_upi: bool = True) -> dict:
    """Build reminder + try auto-send via configured provider. Returns message + wa_link + auto status."""
    message = build_message(customer, shop, ps, include_upi=include_upi)
    wa_link = get_wa_link(customer.phone or "", message)
    auto_sent = False
    auto_detail = ""
    try:
        from ..services.whatsapp_service import send_whatsapp_via_provider
        provider = getattr(ps, 'whatsapp_provider', 'wa_me') or 'wa_me'
        base_url = getattr(ps, 'whatsapp_base_url', '') or ''
        api_key = getattr(ps, 'whatsapp_api_key', '') or ''
        phone_id = getattr(ps, 'whatsapp_phone_id', '') or ''
        if provider not in ("wa_me", "disabled") and base_url and api_key:
            ok, detail = send_whatsapp_via_provider(customer.phone or "", message, provider, base_url, api_key, phone_id)
            if ok and "https://wa.me" not in detail:
                auto_sent = True
                auto_detail = detail
                wa_link = get_wa_link(customer.phone or "", message)
            elif ok:
                wa_link = detail
    except Exception as e:
        auto_detail = str(e)[:200]
    # Fallback wa.me link if not auto_sent
    if not auto_sent:
        wa_link = wa_link or get_wa_link(customer.phone or "", message)
    return {"message": message, "wa_link": wa_link, "auto_sent": auto_sent, "detail": auto_detail,
            "provider": getattr(ps, 'whatsapp_provider', 'wa_me')}