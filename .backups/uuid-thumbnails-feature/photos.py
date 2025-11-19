from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List
import shutil # Do zapisywania plików
import os
import uuid
from PIL import Image
from io import BytesIO

from app import models, schemas, crud
from app.dependencies import get_db_session, get_current_user

router = APIRouter()

# --- Endpoint ZABEZPIECZONY (Przesyłanie Pliku) ---
@router.post("/", response_model=schemas.photo.PhotoRead, status_code=status.HTTP_201_CREATED)
async def create_new_photo(
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
    
    # 2. Wygeneruj unikalną nazwę pliku używając UUID
    original_name = os.path.basename(file.filename or "")
    if not original_name:
        raise HTTPException(status_code=400, detail="Brak nazwy pliku")
    _, ext = os.path.splitext(original_name)
    ext = ext.lower() if ext else '.jpg'  # domyślne rozszerzenie jeśli brak
    
    # Użyj UUID dla gwarancji unikalności
    unique_id = uuid.uuid4().hex
    original_filename = f"{unique_id}{ext}"
    thumbnail_filename = f"{unique_id}_thumb{ext}"
    
    original_path = os.path.join(UPLOAD_DIR, original_filename)
    thumbnail_path = os.path.join(UPLOAD_DIR, thumbnail_filename)
    
    try:
        # Wczytaj zawartość pliku do pamięci
        contents = await file.read()
        
        # Zapisz oryginalny plik
        with open(original_path, "wb") as f:
            f.write(contents)
        
        # Wygeneruj miniaturkę (300px szerokości, zachowując proporcje)
        try:
            img = Image.open(BytesIO(contents))
            
            # EXIF orientation - popraw rotację jeśli potrzeba
            try:
                from PIL import ImageOps
                img = ImageOps.exif_transpose(img)
            except Exception:
                pass  # Jeśli brak EXIF, kontynuuj
            
            # Oblicz nowe wymiary (szerokość 300px)
            THUMB_WIDTH = 300
            width, height = img.size
            if width > THUMB_WIDTH:
                ratio = THUMB_WIDTH / width
                new_height = int(height * ratio)
                img_thumb = img.resize((THUMB_WIDTH, new_height), Image.Resampling.LANCZOS)
            else:
                img_thumb = img  # Jeśli mniejszy niż 300px, zostaw bez zmian
            
            # Zapisz miniaturkę (optymalizacja JPEG)
            if img_thumb.mode in ('RGBA', 'LA', 'P'):
                img_thumb = img_thumb.convert('RGB')
            img_thumb.save(thumbnail_path, format='JPEG', quality=85, optimize=True)
            
        except Exception as thumb_error:
            # Jeśli nie udało się wygenerować miniaturki, zapisz None
            print(f"Warning: Nie można wygenerować miniaturki: {thumb_error}")
            thumbnail_path = None
    
    except Exception as e:
        # Usuń pliki jeśli coś poszło nie tak
        if os.path.exists(original_path):
            os.remove(original_path)
        if thumbnail_path and os.path.exists(thumbnail_path):
            os.remove(thumbnail_path)
        raise HTTPException(status_code=500, detail=f"Nie można zapisać pliku: {e}")
    finally:
        await file.close()

    photo_in = schemas.photo.PhotoCreate(
        title=title,
        description=description,
        image_url=f"/{original_path}",  # Ścieżka URL do oryginału
        thumbnail_url=f"/{thumbnail_path}" if thumbnail_path else None,  # Ścieżka URL do miniaturki
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

@router.patch("/{photo_id}", response_model=schemas.photo.PhotoRead)
def update_photo(
    photo_id: int,
    photo_update: schemas.photo.PhotoUpdate,
    db: Session = Depends(get_db_session),
    current_user: models.user.User = Depends(get_current_user)
):
    """
    Aktualizuje zdjęcie (tytuł i/lub opis). Wymaga autentykacji.
    """
    db_photo = crud.crud_photo.update_photo(db, photo_id=photo_id, photo_update=photo_update)
    if db_photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    return db_photo

@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(
    photo_id: int,
    db: Session = Depends(get_db_session),
    current_user: models.user.User = Depends(get_current_user)
):
    """
    Usuwa zdjęcie z bazy danych i z dysku. Wymaga autentykacji.
    """
    db_photo = crud.crud_photo.get_photo(db, photo_id=photo_id)
    if db_photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # Usuń plik z dysku
    file_path = db_photo.image_url.lstrip('/')  # Usuń leading slash
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            # Loguj błąd, ale nie przerywaj usuwania z bazy
            print(f"Warning: Could not delete file {file_path}: {e}")
    
    # Usuń z bazy danych
    crud.crud_photo.delete_photo(db, photo_id=photo_id)
    return None