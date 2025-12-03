from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    image_url = Column(String, nullable=False)  # sciezka do pliku
    thumbnail_url = Column(String, nullable=True)  # sciezka do miniatury

    # Klucz obcy, ktory laczy zdjecie z albumem
    album_id = Column(Integer, ForeignKey("albums.id"))

    # To jest druga strona relacji: zdjecie nalezy do jednego albumu
    album = relationship("Album", back_populates="photos")
