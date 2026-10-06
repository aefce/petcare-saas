from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.core.dependencies import get_db, get_current_account, RequireRole
from src.identity.models import Account, RoleEnum
from src.hr.schemas import AttendanceResponse
from src.hr.service import HRService

router = APIRouter()

@router.post("/clock-in", response_model=AttendanceResponse)
def clock_in(
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    """員工打卡上班"""
    return HRService.clock_in(db, str(current_account.id))

@router.post("/clock-out", response_model=AttendanceResponse)
def clock_out(
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN, RoleEnum.STAFF]))
):
    """員工打卡下班"""
    return HRService.clock_out(db, str(current_account.id))
