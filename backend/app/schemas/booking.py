# app/schemas/booking.py
from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from app.models.booking import BookingStatus # Importujemy nasz Enum

class BookingBase(BaseModel):
    client_name: str
    client_email: EmailStr
    client_phone: str | None = None
    service_name: str
    booking_date: datetime
    notes: str | None = None

# Schemat do tworzenia rezerwacji przez klienta (publiczny)
class BookingCreate(BookingBase):
    pass

# Schemat do odczytu (dla admina)
class BookingRead(BookingBase):
    id: int
    status: BookingStatus
    
    model_config = ConfigDict(from_attributes=True)

# Schemat do aktualizacji statusu przez admina
class BookingUpdateStatus(BaseModel):
    status: BookingStatus