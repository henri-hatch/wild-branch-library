from datetime import date, datetime, timezone
from fastapi.testclient import TestClient
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from core.database import get_db, Base
from main import app
from book.models.book import Book
from auth.utils.auth_utils import get_password_hash
from user.models.user import User

# Set up in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the get_db dependency to use the test database
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

# Test fixture to create tables and sample data
@pytest.fixture(autouse=True)
def setup_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create test data
    db = TestingSessionLocal()
    
    # Create a test user using the ORM instead of raw SQL
    password_hash = get_password_hash("testpassword123")
    test_user = User(
        username="testuser",
        email="test@example.com",
        password=password_hash,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    # Add a test book using the ORM
    test_book = Book(
        title="Test Book",
        author="Test Author",
        isbn="1234567890",
        published_date=date(2023, 1, 1),
        genre="Fiction",
        description="A test book",
        location="Shelf A-1",
        owner_id=test_user.id
    )
    db.add(test_book)
    db.commit()
    db.close()
    
    # Run tests
    yield
    
    # Clean up
    Base.metadata.drop_all(bind=engine)


def get_token():
    """Helper function to get authentication token"""
    # The test is using form data as required by OAuth2PasswordRequestForm
    response = client.post(
        "/api/login/access-token",
        data={
            "username": "test@example.com",  # We use email as username in the authenticate_user function
            "password": "testpassword123",
        },
    )
    # Let's print the response for debugging
    print(f"Auth response status: {response.status_code}")
    print(f"Auth response body: {response.json()}")
    return response.json()["access_token"]


def test_get_books():
    """Test retrieving all books"""
    response = client.get("/api/books")
    assert response.status_code == 200
    books = response.json()
    assert len(books) >= 1
    assert books[0]["title"] == "Test Book"
    assert books[0]["author"] == "Test Author"


def test_get_book_by_id():
    """Test retrieving a book by its ID"""
    response = client.get("/api/books/1")
    assert response.status_code == 200
    book = response.json()
    assert book["title"] == "Test Book"
    assert book["author"] == "Test Author"


def test_create_book():
    """Test creating a new book"""
    token = get_token()
    response = client.post(
        "/api/books",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "New Book",
            "author": "New Author",
            "isbn": "0987654321",
            "published_date": "2024-01-01",
            "genre": "Non-fiction",
            "description": "A new test book",
            "location": "Shelf B-2"
        },
    )
    assert response.status_code == 201
    book = response.json()
    assert book["title"] == "New Book"
    assert book["author"] == "New Author"


def test_update_book():
    """Test updating a book"""
    token = get_token()
    response = client.put(
        "/api/books/1",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Updated Book",
            "description": "This book has been updated"
        },
    )
    assert response.status_code == 200
    book = response.json()
    assert book["title"] == "Updated Book"
    assert book["description"] == "This book has been updated"
    # The rest of the fields should remain unchanged
    assert book["author"] == "Test Author"


def test_delete_book():
    """Test deleting a book"""
    token = get_token()
    response = client.delete(
        "/api/books/1",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 204
    
    # Verify the book is gone
    response = client.get("/api/books/1")
    assert response.status_code == 404