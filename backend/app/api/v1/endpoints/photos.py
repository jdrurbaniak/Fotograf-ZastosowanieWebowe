from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List
from PIL import Image
import shutil
import os
import time

from app import models, schemas, crud
from app.dependencies import get_db_session, get_current_user

router = APIRouter()


# --- Endpoint ZABEZPIECZONY (Przesylanie Pliku) ---
@router.post("/", response_model=schemas.photo.PhotoRead, status_code=status.HTTP_201_CREATED)
def create_new_photo(
    title: str = Form(...),
    album_id: int = Form(...),
    description: str | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db_session),
    current_user: models.user.User = Depends(get_current_user),
):
    """
    Przesyla nowe zdjecie, zapisuje oryginal i miniature oraz rekord w bazie.
    Wymaga autentykacji administratora.
    """

    UPLOAD_DIR = "uploads"
    THUMB_DIR = os.path.join(UPLOAD_DIR, "thumbnails")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(THUMB_DIR, exist_ok=True)

    original_name = os.path.basename(file.filename or "")
    if not original_name:
        raise HTTPException(status_code=400, detail="Brak nazwy pliku")
    name, ext = os.path.splitext(original_name)

    safe_name = "".join(c for c in name if c.isalnum() or c in (" ", "-", "_")).rstrip()
    safe_name = safe_name.replace(" ", "_") or str(int(time.time()))

    candidate = f"{safe_name}{ext}"
    file_path = os.path.join(UPLOAD_DIR, candidate)

    if os.path.exists(file_path):
        ts = int(time.time())
        candidate = f"{safe_name}-{ts}{ext}"
        file_path = os.path.join(UPLOAD_DIR, candidate)
        counter = 1
        while os.path.exists(file_path):
            candidate = f"{safe_name}-{ts}-{counter}{ext}"
            file_path = os.path.join(UPLOAD_DIR, candidate)
            counter += 1

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Nie mozna zapisac pliku: {e}")
    finally:
        file.file.close()

    # Generowanie miniatury
    thumbnail_url: str | None = None
    thumbnail_path = os.path.join(THUMB_DIR, candidate)
    try:
        with Image.open(file_path) as img:
            img = img.convert("RGB") if img.mode not in ("RGB", "RGBA") else img
            img.thumbnail((800, 800))
            save_format = "JPEG" if ext.lower() in (".jpg", ".jpeg", "") else "PNG"
            img.save(thumbnail_path, format=save_format, optimize=True, quality=85)
            thumbnail_url = f"/{thumbnail_path}"
    except Exception as thumb_err:
        # Miniatura opcjonalna: log do konsoli, ale nie przerywamy uploadu
        print(f"Warning: could not create thumbnail for {file_path}: {thumb_err}")
        thumbnail_path = None

    photo_in = schemas.photo.PhotoCreate(
        title=title,
        description=description,
        image_url=f"/{file_path}",
        thumbnail_url=thumbnail_url,
        album_id=album_id,
    )

    db_album = crud.crud_album.get_album(db, album_id=album_id)
    if not db_album:
        if os.path.exists(file_path):
            os.remove(file_path)
        if thumbnail_path and os.path.exists(thumbnail_path):
            os.remove(thumbnail_path)
        raise HTTPException(status_code=404, detail=f"Album o ID {album_id} nie istnieje.")

    return crud.crud_photo.create_photo(db=db, photo=photo_in)


# --- Endpointy PUBLICZNE ---
@router.get("/", response_model=List[schemas.photo.PhotoRead])
def read_all_photos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session),
):
    """
    Pobiera liste wszystkich zdjec. Publicznie dostepne.
    """
    photos = crud.crud_photo.get_all_photos(db, skip=skip, limit=limit)
    return photos


@router.get("/album/{album_id}", response_model=List[schemas.photo.PhotoRead])
def read_photos_for_album(
    album_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session),
):
    """
    Pobiera liste zdjec dla konkretnego albumu. Publicznie dostepne.
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
    current_user: models.user.User = Depends(get_current_user),
):
    """
    Aktualizuje zdjecie (tytul i/lub opis). Wymaga autentykacji.
    """
    db_photo = crud.crud_photo.update_photo(db, photo_id=photo_id, photo_update=photo_update)
    if db_photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    return db_photo


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(
    photo_id: int,
    db: Session = Depends(get_db_session),
    current_user: models.user.User = Depends(get_current_user),
):
    """
    Usuwa zdjecie z bazy danych i z dysku. Wymaga autentykacji.
    """
    db_photo = crud.crud_photo.get_photo(db, photo_id=photo_id)
    if db_photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")

    file_path = db_photo.image_url.lstrip("/")
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Warning: Could not delete file {file_path}: {e}")

    if db_photo.thumbnail_url:
        thumb_path = db_photo.thumbnail_url.lstrip("/")
        if os.path.exists(thumb_path):
            try:
                os.remove(thumb_path)
            except Exception as e:
                print(f"Warning: Could not delete thumbnail {thumb_path}: {e}")

    crud.crud_photo.delete_photo(db, photo_id=photo_id)
    return None
