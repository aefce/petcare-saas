import uuid
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from datetime import datetime

from src.core.models import Base, SoftDeleteMixin

class RoleEnum(str, enum.Enum):
    OWNER = "OWNER"   # 泛指 PetOwner
    STAFF = "STAFF"
    ADMIN = "ADMIN"

class Account(Base, SoftDeleteMixin):
    """
    身分與權限模組：核心帳號抽象表
    """
    __tablename__ = "accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(Enum(RoleEnum), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Polymorphic relationships
    owner_profile = relationship("PetOwner", back_populates="account", uselist=False)
    staff_profile = relationship("StaffAccount", back_populates="account", uselist=False)

class PetOwner(Base, SoftDeleteMixin):
    """
    客戶檔案 (包含 Guest 與 Member)
    依據 UR-00.C, 手機號碼為跨生命週期的唯一識別符號
    """
    __tablename__ = "pet_owners"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), unique=True, nullable=True)
    
    name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    
    is_member = Column(Boolean, default=False, nullable=False)
    loyalty_points = Column(Integer, default=0)
    
    # 對應 ER 圖: member_since 等於 Account 升級的時間
    member_since = Column(DateTime, nullable=True)
    
    account = relationship("Account", back_populates="owner_profile")

class StaffAccount(Base, SoftDeleteMixin):
    """
    內部員工檔案
    """
    __tablename__ = "staff_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), unique=True, nullable=False)
    
    name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    
    # 針對離職或停權防護 (UR-16) 可以加入停權結束時間等
    suspension_expiry_date = Column(DateTime, nullable=True)

    account = relationship("Account", back_populates="staff_profile")
    shifts = relationship("StaffShift", back_populates="staff", cascade="all, delete-orphan")
    clock_records = relationship("StaffClockIn", back_populates="staff", cascade="all, delete-orphan")


class ShiftTypeEnum(str, enum.Enum):
    MORNING = "MORNING"       # 早班
    AFTERNOON = "AFTERNOON"   # 晚班/午班
    FULL_DAY = "FULL_DAY"     # 全天
    OFF = "OFF"               # 休假


class StaffShift(Base, SoftDeleteMixin):
    """
    員工排班表
    """
    __tablename__ = "staff_shifts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("staff_accounts.id"), nullable=False)
    
    shift_date = Column(DateTime, nullable=False)  # 或 Date
    shift_type = Column(Enum(ShiftTypeEnum), nullable=False)
    
    staff = relationship("StaffAccount", back_populates="shifts")

class StaffClockIn(Base, SoftDeleteMixin):
    """
    員工出勤打卡紀錄
    """
    __tablename__ = "staff_clock_ins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("staff_accounts.id"), nullable=False)
    
    clock_in_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    clock_out_time = Column(DateTime, nullable=True)
    
    staff = relationship("StaffAccount", back_populates="clock_records")
