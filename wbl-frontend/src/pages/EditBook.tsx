import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { bookService, libraryService } from '../services/api';
import { Book, Library } from '../models';
import '../styles/AddBook.css'; // Reuse the AddBook styles

export function EditBook() {
  const navigate = useNavigate();
  const { id: bookId } = useParams<{ id: string }>(); // Changed from isbn to id
  const location = useLocation();
  const bookFromLocation = location.state?.book as Book | undefined;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!bookFromLocation);  const [error, setError] = useState<string | null>(null);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [isLoadingLibraries, setIsLoadingLibraries] = useState(true);
  const [formData, setFormData] = useState<Book>(
    bookFromLocation || {
      id: 0,
      isbn: '',
      title: '',
      author: '',
      genre: '',
      description: '',
      cover_image: '',
      library_id: -1, // Initialize with invalid ID, will be updated when libraries load
      owner_id: 0,
    }
  );
  useEffect(() => {
    // If we didn't get the book data from the location state, fetch it by ID
    if (!bookFromLocation && bookId) {
      fetchBookById(Number(bookId)); // Ensure bookId is a number
    }
    
    // Fetch libraries for the dropdown
    fetchLibraries();
  }, [bookId, bookFromLocation]);
  
  const fetchLibraries = async () => {
    setIsLoadingLibraries(true);
    try {
      const response = await libraryService.getUserLibraries();
      if (response.error) {
        setError(response.error);
      } else {
        setLibraries(response.data || []);
      }
    } catch (err) {
      setError('Failed to fetch libraries. Please try again later.');
      console.error('Error fetching libraries:', err);
    } finally {
      setIsLoadingLibraries(false);
    }
  };

  const fetchBookById = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await bookService.getBookById(id);
      
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
      [name]: name === 'library_id' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // formData.id should exist if we are editing an existing book
      if (formData.id === undefined) {
        setError("Book ID is missing, cannot update.");
        setIsSubmitting(false);
        return;
      }
      const response = await bookService.updateBook(formData.id, formData); 
      
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
                readOnly // ISBN should not be edited after creation
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
            </div>            <div className="form-group">
              <label htmlFor="library_id">Library *</label>
              <select
                id="library_id"
                name="library_id"
                value={formData.library_id}
                onChange={handleChange}
                required
              >
                <option value="" disabled={libraries.length > 0}>
                  {isLoadingLibraries ? "Loading libraries..." : "Select a library"}
                </option>
                {libraries.map(library => (
                  <option key={library.id} value={library.id}>
                    {library.name}
                  </option>
                ))}
              </select>
              {libraries.length === 0 && !isLoadingLibraries && (
                <div className="helper-text error-message">
                  Please <a href="/manage-libraries">create a library</a> before editing books.
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="cover_image">Cover Image URL</label>
              <input
                type="url"
                id="cover_image"
                name="cover_image"
                value={formData.cover_image || ''}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {formData.cover_image && (
              <div className="form-group cover-preview-container">
                <label>Cover Preview</label>
                <img 
                  src={formData.cover_image} 
                  alt={`Cover of ${formData.title}`}
                  className="book-cover-preview" 
                />
              </div>
            )}
              <div className="button-group">
              <button 
                type="submit" 
                disabled={isSubmitting || libraries.length === 0 || formData.library_id < 1} 
                className="submit-button"
              >
                {isSubmitting ? 'Updating...' : 'Update Book'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
