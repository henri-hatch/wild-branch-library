import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { bookService } from '../services/api';
import { Book } from '../models';
import '../styles/Library.css';

export function Library() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    // Filter books based on search term
    if (searchTerm.trim() === '') {
      setFilteredBooks(books);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredBooks(
        books.filter(book => 
          book.title.toLowerCase().includes(term) || 
          book.author.toLowerCase().includes(term) || 
          book.isbn.toLowerCase().includes(term) ||
          book.genre?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, books]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await bookService.getAllBooks();
      
      if (response.error) {
        setError(response.error);
      } else {
        setBooks(response.data || []);
        setFilteredBooks(response.data || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch books. Please try again later.');
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleBackClick = () => {
    navigate('/');
  };
  
  const handleEditBook = (book: Book) => {
    navigate(`/edit-book/${book.id}`, { state: { book } }); // Navigate with book.id
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="app-container">
      <Header showBackButton onBackClick={handleBackClick} />
      
      <main className="library-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search books by title, author, ISBN, or genre..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        <div className="table-container">
          <table className="book-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Author</th>
                <th>Owner</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="loading-row">
                  <td colSpan={4}>Loading books...</td>
                </tr>
              ) : error ? (
                <tr className="error-row">
                  <td colSpan={4}>{error}</td>
                </tr>
              ) : filteredBooks.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={4}>
                    {searchTerm ? 'No books match your search' : 'No books found in the library'}
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => (
                  <tr 
                    key={book.id || book.isbn}
                    onClick={() => handleEditBook(book)}
                    className="book-row"
                  >
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>Owner {book.owner_id}</td>
                    <td>{book.location}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}