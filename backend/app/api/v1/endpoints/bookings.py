# app/api/v1/endpoints/bookings.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas, crud
from app.dependencies import get_db_session, get_current_user

router = APIRouter()

# --- Endpoint PUBLICZNY (Tworzenie rezerwacji przez klienta) ---
@router.post("/", response_model=schemas.booking.BookingRead, status_code=status.HTTP_201_CREATED)
def submit_booking(
    booking: schemas.booking.BookingCreate,
    db: Session = Depends(get_db_session)
):
    """
    Publiczny endpoint dla klientów do wysyłania zgłoszeń rezerwacji.
    """
    # TODO: Dodać walidację, czy data nie jest z przeszłości 
    # lub czy termin nie jest już zajęty
    
    return crud.crud_booking.create_booking(db=db, booking=booking)

# --- Endpointy ZABEZPIECZONE (dla fotografa/admina) ---

@router.get("/", response_model=List[schemas.booking.BookingRead])
def read_all_bookings(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session),
    current_user: models.user.User = Depends(get_current_user)
):
    """
    Pobiera listę wszystkich rezerwacji. Wymaga autentykacji.
    """
    bookings = crud.crud_booking.get_bookings(db, skip=skip, limit=limit)
    return bookings

@router.patch("/{booking_id}", response_model=schemas.booking.BookingRead)
def update_booking(
    booking_id: int,
    status_update: schemas.booking.BookingUpdateStatus,
    db: Session = Depends(get_db_session),
    current_user: models.user.User = Depends(get_current_user)
):
    """
    Aktualizuje status rezerwacji (np. z 'oczekująca' na 'potwierdzona').
    Wymaga autentykacji.
    """
    db_booking = crud.crud_booking.update_booking_status(
        db, booking_id=booking_id, status=status_update.status
    )
    if db_booking is None:
        raise HTTPException(status_code=404, detail="Rezerwacja nie znaleziona")
    
    return db_booking

@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db_session),
    current_user: models.user.User = Depends(get_current_user)
):
    """
    Usuwa rezerwację. Wymaga autentykacji.
    """
    db_booking = crud.crud_booking.delete_booking(db, booking_id=booking_id)
    if db_booking is None:
        raise HTTPException(status_code=404, detail="Rezerwacja nie znaleziona")
    
    return None