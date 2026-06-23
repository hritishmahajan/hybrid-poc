from fastapi import FastAPI, Depends, HTTPException, Header, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import sys, os

from database import get_db, create_tables, LocationRecord, PhotoRecord, NotificationRecord
from schemas import (
    LocationCreate, LocationOut,
    PhotoCreate, PhotoOut, PhotoListItem,
    NotificationCreate, NotificationOut,
    StatsOut
)

API_KEY = "hybridpoc-secret-2025"

app = FastAPI(title="HybridPOC Admin API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.on_event("startup")
def startup():
    create_tables()
    print("✓ Database tables ready", file=sys.stderr)


@app.get("/admin", include_in_schema=False)
def admin_dashboard():
    admin_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "admin.html")
    return FileResponse(admin_path, media_type="text/html")


# localhost requests skip the API key check — makes local dev frictionless
def verify_key(request: Request):
    host = request.headers.get("host", "")
    if "localhost" in host or "127.0.0.1" in host:
        return True
    key = (
        request.headers.get("x-api-key") or
        request.headers.get("X-Api-Key") or
        request.query_params.get("api_key")
    )
    if key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return key


@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}


@app.get("/api/stats", response_model=StatsOut)
def get_stats(request: Request, db: Session = Depends(get_db)):
    verify_key(request)
    total_loc   = db.query(LocationRecord).count()
    total_photo = db.query(PhotoRecord).count()
    total_notif = db.query(NotificationRecord).count()
    latest_loc   = db.query(LocationRecord).order_by(LocationRecord.created_at.desc()).first()
    latest_photo = db.query(PhotoRecord).order_by(PhotoRecord.created_at.desc()).first()
    latest_notif = db.query(NotificationRecord).order_by(NotificationRecord.created_at.desc()).first()
    return StatsOut(
        total_locations=total_loc,
        total_photos=total_photo,
        total_notifications=total_notif,
        latest_location=latest_loc,
        latest_photo=latest_photo,
        latest_notification=latest_notif,
    )


@app.post("/api/locations", response_model=LocationOut, status_code=201)
def create_location(request: Request, payload: LocationCreate, db: Session = Depends(get_db)):
    verify_key(request)
    record = LocationRecord(**payload.model_dump())
    db.add(record); db.commit(); db.refresh(record)
    return record

@app.get("/api/locations", response_model=List[LocationOut])
def list_locations(request: Request, skip: int = Query(0, ge=0), limit: int = Query(50, le=200), db: Session = Depends(get_db)):
    verify_key(request)
    return db.query(LocationRecord).order_by(LocationRecord.created_at.desc()).offset(skip).limit(limit).all()

@app.delete("/api/locations/{record_id}")
def delete_location(request: Request, record_id: int, db: Session = Depends(get_db)):
    verify_key(request)
    record = db.query(LocationRecord).filter(LocationRecord.id == record_id).first()
    if not record: raise HTTPException(status_code=404, detail="Not found")
    db.delete(record); db.commit()
    return {"deleted": record_id}


@app.post("/api/photos", response_model=PhotoOut, status_code=201)
def create_photo(request: Request, payload: PhotoCreate, db: Session = Depends(get_db)):
    verify_key(request)
    size = len(payload.data_url.encode("utf-8"))
    record = PhotoRecord(**payload.model_dump(), size_bytes=size)
    db.add(record); db.commit(); db.refresh(record)
    return record

@app.get("/api/photos", response_model=List[PhotoListItem])
def list_photos(request: Request, skip: int = Query(0, ge=0), limit: int = Query(50, le=200), db: Session = Depends(get_db)):
    verify_key(request)
    return db.query(PhotoRecord).order_by(PhotoRecord.created_at.desc()).offset(skip).limit(limit).all()

@app.get("/api/photos/{photo_id}", response_model=PhotoOut)
def get_photo(request: Request, photo_id: int, db: Session = Depends(get_db)):
    verify_key(request)
    record = db.query(PhotoRecord).filter(PhotoRecord.id == photo_id).first()
    if not record: raise HTTPException(status_code=404, detail="Not found")
    return record

@app.delete("/api/photos/{photo_id}")
def delete_photo(request: Request, photo_id: int, db: Session = Depends(get_db)):
    verify_key(request)
    record = db.query(PhotoRecord).filter(PhotoRecord.id == photo_id).first()
    if not record: raise HTTPException(status_code=404, detail="Not found")
    db.delete(record); db.commit()
    return {"deleted": photo_id}


@app.post("/api/notifications", response_model=NotificationOut, status_code=201)
def create_notification(request: Request, payload: NotificationCreate, db: Session = Depends(get_db)):
    verify_key(request)
    record = NotificationRecord(**payload.model_dump())
    db.add(record); db.commit(); db.refresh(record)
    return record

@app.get("/api/notifications", response_model=List[NotificationOut])
def list_notifications(request: Request, skip: int = Query(0, ge=0), limit: int = Query(50, le=200), db: Session = Depends(get_db)):
    verify_key(request)
    return db.query(NotificationRecord).order_by(NotificationRecord.created_at.desc()).offset(skip).limit(limit).all()

@app.delete("/api/notifications/{record_id}")
def delete_notification(request: Request, record_id: int, db: Session = Depends(get_db)):
    verify_key(request)
    record = db.query(NotificationRecord).filter(NotificationRecord.id == record_id).first()
    if not record: raise HTTPException(status_code=404, detail="Not found")
    db.delete(record); db.commit()
    return {"deleted": record_id}
