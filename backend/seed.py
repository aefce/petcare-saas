import sys
import os
import asyncio

# Setup path so we can import src
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from src.core.dependencies import SessionLocal
from src.identity.models import Account, StaffAccount, PetOwner, RoleEnum
from src.core.security import get_password_hash

def seed_data():
    db = SessionLocal()
    try:
        # 1. System Admin
        admin_email = "admin@petcare.com"
        if not db.query(Account).filter(Account.email == admin_email).first():
            admin = Account(email=admin_email, password_hash=get_password_hash("admin1234"), role=RoleEnum.ADMIN, is_active=True)
            db.add(admin)
            db.flush()
            staff_admin = StaffAccount(account_id=admin.id, name="王維護", department="系統管理員")
            db.add(staff_admin)
            
        # 1.5 Store Manager
        manager_email = "manager@petcare.com"
        if not db.query(Account).filter(Account.email == manager_email).first():
            manager = Account(email=manager_email, password_hash=get_password_hash("manager123"), role=RoleEnum.ADMIN, is_active=True)
            db.add(manager)
            db.flush()
            staff_manager = StaffAccount(account_id=manager.id, name="趙店長", department="店長")
            db.add(staff_manager)
            
        # 2. Groomer (Staff)
        groomer_email = "groomer@petcare.com"
        if not db.query(Account).filter(Account.email == groomer_email).first():
            groomer = Account(email=groomer_email, password_hash=get_password_hash("groomer123"), role=RoleEnum.STAFF, is_active=True)
            db.add(groomer)
            db.flush()
            staff_groomer = StaffAccount(account_id=groomer.id, name="李美容師", department="首席美容師")
            db.add(staff_groomer)

        # 3. Receptionist (Staff)
        receptionist_email = "recept@petcare.com"
        if not db.query(Account).filter(Account.email == receptionist_email).first():
            recept = Account(email=receptionist_email, password_hash=get_password_hash("recept123"), role=RoleEnum.STAFF, is_active=True)
            db.add(recept)
            db.flush()
            staff_recept = StaffAccount(account_id=recept.id, name="陳櫃檯", department="親切櫃檯員")
            db.add(staff_recept)
            
        # 4. Caretaker (Staff)
        caretaker_email = "care@petcare.com"
        if not db.query(Account).filter(Account.email == caretaker_email).first():
            care = Account(email=caretaker_email, password_hash=get_password_hash("care1234"), role=RoleEnum.STAFF, is_active=True)
            db.add(care)
            db.flush()
            staff_care = StaffAccount(account_id=care.id, name="林照護", department="資深照護員")
            db.add(staff_care)

        # 5. Owner
        owner_email = "owner@petcare.com"
        if not db.query(Account).filter(Account.email == owner_email).first():
            owner = Account(email=owner_email, password_hash=get_password_hash("owner1234"), role=RoleEnum.OWNER, is_active=True)
            db.add(owner)
            db.flush()
            import uuid
            pet_owner = PetOwner(account_id=owner.id, name="張飼主", phone=str(uuid.uuid4())[:20])
            db.add(pet_owner)

        # 6. Room Types (Hotel) & Physical Rooms
        from src.hotel.models import RoomType, Room
        
        room_types = [
            {
                "name": "精緻小艙 (狗)",
                "description": "適合中小型犬，配備舒適睡墊與獨立飲水器，每日定時清潔。",
                "price_per_night": 500,
                "total_rooms": 10,
                "prefix": "A"
            },
            {
                "name": "豪華套房 (狗)",
                "description": "適合大型犬或多犬家庭，寬敞活動空間，24小時全天候監視器監控與豪華睡床。",
                "price_per_night": 1200,
                "total_rooms": 5,
                "prefix": "B"
            },
            {
                "name": "溫馨貓格 (貓)",
                "description": "專為貓咪設計的垂直跳台空間，防菌防火建材，配備貓抓板與進口砂盆。",
                "price_per_night": 600,
                "total_rooms": 8,
                "prefix": "C"
            },
            {
                "name": "尊榮貓別墅 (貓)",
                "description": "頂級挑高貓咪別墅，多層次實木跳台，大片落地窗採光，高質感貓抓柱與私密隱蔽小窩。",
                "price_per_night": 1000,
                "total_rooms": 4,
                "prefix": "D"
            }
        ]
        
        for rt_data in room_types:
            rt = db.query(RoomType).filter(RoomType.name == rt_data["name"]).first()
            if not rt:
                rt = RoomType(
                    name=rt_data["name"],
                    description=rt_data["description"],
                    price_per_night=rt_data["price_per_night"],
                    total_rooms=rt_data["total_rooms"],
                    is_active=True
                )
                db.add(rt)
                db.flush()
                
            # 種植實體房間
            for i in range(1, rt_data["total_rooms"] + 1):
                room_num = f"{rt_data['prefix']}{i:02d}" # 例如 A01, A02
                if not db.query(Room).filter(Room.room_number == room_num, Room.is_deleted == False).first():
                    r = Room(
                        room_type_id=rt.id,
                        room_number=room_num,
                        status="AVAILABLE"
                    )
                    db.add(r)

        db.commit()
        print("Successfully seeded all role accounts, room types, and physical rooms!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
