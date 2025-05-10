from typing import Optional, List
from pydantic import BaseModel, Field


class LibraryBase(BaseModel):
    name: str = Field(..., max_length=255)


class LibraryCreate(LibraryBase):
    pass


class LibraryUpdate(LibraryBase):
    pass


class LibraryResponse(LibraryBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True
