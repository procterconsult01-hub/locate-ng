import { useState, useRef, useEffect } from 'react';
import { searchNigeria, type GeoResult } from '../lib/geocode';

interface SearchBoxProps {
  onSelect: (lat: number, lng: number, label: string) => void;
}

export default function SearchBox({ onSelect }: SearchBoxProps) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function onChange(value: string) {
    setQ(value);
    setError(null);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await searchNigeria(value, 6);
        setResults(r);
        setOpen(true);
        if (r.length === 0) setError('No places found in Nigeria');
      } catch {
        setError('Search unavailable (Nominatim rate limit?)');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 450);
  }

  return (
    <div className="search-box" ref={boxRef}>
      <div className="search-input-wrap">
        <span className="search-icon" aria-hidden>
          ⌕
        </span>
        <input
          type="search"
          placeholder="Search a place in Nigeria…"
          value={q}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          aria-label="Search place"
        />
        {loading && <span className="search-spinner" />}
      </div>
      {open && (results.length > 0 || error) && (
        <ul className="search-results" role="listbox">
          {error && <li className="search-empty">{error}</li>}
          {results.map((r) => (
            <li key={`${r.lat}-${r.lng}-${r.displayName}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect(r.lat, r.lng, r.displayName);
                  setQ(r.displayName.split(',').slice(0, 2).join(','));
                  setOpen(false);
                }}
              >
                {r.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
