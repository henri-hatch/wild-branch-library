import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { libraryService } from '../services/api';
import { Library } from '../models';
import '../styles/ManageLibraries.css';

export function ManageLibraries() {
  const navigate = useNavigate();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingLibrary, setEditingLibrary] = useState<Library | null>(null);
  const [newLibraryName, setNewLibraryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    fetchLibraries();
  }, []);

  const fetchLibraries = async () => {
    setLoading(true);
    try {
      const response = await libraryService.getUserLibraries();
      if (response.error) {
        setError(response.error);
      } else {
        setLibraries(response.data || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch libraries. Please try again later.');
      console.error('Error fetching libraries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const handleCreateLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLibraryName.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await libraryService.createLibrary(newLibraryName.trim());
      if (response.error) {
        setError(response.error);
      } else {
        setLibraries(prev => [...prev, response.data!]);
        setNewLibraryName('');
      }
    } catch (err) {
      setError('Failed to create library. Please try again.');
      console.error('Error creating library:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (library: Library) => {
    setEditingLibrary({ ...library });
  };

  const cancelEditing = () => {
    setEditingLibrary(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingLibrary) {
      setEditingLibrary({ ...editingLibrary, name: e.target.value });
    }
  };

  const handleUpdateLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLibrary || !editingLibrary.name.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await libraryService.updateLibrary(
        editingLibrary.id, 
        editingLibrary.name.trim()
      );
      if (response.error) {
        setError(response.error);
      } else {
        setLibraries(libraries.map(lib => 
          lib.id === editingLibrary.id ? response.data! : lib
        ));
        setEditingLibrary(null);
      }
    } catch (err) {
      setError('Failed to update library. Please try again.');
      console.error('Error updating library:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLibrary = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this library? This action cannot be undone if the library has no books.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await libraryService.deleteLibrary(id);
      if (response.error) {
        setError(response.error);
      } else {
        setLibraries(libraries.filter(lib => lib.id !== id));
      }
    } catch (err) {
      setError('Failed to delete library. Please ensure it has no books assigned to it.');
      console.error('Error deleting library:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <Header showBackButton onBackClick={handleBackClick} />
      
      <main className="libraries-container">
        <h2>Manage Libraries</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="create-library-form">
          <h3>Create New Library</h3>
          <form onSubmit={handleCreateLibrary}>
            <div className="form-group">
              <label htmlFor="new-library-name">Library Name</label>
              <input 
                type="text" 
                id="new-library-name"
                value={newLibraryName}
                onChange={e => setNewLibraryName(e.target.value)}
                placeholder="Enter library name"
                required
              />
            </div>
            <button 
              type="submit" 
              className="submit-button" 
              disabled={isSubmitting || !newLibraryName.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create Library'}
            </button>
          </form>
        </div>

        <div className="libraries-list">
          <h3>Your Libraries</h3>
          
          {loading ? (
            <div className="loading-container">Loading libraries...</div>
          ) : libraries.length === 0 ? (
            <div className="empty-message">You don't have any libraries yet. Create one to get started!</div>
          ) : (
            <ul className="library-items">
              {libraries.map(library => (
                <li key={library.id} className="library-item">
                  {editingLibrary && editingLibrary.id === library.id ? (
                    <form onSubmit={handleUpdateLibrary} className="edit-library-form">
                      <input 
                        type="text" 
                        value={editingLibrary.name}
                        onChange={handleNameChange}
                        required
                      />
                      <div className="button-group">
                        <button type="submit" className="submit-button" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                        <button 
                          type="button" 
                          className="cancel-button" 
                          onClick={cancelEditing}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="library-name">{library.name}</div>
                      <div className="library-actions">
                        <button 
                          className="edit-button" 
                          onClick={() => startEditing(library)}
                          disabled={isSubmitting}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-button" 
                          onClick={() => handleDeleteLibrary(library.id)}
                          disabled={isSubmitting}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
