from pydantic import BaseModel, UUID4, Field
from typing import Optional
from datetime import datetime

class ServiceRecordCreate(BaseModel):
    mood_score: int = Field(..., ge=1, le=5, description="情緒評分 (1-5)")
    appetite_score: int = Field(..., ge=1, le=5, description="食慾評分 (1-5)")
    notes: Optional[str] = None
    image_url: Optional[str] = None
    is_abnormal: Optional[bool] = False
    food_type: Optional[str] = None
    food_weight_g: Optional[int] = None
    health_check_results: Optional[str] = None

class ServiceRecordResponse(BaseModel):
    id: UUID4
    booking_id: UUID4
    staff_id: UUID4
    staff_name: str
    mood_score: Optional[int]
    appetite_score: Optional[int]
    notes: Optional[str]
    image_url: Optional[str]
    food_type: Optional[str] = None
    food_weight_g: Optional[int] = None
    health_check_results: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StaffNotificationResponse(BaseModel):
    id: UUID4
    title: str
    content: str
    sender_name: Optional[str] = None
    recipient_role: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

