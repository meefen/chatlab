from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Get the database URL using the new configuration method
DATABASE_URL = settings.get_database_url()

# Configure engine based on database type
if settings.is_postgresql:
    # PostgreSQL configuration
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False  # Set to True for SQL debugging
    )
else:
    # SQLite configuration
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False  # Set to True for SQL debugging
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

def get_database_info():
    """Get information about the current database configuration"""
    return {
        "database_url": DATABASE_URL,
        "is_postgresql": settings.is_postgresql,
        "is_production": settings.is_production,
        "environment": settings.ENVIRONMENT
    }