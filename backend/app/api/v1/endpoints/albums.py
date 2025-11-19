from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas, crud
from app.dependencies import get_db_session, get_current_user, get_current_user_optional

router = APIRouter()

# --- Endpoint ZABEZPIECZONY ---
@router.post("/", response_model=schemas.album.AlbumRead, status_code=status.HTTP_201_CREATED)
def create_new_album(
    album: schemas.album.AlbumCreate,
    db: Session = Depends(get_db_session),
    # To jest nasz "zamek". Jeśli token będzie niepoprawny,
    # użytkownik dostanie błąd 401 Unauthorized.
    current_user: models.user.User = Depends(get_current_user)
):
    """
    Tworzy nowy album. Wymaga autentykacji administratora.
    """
    # current_user jest obiektem, możemy go użyć do logów, ale
    # na razie sama jego obecność potwierdza autentykację.
    return crud.crud_album.create_album(db=db, album=album)


# --- Endpointy PUBLICZNE ---
@router.get("/", response_model=List[schemas.album.AlbumRead])
def read_all_albums(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session),
    current_user: models.user.User | None = Depends(get_current_user_optional)
):
    """
    Pobiera listę albumów.
    - Dla niezalogowanych: tylko publiczne
    - Dla zalogowanych (admin): wszystkie
    """
    if current_user is None:
        return crud.crud_album.get_public_albums(db, skip=skip, limit=limit)
    return crud.crud_album.get_albums(db, skip=skip, limit=limit)

@router.get("/{album_id}", response_model=schemas.album.AlbumRead)
def read_single_album(
    album_id: int,
    db: Session = Depends(get_db_session),
    current_user: models.user.User | None = Depends(get_current_user_optional)
):
    """
    Pobiera informacje o jednym albumie. Gdy niezalogowany użytkownik próbuje
    pobrać ukryty album, zwracamy 404.
    """
    db_album = crud.crud_album.get_album(db, album_id=album_id)
    if db_album is None:
        raise HTTPException(status_code=404, detail="Album not found")
    if current_user is None and not db_album.is_public:
        raise HTTPException(status_code=404, detail="Album not found")
    return db_album

@router.patch("/{album_id}", response_model=schemas.album.AlbumRead)
def update_album(
    album_id: int,
    album_update: schemas.album.AlbumUpdate,
    db: Session = Depends(get_db_session),
    current_user: models.user.User = Depends(get_current_user)
):
    """
    Aktualizuje album (tytuł i/lub opis). Wymaga autentykacji.
    """
    db_album = crud.crud_album.update_album(db, album_id=album_id, album_update=album_update)
    if db_album is None:
        raise HTTPException(status_code=404, detail="Album not found")
    return db_album

@router.delete("/{album_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_album(
    album_id: int,
    db: Session = Depends(get_db_session),
    current_user: models.user.User = Depends(get_current_user)
):
    """
    Usuwa album. Wymaga autentykacji.
    UWAGA: Zdjęcia w albumie zostaną usunięte przez CASCADE (jeśli skonfigurowane)
    lub będą osieroconione.
    """
    db_album = crud.crud_album.delete_album(db, album_id=album_id)
    if db_album is None:
        raise HTTPException(status_code=404, detail="Album not found")
    return None


@router.post("/reorder", status_code=status.HTTP_204_NO_CONTENT)
def reorder_albums(
    payload: schemas.album.AlbumReorderRequest,
    db: Session = Depends(get_db_session),
    current_user: models.user.User = Depends(get_current_user)
):
    """
    Ustawia kolejność albumów na podstawie listy identyfikatorów.
    Wymaga autentykacji administratora.
    """
    if not payload.album_ids or len(payload.album_ids) == 0:
        raise HTTPException(status_code=400, detail="Brak album_ids")
    # Opcjonalnie: walidacja czy wszystkie id istnieją
    crud.crud_album.reorder_albums(db, payload.album_ids)
    return None