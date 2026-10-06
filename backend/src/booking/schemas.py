from pydantic import BaseModel, UUID4, Field
from typing import Optional, List
from datetime import datetime
from src.booking.models import BookingStatus

class PetCreate(BaseModel):
    name: str = Field(..., max_length=100)
    species: str = Field(..., max_length=50)
    breed: Optional[str] = None
    weight_kg: Optional[float] = None
    medical_notes: Optional[str] = None
    avatar_url: Optional[str] = None

class PetResponse(PetCreate):
    id: UUID4
    owner_id: UUID4
    is_vaccine_valid: bool = False
    
    class Config:
        from_attributes = True

class VaccineRecordCreate(BaseModel):
    vaccine_name: str = Field(..., max_length=100)
    expiry_date: datetime

class VaccineRecordResponse(BaseModel):
    id: UUID4
    pet_id: UUID4
    vaccine_name: str
    status: str
    expiry_date: datetime
    file_url: Optional[str] = None
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


class ServiceItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int
    price: int

class ServiceItemResponse(ServiceItemCreate):
    id: UUID4
    is_active: bool
    
    class Config:
        from_attributes = True

class TimeSlotCreate(BaseModel):
    start_time: datetime
    end_time: datetime
    service_item_id: Optional[UUID4] = None
    max_capacity: int = 1

class TimeSlotResponse(TimeSlotCreate):
    id: UUID4
    is_available: bool
    
    class Config:
        from_attributes = True

class CreateBookingReq(BaseModel):
    pet_id: UUID4
    service_item_id: UUID4
    time_slot_id: UUID4

class BookingResponse(BaseModel):
    id: UUID4
    pet_id: UUID4
    service_item_id: UUID4
    time_slot_id: UUID4
    status: BookingStatus
    lock_expires_at: Optional[datetime]
    fee_charged: int
    
    class Config:
        from_attributes = True

class BookingDetailResponse(BaseModel):
    id: UUID4
    pet_name: str
    service_name: str
    start_time: datetime
    status: BookingStatus
    refund_status: Optional[str] = None

    class Config:
        from_attributes = True

