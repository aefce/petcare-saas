import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import random
import string

from src.identity.models import Account, PetOwner, RoleEnum
from src.identity.schemas import GuestUpgradeRequest, PasswordResetConfirm
from src.core.security import verify_password, get_password_hash, create_access_token
from src.core.email_service import send_email
from src.core.cache import redis_client

class IdentityService:
    def __init__(self, db: Session):
        self.db = db

    def authenticate(self, email: str, password: str) -> Account:
        account = self.db.query(Account).filter(Account.email == email, Account.is_deleted == False).first()
        if not account:
            return None
        if not verify_password(password, account.password_hash):
            return None
        if not account.is_active:
            raise HTTPException(status_code=403, detail="Account is deactivated or suspended")
            
        from datetime import timedelta
        if account.role == RoleEnum.OWNER and account.owner_profile and not account.owner_profile.is_member:
            if datetime.utcnow() - account.created_at > timedelta(days=30):
                raise HTTPException(status_code=403, detail="您的臨時訪客帳號已逾期 (30天限制)。請聯繫櫃檯升級正式會員！")
                
        return account

    def upgrade_guest_to_member(self, request: GuestUpgradeRequest) -> Account:
        """UR-00.C: Guest 單鍵升級為 Member，透過手機號碼綁定"""
        # 1. 透過手機號碼尋找 Guest
        guest = self.db.query(PetOwner).filter(PetOwner.phone == request.phone, PetOwner.is_deleted == False).first()
        
        # 2. 檢查是否已存在 Account
        if guest and guest.account_id:
            raise HTTPException(status_code=400, detail="This phone number is already linked to an account.")

        # 3. 檢查 Email 是否衝突
        if self.db.query(Account).filter(Account.email == request.email).first():
            raise HTTPException(status_code=400, detail="Email already registered.")

        # 4. 建立 Account
        new_account = Account(
            email=request.email,
            password_hash=get_password_hash(request.password),
            role=RoleEnum.OWNER
        )
        self.db.add(new_account)
        self.db.flush()

        if guest:
            # 升級現有 Guest
            guest.account_id = new_account.id
            guest.is_member = True
            guest.member_since = datetime.utcnow()
        else:
            # 建立全新 Member
            new_owner = PetOwner(
                account_id=new_account.id,
                name="New Member", # 可由後續 Profile API 補齊
                phone=request.phone,
                is_member=True,
                member_since=datetime.utcnow()
            )
            self.db.add(new_owner)

        self.db.commit()

        # 發送歡迎信 (包含非同步/SMTP寄送)
        send_email(
            to_email=request.email,
            subject="Welcome to PetCare SaaS!",
            html_content="<h1>Welcome!</h1><p>Your account has been successfully upgraded to Member.</p>"
        )

        return new_account

    def request_password_reset(self, email: str):
        """UR-15: MFA/Email 驗證重置邏輯 - 發送 OTP"""
        account = self.db.query(Account).filter(Account.email == email, Account.is_deleted == False).first()
        if not account:
            return # 安全起見，不回傳 404 防止信箱探測

        # 產生 6 位數 OTP
        otp = ''.join(random.choices(string.digits, k=6))
        
        # 存入 Redis，15 分鐘 TTL
        redis_key = f"pwd_reset:{email}"
        redis_client.set(redis_key, otp, ex=900)

        # 寄送真實 Email
        send_email(
            to_email=email,
            subject="PetCare SaaS - Password Reset OTP",
            html_content=f"<h2>Your OTP is: {otp}</h2><p>This code expires in 15 minutes.</p>"
        )

    def confirm_password_reset(self, request: PasswordResetConfirm):
        redis_key = f"pwd_reset:{request.email}"
        valid_otp = redis_client.get(redis_key)

        if not valid_otp or valid_otp != request.otp:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

        account = self.db.query(Account).filter(Account.email == request.email).first()
        if account:
            account.password_hash = get_password_hash(request.new_password)
            self.db.commit()

        # 使 OTP 失效
        redis_client.delete(redis_key)
