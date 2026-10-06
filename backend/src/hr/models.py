import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from src.core.models import Base

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False, index=True)
    clock_in_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    clock_out_time = Column(DateTime, nullable=True)
    status = Column(String(50), default="PRESENT") # PRESENT, ABSENT, LATE, etc.
    
    account = relationship("Account")
