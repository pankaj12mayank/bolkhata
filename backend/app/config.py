import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))

    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@bolkhata.in")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

    DEV_OTP = os.getenv("DEV_OTP", "1234")

    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
    RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./bolkhata.db")


settings = Settings()
