from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
import requests  # For OpenLibrary API

from book.models.book import Book as BookModel
from book.schemas.book import BookCreate, BookUpdate


class BookService:
    @staticmethod
    def get_books(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None, owner_id: Optional[int] = None) -> List[BookModel]:
        query = db.query(BookModel)
        if owner_id is not None:
            query = query.filter(BookModel.owner_id == owner_id)
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                BookModel.title.ilike(search_term) |
                BookModel.author.ilike(search_term) |
                BookModel.isbn.ilike(search_term)
            )
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_book_by_id(db: Session, book_id: int) -> Optional[BookModel]:
        return db.query(BookModel).filter(BookModel.id == book_id).first()

    @staticmethod
    def get_book_by_isbn_and_owner(db: Session, isbn: str, owner_id: int) -> Optional[BookModel]:
        """Fetches a specific book instance by ISBN for a given owner."""
        return db.query(BookModel).filter(BookModel.isbn == isbn, BookModel.owner_id == owner_id).first()    @staticmethod
    def get_book_details_from_external(isbn: str) -> Optional[dict]:
        """Fetches book details from OpenLibrary API."""
        url = f"https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()  # Raise an exception for HTTP errors
            data = response.json()
            if f"ISBN:{isbn}" in data:
                book_data = data[f"ISBN:{isbn}"]
                authors = ", ".join([author['name'] for author in book_data.get('authors', [])])
                cover_url = book_data.get('cover', {}).get('medium')  # or large, small
                return {
                    "title": book_data.get('title', 'N/A'),
                    "author": authors if authors else "N/A",
                    "cover_image": cover_url,
                    # No library_id from external API
                }
            return None
        except requests.exceptions.RequestException as e:
            print(f"Error fetching from OpenLibrary: {e}")
            return None

    @staticmethod
    def create_book(db: Session, book_data: BookCreate, owner_id: int) -> BookModel:
        db_book = BookModel(**book_data.model_dump(), owner_id=owner_id)
        db.add(db_book)
        db.commit()
        db.refresh(db_book)
        return db_book

    @staticmethod
    def update_book(db: Session, book_id: int, book_data: BookUpdate) -> Optional[BookModel]:
        db_book = BookService.get_book_by_id(db, book_id)
        if db_book:
            update_data = book_data.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_book, key, value)
            db.commit()
            db.refresh(db_book)
        return db_book

    @staticmethod
    def delete_book(db: Session, book_id: int) -> bool:
        db_book = BookService.get_book_by_id(db, book_id)
        if db_book:
            db.delete(db_book)
            db.commit()
            return True
        return False