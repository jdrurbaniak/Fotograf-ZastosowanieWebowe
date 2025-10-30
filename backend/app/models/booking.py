# app/models/booking.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum

# Definiujemy możliwe statusy rezerwacji
class BookingStatus(str, enum.Enum):
    PENDING = "oczekująca"
    CONFIRMED = "potwierdzona"
    CANCELLED = "anulowana"

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    
    # Dane klienta
    client_name = Column(String, nullable=False)
    client_email = Column(String, nullable=False, index=True)
    client_phone = Column(String, nullable=True)
    
    # Dane rezerwacji
    service_name = Column(String, nullable=False) # Np. "Sesja portretowa", "Reportaż ślubny"
    booking_date = Column(DateTime, nullable=False)
    
    # Status rezerwacji (oczekująca, potwierdzona, anulowana)
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING, nullable=False)
    
    # Dodatkowe uwagi od klienta
    notes = Column(String, nullable=True)
    