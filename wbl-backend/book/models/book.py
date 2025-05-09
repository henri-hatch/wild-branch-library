from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from core.database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)  # New PK
    isbn = Column(String(20), index=True, nullable=False)  # No longer PK, no longer unique, but indexed and not nullable
    title = Column(String(255), index=True, nullable=False)  # Added nullable=False for consistency
    author = Column(String(255), index=True, nullable=False)  # Added nullable=False for consistency
    genre = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    cover_image = Column(String, nullable=True)
    location = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="books")