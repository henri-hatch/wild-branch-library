from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth.services.auth_service import get_current_user
from library.schemas.library import LibraryCreate, LibraryResponse, LibraryUpdate
from library.services.library_service import LibraryService
from core.database import get_db
from user.models.user import User

router = APIRouter(prefix="/libraries", tags=["libraries"])


@router.get("", response_model=List[LibraryResponse])
def get_libraries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all libraries for the current user"""
    return LibraryService.get_libraries(db, user_id=current_user.id)


@router.get("/all", response_model=List[LibraryResponse])
def get_all_libraries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all libraries across all users"""
    return LibraryService.get_all_libraries(db)


@router.get("/{library_id}", response_model=LibraryResponse)
def get_library(
    library_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific library"""
    db_library = LibraryService.get_library_by_id(db, library_id)
    if db_library is None:
        raise HTTPException(status_code=404, detail="Library not found")
    # Allow any user to view any library (since books can be assigned to any library)
    return db_library


@router.post("", response_model=LibraryResponse, status_code=status.HTTP_201_CREATED)
def create_library(
    library: LibraryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new library for the current user"""
    return LibraryService.create_library(db=db, library_data=library, user_id=current_user.id)


@router.put("/{library_id}", response_model=LibraryResponse)
def update_library(
    library_id: int,
    library: LibraryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing library"""
    db_library = LibraryService.get_library_by_id(db, library_id)
    if db_library is None:
        raise HTTPException(status_code=404, detail="Library not found")
    if db_library.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this library")
    return LibraryService.update_library(db=db, library_id=library_id, library_data=library)


@router.delete("/{library_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_library(
    library_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a library if it has no books"""
    db_library = LibraryService.get_library_by_id(db, library_id)
    if db_library is None:
        return  # Deleting non-existent can be idempotent
    if db_library.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this library")
    LibraryService.delete_library(db=db, library_id=library_id)
    return
