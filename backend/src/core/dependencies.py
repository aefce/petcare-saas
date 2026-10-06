from typing import Generator, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
import os

from src.core.config import settings
from src.core.cache import redis_client
from src.identity.models import Account, RoleEnum

# 這裡因為缺少真實的 SessionLocal，我們簡化實作
# 實際環境需透過 src.core.database 取得
# TODO: 建立 core.database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_account(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Account:
    """驗證 JWT 並確保不在黑名單中 (UR-16)"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 檢查 Redis 黑名單
    is_blacklisted = redis_client.get(f"bl_{token}")
    if is_blacklisted:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        account_id: str = payload.get("sub")
        if account_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    account = db.query(Account).filter(Account.id == account_id).first()
    if account is None or not account.is_active or account.is_deleted:
        raise credentials_exception
    return account

class RequireRole:
    """RBAC Role Checker Dependency (UR-11)"""
    def __init__(self, allowed_roles: List[RoleEnum]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_account: Account = Depends(get_current_account)):
        if current_account.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )
        return current_account
