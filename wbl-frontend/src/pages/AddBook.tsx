import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { bookService } from '../services/api';
import { Book } from '../models';
import '../styles/AddBook.css';

export function AddBook() {
  const navigate = useNavigate();
  const [isbnForLookup, setIsbnForLookup] = useState('');
  const [showIsbnPrompt, setShowIsbnPrompt] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Book, 'id' | 'owner_id'>>({
    isbn: '',
    title: '',
    author: '',
    genre: '',
    description: '',
    cover_image: '',
    location: '',
  });

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
        setFormData({
          isbn: isbnForLookup, title: '', author: '', genre: '', description: '', cover_image: '', location: ''
        });
      } else if (response.error) {
        setError(response.error);
        setFormData({ // Reset form but keep entered ISBN
          isbn: isbnForLookup, title: '', author: '', genre: '', description: '', cover_image: '', location: ''
        });
      } else if (response.data) {
        setFormData({
          isbn: response.data.isbn || isbnForLookup,
          title: response.data.title || '',
          author: response.data.author || '',
          genre: response.data.genre || '',
          description: response.data.description || '',
          cover_image: response.data.cover_image || '',
          location: response.data.location || '', // Default or fetched location
        });
      } else {
        // No data and no specific error, means book not found by API
        setError(`No details found for ISBN ${isbnForLookup}. Please fill the form manually.`);
        setFormData({
            isbn: isbnForLookup, title: '', author: '', genre: '', description: '', cover_image: '', location: ''
        });
      }
    } catch (err) {
      setError('Failed to fetch book details. Please try again or fill the form manually.');
      console.error('Error fetching book details:', err);
      setFormData({ // Reset form but keep entered ISBN
        isbn: isbnForLookup, title: '', author: '', genre: '', description: '', cover_image: '', location: ''
      });
    } finally {
      setIsLoadingDetails(false);
      setShowIsbnPrompt(false); // Hide prompt, show form
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
                readOnly // ISBN might be read-only if fetched
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
              <label htmlFor="description">Description *</label>
              <textarea 
                id="description" 
                name="description" 
                value={formData.description}
                onChange={handleChange}
                rows={4}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="location">Location *</label>
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              >
                <option value="aa">Default Location (aa)</option>
                {/* More locations can be added here later */}
              </select>
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Book'}
              </button>
              <button 
                type="button" 
                className="cancel-button" 
                onClick={handleBackClick} // Use updated handler
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