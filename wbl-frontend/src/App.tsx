import './App.css';
import wblIcon from './assets/wbl-icon.png'; // Import the icon

function App() {
  // Button labels based on the mockup
  const buttons = [
    'View Library',
    'Add Book',
    'Edit Book',
    'Manage Users',
  ];

  return (
    <div className="app-container">
      <header className="header">
        <img src={wblIcon} alt="Wild Branch Library Icon" className="header-icon" />
        <h1 className="header-title">Wild Branch Library</h1>
      </header>

      <main className="button-grid">
        {buttons.map((label) => (
          <button key={label} className="grid-button">
            {/* Icon placeholder can go here later */}
            <span>{label}</span>
          </button>
        ))}
      </main>
    </div>
  );
}

export default App;
