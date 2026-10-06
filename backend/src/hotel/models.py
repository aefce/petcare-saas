import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Date, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from src.core.models import Base, SoftDeleteMixin
from src.booking.models import BookingStatus

class RoomType(Base, SoftDeleteMixin):
    __tablename__ = "room_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price_per_night = Column(Integer, nullable=False)
    total_rooms = Column(Integer, default=1, nullable=False) # 每日最大容納房間數
    is_active = Column(Boolean, default=True)

class Room(Base, SoftDeleteMixin):
    __tablename__ = "rooms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_type_id = Column(UUID(as_uuid=True), ForeignKey("room_types.id"), nullable=False)
    room_number = Column(String(50), nullable=False, unique=True) # 房號，例如 "A01", "B02"
    status = Column(String(50), default="AVAILABLE") # AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE

    room_type = relationship("RoomType")

class RoomBooking(Base, SoftDeleteMixin):
    __tablename__ = "room_bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pet_id = Column(UUID(as_uuid=True), ForeignKey("pets.id"), nullable=False)
    room_type_id = Column(UUID(as_uuid=True), ForeignKey("room_types.id"), nullable=False)
    
    assigned_room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=True)
    assigned_staff_id = Column(UUID(as_uuid=True), ForeignKey("staff_accounts.id"), nullable=True)
    
    check_in_date = Column(Date, nullable=False, index=True)
    check_out_date = Column(Date, nullable=False, index=True)
    
    status = Column(Enum(BookingStatus, create_type=False), default=BookingStatus.PENDING, nullable=False)
    
    total_fee = Column(Integer, default=0, nullable=False)
    add_on_fee = Column(Integer, default=0, nullable=True)
    overtime_fee = Column(Integer, default=0, nullable=True)
    
    # 鎖定過期時間 (PENDING 狀態下 15 分鐘過期，自動釋放)
    lock_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    pet = relationship("Pet")
    room_type = relationship("RoomType")
    assigned_room = relationship("Room", foreign_keys=[assigned_room_id])
    assigned_staff = relationship("StaffAccount", foreign_keys=[assigned_staff_id])

class HotelDailyLog(Base, SoftDeleteMixin):
    __tablename__ = "hotel_daily_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_booking_id = Column(UUID(as_uuid=True), ForeignKey("room_bookings.id"), nullable=False, index=True)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("staff_accounts.id"), nullable=False)
    
    date = Column(Date, nullable=False, default=date.today)
    mood_score = Column(Integer, nullable=True)     # 1-5
    appetite_score = Column(Integer, nullable=True) # 1-5
    defecation_status = Column(String(50), nullable=True) # 正常, 便秘, 下痢
    notes = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    room_booking = relationship("RoomBooking")
    staff = relationship("StaffAccount")
