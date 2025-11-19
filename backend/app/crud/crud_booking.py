# app/crud/crud_booking.py
from sqlalchemy.orm import Session
from app import models, schemas

# Pobieranie rezerwacji (dla admina)
def get_booking(db: Session, booking_id: int):
    return db.query(models.booking.Booking).filter(models.booking.Booking.id == booking_id).first()

def get_bookings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.booking.Booking).offset(skip).limit(limit).all()

# Tworzenie rezerwacji (publiczne)
def create_booking(db: Session, booking: schemas.booking.BookingCreate):
    db_booking = models.booking.Booking(
        **booking.model_dump(),
        status=models.booking.BookingStatus.PENDING # Ustawiamy domyślny status
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

# Aktualizacja statusu (dla admina)
def update_booking_status(db: Session, booking_id: int, status: models.booking.BookingStatus):
    db_booking = get_booking(db, booking_id=booking_id)
    if not db_booking:
        return None
    
    db_booking.status = status
    db.commit()
    db.refresh(db_booking)
    return db_booking

# Usuwanie rezerwacji (dla admina)
def delete_booking(db: Session, booking_id: int):
    db_booking = get_booking(db, booking_id=booking_id)
    if not db_booking:
        return None
    
    db.delete(db_booking)
    db.commit()
    return db_booking