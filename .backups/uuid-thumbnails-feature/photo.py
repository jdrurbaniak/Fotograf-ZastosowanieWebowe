from pydantic import BaseModel, ConfigDict

class PhotoBase(BaseModel):
    title: str
    description: str | None = None
    image_url: str # W przyszłości możemy tu użyć Pydantic 'HttpUrl'
    thumbnail_url: str | None = None # URL miniaturki (opcjonalny dla wstecznej kompatybilności)

class PhotoCreate(PhotoBase):
    album_id: int # Wymagamy podania ID albumu przy tworzeniu zdjęcia

class PhotoUpdate(BaseModel):
    """Schemat do aktualizacji zdjęcia - wszystkie pola opcjonalne."""
    title: str | None = None
    description: str | None = None

class PhotoRead(PhotoBase):
    id: int
    album_id: int
    
    model_config = ConfigDict(from_attributes=True)