from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas, crud
from app.dependencies import get_db_session, get_current_user

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
    db: Session = Depends(get_db_session)
):
    """
    Pobiera listę wszystkich albumów. Publicznie dostępne.
    """
    albums = crud.crud_album.get_albums(db, skip=skip, limit=limit)
    return albums

@router.get("/{album_id}", response_model=schemas.album.AlbumRead)
def read_single_album(
    album_id: int,
    db: Session = Depends(get_db_session)
):
    """
    Pobiera informacje o jednym albumie. Publicznie dostępne.
    """
    db_album = crud.crud_album.get_album(db, album_id=album_id)
    if db_album is None:
        raise HTTPException(status_code=404, detail="Album not found")
    return db_album