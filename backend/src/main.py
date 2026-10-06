from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from src.core.middlewares.rate_limit import RateLimitMiddleware
from src.core.dependencies import engine
from src.core.models import Base
from src.execution.models import StaffNotification

# Ensure all database tables exist (e.g. staff_notifications)
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="PetCare SaaS API",
    description="Backend API for PetCare SaaS with Modular Monolith architecture",
    version="1.0.0"
)

# CORS Middleware (允許前端連線)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開發階段允許所有來源，生產環境需嚴格限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 為了提供上傳頭像的存取
import os
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

from src.identity.router import router as identity_router
from src.booking.router import router as booking_router
from src.payment.router import router as payment_router
from src.hr.router import router as hr_router
from src.execution.router import router as execution_router
from src.hotel.router import router as hotel_router

# 加入我們實作的 API Rate Limiter
app.add_middleware(RateLimitMiddleware)

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(identity_router, prefix="/api/auth", tags=["Auth & Identity"])
app.include_router(booking_router, prefix="/api/booking", tags=["Booking & Core Ops"])
app.include_router(payment_router, prefix="/api/payment", tags=["Payment Integration"])
app.include_router(hr_router, prefix="/api/hr", tags=["HR & Attendance"])
app.include_router(execution_router, prefix="/api/execution", tags=["Execution & Operations"])
app.include_router(hotel_router, prefix="/api/hotel", tags=["Pet Hotel Booking"])
