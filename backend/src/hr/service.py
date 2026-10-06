from sqlalchemy.orm import Session
from datetime import datetime
from fastapi import HTTPException
from src.hr.models import AttendanceRecord

class HRService:
    @staticmethod
    def clock_in(db: Session, account_id: str) -> AttendanceRecord:
        # Check if already clocked in and not clocked out today
        # For simplicity, just check if there's any active session (no clock out)
        active_record = db.query(AttendanceRecord).filter(
            AttendanceRecord.account_id == account_id,
            AttendanceRecord.clock_out_time == None
        ).first()
        
        if active_record:
            raise HTTPException(status_code=400, detail="Already clocked in.")
            
        record = AttendanceRecord(account_id=account_id)
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def clock_out(db: Session, account_id: str) -> AttendanceRecord:
        active_record = db.query(AttendanceRecord).filter(
            AttendanceRecord.account_id == account_id,
            AttendanceRecord.clock_out_time == None
        ).first()
        
        if not active_record:
            raise HTTPException(status_code=400, detail="No active clock-in session found.")
            
        active_record.clock_out_time = datetime.utcnow()
        db.commit()
        db.refresh(active_record)
        return active_record
