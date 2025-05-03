import './App.css';
import { useNavigate } from 'react-router-dom';
import { Header } from './components/Header';

function App() {
  const navigate = useNavigate();
  
  // Button labels and their corresponding routes
  const buttons = [
    { label: 'View Library', route: '/library' },
    { label: 'Add Book', route: '/add-book' },
    { label: 'Edit Book', route: '/edit-book' },
    { label: 'Manage Account', route: '/manage-account' },
  ];

  const handleButtonClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="app-container">
      <Header />

      <main className="button-grid">
        {buttons.map(({ label, route }) => (
          <button 
            key={label} 
            className="grid-button"
            onClick={() => handleButtonClick(route)}
          >
            {/* Icon placeholder can go here later */}
            <span>{label}</span>
          </button>
        ))}
      </main>
    </div>
  );
}

export default App;
