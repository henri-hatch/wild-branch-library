from typing import Optional
from datetime import date
from pydantic import BaseModel, Field


class BookBase(BaseModel):
    title: str
    author: str
    isbn: Optional[str] = None
    published_date: Optional[date] = None
    genre: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    is_available: bool = True


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    published_date: Optional[date] = None
    genre: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    is_available: Optional[bool] = None


class BookResponse(BookBase):
    id: int
    owner_id: Optional[int] = None

    class Config:
        from_attributes = True