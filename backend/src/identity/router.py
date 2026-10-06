from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta

from src.core.dependencies import get_db, get_current_account, RequireRole, oauth2_scheme
from src.core.config import settings
from src.core.security import create_access_token, get_password_hash
from src.core.cache import redis_client
from src.identity.models import Account, RoleEnum, StaffAccount, StaffShift, StaffClockIn
from src.identity.schemas import Token, GuestUpgradeRequest, PasswordResetRequest, PasswordResetConfirm, AccountResponse, RegisterRequest, StaffCreateRequest, StaffResponse, StaffShiftRequest, StaffShiftResponse, StaffClockInResponse, ProfileUpdateRequest, StaffDepartmentUpdateRequest
from src.identity.service import IdentityService
from typing import List
from pydantic import UUID4

router = APIRouter()

from src.identity.models import Account, RoleEnum, StaffAccount, StaffShift, StaffClockIn, PetOwner

@router.post("/register", response_model=AccountResponse, summary="註冊會員或訪客帳號")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """註冊新帳號 (正式會員或臨時訪客)"""
    if db.query(Account).filter(Account.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if db.query(PetOwner).filter(PetOwner.phone == request.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")
        
    new_account = Account(
        email=request.email,
        password_hash=get_password_hash(request.password),
        role=RoleEnum.OWNER,
        is_active=True
    )
    db.add(new_account)
    db.flush()
    
    new_owner = PetOwner(
        account_id=new_account.id,
        name=request.name,
        phone=request.phone,
        is_member=not request.is_guest,
        member_since=datetime.utcnow() if not request.is_guest else None
    )
    db.add(new_owner)
    db.commit()
    db.refresh(new_account)
    db.refresh(new_owner)
    
    resp = new_account.__dict__.copy()
    resp['department'] = None
    resp['name'] = new_owner.name
    resp['phone'] = new_owner.phone
    resp['is_member'] = new_owner.is_member
    return resp

@router.get("/check-email", summary="檢查 Email 是否已被註冊")
def check_email(email: str, db: Session = Depends(get_db)):
    exists = db.query(Account).filter(Account.email == email).first() is not None
    return {"exists": exists}

@router.post("/register-staff", response_model=AccountResponse, summary="[測試用] 註冊員工帳號")
def register_staff(request: RegisterRequest, db: Session = Depends(get_db)):
    """註冊員工帳號 (測試用)"""
    if db.query(Account).filter(Account.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_account = Account(
        email=request.email,
        password_hash=get_password_hash(request.password),
        role=RoleEnum.STAFF,
        is_active=True
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    
    resp = new_account.__dict__.copy()
    resp['department'] = None
    return resp

@router.post("/login", response_model=Token, summary="登入並取得 JWT")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """登入並取得 JWT"""
    service = IdentityService(db)
    account = service.authenticate(form_data.username, form_data.password)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=account.id, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout", summary="登出並將 Token 加入黑名單")
def logout(token: str = Depends(oauth2_scheme), current_account: Account = Depends(get_current_account)):
    """UR-16: 將 Token 寫入 Redis 黑名單，TTL 設為 JWT 最大存活時間"""
    ttl = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    redis_client.set(f"bl_{token}", "1", ex=ttl)
    return {"msg": "Successfully logged out"}

@router.post("/upgrade-guest", response_model=AccountResponse)
def upgrade_guest(request: GuestUpgradeRequest, db: Session = Depends(get_db)):
    """UR-00.C: Guest 單鍵升級"""
    service = IdentityService(db)
    account = service.upgrade_guest_to_member(request)
    
    resp = account.__dict__.copy()
    resp['department'] = None
    return resp

@router.post("/forgot-password")
def forgot_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """UR-15: 發送密碼重置 OTP 信件"""
    service = IdentityService(db)
    service.request_password_reset(request.email)
    return {"msg": "If your email is registered, you will receive an OTP shortly."}

@router.post("/reset-password")
def reset_password(request: PasswordResetConfirm, db: Session = Depends(get_db)):
    """UR-15: 驗證 OTP 並重置密碼"""
    service = IdentityService(db)
    service.confirm_password_reset(request)
    return {"msg": "Password has been reset successfully."}

@router.get("/me", response_model=AccountResponse)
def get_my_profile(current_account: Account = Depends(get_current_account)):
    """取得當前登入者資訊"""
    resp = current_account.__dict__.copy()
    if current_account.staff_profile:
        resp['department'] = current_account.staff_profile.department
        resp['name'] = current_account.staff_profile.name
        resp['phone'] = current_account.staff_profile.phone
    elif current_account.owner_profile:
        resp['name'] = current_account.owner_profile.name
        resp['phone'] = current_account.owner_profile.phone
        resp['is_member'] = current_account.owner_profile.is_member
    return resp


@router.get("/admin/dashboard")
def admin_dashboard(current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))):
    """UR-11: RBAC 路由保護測試，僅限員工/店長存取"""
    return {"msg": "Welcome to Staff Dashboard", "user": current_account.email}

@router.get("/staff", response_model=List[StaffResponse], summary="取得所有員工列表 (限店長與員工)")
def get_all_staff(
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    """取得所有員工列表 (限管理員)"""
    staff_list = db.query(StaffAccount).all()
    result = []
    for staff in staff_list:
        result.append(StaffResponse(
            id=staff.id,
            account_id=staff.account_id,
            full_name=staff.name,
            department=staff.department,
            email=staff.account.email,
            is_active=staff.account.is_active,
            role=staff.account.role
        ))
    return result

@router.post("/staff", response_model=StaffResponse, summary="新增員工帳號 (限店長)")
def create_staff(
    req: StaffCreateRequest,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN]))
):
    """新增員工帳號 (限管理員)"""
    if db.query(Account).filter(Account.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_account = Account(
        email=req.email,
        password_hash=get_password_hash(req.password),
        role=req.role,
        is_active=True
    )
    db.add(new_account)
    db.flush()
    
    new_staff = StaffAccount(
        account_id=new_account.id,
        name=req.full_name,
        department=req.department
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    
    return StaffResponse(
        id=new_staff.id,
        account_id=new_staff.account_id,
        full_name=new_staff.name,
        department=new_staff.department,
        email=new_account.email,
        is_active=new_account.is_active,
        role=new_account.role
    )

@router.put("/staff/{staff_id}/toggle", response_model=StaffResponse, summary="啟用/停用員工帳號 (限店長)")
def toggle_staff_status(
    staff_id: UUID4,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN]))
):
    """停權/啟用員工帳號 (限管理員)"""
    staff = db.query(StaffAccount).filter(StaffAccount.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
        
    staff.account.is_active = not staff.account.is_active
    db.commit()
    db.refresh(staff)
    
    return StaffResponse(
        id=staff.id,
        account_id=staff.account_id,
        full_name=staff.name,
        department=staff.department,
        email=staff.account.email,
        is_active=staff.account.is_active,
        role=staff.account.role
    )

@router.put("/staff/{staff_id}/department", response_model=StaffResponse, summary="更動員工身分/部門 (限管理員，需基於店長指令)")
def update_staff_department(
    staff_id: UUID4,
    req: StaffDepartmentUpdateRequest,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN]))
):
    if not req.manager_instruction.strip():
        raise HTTPException(status_code=400, detail="必須提供店長的更動指令依據或備註")
        
    staff = db.query(StaffAccount).filter(StaffAccount.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
        
    # 更動身分
    staff.department = req.department
    
    # 寫入日誌記錄
    print(f"[Identity] Staff {staff.name} ({staff.id}) department updated to {req.department} under manager instruction: {req.manager_instruction}")
    
    db.commit()
    db.refresh(staff)
    
    return StaffResponse(
        id=staff.id,
        account_id=staff.account_id,
        full_name=staff.name,
        department=staff.department,
        email=staff.account.email,
        is_active=staff.account.is_active,
        role=staff.account.role
    )

@router.get("/shifts", response_model=List[StaffShiftResponse], summary="取得當月所有排班 (限店長)")
def get_all_shifts(
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN]))
):
    shifts = db.query(StaffShift).all()
    return shifts

@router.post("/shifts", response_model=StaffShiftResponse, summary="為員工新增或修改排班 (限店長)")
def create_or_update_shift(
    req: StaffShiftRequest,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN]))
):
    # 檢查是否該員工該日已排班
    existing_shift = db.query(StaffShift).filter(
        StaffShift.staff_id == req.staff_id,
        StaffShift.shift_date == req.shift_date
    ).first()
    
    if existing_shift:
        if req.shift_type.value == "OFF":
            db.delete(existing_shift)
            db.commit()
            return existing_shift # 返回已刪除的紀錄作為確認
        else:
            existing_shift.shift_type = req.shift_type
            db.commit()
            db.refresh(existing_shift)
            return existing_shift
    else:
        if req.shift_type.value == "OFF":
            raise HTTPException(status_code=400, detail="Cannot assign OFF to unassigned day")
        new_shift = StaffShift(
            staff_id=req.staff_id,
            shift_date=req.shift_date,
            shift_type=req.shift_type
        )
        db.add(new_shift)
        db.commit()
        db.refresh(new_shift)
        return new_shift

@router.get("/clock/status", summary="查詢目前員工是否有未完成的打卡紀錄")
def get_clock_status(
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account)
):
    if current_account.role not in [RoleEnum.STAFF, RoleEnum.ADMIN]:
        raise HTTPException(status_code=403, detail="Only staff can clock in")
    
    staff = db.query(StaffAccount).filter(StaffAccount.account_id == current_account.id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff profile not found")

    active_clock = db.query(StaffClockIn).filter(
        StaffClockIn.staff_id == staff.id,
        StaffClockIn.clock_out_time == None
    ).order_by(StaffClockIn.clock_in_time.desc()).first()

    return {"is_clocked_in": active_clock is not None}

@router.post("/clock/in", summary="上班打卡")
def clock_in(
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account)
):
    if current_account.role not in [RoleEnum.STAFF, RoleEnum.ADMIN]:
        raise HTTPException(status_code=403, detail="Only staff can clock in")
    
    staff = db.query(StaffAccount).filter(StaffAccount.account_id == current_account.id).first()
    
    # 檢查是否已有未下班的打卡
    active_clock = db.query(StaffClockIn).filter(
        StaffClockIn.staff_id == staff.id,
        StaffClockIn.clock_out_time == None
    ).first()
    
    if active_clock:
        raise HTTPException(status_code=400, detail="Already clocked in")
        
    new_clock = StaffClockIn(staff_id=staff.id)
    db.add(new_clock)
    db.commit()
    return {"message": "Clocked in successfully"}

@router.post("/clock/out", summary="下班打卡")
def clock_out(
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account)
):
    if current_account.role not in [RoleEnum.STAFF, RoleEnum.ADMIN]:
        raise HTTPException(status_code=403, detail="Only staff can clock out")
        
    staff = db.query(StaffAccount).filter(StaffAccount.account_id == current_account.id).first()
    
    active_clock = db.query(StaffClockIn).filter(
        StaffClockIn.staff_id == staff.id,
        StaffClockIn.clock_out_time == None
    ).order_by(StaffClockIn.clock_in_time.desc()).first()
    
    if not active_clock:
        raise HTTPException(status_code=400, detail="No active clock-in found")
        
    active_clock.clock_out_time = datetime.utcnow()
    db.commit()
    return {"message": "Clocked out successfully"}

@router.get("/clock/records", response_model=List[StaffClockInResponse], summary="取得所有出勤打卡紀錄 (限店長)")
def get_clock_records(
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN]))
):
    records = db.query(StaffClockIn).order_by(StaffClockIn.clock_in_time.desc()).all()
    results = []
    for r in records:
        results.append({
            "id": r.id,
            "staff_id": r.staff_id,
            "staff_name": r.staff.name if r.staff else "Unknown",
            "clock_in_time": r.clock_in_time,
            "clock_out_time": r.clock_out_time
        })
    return results

@router.put("/profile")
def update_profile(
    req: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account)
):
    if current_account.role in [RoleEnum.STAFF, RoleEnum.ADMIN]:
        staff = db.query(StaffAccount).filter(StaffAccount.account_id == current_account.id).first()
        if not staff:
            raise HTTPException(status_code=404, detail="Staff profile not found")
        if not req.phone:
            raise HTTPException(status_code=400, detail="Phone number is required")
        staff.name = req.name
        staff.phone = req.phone
        db.commit()
        return {"message": "Staff profile updated successfully"}
    else:
        owner = db.query(PetOwner).filter(PetOwner.account_id == current_account.id).first()
        if not owner:
            raise HTTPException(status_code=404, detail="Owner profile not found")
            
        if not req.phone:
            raise HTTPException(status_code=400, detail="Phone number is required for owner accounts")
            
        # Check if phone number is already registered by another owner
        dup_phone = db.query(PetOwner).filter(
            PetOwner.phone == req.phone,
            PetOwner.id != owner.id,
            PetOwner.is_deleted == False
        ).first()
        if dup_phone:
            raise HTTPException(status_code=400, detail="Phone number already registered by another user")
            
        owner.name = req.name
        owner.phone = req.phone
        db.commit()
        return {"message": "Profile updated successfully"}

