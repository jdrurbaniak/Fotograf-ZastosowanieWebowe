from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    image_url = Column(String, nullable=False) # Ścieżka do pliku

    # Klucz obcy, który łączy zdjęcie z albumem
    album_id = Column(Integer, ForeignKey("albums.id"))

    # To jest druga strona relacji: zdjęcie należy do jednego albumu
    album = relationship("Album", back_populates="photos")