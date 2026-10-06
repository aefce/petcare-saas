from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import UUID4
from src.core.dependencies import get_db, get_current_account, RequireRole
from src.identity.models import Account, RoleEnum
from src.booking.models import Booking, BookingStatus, TimeSlot
from src.booking.schemas import BookingResponse

router = APIRouter()

@router.post("/check-in", response_model=BookingResponse)
def check_in_service(
    booking_id: UUID4,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    """報到確認 (PENDING -> CONFIRMED)"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if booking.status not in [BookingStatus.PENDING, BookingStatus.CONFIRMED]:
        raise HTTPException(status_code=400, detail="Only PENDING or CONFIRMED bookings can be checked in")
        
    # 驗證疫苗合規性
    if not booking.pet.check_vaccine_validity(db):
        raise HTTPException(
            status_code=400,
            detail="此寵物疫苗紀錄不符合合規要求或已過期，無法辦理實體報到！請先上傳審核通過的疫苗證明。"
        )

        
    booking.status = BookingStatus.CONFIRMED
    db.commit()
    db.refresh(booking)
    return booking


@router.post("/start", response_model=BookingResponse)
def start_service(
    booking_id: UUID4,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    """開始服務 (CONFIRMED -> ACTIVE)"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="Only CONFIRMED bookings can be started")
        
    booking.status = BookingStatus.ACTIVE
    db.commit()
    db.refresh(booking)
    return booking

@router.post("/complete")
def complete_service(booking_id: UUID4, db: Session = Depends(get_db), current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))):
    """完成服務，狀態變更為 COMPLETED"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if booking.status != BookingStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Only ACTIVE bookings can be completed")
        
    booking.status = BookingStatus.COMPLETED
    
    # 建立系統訊息給資深照護員，通知將寵物帶至接送區或旅館
    from src.execution.models import StaffNotification
    from src.identity.models import StaffAccount
    
    staff = db.query(StaffAccount).filter(StaffAccount.account_id == current_account.id).first()
    sender_name = staff.name if staff else "美容師"
    
    noti = StaffNotification(
        title="💇 美容服務完成通知",
        content=f"寵物 {booking.pet.name} 的 {booking.service_item.name} 服務已由 {sender_name} 完成。請資深照護員前往將寵物帶至接送區或旅館。",
        sender_name=sender_name,
        recipient_role="資深照護員"
    )
    db.add(noti)
    
    db.commit()
    db.refresh(booking)
    return {"message": "Service completed successfully", "booking_id": booking.id}

from typing import List
from src.booking.schemas import BookingDetailResponse

@router.get("/report", summary="取得營業報表資料")
def get_report(
    period: str = "all",
    start_date_str: str = None,
    end_date_str: str = None,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN]))
):
    """取得營業報表統計 (限管理員)"""
    from sqlalchemy import func
    from datetime import date, timedelta, datetime
    
    today = date.today()
    query = db.query(Booking).join(Booking.time_slot)
    
    if period == "daily":
        query = query.filter(func.date(TimeSlot.start_time) == today)
    elif period == "weekly":
        start_date = today - timedelta(days=today.weekday())
        query = query.filter(func.date(TimeSlot.start_time) >= start_date)
    elif period == "monthly":
        start_date = today.replace(day=1)
        query = query.filter(func.date(TimeSlot.start_time) >= start_date)
    elif period == "custom" and start_date_str and end_date_str:
        try:
            start_date_parsed = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_date_parsed = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            query = query.filter(func.date(TimeSlot.start_time) >= start_date_parsed)
            query = query.filter(func.date(TimeSlot.start_time) <= end_date_parsed)
        except ValueError:
            pass # fallback if parsing fails
            
    all_bookings = query.all()
    
    total_revenue = sum(b.fee_charged or 0 for b in all_bookings if b.status == BookingStatus.COMPLETED)
    completed_count = sum(1 for b in all_bookings if b.status == BookingStatus.COMPLETED)
    pending_count = sum(1 for b in all_bookings if b.status == BookingStatus.PENDING)
    
    # Calculate date range string for display
    date_range = today.isoformat()
    if period == "weekly":
        date_range = f"{(today - timedelta(days=today.weekday())).isoformat()} ~ {today.isoformat()}"
    elif period == "monthly":
        date_range = f"{today.replace(day=1).isoformat()} ~ {today.isoformat()}"
    elif period == "custom" and start_date_str and end_date_str:
        date_range = f"{start_date_str} ~ {end_date_str}"
    elif period == "all":
        date_range = "歷史總計"
        
    return {
        "total_revenue": total_revenue,
        "completed_count": completed_count,
        "pending_count": pending_count,
        "report_date": date_range,
        "period": period
    }

@router.get("/tasks", response_model=List[BookingDetailResponse])
def get_execution_tasks(db: Session = Depends(get_db), current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))):
    """取得員工工作站的所有有效預約任務"""
    bookings = db.query(Booking).all()
    
    result = []
    for b in bookings:
        result.append(BookingDetailResponse(
            id=b.id,
            pet_name=b.pet.name,
            service_name=b.service_item.name,
            start_time=b.time_slot.start_time,
            status=b.status
        ))
    return result

from src.execution.models import ServiceRecord
from src.execution.schemas import ServiceRecordCreate, ServiceRecordResponse
from src.identity.models import StaffAccount
from fastapi import UploadFile, File
import shutil
import os

@router.post("/bookings/{booking_id}/records", response_model=ServiceRecordResponse)
def create_service_record(
    booking_id: UUID4,
    req: ServiceRecordCreate,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    """新增服務日誌"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    staff = db.query(StaffAccount).filter(StaffAccount.account_id == current_account.id).first()
    if not staff:
        raise HTTPException(status_code=403, detail="Staff profile not found")

    record = ServiceRecord(
        booking_id=booking.id,
        staff_id=staff.id,
        mood_score=req.mood_score,
        appetite_score=req.appetite_score,
        notes=req.notes,
        image_url=req.image_url,
        food_type=req.food_type,
        food_weight_g=req.food_weight_g,
        health_check_results=req.health_check_results
    )
    db.add(record)
    
    # 建立系統訊息給店長，通知異常回報
    if req.is_abnormal:
        from src.execution.models import StaffNotification
        noti = StaffNotification(
            title="⚠️ 寵物異常狀況回報",
            content=f"照護員 {staff.name} 提交了寵物 {booking.pet.name} 的異常狀況回報，備忘錄內容：{req.notes or '無'}",
            sender_name=staff.name,
            recipient_role="店長"
        )
        db.add(noti)

    db.commit()
    db.refresh(record)
    
    return ServiceRecordResponse(
        id=record.id,
        booking_id=record.booking_id,
        staff_id=record.staff_id,
        staff_name=staff.name,
        mood_score=record.mood_score,
        appetite_score=record.appetite_score,
        notes=record.notes,
        image_url=record.image_url,
        food_type=record.food_type,
        food_weight_g=record.food_weight_g,
        health_check_results=record.health_check_results,
        created_at=record.created_at
    )


@router.get("/bookings/{booking_id}/records", response_model=List[ServiceRecordResponse])
def get_service_records(
    booking_id: UUID4,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account) # Owner or Staff can see
):
    """取得預約單的所有服務日誌"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    records = db.query(ServiceRecord).filter(ServiceRecord.booking_id == booking_id).order_by(ServiceRecord.created_at.desc()).all()
    
    result = []
    for r in records:
        result.append(ServiceRecordResponse(
            id=r.id,
            booking_id=r.booking_id,
            staff_id=r.staff_id,
            staff_name=r.staff.name,
            mood_score=r.mood_score,
            appetite_score=r.appetite_score,
            notes=r.notes,
            image_url=r.image_url,
            food_type=r.food_type,
            food_weight_g=r.food_weight_g,
            health_check_results=r.health_check_results,
            created_at=r.created_at
        ))
    return result

@router.post("/records/{record_id}/image")
def upload_record_image(
    record_id: UUID4,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    """上傳服務日誌的照片"""
    record = db.query(ServiceRecord).filter(ServiceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{record_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    url = f"http://localhost:8000/uploads/{record_id}_{file.filename}"
    record.image_url = url
    db.commit()
    db.refresh(record)
    
    return {"image_url": url}


# === Staff Notifications Endpoints ===
from src.execution.schemas import StaffNotificationResponse

@router.get("/notifications", response_model=List[StaffNotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account)
):
    """取得當前登入員工的系統通知訊息"""
    if current_account.role not in [RoleEnum.ADMIN, RoleEnum.STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    dept = current_account.staff_profile.department if current_account.staff_profile else ""
    
    # 獲取傳送給該部門或全體員工且未刪除的通知
    from src.execution.models import StaffNotification
    notifications = db.query(StaffNotification).filter(
        (StaffNotification.recipient_role == dept) | (StaffNotification.recipient_role == "ALL"),
        StaffNotification.is_deleted == False
    ).order_by(StaffNotification.created_at.desc()).all()
    
    return notifications

@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: UUID4,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account)
):
    """將特定通知標記為已讀"""
    from src.execution.models import StaffNotification
    notification = db.query(StaffNotification).filter(
        StaffNotification.id == notification_id,
        StaffNotification.is_deleted == False
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.is_read = True
    db.commit()
    return {"status": "success"}

