from typing import List, Optional
from sqlalchemy.orm import Session
from book.models.book import Book
from book.schemas.book import BookCreate, BookUpdate


class BookService:
    @staticmethod
    def get_books(db: Session, skip: int = 0, limit: int = 100) -> List[Book]:
        return db.query(Book).offset(skip).limit(limit).all()

    @staticmethod
    def get_book_by_isbn(db: Session, isbn: str) -> Optional[Book]:
        """Get a book by ISBN which is now the primary identifier"""
        return db.query(Book).filter(Book.isbn == isbn).first()

    # The original get_book_by_id method is now redundant, but kept for backward compatibility
    @staticmethod
    def get_book_by_id(db: Session, book_isbn: str) -> Optional[Book]:
        """Legacy method - use get_book_by_isbn instead"""
        return BookService.get_book_by_isbn(db, book_isbn)

    @staticmethod
    def create_book(db: Session, book_data: BookCreate, owner_id: Optional[int] = None) -> Book:
        db_book = Book(**book_data.model_dump(), owner_id=owner_id)
        db.add(db_book)
        db.commit()
        db.refresh(db_book)
        return db_book

    @staticmethod
    def update_book(db: Session, book_isbn: str, book_data: BookUpdate) -> Optional[Book]:
        db_book = BookService.get_book_by_id(db, book_isbn)
        if db_book:
            update_data = book_data.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_book, key, value)
            db.commit()
            db.refresh(db_book)
        return db_book

    @staticmethod
    def delete_book(db: Session, book_isbn: str) -> bool:
        db_book = BookService.get_book_by_id(db, book_isbn)
        if db_book:
            db.delete(db_book)
            db.commit()
            return True
        return False

    @staticmethod
    def search_books(db: Session, search_term: str, skip: int = 0, limit: int = 100) -> List[Book]:
        return db.query(Book).filter(
            (Book.title.ilike(f"%{search_term}%")) |
            (Book.author.ilike(f"%{search_term}%")) |
            (Book.isbn.ilike(f"%{search_term}%")) |
            (Book.genre.ilike(f"%{search_term}%"))
        ).offset(skip).limit(limit).all()