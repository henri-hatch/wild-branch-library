import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { authService } from '../services/api';
import { User } from '../models';
import '../styles/ManageAccount.css';

export function ManageAccount() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError('Failed to load user data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleBackClick = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/auth');
    } catch (err) {
      console.error('Error during logout:', err);
      setError('Failed to log out. Please try again.');
    }
  };

  return (
    <div className="app-container">
      <Header showBackButton={true} onBackClick={handleBackClick} />
      
      <main className="account-container">
        {loading ? (
          <div className="loading-container">
            <p>Loading user information...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : user ? (
          <div className="account-card">
            <h2>Account Information</h2>
            
            <div className="account-info">
              <div className="info-group">
                <div className="info-label">Username</div>
                <div className="info-value">{user.username}</div>
              </div>
              
              <div className="info-group">
                <div className="info-label">Email</div>
                <div className="info-value">{user.email}</div>
              </div>
            </div>
            
            <button 
              className="logout-button" 
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        ) : (
          <div className="error-message">User information not available</div>
        )}
      </main>
    </div>
  );
}