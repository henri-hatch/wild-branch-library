from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth.services.auth_service import get_current_user
# Ensure BookResponse includes the new id field
from book.schemas.book import BookCreate, BookResponse, BookUpdate, BookResponseWithId 
from book.services.book_service import BookService
from core.database import get_db
from user.models.user import User

router = APIRouter(prefix="/books", tags=["books"])


@router.get("", response_model=List[BookResponseWithId]) # Changed to BookResponseWithId
def get_books(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    # owner_id: Optional[int] = None, # Keep for potential admin use, but prioritize current_user
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)):
    
    # If we implement admin/superuser later, they could override owner_id.
    # For now, all users only see their own books.
    user_owner_id = current_user.id

    books = BookService.get_books(db=db, skip=skip, limit=limit, search=search, owner_id=user_owner_id)
    if not books:
        # It's better to return an empty list than a 404 if no books match the criteria for this user.
        # A 404 might be more appropriate if the user themselves didn't exist, but here they do.
        return []
    return books


@router.get("/{book_id}", response_model=BookResponseWithId) # Changed to book_id and BookResponseWithId
def get_book(book_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get a book by its new ID"""
    db_book = BookService.get_book_by_id(db, book_id) # Service needs to use ID
    if db_book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    if db_book.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to access this book")
    return db_book

@router.get("/details/{book_isbn}", response_model=BookResponse) # Stays BookResponse, as it's pre-creation
def get_book_details(book_isbn: str, db: Session = Depends(get_db)):
    """Get book details from OpenLibrary API. 
       This does NOT check for user ownership as it's for pre-populating the add book form.
       The check for existing book (204) should now consider ISBN + user if you want to prevent
       a user from adding an ISBN they already have. Or just ISBN globally if that's the rule.
    """
    # Check if this exact ISBN already exists for ANY user (global check before hitting OpenLibrary)
    # This is a design choice: do you prevent adding an ISBN if *anyone* has it, or just if *this user* has it?
    # For now, let's assume the original global check for 204 was for any user.
    # The BookService.get_book_by_isbn_any_user would be a new service method.
    # existing_book = BookService.get_book_by_isbn_any_user(db, isbn=book_isbn) 
    # if existing_book:
    #     raise HTTPException(status_code=status.HTTP_204_NO_CONTENT, detail="Book with this ISBN already exists in the library.")

    book_details = BookService.get_book_details_from_external(book_isbn) # Renamed for clarity
    if not book_details:
        raise HTTPException(status_code=404, detail="Book details not found from external API")

    return BookResponse(
        isbn=book_isbn,
        title=book_details.get("title", "N/A"),
        author=book_details.get("author", "N/A"),
        cover_image=book_details.get("cover_image"),
        # These are not set from external API, will be set by user
        genre=None,
        description=None,
        location="Unknown", # Default location
    )

@router.post("", response_model=BookResponseWithId, status_code=status.HTTP_201_CREATED) # Changed to BookResponseWithId
def create_book(
    book: BookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new book. The book will be owned by the current_user."""
    # BookService.create_book should now assign current_user.id to book.owner_id
    return BookService.create_book(db=db, book_data=book, owner_id=current_user.id)


@router.put("/{book_id}", response_model=BookResponseWithId) # Changed to book_id and BookResponseWithId
def update_book(
    book_id: int,
    book: BookUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing book by its new ID. Ensures user owns the book."""
    db_book = BookService.get_book_by_id(db, book_id)
    if db_book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    if db_book.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to update this book")
    return BookService.update_book(db=db, book_id=book_id, book_data=book)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT) # Changed to book_id
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a book by its new ID. Ensures user owns the book."""
    db_book = BookService.get_book_by_id(db, book_id)
    if db_book is None:
        #raise HTTPException(status_code=404, detail="Book not found") # Deleting non-existent can be idempotent
        return # Or return 204 directly
    if db_book.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to delete this book")
    BookService.delete_book(db=db, book_id=book_id)
    return