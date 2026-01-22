from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Response
from sqlalchemy.orm import Session
from typing import List
from PIL import Image, ImageOps
import shutil
import os
import time
import gc
from concurrent.futures import ThreadPoolExecutor

from app import models, schemas, crud
from app.dependencies import get_db_session, get_current_user
from app.core.config import settings

router = APIRouter()

# Thread pool for background image thumbnail processing
# Zmniejszamy max_workers do 1, aby uniknąć problemów z pamięcią na małych instancjach (np. Azure B1s)
_thumbnail_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="thumbnail_")


def _generate_thumbnail_sync(file_path: str, thumbnail_path: str) -> tuple[bool, str | None]:
    """
    Synchronous function to generate a thumbnail. Runs in a thread pool worker.
    Returns (success: bool, thumbnail_url: str | None)
    Produces highly compressed WebP thumbnails (max 400x400, quality=55).
    Falls back to JPEG/PNG when necessary.
    
    Strategy:
    - Always resize and compress thumbnails regardless of source format or size
    - Resize to max 400x400 (small enough for web galleries)
    - Use aggressive WebP compression (quality=55, method=6)
    - For PNG fallback: quantize to 256 colors for massive size reduction
    """
    try:
        with Image.open(file_path) as img:
            # Correct orientation from EXIF if present
            img = ImageOps.exif_transpose(img)
            
            # Check original dimensions
            orig_width, orig_height = img.size
            target_size = 400  # Reduced from 800 to 400 for smaller file sizes
            
            # Detect alpha channel
            bands = img.getbands()
            has_alpha = "A" in bands
            
            # Convert to appropriate mode for saving
            if has_alpha:
                img = img.convert("RGBA")
            else:
                img = img.convert("RGB")
            
            # Only resize if larger than target; never upscale
            if orig_width > target_size or orig_height > target_size:
                img.thumbnail((target_size, target_size), Image.Resampling.LANCZOS)
            
            # Ensure target directory exists
            os.makedirs(os.path.dirname(thumbnail_path), exist_ok=True)
            
            # Prefer WebP for thumbnails with aggressive compression
            save_format = "WEBP"
            webp_kwargs: dict = {"quality": 55, "method": 6}  # Quality=55 for smaller files
            
            # Try saving as WebP; if that fails, fallback to JPEG/PNG
            try:
                img.save(thumbnail_path, format=save_format, **webp_kwargs)
            except Exception:
                if not has_alpha:
                    # Fallback JPEG for no-alpha images
                    img.save(thumbnail_path, format="JPEG", optimize=True, quality=55, progressive=True)
                else:
                    # Fallback PNG with aggressive quantization to 256 colors
                    try:
                        quantized = img.quantize(colors=256, method=Image.MEDIANCUT)
                        quantized.save(thumbnail_path, format="PNG", optimize=True)
                    except Exception:
                        img.save(thumbnail_path, format="PNG", optimize=True)
            
            return True, f"/{thumbnail_path}"
    except Exception as e:
        print(f"Warning: could not create thumbnail for {file_path}: {e}")
        import traceback
        traceback.print_exc()
        return False, None
    finally:
        # Wymuszamy zwolnienie pamięci po przetworzeniu każdego zdjęcia
        gc.collect()


def _update_photo_thumbnail(photo_id: int, thumbnail_url: str | None) -> None:
    """
    Background task to update photo record with thumbnail URL after generation completes.
    Runs in a thread pool worker.
    """
    from app.database import SessionLocal
    try:
        db = SessionLocal()
        photo = crud.crud_photo.get_photo(db, photo_id=photo_id)
        if photo:
            photo.thumbnail_url = thumbnail_url
            db.commit()
            db.refresh(photo)
        db.close()
    except Exception as e:
        print(f"Warning: could not update thumbnail_url for photo {photo_id}: {e}")


# --- Endpoint ZABEZPIECZONY (Przesylanie Pliku) ---
@router.post("/", response_model=schemas.photo.PhotoRead, status_code=status.HTTP_201_CREATED)
async def create_new_photo(
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

    # Invalidate cache immediately
    # Używamy namespace="fastapi-cache", ponieważ taki prefix został ustawiony w main.py
    # await FastAPICache.clear(namespace="fastapi-cache")

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

    # Generowanie miniatury asynchronicznie (w thread pool)
    # Nie blokujemy request — zwracamy odpowiedź szybko, miniatura będzie wygenerowana w tle
    thumbnail_url: str | None = None
    # Używamy rozszerzenia .webp dla miniaturek, ponieważ taki jest docelowy format
    thumbnail_path = os.path.join(THUMB_DIR, f"{candidate}.webp")

    photo_in = schemas.photo.PhotoCreate(
        title=title,
        description=description,
        image_url=f"/{file_path}",
        thumbnail_url=thumbnail_url,  # Initially None; will be filled in background
        album_id=album_id,
    )

    db_album = crud.crud_album.get_album(db, album_id=album_id)
    if not db_album:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=404, detail=f"Album o ID {album_id} nie istnieje.")

    # Create photo in database immediately
    db_photo = crud.crud_photo.create_photo(db=db, photo=photo_in)

    # Queue thumbnail generation as background task (non-blocking)
    if settings.OPTIMIZATION_MODE.lower() in ["thumbnails", "all"]:
        _thumbnail_executor.submit(_generate_thumbnail_and_update, file_path, thumbnail_path, db_photo.id)

    return db_photo


def _generate_thumbnail_and_update(file_path: str, thumbnail_path: str, photo_id: int) -> None:
    """
    Background task: generate thumbnail and update photo record.
    Runs in a thread pool worker (does not block request).
    """
    success, thumbnail_url = _generate_thumbnail_sync(file_path, thumbnail_path)
    if success:
        _update_photo_thumbnail(photo_id, thumbnail_url)



# --- Endpointy PUBLICZNE ---
@router.get("/", response_model=List[schemas.photo.PhotoRead])
def read_all_photos(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session),
):
    """
    Pobiera liste wszystkich zdjec. Publicznie dostepne.
    """
    # Disable browser caching for API response
    if settings.OPTIMIZATION_MODE.lower() not in ["caching", "all"]:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    
    photos = crud.crud_photo.get_all_photos(db, skip=skip, limit=limit)
    return photos


@router.get("/album/{album_id}", response_model=List[schemas.photo.PhotoRead])
def read_photos_for_album(
    album_id: int,
    response: Response,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session),
):
    """
    Pobiera liste zdjec dla konkretnego albumu. Publicznie dostepne.
    """
    # Disable browser caching for API response
    if settings.OPTIMIZATION_MODE.lower() not in ["caching", "all"]:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"

    photos = crud.crud_photo.get_photos_by_album(
        db, album_id=album_id, skip=skip, limit=limit
    )
    return photos


@router.patch("/{photo_id}", response_model=schemas.photo.PhotoRead)
async def update_photo(
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
    
    # Invalidate cache immediately
    # await FastAPICache.clear(namespace="fastapi-cache")
    
    return db_photo


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
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
    
    # Invalidate cache AFTER database commit to avoid race conditions
    # await FastAPICache.clear(namespace="fastapi-cache")
    
    return None
