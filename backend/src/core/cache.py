import redis
import uuid
from typing import Optional
from contextlib import contextmanager
from src.core.config import settings

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

class ResourceLockError(Exception):
    pass

@contextmanager
def acquire_ttl_lock(resource_key: str, ttl_seconds: int = 900):
    """
    獲取資源的 TTL 鎖 (對應 UR-01: 預約資源保留 15 分鐘)。
    使用情境：進入結帳前鎖定 Timeslot/Room 資源。
    
    :param resource_key: 要鎖定的資源 ID (例如 "timeslot:123:lock")
    :param ttl_seconds: 鎖定時間 (預設 15 分鐘)
    :raises ResourceLockError: 如果資源已經被其他人鎖定
    """
    lock_id = str(uuid.uuid4())
    # NX=True 確保只有在 key 不存在時才能設定，實現原子性鎖
    acquired = redis_client.set(resource_key, lock_id, ex=ttl_seconds, nx=True)
    
    if not acquired:
        raise ResourceLockError(f"Resource {resource_key} is currently locked by another process.")
    
    try:
        yield lock_id
    finally:
        # 釋放鎖：只在鎖定者 ID 吻合時才刪除 (利用 Lua 腳本保證原子性)
        script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """
        redis_client.eval(script, 1, resource_key, lock_id)
