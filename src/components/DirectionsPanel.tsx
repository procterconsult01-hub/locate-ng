import { useEffect, useState, type FormEvent } from 'react';
import {
  fetchRoute,
  formatDistance,
  formatDuration,
  googleMapsDirectionsUrl,
  type LatLng,
  type RouteResult,
  type TravelMode,
} from '../lib/routing';
import { searchNigeria } from '../lib/geocode';

interface DirectionsPanelProps {
  destination: LatLng;
  origin: LatLng | null;
  originLabel?: string | null;
  route: RouteResult | null;
  travelMode: TravelMode;
  pickingOrigin: boolean;
  onTravelMode: (m: TravelMode) => void;
  onOrigin: (o: LatLng | null, label?: string | null) => void;
  onRoute: (r: RouteResult | null) => void;
  onPickingOrigin: (v: boolean) => void;
  onToast: (msg: string) => void;
}

export default function DirectionsPanel({
  destination,
  origin,
  originLabel,
  route,
  travelMode,
  pickingOrigin,
  onTravelMode,
  onOrigin,
  onRoute,
  onPickingOrigin,
  onToast,
}: DirectionsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!origin) {
      onRoute(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchRoute(origin, destination, travelMode)
      .then((r) => {
        if (!cancelled) onRoute(r);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          onRoute(null);
          setError(e instanceof Error ? e.message : 'Routing failed');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.lat, origin?.lng, destination.lat, destination.lng, travelMode]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      onToast('Geolocation not supported');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onPickingOrigin(false);
        onOrigin(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          'My location',
        );
      },
      () => {
        setLocating(false);
        onToast('Could not get your location');
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  async function searchOrigin(e: FormEvent) {
    e.preventDefault();
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const results = await searchNigeria(searchQ, 1);
      if (!results[0]) {
        onToast('No origin found in Nigeria');
        return;
      }
      onPickingOrigin(false);
      onOrigin({ lat: results[0].lat, lng: results[0].lng }, results[0].displayName);
      setSearchQ('');
    } catch {
      onToast('Origin search failed');
    } finally {
      setSearching(false);
    }
  }

  const gmapsDrive = googleMapsDirectionsUrl(origin, destination, 'driving');
  const gmapsWalk = googleMapsDirectionsUrl(origin, destination, 'walking');

  return (
    <aside className="panel directions-panel">
      <header className="panel-header">
        <div>
          <p className="eyebrow">Directions</p>
          <h2>To this pin</h2>
        </div>
      </header>

      <div className="seg mode-seg">
        <button
          type="button"
          className={travelMode === 'driving' ? 'active' : ''}
          onClick={() => onTravelMode('driving')}
        >
          Driving
        </button>
        <button
          type="button"
          className={travelMode === 'walking' ? 'active' : ''}
          onClick={() => onTravelMode('walking')}
        >
          Walking
        </button>
      </div>

      <div className="origin-block">
        <span className="label">From</span>
        <p className="origin-label">
          {origin
            ? originLabel || `${origin.lat.toFixed(5)}, ${origin.lng.toFixed(5)}`
            : 'Choose a starting point'}
        </p>
        <div className="panel-actions tight">
          <button type="button" className="btn btn-secondary" onClick={useMyLocation} disabled={locating}>
            {locating ? 'Locating…' : 'My location'}
          </button>
          <button
            type="button"
            className={`btn btn-ghost ${pickingOrigin ? 'copied' : ''}`}
            onClick={() => onPickingOrigin(!pickingOrigin)}
          >
            {pickingOrigin ? 'Tap map…' : 'Pick on map'}
          </button>
          {origin && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                onOrigin(null, null);
                onPickingOrigin(false);
              }}
            >
              Clear
            </button>
          )}
        </div>
        <form className="find-form" onSubmit={searchOrigin}>
          <input
            type="search"
            placeholder="Search origin in Nigeria…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            aria-label="Search origin"
          />
          <button type="submit" className="btn btn-primary" disabled={searching}>
            {searching ? '…' : 'Set'}
          </button>
        </form>
      </div>

      {pickingOrigin && (
        <p className="muted small pick-hint">Tap the map to set your starting point (A).</p>
      )}

      {loading && <p className="muted">Calculating route…</p>}
      {error && <p className="form-error">{error}</p>}

      {route && !loading && (
        <div className="route-stats">
          <div>
            <span className="label">Distance</span>
            <p className="stat">{formatDistance(route.distanceM)}</p>
          </div>
          <div>
            <span className="label">ETA</span>
            <p className="stat">{formatDuration(route.durationS)}</p>
          </div>
          <div>
            <span className="label">Mode</span>
            <p className="stat capitalize">{route.mode}</p>
          </div>
        </div>
      )}

      <div className="panel-actions">
        <a className="btn btn-secondary" href={gmapsDrive} target="_blank" rel="noreferrer">
          Google Maps · Drive
        </a>
        <a className="btn btn-secondary" href={gmapsWalk} target="_blank" rel="noreferrer">
          Google Maps · Walk
        </a>
      </div>
      <p className="muted small share-hint">
        Routes via OSRM / FOSSGIS (free). Google links open in a new tab.
      </p>
    </aside>
  );
}
