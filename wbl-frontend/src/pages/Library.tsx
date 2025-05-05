import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { bookService } from '../services/api';
import { Book } from '../models';
import '../styles/Library.css';

export function Library() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await bookService.getAllBooks();
      
      if (response.error) {
        setError(response.error);
      } else {
        setBooks(response.data || []);
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

  return (
    <div className="app-container">
      <Header showBackButton onBackClick={handleBackClick} />
      
      <main className="library-container">
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
              ) : books.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={4}>No books found in the library</td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book.id || book.isbn}>
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