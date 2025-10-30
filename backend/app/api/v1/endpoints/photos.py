from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List
import shutil # Do zapisywania plików
import os

from app import models, schemas, crud
from app.dependencies import get_db_session, get_current_user

router = APIRouter()

# --- Endpoint ZABEZPIECZONY (Przesyłanie Pliku) ---
@router.post("/", response_model=schemas.photo.PhotoRead, status_code=status.HTTP_201_CREATED)
def create_new_photo(
    # Zamiast JSON, oczekujemy danych formularza
    title: str = Form(...),
    album_id: int = Form(...),
    description: str | None = Form(default=None),
    file: UploadFile = File(...), # To jest nasz plik zdjęcia
    db: Session = Depends(get_db_session),
    current_user: models.user.User = Depends(get_current_user)
):
    """
    Przesyła nowe zdjęcie i zapisuje je na serwerze oraz w bazie danych.
    Wymaga autentykacji administratora.
    """
    
    # 1. Zdefiniuj ścieżkę zapisu pliku
    # Na razie zapiszemy pliki lokalnie w nowym folderze 'uploads'
    UPLOAD_DIR = "uploads"
    os.makedirs(UPLOAD_DIR, exist_ok=True) # Stwórz folder, jeśli nie istnieje
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Nie można zapisać pliku: {e}")
    finally:
        file.file.close()

    photo_in = schemas.photo.PhotoCreate(
        title=title,
        description=description,
        image_url=f"/{file_path}", # Ważne: ścieżka URL, nie ścieżka systemowa
        album_id=album_id
    )
    
    # Sprawdź, czy album istnieje
    db_album = crud.crud_album.get_album(db, album_id=album_id)
    if not db_album:
        # Jeśli album nie istnieje, usuń zapisany plik, aby nie śmiecić
        os.remove(file_path)
        raise HTTPException(status_code=404, detail=f"Album o ID {album_id} nie istnieje.")
        
    return crud.crud_photo.create_photo(db=db, photo=photo_in)


# --- Endpointy PUBLICZNE ---
@router.get("/", response_model=List[schemas.photo.PhotoRead])
def read_all_photos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session)
):
    """
    Pobiera listę wszystkich zdjęć. Publicznie dostępne.
    """
    photos = crud.crud_photo.get_all_photos(db, skip=skip, limit=limit)
    return photos

@router.get("/album/{album_id}", response_model=List[schemas.photo.PhotoRead])
def read_photos_for_album(
    album_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session)
):
    """
    Pobiera listę zdjęć dla konkretnego albumu. Publicznie dostępne.
    """

    photos = crud.crud_photo.get_photos_by_album(
        db, album_id=album_id, skip=skip, limit=limit
    )
    return photos