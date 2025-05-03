import wblIcon from '../assets/wbl-icon.png';

interface HeaderProps {
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export function Header({ showBackButton = false, onBackClick }: HeaderProps) {
  return (
    <header className="header">
      {showBackButton && (
        <button className="back-button" onClick={onBackClick}>
          ←
        </button>
      )}
      <img src={wblIcon} alt="Wild Branch Library Icon" className="header-icon" />
      <h1 className="header-title">Wild Branch Library</h1>
    </header>
  );
}