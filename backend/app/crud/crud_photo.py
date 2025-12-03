from sqlalchemy.orm import Session
from app.models.photo import Photo
from app.schemas.photo import PhotoCreate, PhotoUpdate


def create_photo(db: Session, photo: PhotoCreate) -> Photo:
    """Dodaje nowe zdjecie do bazy danych."""
    db_photo = Photo(
        title=photo.title,
        description=photo.description,
        image_url=photo.image_url,
        thumbnail_url=photo.thumbnail_url,
        album_id=photo.album_id,
    )
    db.add(db_photo)
    db.commit()
    db.refresh(db_photo)
    return db_photo


def get_photo(db: Session, photo_id: int) -> Photo | None:
    """Pobiera jedno zdjecie po ID."""
    return db.query(Photo).filter(Photo.id == photo_id).first()


def get_photos_by_album(db: Session, album_id: int, skip: int = 0, limit: int = 100) -> list[Photo]:
    """Pobiera liste zdjec dla konkretnego albumu."""
    return db.query(Photo).filter(Photo.album_id == album_id).offset(skip).limit(limit).all()


def get_all_photos(db: Session, skip: int = 0, limit: int = 100) -> list[Photo]:
    """Pobiera liste wszystkich zdjec."""
    return db.query(Photo).offset(skip).limit(limit).all()


def update_photo(db: Session, photo_id: int, photo_update: PhotoUpdate) -> Photo | None:
    """Aktualizuje zdjecie. Zwraca zaktualizowane zdjecie lub None jesli nie znaleziono."""
    db_photo = get_photo(db, photo_id=photo_id)
    if not db_photo:
        return None

    # Aktualizuj tylko pola, ktore zostaly podane
    update_data = photo_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_photo, field, value)

    db.commit()
    db.refresh(db_photo)
    return db_photo


def delete_photo(db: Session, photo_id: int) -> Photo | None:
    """Usuwa zdjecie z bazy danych. Zwraca usuniete zdjecie lub None jesli nie znaleziono."""
    db_photo = get_photo(db, photo_id=photo_id)
    if not db_photo:
        return None

    db.delete(db_photo)
    db.commit()
    return db_photo
