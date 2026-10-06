from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import UUID4, BaseModel
from typing import List, Optional
from datetime import date, datetime
import os
import shutil

from src.core.dependencies import get_db, get_current_account, RequireRole
from src.identity.models import Account, RoleEnum, PetOwner, StaffAccount
from src.booking.models import Pet, BookingStatus
from src.hotel.models import RoomType, RoomBooking, Room, HotelDailyLog
from src.hotel.schemas import (
    RoomTypeCreate, RoomTypeResponse, 
    RoomBookingCreate, RoomBookingResponse, RoomBookingDetailResponse,
    RoomCreate, RoomResponse,
    HotelDailyLogCreate, HotelDailyLogResponse
)
from src.hotel.service import HotelService

router = APIRouter()

# === Room Type Management ===

@router.get("/rooms", response_model=List[RoomTypeResponse])
def get_room_types(db: Session = Depends(get_db)):
    """查詢所有房型 (包含未開放的，店長前台過濾即可)"""
    return db.query(RoomType).filter(RoomType.is_deleted == False).all()

@router.post("/rooms", response_model=RoomTypeResponse)
def create_room_type(
    req: RoomTypeCreate,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN]))
):
    """建立新房型 (限管理員/店長)"""
    room_type = RoomType(**req.model_dump())
    db.add(room_type)
    db.commit()
    db.refresh(room_type)
    return room_type


# === Physical Room Management ===

@router.post("/rooms/physical", response_model=RoomResponse)
def create_physical_room(
    req: RoomCreate,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    """為房型新增實體房間房號 (限管理員/櫃檯)"""
    # 檢查房型是否存在
    room_type = db.query(RoomType).filter(RoomType.id == req.room_type_id).first()
    if not room_type:
        raise HTTPException(status_code=404, detail="Room type not found")
    
    # 檢查房號是否重複
    existing = db.query(Room).filter(Room.room_number == req.room_number, Room.is_deleted == False).first()
    if existing:
        raise HTTPException(status_code=400, detail="房間號碼已存在。")

    room = Room(**req.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.get("/rooms/{room_type_id}/physical", response_model=List[RoomResponse])
def get_physical_rooms(
    room_type_id: UUID4,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    """查詢某房型下的所有實體房間"""
    return db.query(Room).filter(Room.room_type_id == room_type_id, Room.is_deleted == False).all()

@router.put("/rooms/physical/{room_id}/status", response_model=RoomResponse)
def update_physical_room_status(
    room_id: UUID4,
    status_str: str = Query(..., description="AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE"),
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    """變更實體房間狀態 (如：設為清潔中、或維修中以扣除限量房型庫存)"""
    room = db.query(Room).filter(Room.id == room_id, Room.is_deleted == False).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    if status_str not in ["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE"]:
        raise HTTPException(status_code=400, detail="不合法的房間狀態。")
        
    room.status = status_str
    db.commit()
    db.refresh(room)
    return room


# === Room Booking Operations ===

@router.get("/rooms/availability")
def get_room_availability(
    room_type_id: UUID4 = Query(...),
    check_in: date = Query(...),
    check_out: date = Query(...),
    db: Session = Depends(get_db)
):
    """查詢房型在特定日期區間內是否有空房"""
    available = HotelService.check_room_availability(db, room_type_id, check_in, check_out)
    return {"available": available}

@router.post("/reserve", response_model=RoomBookingResponse)
def reserve_room(
    req: RoomBookingCreate,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account)
):
    """預約寵物旅館房間 (建立 PENDING 預約，需在 15 分鐘內支付)"""
    if current_account.owner_profile and not current_account.owner_profile.is_member:
        raise HTTPException(status_code=403, detail="臨時訪客無法進行預約，請升級正式會員！")
    return HotelService.create_pending_room_booking(db, req, str(current_account.id))

@router.get("/my-bookings", response_model=List[RoomBookingDetailResponse])
def get_my_room_bookings(
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account)
):
    """飼主獲取自己的旅館預約歷史紀錄"""
    owner = db.query(PetOwner).filter(PetOwner.account_id == current_account.id).first()
    if not owner:
        return []
        
    bookings = db.query(RoomBooking).join(Pet).filter(
        Pet.owner_id == owner.id,
        RoomBooking.is_deleted == False
    ).order_by(RoomBooking.created_at.desc()).all()
    
    result = []
    for b in bookings:
        result.append(RoomBookingDetailResponse(
            id=b.id,
            pet_name=b.pet.name,
            pet_species=b.pet.species,
            room_type_name=b.room_type.name,
            assigned_room_number=b.assigned_room.room_number if b.assigned_room else None,
            assigned_staff_name=b.assigned_staff.name if b.assigned_staff else None,
            check_in_date=b.check_in_date,
            check_out_date=b.check_out_date,
            status=b.status,
            total_fee=b.total_fee,
            add_on_fee=b.add_on_fee,
            overtime_fee=b.overtime_fee,
            created_at=b.created_at
        ))
    return result


# === Staff Dashboard Hotel Tasks ===

@router.get("/tasks")
def get_hotel_tasks(
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    """櫃檯與員工獲取今日的旅館入住與退房清單，以及當前入住名單"""
    today = date.today()
    
    # 今日預計入住 (狀態為 CONFIRMED)
    check_ins = db.query(RoomBooking).filter(
        RoomBooking.check_in_date == today,
        RoomBooking.status == BookingStatus.CONFIRMED,
        RoomBooking.is_deleted == False
    ).all()
    
    # 今日預計退房 (狀態為 ACTIVE)
    check_outs = db.query(RoomBooking).filter(
        RoomBooking.check_out_date == today,
        RoomBooking.status == BookingStatus.ACTIVE,
        RoomBooking.is_deleted == False
    ).all()

    # 場內目前入住中 (狀態為 ACTIVE)
    actives = db.query(RoomBooking).filter(
        RoomBooking.status == BookingStatus.ACTIVE,
        RoomBooking.is_deleted == False
    ).all()
    
    def map_to_detail(b_list) -> List[RoomBookingDetailResponse]:
        res = []
        for b in b_list:
            res.append(RoomBookingDetailResponse(
                id=b.id,
                pet_name=b.pet.name,
                pet_species=b.pet.species,
                room_type_name=b.room_type.name,
                assigned_room_number=b.assigned_room.room_number if b.assigned_room else None,
                assigned_staff_name=b.assigned_staff.name if b.assigned_staff else None,
                check_in_date=b.check_in_date,
                check_out_date=b.check_out_date,
                status=b.status,
                total_fee=b.total_fee,
                add_on_fee=b.add_on_fee,
                overtime_fee=b.overtime_fee,
                created_at=b.created_at
            ))
        return res
        
    return {
        "check_ins": map_to_detail(check_ins),
        "check_outs": map_to_detail(check_outs),
        "actives": map_to_detail(actives)
    }

class HotelCheckInRequest(BaseModel):
    room_id: Optional[UUID4] = None
    staff_id: Optional[UUID4] = None

@router.post("/bookings/{booking_id}/check-in", response_model=RoomBookingResponse)
def hotel_check_in(
    booking_id: UUID4,
    req: Optional[HotelCheckInRequest] = None,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    """辦理現場入住 (CONFIRMED -> ACTIVE)，會指派房號、照護員，並強制驗證疫苗"""
    booking = db.query(RoomBooking).filter(RoomBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Room booking not found")
        
    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(
            status_code=400,
            detail="只有已確認 (CONFIRMED) 的旅館預約單可以辦理入住！"
        )
        
    # 強制檢測疫苗
    if not booking.pet.check_vaccine_validity(db):
        raise HTTPException(
            status_code=400,
            detail="此寵物疫苗紀錄不符合合規要求，無法辦理入住！請先上傳審核通過的疫苗證明。"
        )

    room_id = req.room_id if req else None
    staff_id = req.staff_id if req else None

    # 如果沒傳 room_id，自動尋找一個該房型下 AVAILABLE 的房間分配
    if not room_id:
        available_room = db.query(Room).filter(
            Room.room_type_id == booking.room_type_id,
            Room.status == "AVAILABLE",
            Room.is_deleted == False
        ).first()
        if available_room:
            room_id = available_room.id

    if room_id:
        room = db.query(Room).filter(Room.id == room_id, Room.is_deleted == False).first()
        if not room:
            raise HTTPException(status_code=404, detail="指定房間不存在。")
        if room.status not in ["AVAILABLE", "CLEANING"]:
            raise HTTPException(status_code=400, detail="指定房間目前非空閒可用狀態。")
        room.status = "OCCUPIED"
        booking.assigned_room_id = room.id

    if staff_id:
        staff = db.query(StaffAccount).filter(StaffAccount.id == staff_id, StaffAccount.is_deleted == False).first()
        if staff:
            booking.assigned_staff_id = staff.id
        
    booking.status = BookingStatus.ACTIVE
    db.commit()
    db.refresh(booking)
    return booking

class HotelCheckOutRequest(BaseModel):
    add_on_fee: int = 0
    overtime_fee: int = 0

@router.post("/bookings/{booking_id}/check-out", response_model=RoomBookingResponse)
def hotel_check_out(
    booking_id: UUID4,
    req: Optional[HotelCheckOutRequest] = None,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    """辦理現場退房 (ACTIVE -> COMPLETED)，加收費用並釋放實體房間"""
    booking = db.query(RoomBooking).filter(RoomBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Room booking not found")
        
    if booking.status != BookingStatus.ACTIVE:
        raise HTTPException(
            status_code=400,
            detail="只有服務進行中 (ACTIVE) 的旅館單可以辦理退房！"
        )
        
    add_on = req.add_on_fee if req else 0
    overtime = req.overtime_fee if req else 0

    booking.add_on_fee = add_on
    booking.overtime_fee = overtime
    booking.total_fee = booking.total_fee + add_on + overtime

    # 釋放實體房間，將其設為 CLEANING
    if booking.assigned_room_id:
        room = db.query(Room).filter(Room.id == booking.assigned_room_id).first()
        if room:
            room.status = "CLEANING"

    booking.status = BookingStatus.COMPLETED
    db.commit()
    db.refresh(booking)
    return booking


# === Staff/Caretaker Log Operations ===

@router.post("/bookings/{booking_id}/logs", response_model=HotelDailyLogResponse)
def create_hotel_daily_log(
    booking_id: UUID4,
    req: HotelDailyLogCreate,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    """照護員撰寫今日寵物照護日誌 (限照護員與管理員)"""
    booking = db.query(RoomBooking).filter(RoomBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    staff = db.query(StaffAccount).filter(StaffAccount.account_id == current_account.id).first()
    if not staff:
        raise HTTPException(status_code=403, detail="您不是登記的照護員工。")

    log = HotelDailyLog(
        room_booking_id=booking_id,
        staff_id=staff.id,
        date=date.today(),
        mood_score=req.mood_score,
        appetite_score=req.appetite_score,
        defecation_status=req.defecation_status,
        notes=req.notes,
        image_url=req.image_url
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    
    resp = HotelDailyLogResponse.model_validate(log)
    resp.staff_name = staff.name
    return resp

@router.get("/bookings/{booking_id}/logs", response_model=List[HotelDailyLogResponse])
def get_hotel_daily_logs(
    booking_id: UUID4,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account)
):
    """獲取特定旅館住宿期間的每日照護日誌 (開放給飼主與全體員工)"""
    logs = db.query(HotelDailyLog).filter(
        HotelDailyLog.room_booking_id == booking_id,
        HotelDailyLog.is_deleted == False
    ).order_by(HotelDailyLog.date.desc()).all()
    
    result = []
    for log in logs:
        r = HotelDailyLogResponse.model_validate(log)
        r.staff_name = log.staff.name if log.staff else None
        result.append(r)
    return result

@router.post("/logs/{log_id}/image")
def upload_hotel_log_image(
    log_id: UUID4,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    """上傳日誌照片 (二階段非同步上傳)"""
    log = db.query(HotelDailyLog).filter(HotelDailyLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log record not found")

    os.makedirs("uploads/hotel_logs", exist_ok=True)
    file_extension = file.filename.split(".")[-1]
    file_name = f"{log.id}_hotel_log.{file_extension}"
    file_path = f"uploads/hotel_logs/{file_name}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    log.image_url = f"http://localhost:8000/{file_path}"
    db.commit()
    db.refresh(log)
    return {"image_url": log.image_url}

@router.put("/bookings/{booking_id}/assign", response_model=RoomBookingResponse)
def assign_staff(
    booking_id: UUID4,
    staff_id: UUID4 = Query(...),
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    """現場指派負責的值班照護員"""
    booking = db.query(RoomBooking).filter(RoomBooking.id == booking_id, RoomBooking.is_deleted == False).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    staff = db.query(StaffAccount).filter(StaffAccount.id == staff_id, StaffAccount.is_deleted == False).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff account not found")

    booking.assigned_staff_id = staff.id
    db.commit()
    db.refresh(booking)
    return booking


# === Cancellations / Refunds ===

@router.post("/bookings/{booking_id}/cancel", response_model=RoomBookingResponse)
def cancel_room_booking(
    booking_id: UUID4,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account)
):
    """取消與退款旅館預約 (如果是已付款 CONFIRMED，則狀態改為 REFUNDED；如果是 PENDING，則改為 CANCELLED)"""
    booking = db.query(RoomBooking).filter(RoomBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Room booking not found")
        
    # 權限檢查
    is_staff = current_account.role in [RoleEnum.ADMIN, RoleEnum.STAFF]
    owner = db.query(PetOwner).filter(PetOwner.account_id == current_account.id).first()
    
    if not is_staff:
        if not owner or booking.pet.owner_id != owner.id:
            raise HTTPException(status_code=403, detail="無權限操作此預約單。")
            
    if booking.status in [BookingStatus.CANCELLED, BookingStatus.REFUNDED, BookingStatus.COMPLETED, BookingStatus.ACTIVE]:
        raise HTTPException(status_code=400, detail="此預約單狀態無法取消或退款。")
        
    if booking.status == BookingStatus.CONFIRMED:
        booking.status = BookingStatus.REFUNDED
    else:
        booking.status = BookingStatus.CANCELLED
        
    db.commit()
    db.refresh(booking)
    return booking
