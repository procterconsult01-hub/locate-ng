import { useState, type FormEvent } from 'react';
import { lookupCode } from '../lib/codes';

interface FindPanelProps {
  onFound: (lat: number, lng: number, plusCode: string, friendlyCode?: string) => void;
  initial?: string;
}

export default function FindPanel({ onFound, initial = '' }: FindPanelProps) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const result = lookupCode(value);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    onFound(result.lat, result.lng, result.plusCode, result.friendlyCode);
  }

  return (
    <aside className="panel find-panel">
      <header className="panel-header">
        <div>
          <p className="eyebrow">Find a place</p>
          <h2>Look up a code</h2>
        </div>
      </header>
      <p className="muted">
        Paste a <strong>5-character zip</strong> (<span className="mono">82A6B</span>), an
        old <span className="mono">NG-LA-…</span> code, or a Google Plus Code (
        <span className="mono">6FR5G9FH+QM</span>).
      </p>
      <form onSubmit={submit} className="find-form">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="82A6B"
          aria-label="Location code"
          autoCapitalize="characters"
          spellCheck={false}
        />
        <button type="submit" className="btn btn-primary">
          Find
        </button>
      </form>
      {error && <p className="form-error">{error}</p>}
    </aside>
  );
}
