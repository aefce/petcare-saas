import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from pydantic import UUID4

from src.core.cache import redis_client
from src.booking.models import Pet, ServiceItem, TimeSlot, Booking, BookingStatus
from src.booking.schemas import CreateBookingReq

class BookingService:
    @staticmethod
    def create_pending_booking(db: Session, req: CreateBookingReq, owner_account_id: str) -> Booking:
        # 1. 驗證寵物是否存在且屬於該帳號
        pet = db.query(Pet).filter(Pet.id == req.pet_id).first()
        if not pet or str(pet.owner.account_id) != str(owner_account_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pet not found or not owned by you.")
            
        # 1.1 驗證疫苗合規性
        if not pet.check_vaccine_validity(db):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="寵物疫苗紀錄不符合合規要求。犬隻必須具備有效的狂犬病與犬五合一疫苗證明，貓隻必須具備貓三合一疫苗證明。請至「管理檔案」上傳疫苗憑證審核。"
            )


            
        # 2. 驗證服務與時段
        service = db.query(ServiceItem).filter(ServiceItem.id == req.service_item_id, ServiceItem.is_active == True).first()
        time_slot = db.query(TimeSlot).filter(TimeSlot.id == req.time_slot_id, TimeSlot.is_available == True).first()
        if not service or not time_slot:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service or TimeSlot unavailable.")
            
        if time_slot.start_time < datetime.utcnow():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="預約時間已過期，請選擇未來的預約時段。")
            
        # 3. Redis Mutex 鎖，防止併發超賣 (Race Condition)
        mutex_key = f"mutex:timeslot:{req.time_slot_id}"
        # 嘗試取得全局時段鎖 (最多等 5 秒)
        acquired = redis_client.set(mutex_key, "LOCKED", nx=True, ex=5)
        if not acquired:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Server is busy, please try again.")
            
        try:
            # 4. 容量計算
            # 查詢目前在 DB 裡佔用容量的預約：已確認 (CONFIRMED/ACTIVE) 或 尚在鎖定期內的 (PENDING 且未過期)
            now = datetime.utcnow()
            occupied_count = db.query(Booking).filter(
                Booking.time_slot_id == req.time_slot_id,
                Booking.is_deleted == False,
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.PENDING])
            ).filter(
                (Booking.status != BookingStatus.PENDING) | (Booking.lock_expires_at > now)
            ).count()
            
            if occupied_count >= time_slot.max_capacity:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="TimeSlot is fully booked.")
                
            # 5. 建立 PENDING Booking 與 15 分鐘 TTL
            expires_at = now + timedelta(minutes=15)
            booking = Booking(
                pet_id=req.pet_id,
                service_item_id=req.service_item_id,
                time_slot_id=req.time_slot_id,
                status=BookingStatus.PENDING,
                lock_expires_at=expires_at,
                fee_charged=0
            )
            db.add(booking)
            db.commit()
            db.refresh(booking)
            
            # 6. 在 Redis 寫入 TTL 鎖狀態，方便快取查詢與未來擴充 (如 Keyspace Notification 釋放機制)
            redis_client.setex(f"booking_ttl:{booking.id}", 900, "PENDING")
            
            return booking
            
        finally:
            # 釋放 Mutex
            redis_client.delete(mutex_key)
            
    @staticmethod
    def confirm_booking(db: Session, booking_id: UUID4) -> Booking:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")
            
        if booking.status != BookingStatus.PENDING:
            raise HTTPException(status_code=400, detail="Only PENDING bookings can be confirmed.")
            
        if booking.lock_expires_at and booking.lock_expires_at < datetime.utcnow():
            booking.status = BookingStatus.EXPIRED
            db.commit()
            raise HTTPException(status_code=400, detail="Booking lock expired.")
            
        booking.status = BookingStatus.CONFIRMED
        booking.fee_charged = booking.service_item.price # 假設全額收取
        db.commit()
        db.refresh(booking)
        
        # 清除 Redis TTL
        redis_client.delete(f"booking_ttl:{booking_id}")
        
        return booking
