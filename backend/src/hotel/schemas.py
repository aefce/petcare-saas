from pydantic import BaseModel, UUID4, Field
from typing import Optional, List
from datetime import datetime, date
from src.booking.models import BookingStatus

class RoomTypeCreate(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    price_per_night: int
    total_rooms: int = 1
    is_active: bool = True

class RoomTypeResponse(RoomTypeCreate):
    id: UUID4

    class Config:
        from_attributes = True

# --- Physical Room Schemas ---
class RoomCreate(BaseModel):
    room_type_id: UUID4
    room_number: str = Field(..., max_length=50)
    status: str = "AVAILABLE"

class RoomResponse(RoomCreate):
    id: UUID4

    class Config:
        from_attributes = True

# --- Room Booking Schemas ---
class RoomBookingCreate(BaseModel):
    pet_id: UUID4
    room_type_id: UUID4
    check_in_date: date
    check_out_date: date

class RoomBookingResponse(BaseModel):
    id: UUID4
    pet_id: UUID4
    room_type_id: UUID4
    assigned_room_id: Optional[UUID4] = None
    assigned_staff_id: Optional[UUID4] = None
    check_in_date: date
    check_out_date: date
    status: BookingStatus
    total_fee: int
    add_on_fee: Optional[int] = 0
    overtime_fee: Optional[int] = 0
    lock_expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RoomBookingDetailResponse(BaseModel):
    id: UUID4
    pet_name: str
    pet_species: str
    room_type_name: str
    assigned_room_number: Optional[str] = None
    assigned_staff_name: Optional[str] = None
    check_in_date: date
    check_out_date: date
    status: BookingStatus
    total_fee: int
    add_on_fee: Optional[int] = 0
    overtime_fee: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True

# --- Hotel Daily Log Schemas ---
class HotelDailyLogCreate(BaseModel):
    mood_score: Optional[int] = Field(None, ge=1, le=5)
    appetite_score: Optional[int] = Field(None, ge=1, le=5)
    defecation_status: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None
    image_url: Optional[str] = None

class HotelDailyLogResponse(BaseModel):
    id: UUID4
    room_booking_id: UUID4
    staff_id: UUID4
    staff_name: Optional[str] = None
    date: date
    mood_score: Optional[int]
    appetite_score: Optional[int]
    defecation_status: Optional[str]
    notes: Optional[str]
    image_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
