from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from library.models.library import Library
from library.schemas.library import LibraryCreate, LibraryUpdate


class LibraryService:
    @staticmethod
    def get_libraries(db: Session, user_id: int) -> List[Library]:
        """Get all libraries for a specific user"""
        return db.query(Library).filter(Library.user_id == user_id).all()

    @staticmethod
    def get_all_libraries(db: Session) -> List[Library]:
        """Get all libraries across all users"""
        return db.query(Library).all()

    @staticmethod
    def get_library_by_id(db: Session, library_id: int) -> Optional[Library]:
        """Get a specific library by ID"""
        return db.query(Library).filter(Library.id == library_id).first()

    @staticmethod
    def create_library(db: Session, library_data: LibraryCreate, user_id: int) -> Library:
        """Create a new library for a user"""
        db_library = Library(**library_data.dict(), user_id=user_id)
        db.add(db_library)
        db.commit()
        db.refresh(db_library)
        return db_library

    @staticmethod
    def update_library(db: Session, library_id: int, library_data: LibraryUpdate) -> Optional[Library]:
        """Update a library's details"""
        db_library = LibraryService.get_library_by_id(db, library_id)
        if db_library:
            update_data = library_data.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_library, key, value)
            db.commit()
            db.refresh(db_library)
        return db_library

    @staticmethod
    def delete_library(db: Session, library_id: int) -> bool:
        """Delete a library if it has no books associated with it"""
        db_library = LibraryService.get_library_by_id(db, library_id)
        if db_library:
            # Check if library has books
            if db_library.books and len(db_library.books) > 0:
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot delete library that contains books. Move or remove the books first."
                )
            db.delete(db_library)
            db.commit()
            return True
        return False
