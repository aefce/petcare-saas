from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from pydantic import UUID4
from typing import List
from datetime import datetime


from src.core.dependencies import get_db, get_current_account, RequireRole
from src.identity.models import Account, PetOwner, RoleEnum
from src.booking.schemas import CreateBookingReq, BookingResponse, PetCreate, PetResponse, ServiceItemCreate, ServiceItemResponse, TimeSlotCreate, TimeSlotResponse, VaccineRecordResponse
from src.booking.models import Pet, ServiceItem, TimeSlot, Booking, VaccineRecord, VaccineStatusEnum
from src.booking.service import BookingService

router = APIRouter()

@router.post("/pets", response_model=PetResponse)
def create_pet(req: PetCreate, db: Session = Depends(get_db), current_account: Account = Depends(get_current_account)):
    owner = db.query(PetOwner).filter(PetOwner.account_id == current_account.id).first()
    if not owner:
        # 為了測試方便，如果沒有 Owner，就自動幫他建一個
        import uuid
        owner = PetOwner(account_id=current_account.id, name="Test Owner", phone=str(uuid.uuid4())[:20])
        db.add(owner)
        db.commit()
        db.refresh(owner)
        
    pet = Pet(**req.model_dump(), owner_id=owner.id)
    db.add(pet)
    db.commit()
    db.refresh(pet)
    
    resp = PetResponse.model_validate(pet)
    resp.is_vaccine_valid = pet.check_vaccine_validity(db)
    return resp



@router.post("/services", response_model=ServiceItemResponse)
def create_service(
    req: ServiceItemCreate, 
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN]))
):
    if not current_account.staff_profile or "店長" not in current_account.staff_profile.department:
        raise HTTPException(status_code=403, detail="此操作僅限店長執行")
    service = ServiceItem(**req.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service

@router.put("/services/{service_id}", response_model=ServiceItemResponse)
def update_service(
    service_id: UUID4,
    req: ServiceItemCreate,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN]))
):
    if not current_account.staff_profile or "店長" not in current_account.staff_profile.department:
        raise HTTPException(status_code=403, detail="此操作僅限店長執行")
    service = db.query(ServiceItem).filter(ServiceItem.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
        
    service.name = req.name
    service.description = req.description
    service.duration_minutes = req.duration_minutes
    service.price = req.price
    db.commit()
    db.refresh(service)
    return service

@router.put("/services/{service_id}/toggle", response_model=ServiceItemResponse)
def toggle_service(
    service_id: UUID4,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN]))
):
    if not current_account.staff_profile or "店長" not in current_account.staff_profile.department:
        raise HTTPException(status_code=403, detail="此操作僅限店長執行")
    service = db.query(ServiceItem).filter(ServiceItem.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
        
    service.is_active = not service.is_active
    db.commit()
    db.refresh(service)
    return service

@router.get("/services", response_model=List[ServiceItemResponse])
def get_services(db: Session = Depends(get_db)):
    return db.query(ServiceItem).all() # 回傳所有，前端再依據 is_active 顯示

@router.post("/timeslots", response_model=TimeSlotResponse)
def create_timeslot(req: TimeSlotCreate, db: Session = Depends(get_db)):
    data = req.model_dump()
    data.pop("service_item_id", None)
    slot = TimeSlot(**data)
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot

@router.get("/timeslots", response_model=List[TimeSlotResponse])
def get_timeslots(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    return db.query(TimeSlot).filter(TimeSlot.is_available == True, TimeSlot.start_time >= now).all()

@router.post("/reserve", response_model=BookingResponse)
def reserve_time_slot(
    req: CreateBookingReq,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account)
):
    """
    建立預約 (PENDING)。會嘗試取得時段鎖並保留 15 分鐘。
    """
    if current_account.owner_profile and not current_account.owner_profile.is_member:
        raise HTTPException(status_code=403, detail="臨時訪客無法進行預約，請升級正式會員！")
    return BookingService.create_pending_booking(db, req, str(current_account.id))

from fastapi import UploadFile, File
from src.booking.schemas import BookingDetailResponse
import shutil
import os

@router.post("/pets/{pet_id}/avatar")
def upload_pet_avatar(
    pet_id: UUID4,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account)
):
    # Verify ownership
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet or str(pet.owner.account_id) != str(current_account.id):
        raise HTTPException(status_code=403, detail="Not your pet")

    file_extension = file.filename.split(".")[-1]
    file_path = f"uploads/{pet.id}.{file_extension}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Set absolute URL base here if necessary, but returning relative is fine for frontend to append
    # using localhost:8000
    pet.avatar_url = f"http://localhost:8000/{file_path}"
    db.commit()
    db.refresh(pet)
    return {"avatar_url": pet.avatar_url}

@router.get("/pets", response_model=List[PetResponse])
def get_my_pets(db: Session = Depends(get_db), current_account: Account = Depends(get_current_account)):
    owner = db.query(PetOwner).filter(PetOwner.account_id == current_account.id).first()
    if not owner:
        return []
    pets = db.query(Pet).filter(Pet.owner_id == owner.id).all()
    resp = []
    for p in pets:
        pr = PetResponse.model_validate(p)
        pr.is_vaccine_valid = p.check_vaccine_validity(db)
        resp.append(pr)
    return resp


# === Vaccine Endpoints ===

@router.post("/pets/{pet_id}/vaccines", response_model=VaccineRecordResponse)
def upload_pet_vaccine(
    pet_id: UUID4,
    vaccine_name: str = Form(...),
    expiry_date: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account)
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet or str(pet.owner.account_id) != str(current_account.id):
        raise HTTPException(status_code=403, detail="Not your pet")
        
    try:
        parsed_expiry = datetime.fromisoformat(expiry_date.replace("Z", "+00:00"))
    except ValueError:
        try:
            parsed_expiry = datetime.strptime(expiry_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD or ISO format.")
            
    os.makedirs("uploads/vaccines", exist_ok=True)
    file_extension = file.filename.split(".")[-1]
    import uuid
    file_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"uploads/vaccines/{file_name}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_url = f"http://localhost:8000/{file_path}"
    
    record = VaccineRecord(
        pet_id=pet_id,
        vaccine_name=vaccine_name,
        status=VaccineStatusEnum.PENDING,
        expiry_date=parsed_expiry,
        file_url=file_url
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.get("/pets/{pet_id}/vaccines", response_model=List[VaccineRecordResponse])
def get_pet_vaccines(
    pet_id: UUID4,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account)
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    if str(pet.owner.account_id) != str(current_account.id) and current_account.role not in [RoleEnum.ADMIN, RoleEnum.STAFF]:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    return db.query(VaccineRecord).filter(VaccineRecord.pet_id == pet_id, VaccineRecord.is_deleted == False).order_by(VaccineRecord.uploaded_at.desc()).all()

@router.get("/vaccines/pending", response_model=List[VaccineRecordResponse])
def get_pending_vaccines(
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    return db.query(VaccineRecord).filter(VaccineRecord.status == VaccineStatusEnum.PENDING, VaccineRecord.is_deleted == False).all()

from pydantic import BaseModel
class VaccineVerifyRequest(BaseModel):
    status: str

@router.post("/vaccines/{record_id}/verify", response_model=VaccineRecordResponse)
def verify_vaccine(
    record_id: UUID4,
    req: VaccineVerifyRequest,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    record = db.query(VaccineRecord).filter(VaccineRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    if req.status not in ["VALID", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Invalid verification status")
        
    record.status = VaccineStatusEnum(req.status)
    db.commit()
    db.refresh(record)
    return record

@router.get("/my-bookings", response_model=List[BookingDetailResponse])
def get_my_bookings(db: Session = Depends(get_db), current_account: Account = Depends(get_current_account)):
    owner = db.query(PetOwner).filter(PetOwner.account_id == current_account.id).first()
    if not owner:
        return []
    
    # 關聯查詢
    bookings = db.query(Booking).join(Pet).filter(Pet.owner_id == owner.id).all()
    
    from src.payment.models import RefundRequest, RefundStatus
    result = []
    for b in bookings:
        # 查詢是否有處於待審查或已通過的退款申請
        refund = db.query(RefundRequest).filter(
            RefundRequest.booking_id == b.id,
            RefundRequest.is_deleted == False
        ).filter(
            RefundRequest.status.in_([RefundStatus.PENDING_APPROVAL, RefundStatus.MANUAL_APPROVED, RefundStatus.AUTO_APPROVED])
        ).first()
        
        refund_status_str = refund.status.value if refund else None
        
        result.append(BookingDetailResponse(
            id=b.id,
            pet_name=b.pet.name,
            service_name=b.service_item.name,
            start_time=b.time_slot.start_time,
            status=b.status,
            refund_status=refund_status_str
        ))
    return result


@router.put("/pets/{pet_id}", response_model=PetResponse)
def update_pet(
    pet_id: UUID4,
    req: PetCreate,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account)
):
    pet = db.query(Pet).filter(Pet.id == pet_id, Pet.is_deleted == False).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
        
    if str(pet.owner.account_id) != str(current_account.id):
        raise HTTPException(status_code=403, detail="Not your pet")
        
    pet.name = req.name
    pet.species = req.species
    pet.breed = req.breed
    pet.weight_kg = req.weight_kg
    pet.medical_notes = req.medical_notes
    if req.avatar_url:
        pet.avatar_url = req.avatar_url
        
    db.commit()
    db.refresh(pet)
    
    resp = PetResponse.model_validate(pet)
    resp.is_vaccine_valid = pet.check_vaccine_validity(db)
    return resp


@router.delete("/pets/{pet_id}")
def delete_pet(
    pet_id: UUID4,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account)
):
    pet = db.query(Pet).filter(Pet.id == pet_id, Pet.is_deleted == False).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
        
    if str(pet.owner.account_id) != str(current_account.id):
        raise HTTPException(status_code=403, detail="Not your pet")
        
    pet.soft_delete()
    db.commit()
    return {"message": "Pet deleted successfully"}


