
import requests

def send_otp_via_provider(phone: str, otp: str, provider: str, base_url: str, api_key: str, template_id: str = "") -> tuple[bool, str]:
    """
    Send OTP via provider. Returns (success, detail)
    Providers: dev (no send, return OTP), msg91, twilio, custom
    """
    if provider == "dev":
        return True, f"Dev mode — OTP {otp} (no SMS)"
    try:
        if not base_url or not api_key:
            return False, "Base URL / Key missing"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {"phone": phone, "otp": otp, "template_id": template_id}
        url = base_url
        # Heuristic for known providers
        if provider == "msg91":
            # MSG91: https://control.msg91.com/api/v5/otp?mobile=91PHONE&otp=OTP
            url = f"{base_url.rstrip('/')}/api/v5/otp?mobile=91{phone}&otp={otp}"
            if template_id:
                url += f"&template_id={template_id}"
            headers = {"authkey": api_key}
            payload = None
            resp = requests.get(url, headers=headers, timeout=10) if payload is None else requests.post(url, json=payload, headers=headers, timeout=10)
        elif provider == "twilio":
            # Twilio Verify: POST https://verify.twilio.com/v2/Services/{ServiceSid}/Verifications
            # Simplified
            resp = requests.post(url, data={"To": f"+91{phone}", "Channel": "sms"}, auth=(api_key.split(":")[0], api_key.split(":")[1] if ":" in api_key else ""), timeout=10)
        else:
            # custom generic POST {phone, otp}
            resp = requests.post(url, json=payload, headers=headers, timeout=10)
        if resp.status_code in (200, 201, 202):
            return True, f"Sent via {provider}"
        else:
            return False, f"{provider} error {resp.status_code}: {resp.text[:300]}"
    except Exception as e:
        return False, str(e)[:300]
