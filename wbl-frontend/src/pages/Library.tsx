import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import '../styles/Library.css';

export function Library() {
  const navigate = useNavigate();

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
              {/* Table will be populated from backend data later */}
              {/* This is just a placeholder row for styling purposes */}
              <tr className="empty-row">
                <td colSpan={4}>No books found in the library</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}