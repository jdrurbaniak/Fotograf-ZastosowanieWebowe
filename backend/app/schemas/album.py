from pydantic import BaseModel, ConfigDict

class AlbumBase(BaseModel):
    title: str
    description: str | None = None # Opis jest opcjonalny

class AlbumCreate(AlbumBase):
    pass # Na razie nie ma dodatkowych pól przy tworzeniu

class AlbumRead(AlbumBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)