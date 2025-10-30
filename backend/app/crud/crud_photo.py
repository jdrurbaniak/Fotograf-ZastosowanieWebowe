from sqlalchemy.orm import Session
from app.models.photo import Photo
from app.schemas.photo import PhotoCreate

def create_photo(db: Session, photo: PhotoCreate) -> Photo:
    """Dodaje nowe zdjęcie do bazy danych."""
    db_photo = Photo(
        title=photo.title,
        description=photo.description,
        image_url=photo.image_url,
        album_id=photo.album_id
    )
    db.add(db_photo)
    db.commit()
    db.refresh(db_photo)
    return db_photo

def get_photos_by_album(db: Session, album_id: int, skip: int = 0, limit: int = 100) -> list[Photo]:
    """Pobiera listę zdjęć dla konkretnego albumu."""
    return db.query(Photo).filter(Photo.album_id == album_id).offset(skip).limit(limit).all()

def get_all_photos(db: Session, skip: int = 0, limit: int = 100) -> list[Photo]:
    """Pobiera listę wszystkich zdjęć."""
    return db.query(Photo).offset(skip).limit(limit).all()