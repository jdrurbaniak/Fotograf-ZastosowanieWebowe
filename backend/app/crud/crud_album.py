from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.album import Album
from app.schemas.album import AlbumCreate, AlbumUpdate

def create_album(db: Session, album: AlbumCreate) -> Album:
    """Tworzy nowy album w bazie danych."""
    # Ustal sort_order jako maksymalny istniejący + 1 (jeśli brak, zacznij od 1)
    max_order = db.query(func.max(Album.sort_order)).scalar() or 0
    db_album = Album(
        title=album.title,
        description=album.description,
        is_public=album.is_public,
        sort_order=max_order + 1,
    )
    db.add(db_album)
    db.commit()
    db.refresh(db_album)
    return db_album

def get_album(db: Session, album_id: int) -> Album | None:
    """Pobiera jeden album po ID."""
    return db.query(Album).filter(Album.id == album_id).first()

def get_albums(db: Session, skip: int = 0, limit: int = 100) -> list[Album]:
    """Pobiera listę albumów (z paginacją), posortowaną wg sort_order (lub id jeśli brak)."""
    return (
        db.query(Album)
        .order_by(func.coalesce(Album.sort_order, Album.id).asc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_public_albums(db: Session, skip: int = 0, limit: int = 100) -> list[Album]:
    """Pobiera tylko publiczne albumy (dla niezalogowanych), posortowane wg sort_order/id."""
    return (
        db.query(Album)
        .filter(Album.is_public.is_(True))
        .order_by(func.coalesce(Album.sort_order, Album.id).asc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def reorder_albums(db: Session, album_ids: list[int]) -> None:
    """Ustawia sort_order na podstawie kolejności identyfikatorów w album_ids (0..n-1)."""
    for idx, aid in enumerate(album_ids):
        db.query(Album).filter(Album.id == aid).update({Album.sort_order: idx + 1})
    db.commit()

def update_album(db: Session, album_id: int, album_update: AlbumUpdate) -> Album | None:
    """Aktualizuje album. Zwraca zaktualizowany album lub None jeśli nie znaleziono."""
    db_album = get_album(db, album_id=album_id)
    if not db_album:
        return None
    
    # Aktualizuj tylko pola, które zostały podane (nie są None)
    update_data = album_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_album, field, value)
    
    db.commit()
    db.refresh(db_album)
    return db_album

def delete_album(db: Session, album_id: int) -> Album | None:
    """Usuwa album z bazy danych. Zwraca usunięty album lub None jeśli nie znaleziono."""
    db_album = get_album(db, album_id=album_id)
    if not db_album:
        return None
    
    db.delete(db_album)
    db.commit()
    return db_album