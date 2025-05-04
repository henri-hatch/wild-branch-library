from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship

from core.database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    author = Column(String, index=True)
    isbn = Column(String, unique=True, index=True, nullable=True)
    published_date = Column(Date, nullable=True)
    genre = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    cover_image = Column(String, nullable=True)
    is_available = Column(Boolean, default=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    owner = relationship("User", back_populates="books")