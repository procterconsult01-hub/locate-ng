interface HeaderProps {
  mode: 'pin' | 'find' | 'guide';
  onMode: (m: 'pin' | 'find') => void;
  onLocate: () => void;
  locating?: boolean;
  onGuide?: () => void;
}

export default function Header({ mode, onMode, onLocate, locating, onGuide }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand">
        <a className="brand-link" href="#/" aria-label="LocateNG home">
          <div className="logo" aria-hidden>
            <span />
          </div>
          <div>
            <h1>LocateNG</h1>
            <p className="tagline">A shareable address for every place in Nigeria.</p>
          </div>
        </a>
      </div>
      <nav className="header-nav">
        <a
          className={`guide-link${mode === 'guide' ? ' active' : ''}`}
          href="#/guide"
          onClick={(e) => {
            if (onGuide) {
              e.preventDefault();
              onGuide();
            }
          }}
        >
          How to use
        </a>
        {mode !== 'guide' && (
          <>
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
          </>
        )}
      </nav>
    </header>
  );
}
