from pydantic import BaseModel, EmailStr, constr
from typing import Optional
from src.identity.models import RoleEnum, ShiftTypeEnum
from datetime import datetime, date
from uuid import UUID

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: constr(min_length=8)
    name: str
    phone: str
    is_guest: bool = False

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    email: EmailStr
    otp: str
    new_password: constr(min_length=8)  # UR-15 密碼複雜度

class GuestUpgradeRequest(BaseModel):
    phone: str
    email: EmailStr
    password: constr(min_length=8)

class AccountResponse(BaseModel):
    id: UUID
    email: str
    role: RoleEnum
    is_active: bool
    created_at: datetime
    department: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    is_member: Optional[bool] = None
    
    class Config:
        from_attributes = True


class StaffCreateRequest(BaseModel):
    email: EmailStr
    password: constr(min_length=8)
    full_name: str
    department: str
    role: RoleEnum = RoleEnum.STAFF

class StaffResponse(BaseModel):
    id: UUID
    account_id: UUID
    full_name: str
    department: str
    email: str
    is_active: bool
    role: RoleEnum
    
    class Config:
        from_attributes = True

class StaffShiftRequest(BaseModel):
    staff_id: UUID
    shift_date: date
    shift_type: ShiftTypeEnum

class StaffShiftResponse(BaseModel):
    id: UUID
    staff_id: UUID
    shift_date: date
    shift_type: ShiftTypeEnum
    
    class Config:
        from_attributes = True

class StaffClockInResponse(BaseModel):
    id: UUID
    staff_id: UUID
    staff_name: str
    clock_in_time: datetime
    clock_out_time: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProfileUpdateRequest(BaseModel):
    name: str
    phone: Optional[str] = None

class StaffDepartmentUpdateRequest(BaseModel):
    department: str
    manager_instruction: str


