import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from src.core.cache import redis_client

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    API Rate Limiter 中介軟體 (對應 UR-18)。
    針對 IP 位址限制請求頻率，防止 DDoS 或惡意爬蟲。
    """
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def dispatch(self, request: Request, call_next):
        # 獲取 Client IP (處理 Proxy 的情況)
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0]

        rate_limit_key = f"rate_limit:{client_ip}"
        
        # 使用 Redis 管道執行原子性操作
        pipeline = redis_client.pipeline()
        pipeline.incr(rate_limit_key)
        pipeline.expire(rate_limit_key, self.window_seconds, nx=True)
        results = pipeline.execute()
        
        request_count = results[0]

        if request_count > self.max_requests:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too Many Requests",
                    "message": f"Rate limit exceeded. Maximum {self.max_requests} requests per {self.window_seconds} seconds."
                }
            )

        response = await call_next(request)
        return response
