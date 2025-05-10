import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { bookService, libraryService } from '../services/api';
import { Book, Library } from '../models';
import '../styles/AddBook.css';

export function AddBook() {
  const navigate = useNavigate();
  const [isbnForLookup, setIsbnForLookup] = useState('');
  const [showIsbnPrompt, setShowIsbnPrompt] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);  const [libraries, setLibraries] = useState<Library[]>([]);
  const [isLoadingLibraries, setIsLoadingLibraries] = useState(true);
  const [formData, setFormData] = useState<Omit<Book, 'id' | 'owner_id'>>({
    isbn: '',
    title: '',
    author: '',
    genre: '',
    description: '',
    cover_image: '',
    library_id: -1, // Initialize with invalid ID, will be updated when libraries load
  });

  useEffect(() => {
    fetchLibraries();
  }, []);
  const fetchLibraries = async () => {
    setIsLoadingLibraries(true);
    try {
      const response = await libraryService.getUserLibraries();
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setLibraries(response.data);
        // If libraries are loaded and there's at least one, set the default library
        if (response.data.length > 0) {
          // Create a local library var for type safety
          const library = response.data[0];
          setFormData(prev => ({ ...prev, library_id: library.id }));
        }
      } else {
        // Handle case where response.data is undefined
        setLibraries([]);
      }
    } catch (err) {
      setError('Failed to fetch libraries. Please try again later.');
      console.error('Error fetching libraries:', err);
    } finally {
      setIsLoadingLibraries(false);
    }
  };

  const handleIsbnLookupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsbnForLookup(e.target.value);
  };

  const handleFetchDetails = async () => {
    if (!isbnForLookup.trim()) {
      setShowIsbnPrompt(false); // Proceed with empty form
      setFormData(prev => ({ ...prev, isbn: '' })); // Clear any previous ISBN
      return;
    }
    setIsLoadingDetails(true);
    setError(null);
    try {
      const response = await bookService.getBookDetailsFromAPI(isbnForLookup);
      if (response.status === 204) {
        setError(`Book with ISBN ${isbnForLookup} already exists in the library. You can edit it from the library page.`);
        // Optionally, you could navigate to edit page or clear form
        setFormData(prev => ({          ...prev,
          isbn: isbnForLookup, 
          title: '', 
          author: '', 
          genre: '', 
          description: '', 
          cover_image: ''
          // Keep the current library_id
        }));      } else if (response.error) {
        setError(response.error);
        setFormData(prev => ({ // Reset form but keep entered ISBN and library
          ...prev,
          isbn: isbnForLookup, 
          title: '', 
          author: '', 
          genre: '', 
          description: '', 
          cover_image: ''
        }));
      } else if (response.data) {
        setFormData(prev => ({          ...prev,
          isbn: response.data?.isbn || isbnForLookup,
          title: response.data?.title || '',
          author: response.data?.author || '',
          genre: response.data?.genre || '',
          description: response.data?.description || '',
          cover_image: response.data?.cover_image || '',
          // Keep the existing library_id
        }));
      } else {
        // No data and no specific error, means book not found by API
        setError(`No details found for ISBN ${isbnForLookup}. Please fill the form manually.`);
        setFormData(prev => ({            ...prev,
            isbn: isbnForLookup, 
            title: '', 
            author: '', 
            genre: '', 
            description: '', 
            cover_image: ''
            // Keep the existing library_id
        }));
      }
    } catch (err) {
      setError('Failed to fetch book details. Please try again or fill the form manually.');
      console.error('Error fetching book details:', err);
      setFormData(prev => ({ // Reset form but keep entered ISBN and library
        ...prev,
        isbn: isbnForLookup, title: '', author: '', genre: '', description: '', cover_image: ''
      }));
    } finally {
      setIsLoadingDetails(false);
      setShowIsbnPrompt(false); // Hide prompt, show form
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
      const response = await bookService.addBook(formData);
      
      if (response.error) {
        setError(response.error);
      } else {
        // Redirect to library on success
        navigate('/library');
      }
    } catch (err) {
      setError('Failed to add book. Please try again later.');
      console.error('Error adding book:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackClick = () => {
    // If returning from form to ISBN prompt, show prompt again. Otherwise, navigate back.
    if (!showIsbnPrompt) {
      setShowIsbnPrompt(true);
      setError(null); // Clear errors when going back to ISBN prompt
      // Optionally reset isbnForLookup or keep it
    } else {
      navigate('/');
    }
  };

  if (showIsbnPrompt) {
    return (
      <div className="app-container">
        <Header showBackButton onBackClick={handleBackClick} />
        <main className="addbook-container">
          <div className="form-container isbn-prompt-container">
            <h2>Add New Book: Enter ISBN</h2>
            <p>Enter the ISBN of the book to fetch its details, or leave blank to fill manually.</p>
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
              <label htmlFor="isbn-lookup">ISBN</label>
              <input
                type="text"
                id="isbn-lookup"
                name="isbn-lookup"
                value={isbnForLookup}
                onChange={handleIsbnLookupChange}
                placeholder="e.g., 9780321765723"
              />
            </div>
            <div className="button-group">
              <button onClick={handleFetchDetails} disabled={isLoadingDetails} className="submit-button">
                {isLoadingDetails ? 'Fetching...' : 'Fetch Details / Continue'}
              </button>
              <button type="button" className="cancel-button" onClick={() => navigate('/')}>
                Cancel
              </button>
            </div>
          </div>
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
            <h2>Add New Book</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="title">Title *</label>
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
              <label htmlFor="isbn">ISBN *</label>
              <input 
                type="text" 
                id="isbn" 
                name="isbn" 
                value={formData.isbn}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="author">Author *</label>
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
              <label htmlFor="genre">Genre *</label>
              <input 
                type="text" 
                id="genre" 
                name="genre" 
                value={formData.genre}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea 
                id="description" 
                name="description" 
                value={formData.description}
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
                  Please <a href="/manage-libraries">create a library</a> before adding books.
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
                  alt="Cover preview" 
                  className="book-cover-preview" 
                />
              </div>
            )}
              <div className="button-group">
              <button 
                type="submit" 
                className="submit-button" 
                disabled={isSubmitting || libraries.length === 0 || formData.library_id < 1}
              >
                {isSubmitting ? 'Adding...' : 'Add Book'}
              </button>
              <button 
                type="button" 
                className="cancel-button" 
                onClick={handleBackClick}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}