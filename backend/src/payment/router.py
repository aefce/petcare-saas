from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, UUID4
from typing import List, Optional
from datetime import datetime

from src.core.dependencies import get_db, get_current_account, RequireRole
from src.identity.models import Account, RoleEnum, PetOwner
from src.booking.models import Booking, BookingStatus, Pet
from src.booking.service import BookingService
from src.hotel.models import RoomBooking
from src.hotel.service import HotelService
from src.payment.models import RefundRequest, RefundStatus
from src.payment.schemas import RefundCreateRequest, RefundResponse

router = APIRouter()

class MockPaymentCallback(BaseModel):
    booking_id: UUID4
    payment_status: str # e.g., "SUCCESS"

@router.post("/mock-callback")
def mock_payment_callback(
    payload: MockPaymentCallback,
    db: Session = Depends(get_db)
):
    """
    假金流回呼端點 (Webhook)。
    當外部金流收款成功後，會打這支 API。
    觸發 PENDING -> CONFIRMED 的狀態機轉換。
    """
    if payload.payment_status != "SUCCESS":
        raise HTTPException(status_code=400, detail="Payment failed")
        
    # 判斷是常規服務預約還是旅館預約
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if booking:
        confirmed_booking = BookingService.confirm_booking(db, payload.booking_id)
        return {
            "status": "ok", 
            "message": "Payment confirmed, booking unlocked.",
            "booking_status": confirmed_booking.status
        }

    room_booking = db.query(RoomBooking).filter(RoomBooking.id == payload.booking_id).first()
    if room_booking:
        confirmed_room_booking = HotelService.confirm_room_booking(db, payload.booking_id)
        return {
            "status": "ok",
            "message": "Payment confirmed, room booking unlocked.",
            "booking_status": confirmed_room_booking.status
        }

    raise HTTPException(status_code=404, detail="Booking or RoomBooking not found")


# 定義常規退費理由
AUTO_APPROVE_REASONS = ["毛孩生病", "天候惡劣", "提前三天以上取消"]

@router.post("/refund/request", response_model=RefundResponse, summary="發起退款申請 (包含自動審核分流)")
def request_refund(
    req: RefundCreateRequest,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account)
):
    """櫃檯或顧客發起退費申請 (相容一般服務預約與旅館預訂)"""
    booking = db.query(Booking).filter(Booking.id == req.booking_id).first()
    room_booking = None
    
    if not booking:
        room_booking = db.query(RoomBooking).filter(RoomBooking.id == req.booking_id).first()
        if not room_booking:
            raise HTTPException(status_code=404, detail="Booking or RoomBooking not found")

    # 1. 處理常規服務預約退款
    if booking:
        if booking.status in [BookingStatus.CANCELLED, BookingStatus.REFUNDED]:
            raise HTTPException(status_code=400, detail="Booking already cancelled or refunded")
            
        existing = db.query(RefundRequest).filter(
            RefundRequest.booking_id == req.booking_id,
            RefundRequest.status == RefundStatus.PENDING_APPROVAL,
            RefundRequest.is_deleted == False
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Refund request already pending")

        refund_amount = booking.fee_charged if (booking.fee_charged and booking.fee_charged > 0) else booking.service_item.price
        
        refund_request = RefundRequest(
            booking_id=booking.id,
            room_booking_id=None,
            amount=refund_amount,
            reason=req.reason,
            details=req.details,
            requested_by_id=current_account.id
        )
        
        if req.reason in AUTO_APPROVE_REASONS:
            refund_request.status = RefundStatus.AUTO_APPROVED
            booking.status = BookingStatus.REFUNDED
        else:
            refund_request.status = RefundStatus.PENDING_APPROVAL
            
        db.add(refund_request)
        db.commit()
        db.refresh(refund_request)
        
        return RefundResponse(
            id=refund_request.id,
            booking_id=booking.id,
            pet_name=booking.pet.name,
            service_name=booking.service_item.name,
            amount=refund_request.amount,
            reason=refund_request.reason,
            details=refund_request.details,
            status=refund_request.status,
            requested_by_id=refund_request.requested_by_id,
            approved_by_id=refund_request.approved_by_id,
            created_at=refund_request.created_at
        )

    # 2. 處理寵物旅館預約退款
    if room_booking:
        if room_booking.status in [BookingStatus.CANCELLED, BookingStatus.REFUNDED]:
            raise HTTPException(status_code=400, detail="Room booking already cancelled or refunded")
            
        existing = db.query(RefundRequest).filter(
            RefundRequest.room_booking_id == room_booking.id,
            RefundRequest.status == RefundStatus.PENDING_APPROVAL,
            RefundRequest.is_deleted == False
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Refund request already pending")

        refund_amount = room_booking.total_fee
        
        refund_request = RefundRequest(
            booking_id=None,
            room_booking_id=room_booking.id,
            amount=refund_amount,
            reason=req.reason,
            details=req.details,
            requested_by_id=current_account.id
        )
        
        if req.reason in AUTO_APPROVE_REASONS:
            refund_request.status = RefundStatus.AUTO_APPROVED
            room_booking.status = BookingStatus.REFUNDED
            # 如果已經指派了實體房間，釋放房間
            if room_booking.assigned_room_id:
                from src.hotel.models import Room
                room = db.query(Room).filter(Room.id == room_booking.assigned_room_id).first()
                if room:
                    room.status = "AVAILABLE"
        else:
            refund_request.status = RefundStatus.PENDING_APPROVAL
            
        db.add(refund_request)
        db.commit()
        db.refresh(refund_request)
        
        return RefundResponse(
            id=refund_request.id,
            booking_id=room_booking.id,
            pet_name=room_booking.pet.name,
            service_name=f"🏨 寵物旅館 - {room_booking.room_type.name}",
            amount=refund_request.amount,
            reason=refund_request.reason,
            details=refund_request.details,
            status=refund_request.status,
            requested_by_id=refund_request.requested_by_id,
            approved_by_id=refund_request.approved_by_id,
            created_at=refund_request.created_at
        )


@router.get("/refund/pending", response_model=List[RefundResponse], summary="取得待審核退款單 (限店長)")
def get_pending_refunds(
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN]))
):
    if not current_account.staff_profile or "店長" not in current_account.staff_profile.department:
        raise HTTPException(status_code=403, detail="此操作僅限店長執行")
    requests = db.query(RefundRequest).filter(
        RefundRequest.status == RefundStatus.PENDING_APPROVAL,
        RefundRequest.is_deleted == False
    ).all()
    
    results = []
    for r in requests:
        if r.booking_id:
            results.append(RefundResponse(
                id=r.id,
                booking_id=r.booking_id,
                pet_name=r.booking.pet.name,
                service_name=r.booking.service_item.name,
                amount=r.amount,
                reason=r.reason,
                details=r.details,
                status=r.status,
                requested_by_id=r.requested_by_id,
                approved_by_id=r.approved_by_id,
                created_at=r.created_at
            ))
        elif r.room_booking_id:
            results.append(RefundResponse(
                id=r.id,
                booking_id=r.room_booking_id,
                pet_name=r.room_booking.pet.name,
                service_name=f"🏨 寵物旅館 - {r.room_booking.room_type.name}",
                amount=r.amount,
                reason=r.reason,
                details=r.details,
                status=r.status,
                requested_by_id=r.requested_by_id,
                approved_by_id=r.approved_by_id,
                created_at=r.created_at
            ))
    return results


@router.post("/refund/{refund_id}/approve", response_model=RefundResponse, summary="批准異常退款單 (限店長)")
def approve_refund(
    refund_id: UUID4,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN]))
):
    if not current_account.staff_profile or "店長" not in current_account.staff_profile.department:
        raise HTTPException(status_code=403, detail="此操作僅限店長執行")
    refund = db.query(RefundRequest).filter(RefundRequest.id == refund_id).first()
    if not refund:
        raise HTTPException(status_code=404, detail="Refund request not found")
        
    if refund.status != RefundStatus.PENDING_APPROVAL:
        raise HTTPException(status_code=400, detail="Only pending requests can be approved")
        
    refund.status = RefundStatus.MANUAL_APPROVED
    refund.approved_by_id = current_account.id
    
    if refund.booking_id:
        refund.booking.status = BookingStatus.REFUNDED
        db.commit()
        db.refresh(refund)
        return RefundResponse(
            id=refund.id,
            booking_id=refund.booking_id,
            pet_name=refund.booking.pet.name,
            service_name=refund.booking.service_item.name,
            amount=refund.amount,
            reason=refund.reason,
            details=refund.details,
            status=refund.status,
            requested_by_id=refund.requested_by_id,
            approved_by_id=refund.approved_by_id,
            created_at=refund.created_at
        )
    elif refund.room_booking_id:
        refund.room_booking.status = BookingStatus.REFUNDED
        # 釋放實體房
        if refund.room_booking.assigned_room_id:
            from src.hotel.models import Room
            room = db.query(Room).filter(Room.id == refund.room_booking.assigned_room_id).first()
            if room:
                room.status = "AVAILABLE"
                
        db.commit()
        db.refresh(refund)
        return RefundResponse(
            id=refund.id,
            booking_id=refund.room_booking_id,
            pet_name=refund.room_booking.pet.name,
            service_name=f"🏨 寵物旅館 - {refund.room_booking.room_type.name}",
            amount=refund.amount,
            reason=refund.reason,
            details=refund.details,
            status=refund.status,
            requested_by_id=refund.requested_by_id,
            approved_by_id=refund.approved_by_id,
            created_at=refund.created_at
        )


@router.post("/refund/{refund_id}/reject", response_model=RefundResponse, summary="駁回退款單 (限店長)")
def reject_refund(
    refund_id: UUID4,
    db: Session = Depends(get_db),
    current_account: Account = Depends(RequireRole([RoleEnum.ADMIN]))
):
    if not current_account.staff_profile or "店長" not in current_account.staff_profile.department:
        raise HTTPException(status_code=403, detail="此操作僅限店長執行")
    refund = db.query(RefundRequest).filter(RefundRequest.id == refund_id).first()
    if not refund:
        raise HTTPException(status_code=404, detail="Refund request not found")
        
    if refund.status != RefundStatus.PENDING_APPROVAL:
        raise HTTPException(status_code=400, detail="Only pending requests can be rejected")
        
    refund.status = RefundStatus.REJECTED
    refund.approved_by_id = current_account.id
    
    db.commit()
    db.refresh(refund)
    
    if refund.booking_id:
        return RefundResponse(
            id=refund.id,
            booking_id=refund.booking_id,
            pet_name=refund.booking.pet.name,
            service_name=refund.booking.service_item.name,
            amount=refund.amount,
            reason=refund.reason,
            details=refund.details,
            status=refund.status,
            requested_by_id=refund.requested_by_id,
            approved_by_id=refund.approved_by_id,
            created_at=refund.created_at
        )
    elif refund.room_booking_id:
        return RefundResponse(
            id=refund.id,
            booking_id=refund.room_booking_id,
            pet_name=refund.room_booking.pet.name,
            service_name=f"🏨 寵物旅館 - {refund.room_booking.room_type.name}",
            amount=refund.amount,
            reason=refund.reason,
            details=refund.details,
            status=refund.status,
            requested_by_id=refund.requested_by_id,
            approved_by_id=refund.approved_by_id,
            created_at=refund.created_at
        )
