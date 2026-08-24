import hmac
import hashlib
import random
import string

def generate_mock_ids():
    rand = "".join(random.choices(string.ascii_letters + string.digits, k=14))
    return f"order_mock_{rand}", f"pay_{rand}"

def verify_signature(order_id: str, payment_id: str, signature: str, secret: str) -> bool:
    """Verify Razorpay signature: HMAC_SHA256(order_id|payment_id, secret)"""
    if not secret:
        return False
    payload = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

def create_razorpay_order(key_id: str, key_secret: str, amount_paise: int, currency: str = "INR", receipt: str = "") -> dict:
    """
    Create Razorpay order via REST API.
    Returns dict with id, amount, currency.
    Raises exception on failure.
    """
    import requests
    import base64

    if not key_id or not key_secret:
        raise ValueError("Razorpay keys not configured")

    url = "https://api.razorpay.com/v1/orders"
    auth_str = base64.b64encode(f"{key_id}:{key_secret}".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_str}",
        "Content-Type": "application/json",
    }
    payload = {
        "amount": amount_paise,
        "currency": currency,
        "receipt": receipt or f"rcpt_{random.randint(10000,99999)}",
        "payment_capture": 1,
    }
    resp = requests.post(url, json=payload, headers=headers, timeout=10)
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Razorpay error {resp.status_code}: {resp.text}")
    return resp.json()

def verify_webhook_signature(body: bytes, signature: str, webhook_secret: str) -> bool:
    if not webhook_secret:
        return False
    expected = hmac.new(webhook_secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
