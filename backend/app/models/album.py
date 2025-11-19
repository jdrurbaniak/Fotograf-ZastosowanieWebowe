from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Album(Base):
    __tablename__ = "albums"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    is_public = Column(Boolean, nullable=False, default=True, server_default="true")
    sort_order = Column(Integer, nullable=True, index=True)

    # To tworzy relację: jeden album ma wiele zdjęć
    photos = relationship("Photo", back_populates="album")