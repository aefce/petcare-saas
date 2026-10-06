from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime

class AttendanceResponse(BaseModel):
    id: UUID4
    account_id: UUID4
    clock_in_time: datetime
    clock_out_time: Optional[datetime]
    status: str

    class Config:
        from_attributes = True
