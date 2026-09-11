from datetime import datetime, timedelta, timezone, date

import asyncio

from contextlib import asynccontextmanager

from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text, inspect

from .database import Base, engine, SessionLocal

from . import models

from .config import settings

from .routers import auth, customers, entries, billing, admin, shop, settings as settings_router, voice, cash, insights, export as export_router, password_reset, query as query_router

def _migrate_sqlite():
    try:
        insp = inspect(engine)
        # shops
        if 'shops' in insp.get_table_names():
            cols = [c["name"] for c in insp.get_columns('shops')]
            with engine.begin() as conn:
                if 'period_start' not in cols:
                    conn.execute(text("ALTER TABLE shops ADD COLUMN period_start DATE"))
                    conn.execute(text("UPDATE shops SET period_start = :d"), {"d": date.today().isoformat()})
                if 'is_active' not in cols:
                    conn.execute(text("ALTER TABLE shops ADD COLUMN is_active VARCHAR DEFAULT 'true'"))
                    conn.execute(text("UPDATE shops SET is_active = 'true' WHERE is_active IS NULL"))
                if 'upi_id' not in cols:
                    conn.execute(text("ALTER TABLE shops ADD COLUMN upi_id VARCHAR DEFAULT ''"))
                if 'shop_photo' not in cols:
                    conn.execute(text("ALTER TABLE shops ADD COLUMN shop_photo VARCHAR DEFAULT ''"))
                if 'entries_limit' in cols:
                    # bump old 15 to 100
                    try:
                        conn.execute(text("UPDATE shops SET entries_limit = 100 WHERE entries_limit = 15"))
                    except: pass
                sub_cols = [c["name"] for c in insp.get_columns('subscriptions')]
                if 'razorpay_order_id' not in sub_cols:
                    conn.execute(text("ALTER TABLE subscriptions ADD COLUMN razorpay_order_id VARCHAR"))
            # customers upi
            try:
                ccols = [c["name"] for c in insp.get_columns('customers')]
                with engine.begin() as conn:
                    if 'upi_id' not in ccols:
                        conn.execute(text("ALTER TABLE customers ADD COLUMN upi_id VARCHAR DEFAULT ''"))
            except Exception as e:
                print(f"customer migrate fail {e}")
        # platform_settings new columns
        if 'platform_settings' in insp.get_table_names():
            ps_cols = [c["name"] for c in insp.get_columns('platform_settings')]
            new_cols = {
                'ai_provider': "VARCHAR DEFAULT 'local'",
                'ai_base_url': "VARCHAR DEFAULT ''",
                'ai_api_key': "VARCHAR DEFAULT ''",
                'ai_model': "VARCHAR DEFAULT 'gpt-4o-mini'",
                'stt_provider': "VARCHAR DEFAULT 'browser'",
                'stt_base_url': "VARCHAR DEFAULT ''",
                'stt_api_key': "VARCHAR DEFAULT ''",
                'stt_model': "VARCHAR DEFAULT 'whisper-1'",
                'whatsapp_provider': "VARCHAR DEFAULT 'wa_me'",
                'whatsapp_base_url': "VARCHAR DEFAULT ''",
                'whatsapp_api_key': "VARCHAR DEFAULT ''",
                'whatsapp_phone_id': "VARCHAR DEFAULT ''",
                'otp_provider': "VARCHAR DEFAULT 'dev'",
                'otp_base_url': "VARCHAR DEFAULT ''",
                'otp_api_key': "VARCHAR DEFAULT ''",
                'otp_template_id': "VARCHAR DEFAULT ''",
                'standard_price_inr': "INTEGER DEFAULT 49",
                'standard_entries_limit': "INTEGER DEFAULT 500",
                'plans_json': "TEXT DEFAULT ''",
                'auto_reminder_day': "VARCHAR DEFAULT 'mon'",
                'auto_reminder_time': "VARCHAR DEFAULT '09:00'",
                'last_reminder_run_date': "DATE",
                'admin_name': "VARCHAR DEFAULT ''",
                'admin_email': "VARCHAR DEFAULT ''",
                'admin_password_hash': "VARCHAR DEFAULT ''",
            }
            with engine.begin() as conn:
                for col, typ in new_cols.items():
                    if col not in ps_cols:
                        try:
                            conn.execute(text(f"ALTER TABLE platform_settings ADD COLUMN {col} {typ}"))
                        except Exception as e:
                            print(f"add col {col} failed: {e}")
                        ps_cols.append(col)
                # bump free limit 15->100
                try:
                    conn.execute(text("UPDATE platform_settings SET free_entries_limit=100 WHERE free_entries_limit=15"))
                except: pass
    except Exception as e:
        print(f"Migration check failed: {e}")

@asynccontextmanager

async def lifespan(app: FastAPI):

    # Startup — create tables + migrate

    Base.metadata.create_all(bind=engine)

    _migrate_sqlite()

    # Ensure platform settings exists

    try:

        from .services.settings_service import get_settings

        db = SessionLocal()

        try:

            get_settings(db)

        finally:

            db.close()

    except Exception as e:

        print(f"Settings init failed: {e}")

    seed_demo_data()

    reminder_task = asyncio.create_task(_reminder_sweep_loop())

    yield

    reminder_task.cancel()

    try:
        await reminder_task
    except Exception:
        pass


async def _reminder_sweep_loop():
    """Background loop — checks every 60s whether scheduled auto-reminders should fire."""
    from .services.reminder_job import run_daily_reminders
    while True:
        try:
            db = SessionLocal()
            try:
                run_daily_reminders(db)
            finally:
                db.close()
        except Exception as e:
            print(f"reminder sweep error: {e}")
        try:
            await asyncio.sleep(60)
        except asyncio.CancelledError:
            raise

app = FastAPI(title="BolKhata API", lifespan=lifespan)

app.add_middleware(

    CORSMiddleware,

    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)

app.include_router(auth.router)

app.include_router(customers.router)

app.include_router(entries.router)

app.include_router(billing.router)

app.include_router(admin.router)

app.include_router(shop.router)

app.include_router(settings_router.router)

app.include_router(voice.router)

app.include_router(cash.router)

app.include_router(insights.router)

app.include_router(export_router.router)

app.include_router(password_reset.router)

app.include_router(billing.public)

app.include_router(query_router.router)

@app.get("/api/health")

def health():

    return {"status": "ok", "message": "BolKhata API chal rahi hai"}

def seed_demo_data():

    db = SessionLocal()

    try:

        if db.query(models.Shop).count() > 0:

            return

        def mk_entry(shop, cust, amount, etype, raw, days_ago=0, status="success", source="voice"):

            e = models.Entry(

                shop_id=shop.id, customer_id=cust.id, amount=amount, type=etype,

                raw_voice_text=raw, source=source, parse_status=status,

                created_at=datetime.now(timezone.utc) - timedelta(days=days_ago),

            )

            db.add(e)

        shop1 = models.Shop(shop_name="Sharma Kirana Store", owner_name="Ramesh Sharma",

                             phone="9876543210", plan_tier="Free", entries_used_this_month=8, period_start=date.today())

        db.add(shop1); db.flush()

        c1 = models.Customer(shop_id=shop1.id, name="Ramesh Kumar", phone="+91 98xxx xx210", balance=1500)

        c2 = models.Customer(shop_id=shop1.id, name="Anil Kirana Supply", phone="+91 97xxx xx884", balance=900)

        c3 = models.Customer(shop_id=shop1.id, name="Sunita Devi", phone="+91 99xxx xx031", balance=450)

        c4 = models.Customer(shop_id=shop1.id, name="Manoj Traders", phone="+91 96xxx xx772", balance=200)

        db.add_all([c1, c2, c3, c4]); db.flush()

        mk_entry(shop1, c1, 500, "credit_given", "Ramesh ko paanch sau udhaar diya", days_ago=0)

        mk_entry(shop1, c1, 1000, "credit_given", "Ramesh ko ek hazaar udhaar diya", days_ago=5)

        mk_entry(shop1, c2, 300, "payment_received", "Anil se teen sau mile", days_ago=2)

        mk_entry(shop1, c2, 1200, "credit_given", "Anil ko bara sau udhaar diya", days_ago=15)

        mk_entry(shop1, c3, 450, "credit_given", "Sunita ko saade chaar sau udhaar diya", days_ago=7)

        mk_entry(shop1, c4, 200, "credit_given", "Manoj ko do sau udhaar diya", days_ago=12)

        shop2 = models.Shop(shop_name="Patel Boutique", owner_name="Reena Patel", phone="9998887771",

                             plan_tier="Paid", entries_used_this_month=42, period_start=date.today())

        shop3 = models.Shop(shop_name="Verma General Store", owner_name="Suresh Verma", phone="9998887772",

                             plan_tier="Paid", entries_used_this_month=31, period_start=date.today())

        shop4 = models.Shop(shop_name="Iqbal Cloth House", owner_name="Salim Iqbal", phone="9998887773",

                             plan_tier="Free", entries_used_this_month=0, period_start=date.today())

        shop5 = models.Shop(shop_name="Deshmukh Vegetables", owner_name="Vijay Deshmukh", phone="9998887774",

                             plan_tier="Free", entries_used_this_month=5, period_start=date.today())

        db.add_all([shop2, shop3, shop4, shop5]); db.flush()

        db.add(models.Subscription(shop_id=shop2.id, amount=99, razorpay_id="pay_NqX2demo881", status="Success"))

        db.add(models.Subscription(shop_id=shop3.id, amount=99, razorpay_id="pay_NqV1demo730", status="Success"))

        db.add(models.Subscription(shop_id=shop4.id, amount=99, razorpay_id="pay_NqT4demo558", status="Failed"))

        rcust = models.Customer(shop_id=shop2.id, name="Anita Sharma", phone="+91 90xxx xx001", balance=2000)

        vcust = models.Customer(shop_id=shop3.id, name="Deepak Rao", phone="+91 90xxx xx002", balance=300)

        dcust = models.Customer(shop_id=shop5.id, name="Farmer Suresh", phone="+91 90xxx xx003", balance=500)

        db.add_all([rcust, vcust, dcust]); db.flush()

        mk_entry(shop2, rcust, 2000, "payment_received", "Reena se do hazaar mile the wapas", days_ago=0)

        mk_entry(shop3, vcust, 300, "credit_given", "Anita ko teen sau udhaar", days_ago=0)

        mk_entry(shop5, dcust, 500, "credit_given", "kal wo paanch sau wala kaam...", days_ago=0, status="failed")

        db.commit()

    finally:

        db.close()

