import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, JSON
from sqlalchemy.orm import declarative_base
from sqlalchemy.dialects.postgresql import UUID

Base = declarative_base()

class SoftDeleteMixin:
    """
    Soft Delete 抽象模組 (對應 UR-19)。
    所有核心業務表 (如 User, Booking, Room) 皆需繼承此模組，以確保外鍵關聯完整性。
    """
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()

class AuditLog(Base):
    """
    不可變的稽核日誌 (Audit Trail) (對應 UR-12)。
    Append-only 結構，記錄所有重要操作的 Who, When, What。
    """
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_name = Column(String(50), nullable=False, index=True)  # 例如 "Booking", "User"
    entity_id = Column(String(100), nullable=False, index=True)   # 目標紀錄的 ID
    action = Column(String(50), nullable=False)                   # 例如 "CREATE", "UPDATE", "CANCEL"
    performed_by = Column(String(100), nullable=False)            # 執行者的 User ID (Who)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False) # (When)
    changes = Column(JSON, nullable=True)                         # 具體的資料變更 (What)
    reason = Column(String(255), nullable=True)                   # 操作原因 (如強制作廢的理由)
