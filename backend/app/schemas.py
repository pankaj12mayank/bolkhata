from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


# ---------- AUTH ----------
class SendOtpIn(BaseModel):
    phone: str


class VerifyOtpIn(BaseModel):
    phone: str
    otp: str
    is_register: bool = False
    shop_name: Optional[str] = None
    owner_name: Optional[str] = None
    language: Optional[str] = "Hindi"


class AdminLoginIn(BaseModel):
    email: str
    password: str


class TokenOut(BaseModel):
    token: str
    role: Literal["user", "admin"]


# ---------- SHOP ----------
class ShopOut(BaseModel):
    id: int
    shop_name: str
    owner_name: str
    phone: str
    language: str
    plan_tier: str
    entries_used_this_month: int
    entries_limit: int

    class Config:
        from_attributes = True


class ShopUpdateIn(BaseModel):
    shop_name: Optional[str] = None
    owner_name: Optional[str] = None
    language: Optional[str] = None


# ---------- CUSTOMER ----------
class EntryOut(BaseModel):
    id: int
    amount: float
    type: str
    raw_voice_text: str
    source: str
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerOut(BaseModel):
    id: int
    name: str
    phone: str
    balance: float

    class Config:
        from_attributes = True


class CustomerDetailOut(CustomerOut):
    entries: list[EntryOut] = []


class CustomerCreateIn(BaseModel):
    name: str
    phone: Optional[str] = ""
    balance: Optional[float] = 0


class CustomerUpdateIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


# ---------- ENTRY ----------
class EntryCreateIn(BaseModel):
    customer_name: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0, le=10000000)
    type: Literal["credit_given", "payment_received"]
    raw_voice_text: str = ""
    source: Literal["voice", "manual"] = "voice"
    parse_status: Literal["success", "failed"] = "success"


class VoiceTranscribeOut(BaseModel):
    text: str
    language: str = "hi"


class VoiceParseIn(BaseModel):
    text: str
    language: Optional[str] = "Hinglish"


class VoiceParseOut(BaseModel):
    customer_name: str
    amount: float
    type: Literal["credit_given", "payment_received"]
    confidence: float = 1.0
    raw_text: str


class EntryResultOut(BaseModel):
    entry: EntryOut
    customer: CustomerOut
    is_new_customer: bool


class HomeEntryOut(BaseModel):
    customer_name: str
    amount: float
    type: str
    created_at: datetime


# ---------- BILLING ----------
class BillingOut(BaseModel):
    tier: str
    used: int
    limit: int
    price: int = 99


class BillingOrderOut(BaseModel):
    order_id: str
    amount: int  # in paise
    currency: str = "INR"
    key_id: str = ""  # razorpay key to use on frontend
    mock: bool = False  # true if keys not configured -> mock flow


class BillingVerifyIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class BillingTestIn(BaseModel):
    key_id: str
    key_secret: str


# ---------- ADMIN ----------
class AdminShopOut(BaseModel):
    id: int
    shop_name: str
    owner_name: str
    plan_tier: str
    entries_used_this_month: int
    created_at: datetime

    class Config:
        from_attributes = True


class SubscriptionOut(BaseModel):
    id: int
    shop_id: int
    amount: float
    razorpay_id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminLogOut(BaseModel):
    shop_name: str
    raw_voice_text: str
    parsed_summary: str
    status: str
    created_at: datetime


# ---------- PLATFORM SETTINGS ----------
class PlatformSettingsOut(BaseModel):
    free_entries_limit: int
    paid_price_inr: int
    paid_entries_limit: int
    currency: str
    default_language: str
    otp_mode: str
    otp_expiry_minutes: int
    jwt_expire_minutes: int
    razorpay_key_id: str
    razorpay_key_secret: str  # masked on GET, full only if needed
    razorpay_test_mode: str
    razorpay_webhook_secret: str
    openai_api_key: str
    anthropic_api_key: str
    whisper_model: str
    claude_model: str
    auto_reminder: str
    wa_template: str
    maintenance_mode: str
    # generic providers
    ai_provider: str = "local"
    ai_base_url: str = ""
    ai_api_key: str = ""
    ai_model: str = "gpt-4o-mini"
    stt_provider: str = "browser"
    stt_base_url: str = ""
    stt_api_key: str = ""
    stt_model: str = "whisper-1"
    whatsapp_provider: str = "wa_me"
    whatsapp_base_url: str = ""
    whatsapp_api_key: str = ""
    whatsapp_phone_id: str = ""
    otp_provider: str = "dev"
    otp_base_url: str = ""
    otp_api_key: str = ""
    otp_template_id: str = ""
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PlatformSettingsUpdateIn(BaseModel):
    free_entries_limit: Optional[int] = Field(default=None, ge=1, le=10000)
    paid_price_inr: Optional[int] = Field(default=None, ge=0, le=100000)
    paid_entries_limit: Optional[int] = None
    currency: Optional[str] = None
    default_language: Optional[str] = None
    otp_mode: Optional[str] = None
    otp_expiry_minutes: Optional[int] = Field(default=None, ge=1, le=60)
    jwt_expire_minutes: Optional[int] = Field(default=None, ge=5, le=525600)
    razorpay_key_id: Optional[str] = None
    razorpay_key_secret: Optional[str] = None
    razorpay_test_mode: Optional[str] = None
    razorpay_webhook_secret: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    whisper_model: Optional[str] = None
    claude_model: Optional[str] = None
    auto_reminder: Optional[str] = None
    wa_template: Optional[str] = None
    maintenance_mode: Optional[str] = None
    ai_provider: Optional[str] = None
    ai_base_url: Optional[str] = None
    ai_api_key: Optional[str] = None
    ai_model: Optional[str] = None
    stt_provider: Optional[str] = None
    stt_base_url: Optional[str] = None
    stt_api_key: Optional[str] = None
    stt_model: Optional[str] = None
    whatsapp_provider: Optional[str] = None
    whatsapp_base_url: Optional[str] = None
    whatsapp_api_key: Optional[str] = None
    whatsapp_phone_id: Optional[str] = None
    otp_provider: Optional[str] = None
    otp_base_url: Optional[str] = None
    otp_api_key: Optional[str] = None
    otp_template_id: Optional[str] = None


class ConnectionTestOut(BaseModel):
    success: bool
    message: str
    detail: Optional[str] = None


class ResetConfirm(BaseModel):
    confirm: str = Field(..., description="Type RESET to confirm")
