from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# SQLite needs check_same_thread, Postgres needs pooling
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
if settings.DATABASE_URL.startswith("postgresql") or settings.DATABASE_URL.startswith("postgres"):
    # Postgres: connection pooling + pre-ping for Render/Railway
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_recycle=300,
    )
else:
    engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
