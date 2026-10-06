import uuid
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from pydantic import UUID4

from src.core.cache import redis_client
from src.booking.models import Pet, BookingStatus
from src.hotel.models import RoomType, RoomBooking, Room
from src.hotel.schemas import RoomBookingCreate

class HotelService:
    @staticmethod
    def check_room_availability(
        db: Session,
        room_type_id: UUID4,
        check_in: date,
        check_out: date,
        exclude_booking_id: UUID4 = None
    ) -> bool:
        room_type = db.query(RoomType).filter(RoomType.id == room_type_id).first()
        if not room_type:
            return False
            
        # 1. 取得該房型當前實際總間數 (非維護中的實體房間數)
        rooms_count = db.query(Room).filter(Room.room_type_id == room_type_id, Room.is_deleted == False).count()
        if rooms_count > 0:
            total_active_rooms = db.query(Room).filter(
                Room.room_type_id == room_type_id,
                Room.status != "MAINTENANCE",
                Room.is_deleted == False
            ).count()
        else:
            total_active_rooms = room_type.total_rooms

        # 2. 取得該房型所有可能衝突的活躍預約
        now = datetime.utcnow()
        query = db.query(RoomBooking).filter(
            RoomBooking.room_type_id == room_type_id,
            RoomBooking.is_deleted == False,
            RoomBooking.status.in_([BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.PENDING])
        ).filter(
            (RoomBooking.status != BookingStatus.PENDING) | (RoomBooking.lock_expires_at > now)
        )
        
        if exclude_booking_id:
            query = query.filter(RoomBooking.id != exclude_booking_id)
            
        bookings = query.all()
        
        # 3. 遍歷入住區間的每一晚，驗證佔用數是否小於總可用房間數
        current_day = check_in
        while current_day < check_out:
            occupied = 0
            for b in bookings:
                if b.check_in_date <= current_day < b.check_out_date:
                    occupied += 1
            if occupied >= total_active_rooms:
                return False
            current_day += timedelta(days=1)
            
        return True

    @staticmethod
    def create_pending_room_booking(
        db: Session,
        req: RoomBookingCreate,
        owner_account_id: str
    ) -> RoomBooking:
        # 1. 驗證寵物
        pet = db.query(Pet).filter(Pet.id == req.pet_id).first()
        if not pet or str(pet.owner.account_id) != str(owner_account_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Pet not found or not owned by you."
            )
            
        # 1.1 驗證疫苗合規性
        if not pet.check_vaccine_validity(db):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="寵物疫苗紀錄不符合合規要求。犬隻必須具備有效的狂犬病與犬五合一疫苗證明，貓隻必須具備貓三合一疫苗證明。請至「管理檔案」上傳疫苗憑證審核。"
            )

        # 2. 驗證日期範圍
        if req.check_in_date >= req.check_out_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="退房日期必須大於入住日期。"
            )
        if req.check_in_date < date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="入住日期不能為過去時間。"
            )

        # 3. 驗證房型
        room_type = db.query(RoomType).filter(
            RoomType.id == req.room_type_id,
            RoomType.is_active == True
        ).first()
        if not room_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room type not found or inactive."
            )

        # 4. Redis Mutex 鎖防併發超賣
        mutex_key = f"mutex:hotel_room:{req.room_type_id}"
        acquired = redis_client.set(mutex_key, "LOCKED", nx=True, ex=5)
        if not acquired:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="伺服器忙碌中，請重新嘗試。"
            )

        try:
            # 5. 校驗可用性
            available = HotelService.check_room_availability(
                db, req.room_type_id, req.check_in_date, req.check_out_date
            )
            if not available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="該房型在此日期區間已無空房。"
                )

            # 6. 計算總費用
            nights = (req.check_out_date - req.check_in_date).days
            total_fee = room_type.price_per_night * nights

            # 7. 建立 RoomBooking (PENDING + 15 分鐘 TTL)
            now = datetime.utcnow()
            expires_at = now + timedelta(minutes=15)
            
            booking = RoomBooking(
                pet_id=req.pet_id,
                room_type_id=req.room_type_id,
                check_in_date=req.check_in_date,
                check_out_date=req.check_out_date,
                status=BookingStatus.PENDING,
                total_fee=total_fee,
                lock_expires_at=expires_at
            )
            db.add(booking)
            db.commit()
            db.refresh(booking)
            
            # 8. 寫入 Redis TTL
            redis_client.setex(f"room_booking_ttl:{booking.id}", 900, "PENDING")
            
            return booking

        finally:
            redis_client.delete(mutex_key)

    @staticmethod
    def confirm_room_booking(db: Session, booking_id: UUID4) -> RoomBooking:
        booking = db.query(RoomBooking).filter(RoomBooking.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Room booking not found.")
            
        if booking.status != BookingStatus.PENDING:
            raise HTTPException(status_code=400, detail="Only PENDING room bookings can be confirmed.")
            
        if booking.lock_expires_at and booking.lock_expires_at < datetime.utcnow():
            booking.status = BookingStatus.EXPIRED
            db.commit()
            raise HTTPException(status_code=400, detail="Room booking lock expired.")
            
        booking.status = BookingStatus.CONFIRMED
        db.commit()
        db.refresh(booking)
        
        # 清除 Redis TTL
        redis_client.delete(f"room_booking_ttl:{booking_id}")
        
        return booking
