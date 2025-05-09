from typing import Optional
from pydantic import BaseModel, Field


# Schema for book details fetched from external API (e.g., OpenLibrary)
# This is used by the /details/{isbn} endpoint before a book is added to the DB.
class BookResponse(BaseModel):
    isbn: str
    title: str
    author: str
    cover_image: Optional[str] = None
    genre: Optional[str] = None  # Typically not from OpenLibrary, user adds
    description: Optional[str] = None  # Typically not from OpenLibrary, user adds
    location: Optional[str] = None  # User adds

    class Config:
        orm_mode = True


# Schema for creating a book in the database
# owner_id will be set by the service from the current_user
class BookCreate(BaseModel):
    isbn: str = Field(..., max_length=20)
    title: str = Field(..., max_length=255)
    author: str = Field(..., max_length=255)
    genre: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    cover_image: Optional[str] = None
    location: str  # Made mandatory as per model


# Schema for updating a book
# User cannot change isbn, id, or owner_id via this schema
class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    author: Optional[str] = Field(None, max_length=255)
    genre: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    cover_image: Optional[str] = None
    location: Optional[str] = None  # Allow location update


# Schema for responses that include the database ID and owner_id
class BookResponseWithId(BookResponse):  # Inherits fields from BookResponse
    id: int
    owner_id: int
    # Ensure all fields from Book model are here if they should be returned
    # BookResponse already has isbn, title, author, cover_image, genre, description, location

    class Config:
        orm_mode = True