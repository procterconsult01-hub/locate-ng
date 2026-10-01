interface HeaderProps {
  mode: 'pin' | 'find';
  onMode: (m: 'pin' | 'find') => void;
  onLocate: () => void;
  locating?: boolean;
}

export default function Header({ mode, onMode, onLocate, locating }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="logo" aria-hidden>
          <span />
        </div>
        <div>
          <h1>LocateNG</h1>
          <p className="tagline">A shareable address for every place in Nigeria.</p>
        </div>
      </div>
      <nav className="header-nav">
        <div className="seg">
          <button
            type="button"
            className={mode === 'pin' ? 'active' : ''}
            onClick={() => onMode('pin')}
          >
            Drop pin
          </button>
          <button
            type="button"
            className={mode === 'find' ? 'active' : ''}
            onClick={() => onMode('find')}
          >
            Find code
          </button>
        </div>
        <button type="button" className="btn btn-locate" onClick={onLocate} disabled={locating}>
          {locating ? 'Locating…' : 'Use my location'}
        </button>
      </nav>
    </header>
  );
}
