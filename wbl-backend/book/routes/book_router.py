from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth.services.auth_service import get_current_user
from book.schemas.book import BookCreate, BookResponse, BookUpdate
from book.services.book_service import BookService
from core.database import get_db
from user.models.user import User

router = APIRouter(prefix="/books", tags=["books"])


@router.get("", response_model=List[BookResponse])
def get_books(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all books with optional search"""
    if search:
        return BookService.search_books(db, search, skip, limit)
    return BookService.get_books(db, skip, limit)


@router.get("/{book_isbn}", response_model=BookResponse)
def get_book(book_isbn: str, db: Session = Depends(get_db)):
    """Get a book by ISBN"""
    db_book = BookService.get_book_by_id(db, book_isbn)
    if db_book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return db_book

@router.get("/details/{book_isbn}", response_model=BookResponse)
def get_book_details(book_isbn: str, db: Session = Depends(get_db)):
    """Get book details from OpenLibrary API"""
    # Check to make sure book doesn't already exist in the database if it does return a 204 No Content
    db_book = BookService.get_book_by_id(db, book_isbn)
    if db_book is not None:
        raise HTTPException(status_code=204, detail="Book already exists")
    
    # Call the OpenLibrary API to get book details
    book_details = BookService.get_book_details(book_isbn)
    
    # Create a BookResponse object with the fetched details
    # We don't save this to the database yet - that happens when the user confirms creation
    return BookResponse(
        isbn=book_isbn,
        title=book_details["title"],
        author=book_details["author"],
        cover_image=book_details["cover_image"],
        # Default values for required fields that aren't provided by the API
        location="Unknown",
        genre=None,
        description=None,
        owner_id=None
    )

@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    book: BookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new book"""
    return BookService.create_book(db, book, current_user.id)


@router.put("/{book_isbn}", response_model=BookResponse)
def update_book(
    book_isbn: str,
    book: BookUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a book"""
    db_book = BookService.get_book_by_id(db, book_isbn)
    if db_book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # For family use, we'll allow any authenticated user to update any book
    # In a more secure implementation, we'd check if the user owns the book
    return BookService.update_book(db, book_isbn, book)


@router.delete("/{book_isbn}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_isbn: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a book"""
    success = BookService.delete_book(db, book_isbn)
    if not success:
        raise HTTPException(status_code=404, detail="Book not found")
    return None