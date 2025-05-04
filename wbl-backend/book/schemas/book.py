from typing import Optional
from pydantic import BaseModel


class BookBase(BaseModel):
    isbn: str
    title: str
    author: str
    genre: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    location: str


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    isbn: str
    title: Optional[str] = None
    author: Optional[str] = None
    genre: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    location: Optional[str] = None


class BookResponse(BookBase):
    owner_id: Optional[int] = None

    class Config:
        from_attributes = True