from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime
from src.payment.models import RefundStatus

class RefundCreateRequest(BaseModel):
    booking_id: UUID4
    reason: str
    details: Optional[str] = None

class RefundResponse(BaseModel):
    id: UUID4
    booking_id: UUID4
    pet_name: str
    service_name: str
    amount: int
    reason: str
    details: Optional[str] = None
    status: RefundStatus
    requested_by_id: UUID4
    approved_by_id: Optional[UUID4] = None
    created_at: datetime
    
    class Config:
        orm_mode = True
