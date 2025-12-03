from pydantic import BaseModel, ConfigDict


class PhotoBase(BaseModel):
    title: str
    description: str | None = None
    image_url: str  # W przyszlosci mozemy tu uzyc Pydantic 'HttpUrl'


class PhotoCreate(PhotoBase):
    album_id: int  # Wymagamy podania ID albumu przy tworzeniu zdjecia
    thumbnail_url: str | None = None


class PhotoUpdate(BaseModel):
    """Schemat do aktualizacji zdjecia - wszystkie pola opcjonalne."""
    title: str | None = None
    description: str | None = None


class PhotoRead(PhotoBase):
    id: int
    album_id: int
    thumbnail_url: str | None = None

    model_config = ConfigDict(from_attributes=True)
