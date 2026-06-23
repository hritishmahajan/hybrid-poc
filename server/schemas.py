from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ── Location ──────────────────────────────────────────────────────────────────

class LocationCreate(BaseModel):
    latitude:  float
    longitude: float
    accuracy:  Optional[float] = None
    altitude:  Optional[float] = None
    address:   Optional[str]   = None
    device_id: Optional[str]   = None

class LocationOut(BaseModel):
    id:         int
    latitude:   float
    longitude:  float
    accuracy:   Optional[float]
    altitude:   Optional[float]
    address:    Optional[str]
    device_id:  Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Photo ─────────────────────────────────────────────────────────────────────

class PhotoCreate(BaseModel):
    data_url:  str             # base64 data URI
    device_id: Optional[str] = None

class PhotoOut(BaseModel):
    id:         int
    data_url:   str
    size_bytes: Optional[int]
    device_id:  Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class PhotoListItem(BaseModel):
    """Slim version for list views — no data_url to keep payload small"""
    id:         int
    size_bytes: Optional[int]
    device_id:  Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Notification ──────────────────────────────────────────────────────────────

class NotificationCreate(BaseModel):
    title:     str
    body:      Optional[str] = None
    status:    Optional[str] = "sent"
    device_id: Optional[str] = None

class NotificationOut(BaseModel):
    id:         int
    title:      str
    body:       Optional[str]
    status:     str
    device_id:  Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Stats ─────────────────────────────────────────────────────────────────────

class StatsOut(BaseModel):
    total_locations:     int
    total_photos:        int
    total_notifications: int
    latest_location:     Optional[LocationOut]
    latest_photo:        Optional[PhotoListItem]
    latest_notification: Optional[NotificationOut]
