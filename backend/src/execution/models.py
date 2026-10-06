import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from src.core.models import Base, SoftDeleteMixin

class ServiceRecord(Base, SoftDeleteMixin):
    __tablename__ = "service_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False, index=True)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("staff_accounts.id"), nullable=False)
    
    mood_score = Column(Integer, nullable=True)     # 1-5
    appetite_score = Column(Integer, nullable=True) # 1-5
    notes = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    
    # 擴充餵食與健康檢測欄位
    food_type = Column(String(100), nullable=True)
    food_weight_g = Column(Integer, nullable=True)
    health_check_results = Column(Text, nullable=True) # 儲存 JSON 或文字格式的檢測結果
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    booking = relationship("Booking")
    staff = relationship("StaffAccount")


class StaffNotification(Base, SoftDeleteMixin):
    __tablename__ = "staff_notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    sender_name = Column(String(100), nullable=True)
    recipient_role = Column(String(50), nullable=True) # e.g. "資深照護員", "店長"
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
