from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Index, UniqueConstraint, Date
from sqlalchemy.orm import relationship
from .database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class Shop(Base):
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    shop_name = Column(String, nullable=False)
    owner_name = Column(String, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    language = Column(String, default="Hindi")
    plan_tier = Column(String, default="Free")  # 'Free' | 'Paid'
    entries_used_this_month = Column(Integer, default=0)
    entries_limit = Column(Integer, default=100)
    period_start = Column(Date, default=lambda: date.today())  # month period start for auto-reset
    is_active = Column(String, default="true")  # 'true' | 'false' string to avoid SQLite bool issues, admin can toggle
    created_at = Column(DateTime(timezone=True), default=_utcnow)
    # New fields Phase 3
    upi_id = Column(String, default="")
    shop_photo = Column(String, default="")

    customers = relationship("Customer", back_populates="shop", cascade="all, delete-orphan")
    entries = relationship("Entry", back_populates="shop", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="shop", cascade="all, delete-orphan")


class Customer(Base):
    __tablename__ = "customers"
    __table_args__ = (
        Index("ix_customers_shop_id", "shop_id"),
        Index("ix_customers_shop_name_lower", "shop_id", "name"),
    )

    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, default="")
    balance = Column(Float, default=0)
    upi_id = Column(String, default="")
    created_at = Column(DateTime(timezone=True), default=_utcnow)

    shop = relationship("Shop", back_populates="customers")
    entries = relationship("Entry", back_populates="customer", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="customer", cascade="all, delete-orphan")


class Entry(Base):
    __tablename__ = "entries"
    __table_args__ = (
        Index("ix_entries_shop_id", "shop_id"),
        Index("ix_entries_customer_id", "customer_id"),
        Index("ix_entries_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # 'credit_given' | 'payment_received'
    raw_voice_text = Column(String, default="")
    source = Column(String, default="voice")  # 'voice' | 'manual'
    parse_status = Column(String, default="success")  # 'success' | 'failed'
    created_at = Column(DateTime(timezone=True), default=_utcnow)

    shop = relationship("Shop", back_populates="entries")
    customer = relationship("Customer", back_populates="entries")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    sent_at = Column(DateTime(timezone=True), default=_utcnow)
    method = Column(String, default="whatsapp")

    customer = relationship("Customer", back_populates="reminders")


class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = (
        Index("ix_subscriptions_shop_id", "shop_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    amount = Column(Float, nullable=False)
    razorpay_id = Column(String, default="")
    razorpay_order_id = Column(String, default="")
    status = Column(String, default="Success")  # 'Success' | 'Pending' | 'Failed'
    created_at = Column(DateTime(timezone=True), default=_utcnow)

    shop = relationship("Shop", back_populates="subscriptions")


class PlatformSettings(Base):
    __tablename__ = "platform_settings"
    id = Column(Integer, primary_key=True, index=True)
    # Only one row expected, id=1
    free_entries_limit = Column(Integer, default=100, nullable=False)
    paid_price_inr = Column(Integer, default=99, nullable=False)
    paid_entries_limit = Column(Integer, default=-1)  # -1 = unlimited
    standard_price_inr = Column(Integer, default=49)  # Phase 3: Rs 49 for 500 entries
    standard_entries_limit = Column(Integer, default=500)
    currency = Column(String, default="INR")
    default_language = Column(String, default="Hindi")
    otp_mode = Column(String, default="dev")  # dev | sms
    otp_expiry_minutes = Column(Integer, default=5)
    jwt_expire_minutes = Column(Integer, default=10080)
    razorpay_key_id = Column(String, default="")
    razorpay_key_secret = Column(String, default="")
    razorpay_test_mode = Column(String, default="true")  # string bool for simplicity
    openai_api_key = Column(String, default="")
    anthropic_api_key = Column(String, default="")
    whisper_model = Column(String, default="whisper-1")
    claude_model = Column(String, default="claude-3-haiku-20240307")
    auto_reminder = Column(String, default="true")
    auto_reminder_day = Column(String, default="mon")  # mon..sun for scheduled auto reminders
    auto_reminder_time = Column(String, default="09:00")  # HH:MM local
    last_reminder_run_date = Column(Date, nullable=True)
    plans_json = Column(Text, default="")  # fully dynamic plan definitions (admin-editable)
    wa_template = Column(Text, default="Namaste {name} ji, aapka ₹{balance} udhaar baaki hai. Kripya jald bhugtan karein. Dhanyavaad — BolKhata")
    maintenance_mode = Column(String, default="false")
    razorpay_webhook_secret = Column(String, default="")
    # --- Generic AI Provider (any OpenAI-compatible) ---
    ai_provider = Column(String, default="local")  # local | openai | anthropic | groq | openrouter | custom
    ai_base_url = Column(String, default="")  # e.g. https://api.openai.com/v1 or https://api.groq.com/openai/v1
    ai_api_key = Column(String, default="")
    ai_model = Column(String, default="gpt-4o-mini")
    # --- STT Provider ---
    stt_provider = Column(String, default="browser")  # browser | openai | custom
    stt_base_url = Column(String, default="")
    stt_api_key = Column(String, default="")
    stt_model = Column(String, default="whisper-1")
    # --- WhatsApp Provider ---
    whatsapp_provider = Column(String, default="wa_me")  # wa_me | twilio | interakt | custom | disabled
    whatsapp_base_url = Column(String, default="")
    whatsapp_api_key = Column(String, default="")
    whatsapp_phone_id = Column(String, default="")
    # --- OTP Provider ---
    otp_provider = Column(String, default="dev")  # dev | msg91 | twilio | custom
    otp_base_url = Column(String, default="")
    otp_api_key = Column(String, default="")
    otp_template_id = Column(String, default="")
    # Admin profile overrides (fallback to env ADMIN_EMAIL/ADMIN_PASSWORD)
    admin_name = Column(String, default="")
    admin_email = Column(String, default="")
    admin_password_hash = Column(String, default="")
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)


class OtpStore(Base):
    __tablename__ = "otp_store"
    phone = Column(String, primary_key=True)
    otp = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    attempts = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=_utcnow)


class CashDay(Base):
    __tablename__ = "cash_days"
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    # denominations JSON as Text: {"2000":2, "500":4, ...}
    denominations = Column(Text, default="{}")
    total_cash = Column(Float, default=0)
    udhaar_given = Column(Float, default=0)
    payment_received = Column(Float, default=0)
    expected_cash = Column(Float, default=0)
    diff = Column(Float, default=0)
    note = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), default=_utcnow)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    __table_args__ = (UniqueConstraint("shop_id", "date", name="uq_shop_date"),)


class InsightCache(Base):
    __tablename__ = "insight_cache"
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False, index=True)
    week_start = Column(Date, nullable=False)
    summary = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), default=_utcnow)
