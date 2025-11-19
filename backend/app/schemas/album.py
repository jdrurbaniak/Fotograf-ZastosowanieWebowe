from pydantic import BaseModel, ConfigDict

class AlbumBase(BaseModel):
    title: str
    description: str | None = None # Opis jest opcjonalny
    is_public: bool = True

class AlbumCreate(AlbumBase):
    pass # Na razie nie ma dodatkowych pól przy tworzeniu

class AlbumUpdate(BaseModel):
    """Schemat do aktualizacji albumu - wszystkie pola opcjonalne."""
    title: str | None = None
    description: str | None = None
    is_public: bool | None = None

class AlbumRead(AlbumBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

class AlbumReorderRequest(BaseModel):
    album_ids: list[int]