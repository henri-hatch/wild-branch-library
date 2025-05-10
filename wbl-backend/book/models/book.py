from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from core.database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    isbn = Column(String(20), index=True, nullable=False)
    title = Column(String(255), index=True, nullable=False)
    author = Column(String(255), index=True, nullable=False)
    genre = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    cover_image = Column(String, nullable=True)
    old_location = Column(String, nullable=True)  # Will be removed after migration
    library_id = Column(Integer, ForeignKey("libraries.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="books")
    library = relationship("Library", back_populates="books")