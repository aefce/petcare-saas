import sys
import os
import random
from datetime import datetime, timedelta, date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from src.core.dependencies import SessionLocal
from src.identity.models import PetOwner, Account, RoleEnum
from src.booking.models import Pet, ServiceItem, TimeSlot, Booking, BookingStatus

def seed_month_data():
    db = SessionLocal()
    try:
        # 1. Ensure we have a PetOwner and Pet
        owner_email = "owner@petcare.com"
        owner_account = db.query(Account).filter(Account.email == owner_email).first()
        if not owner_account:
            print("Please run seed.py first to create the owner account.")
            return

        pet_owner = db.query(PetOwner).filter(PetOwner.account_id == owner_account.id).first()
        if not pet_owner:
            print("Owner account exists but PetOwner profile missing.")
            return

        pet = db.query(Pet).filter(Pet.owner_id == pet_owner.id).first()
        if not pet:
            pet = Pet(owner_id=pet_owner.id, name="毛毛", species="Dog", breed="Golden Retriever")
            db.add(pet)
            db.commit()

        # 2. Ensure we have some ServiceItems
        services = db.query(ServiceItem).all()
        if not services:
            services = [
                ServiceItem(name="基礎洗澡", duration_minutes=60, price=800),
                ServiceItem(name="精緻深層洗淨", duration_minutes=90, price=1200),
                ServiceItem(name="全身大修造型", duration_minutes=120, price=2000),
                ServiceItem(name="安親照顧(半天)", duration_minutes=240, price=500),
            ]
            db.add_all(services)
            db.commit()
            services = db.query(ServiceItem).all()

        # 3. Generate TimeSlots and Bookings for the past 30 days and today
        today = date.today()
        start_date = today - timedelta(days=30)

        bookings_created = 0

        for day_offset in range(35): # 30 days past + 5 days future
            current_date = start_date + timedelta(days=day_offset)
            
            # Create 1 to 5 bookings per day randomly
            num_bookings_today = random.randint(1, 5)
            
            for i in range(num_bookings_today):
                # random hour between 10 AM and 18 PM
                hour = random.randint(10, 18)
                start_dt = datetime.combine(current_date, datetime.min.time()).replace(hour=hour)
                end_dt = start_dt + timedelta(hours=1)
                
                service = random.choice(services)
                
                # Create TimeSlot
                time_slot = TimeSlot(start_time=start_dt, end_time=end_dt, max_capacity=1)
                db.add(time_slot)
                db.flush() # get time_slot.id
                
                status = BookingStatus.COMPLETED
                if current_date > today:
                    status = random.choice([BookingStatus.PENDING, BookingStatus.CONFIRMED])
                elif current_date == today:
                    status = random.choice([BookingStatus.COMPLETED, BookingStatus.ACTIVE, BookingStatus.CONFIRMED])

                booking = Booking(
                    pet_id=pet.id,
                    service_item_id=service.id,
                    time_slot_id=time_slot.id,
                    status=status,
                    fee_charged=service.price
                )
                db.add(booking)
                bookings_created += 1

        db.commit()
        print(f"Successfully generated {bookings_created} bookings across the past month!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_month_data()
