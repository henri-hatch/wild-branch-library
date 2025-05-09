import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { bookService } from '../services/api';
import { Book } from '../models';
import '../styles/AddBook.css'; // Reuse the AddBook styles

export function EditBook() {
  const navigate = useNavigate();
  const { isbn } = useParams<{ isbn: string }>();
  const location = useLocation();
  const bookFromLocation = location.state?.book as Book | undefined;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!bookFromLocation);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Book>(
    bookFromLocation || {
      isbn: '',
      title: '',
      author: '',
      genre: '',
      description: '',
      cover_image: '',
      location: '',
    }
  );

  useEffect(() => {
    // If we didn't get the book data from the location state, fetch it
    if (!bookFromLocation && isbn) {
      fetchBook(isbn);
    }
  }, [isbn, bookFromLocation]);

  const fetchBook = async (bookIsbn: string) => {
    setIsLoading(true);
    try {
      const response = await bookService.getBookByISBN(bookIsbn);
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setFormData(response.data);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch book details. Please try again later.');
      console.error('Error fetching book:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await bookService.updateBook(formData.isbn, formData);
      
      if (response.error) {
        setError(response.error);
      } else {
        // Redirect to library on success
        navigate('/library');
      }
    } catch (err) {
      setError('Failed to update book. Please try again later.');
      console.error('Error updating book:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackClick = () => {
    navigate('/library');
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <Header showBackButton onBackClick={handleBackClick} />
        <main className="addbook-container">
          <div className="loading">Loading book details...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header showBackButton onBackClick={handleBackClick} />
      
      <main className="addbook-container">
        <div className="form-container">
          <form className="book-form" onSubmit={handleSubmit}>
            <h2>Edit Book</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input 
                type="text" 
                id="title" 
                name="title" 
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="isbn">ISBN</label>
              <input 
                type="text" 
                id="isbn" 
                name="isbn" 
                value={formData.isbn}
                onChange={handleChange}
                required
                readOnly // ISBN should not be edited as it's the identifier
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="author">Author</label>
              <input 
                type="text" 
                id="author" 
                name="author" 
                value={formData.author}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="genre">Genre</label>
              <input 
                type="text" 
                id="genre" 
                name="genre" 
                value={formData.genre || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea 
                id="description" 
                name="description" 
                value={formData.description || ''}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input 
                type="text" 
                id="location" 
                name="location" 
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
            
            {formData.cover_image && (
              <div className="form-group">
                <label>Cover Image</label>
                <img 
                  src={formData.cover_image} 
                  alt={`Cover of ${formData.title}`} 
                  className="book-cover-preview" 
                />
              </div>
            )}
            
            <div className="button-group">
              <button type="submit" disabled={isSubmitting} className="primary-button">
                {isSubmitting ? 'Updating...' : 'Update Book'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
