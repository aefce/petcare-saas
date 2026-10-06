import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from src.core.models import Base, SoftDeleteMixin

class RefundStatus(str, enum.Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL" # 待審核 (異常理由)
    AUTO_APPROVED = "AUTO_APPROVED"       # 系統自動批准
    MANUAL_APPROVED = "MANUAL_APPROVED"   # 店長人工批准
    REJECTED = "REJECTED"                 # 店長駁回

class RefundRequest(Base, SoftDeleteMixin):
    __tablename__ = "refund_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True)
    room_booking_id = Column(UUID(as_uuid=True), ForeignKey("room_bookings.id"), nullable=True)
    
    amount = Column(Integer, nullable=False)
    reason = Column(String(200), nullable=False)
    details = Column(Text, nullable=True) # 給店長看的補充說明
    
    status = Column(Enum(RefundStatus), default=RefundStatus.PENDING_APPROVAL, nullable=False)
    
    requested_by_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    booking = relationship("Booking")
    room_booking = relationship("RoomBooking")
    requested_by = relationship("Account", foreign_keys=[requested_by_id])
    approved_by = relationship("Account", foreign_keys=[approved_by_id])
