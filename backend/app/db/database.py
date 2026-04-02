from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker  
from app.core.config import settings
from sqlalchemy.engine import URL

url = URL.create(
    drivername="mysql+pymysql",
    username=settings.DB_USER,
    password=settings.DB_PASS,   # SQLAlchemy handles special chars safely
    host=settings.DB_HOST,
    port=settings.DB_PORT,
    database=settings.DB_NAME,
)

# Hosted MySQL often caps max_user_connections (e.g. 5). Default SQLAlchemy pool_size=5
# + max_overflow=10 can exceed that when MQTT + many API calls overlap.
# One pooled connection per process keeps total DB sessions predictable; requests wait in queue.
engine = create_engine(
    url,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=1,
    max_overflow=0,
    pool_timeout=120,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db() -> None:
    from app.models import sensor  # noqa
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()