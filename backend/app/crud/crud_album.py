from sqlalchemy.orm import Session
from app.models.album import Album
from app.schemas.album import AlbumCreate

def create_album(db: Session, album: AlbumCreate) -> Album:
    """Tworzy nowy album w bazie danych."""
    db_album = Album(title=album.title, description=album.description)
    db.add(db_album)
    db.commit()
    db.refresh(db_album)
    return db_album

def get_album(db: Session, album_id: int) -> Album | None:
    """Pobiera jeden album po ID."""
    return db.query(Album).filter(Album.id == album_id).first()

def get_albums(db: Session, skip: int = 0, limit: int = 100) -> list[Album]:
    """Pobiera listę albumów (z paginacją)."""
    return db.query(Album).offset(skip).limit(limit).all()