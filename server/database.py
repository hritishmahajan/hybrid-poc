from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./hybridpoc.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class LocationRecord(Base):
    __tablename__ = "locations"

    id         = Column(Integer, primary_key=True, index=True)
    latitude   = Column(Float, nullable=False)
    longitude  = Column(Float, nullable=False)
    accuracy   = Column(Float, nullable=True)
    altitude   = Column(Float, nullable=True)
    address    = Column(String(512), nullable=True)
    device_id  = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PhotoRecord(Base):
    __tablename__ = "photos"

    id         = Column(Integer, primary_key=True, index=True)
    data_url   = Column(Text, nullable=False)   # base64 data URI
    size_bytes = Column(Integer, nullable=True)
    device_id  = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class NotificationRecord(Base):
    __tablename__ = "notifications"

    id         = Column(Integer, primary_key=True, index=True)
    title      = Column(String(256), nullable=False)
    body       = Column(Text, nullable=True)
    status     = Column(String(64), default="sent")   # sent | delivered | failed
    device_id  = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
