from sqlalchemy.orm import Session
from app.models.photo import Photo
from app.schemas.photo import PhotoCreate, PhotoUpdate

def create_photo(db: Session, photo: PhotoCreate) -> Photo:
    """Dodaje nowe zdjęcie do bazy danych."""
    db_photo = Photo(
        title=photo.title,
        description=photo.description,
        image_url=photo.image_url,
        thumbnail_url=photo.thumbnail_url,
        album_id=photo.album_id
    )
    db.add(db_photo)
    db.commit()
    db.refresh(db_photo)
    return db_photo

def get_photo(db: Session, photo_id: int) -> Photo | None:
    """Pobiera jedno zdjęcie po ID."""
    return db.query(Photo).filter(Photo.id == photo_id).first()

def get_photos_by_album(db: Session, album_id: int, skip: int = 0, limit: int = 100) -> list[Photo]:
    """Pobiera listę zdjęć dla konkretnego albumu."""
    return db.query(Photo).filter(Photo.album_id == album_id).offset(skip).limit(limit).all()

def get_all_photos(db: Session, skip: int = 0, limit: int = 100) -> list[Photo]:
    """Pobiera listę wszystkich zdjęć."""
    return db.query(Photo).offset(skip).limit(limit).all()

def update_photo(db: Session, photo_id: int, photo_update: PhotoUpdate) -> Photo | None:
    """Aktualizuje zdjęcie. Zwraca zaktualizowane zdjęcie lub None jeśli nie znaleziono."""
    db_photo = get_photo(db, photo_id=photo_id)
    if not db_photo:
        return None
    
    # Aktualizuj tylko pola, które zostały podane
    update_data = photo_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_photo, field, value)
    
    db.commit()
    db.refresh(db_photo)
    return db_photo

def delete_photo(db: Session, photo_id: int) -> Photo | None:
    """Usuwa zdjęcie z bazy danych. Zwraca usunięte zdjęcie lub None jeśli nie znaleziono."""
    db_photo = get_photo(db, photo_id=photo_id)
    if not db_photo:
        return None
    
    db.delete(db_photo)
    db.commit()
    return db_photo