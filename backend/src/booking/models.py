import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from src.core.models import Base, SoftDeleteMixin

class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"       # 等待付款中，時段鎖定 (TTL)
    CONFIRMED = "CONFIRMED"   # 訂單成立
    EXPIRED = "EXPIRED"       # 付款超時，自動釋放
    ACTIVE = "ACTIVE"         # 寵物已入店，服務進行中
    NO_SHOW = "NO_SHOW"       # 爽約，訂金不退
    CANCELLED = "CANCELLED"   # 預約已取消
    REFUNDED = "REFUNDED"     # 已退款
    COMPLETED = "COMPLETED"   # 服務完成

class VaccineStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    VALID = "VALID"
    EXPIRING_SOON = "EXPIRING_SOON"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"

class Pet(Base, SoftDeleteMixin):
    __tablename__ = "pets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("pet_owners.id"), nullable=False, index=True)
    
    name = Column(String(100), nullable=False)
    species = Column(String(50), nullable=False) # e.g., Dog, Cat
    breed = Column(String(100), nullable=True)
    weight_kg = Column(Float, nullable=True)
    medical_notes = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)

    owner = relationship("PetOwner")
    vaccine_records = relationship("VaccineRecord", back_populates="pet", cascade="all, delete-orphan")

    def check_vaccine_validity(self, db_session) -> bool:
        now = datetime.utcnow()
        records = db_session.query(VaccineRecord).filter(
            VaccineRecord.pet_id == self.id,
            VaccineRecord.is_deleted == False,
            VaccineRecord.status.in_([VaccineStatusEnum.VALID, VaccineStatusEnum.EXPIRING_SOON]),
            VaccineRecord.expiry_date > now
        ).all()

        
        active_vaccines = {r.vaccine_name for r in records}
        
        species_lower = (self.species or "").lower()
        if "dog" in species_lower or "狗" in species_lower:
            return "狂犬病" in active_vaccines and "犬五合一" in active_vaccines
        elif "cat" in species_lower or "貓" in species_lower:
            return "貓三合一" in active_vaccines
        else:
            return len(active_vaccines) > 0

class VaccineRecord(Base, SoftDeleteMixin):
    __tablename__ = "vaccine_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pet_id = Column(UUID(as_uuid=True), ForeignKey("pets.id"), nullable=False, index=True)
    vaccine_name = Column(String(100), nullable=False)
    status = Column(Enum(VaccineStatusEnum), default=VaccineStatusEnum.PENDING, nullable=False)
    expiry_date = Column(DateTime, nullable=False)
    file_url = Column(String(500), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    pet = relationship("Pet", back_populates="vaccine_records")


class ServiceItem(Base, SoftDeleteMixin):
    __tablename__ = "service_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=False)
    price = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)

class TimeSlot(Base, SoftDeleteMixin):
    __tablename__ = "time_slots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    max_capacity = Column(Integer, default=1, nullable=False) # 該時段最多容納幾隻寵物
    
    # 用於軟刪除或臨時關閉某個時段
    is_available = Column(Boolean, default=True)

class Booking(Base, SoftDeleteMixin):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pet_id = Column(UUID(as_uuid=True), ForeignKey("pets.id"), nullable=False)
    service_item_id = Column(UUID(as_uuid=True), ForeignKey("service_items.id"), nullable=False)
    time_slot_id = Column(UUID(as_uuid=True), ForeignKey("time_slots.id"), nullable=False)
    
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING, nullable=False)
    
    # 紀錄鎖定何時過期 (僅 PENDING 狀態有效，對應 Redis TTL)
    lock_expires_at = Column(DateTime, nullable=True)
    
    # 實際收取的費用 (可能包含訂金等)
    fee_charged = Column(Integer, default=0)

    pet = relationship("Pet")
    service_item = relationship("ServiceItem")
    time_slot = relationship("TimeSlot")
