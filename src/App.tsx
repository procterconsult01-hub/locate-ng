import { useCallback, useEffect, useMemo, useState } from 'react';
import MapView from './components/MapView';
import SearchBox from './components/SearchBox';
import LocationPanel from './components/LocationPanel';
import FindPanel from './components/FindPanel';
import DirectionsPanel from './components/DirectionsPanel';
import Header from './components/Header';
import GuidePage from './components/GuidePage';
import { codesFromLatLng, lookupCode, type LocationCodes } from './lib/codes';
import { reverseGeocode } from './lib/geocode';
import { savePin, loadSaved } from './lib/storage';
import { isInNigeria } from './lib/states';
import type { LatLng, RouteResult, TravelMode } from './lib/routing';
import 'leaflet/dist/leaflet.css';

function parseRoute(): { mode: 'pin' | 'find' | 'guide'; code?: string } {
  const hash = window.location.hash.replace(/^#/, '');
  const codeMatch = hash.match(/^\/?c\/([^/?#]+)/i);
  if (codeMatch) return { mode: 'pin', code: decodeURIComponent(codeMatch[1]) };
  const params = new URLSearchParams(window.location.search);
  const q = params.get('code');
  if (q) return { mode: 'pin', code: q };
  if (/^\/?guide\/?$/i.test(hash)) return { mode: 'guide' };
  if (/^\/?find/i.test(hash)) return { mode: 'find' };
  return { mode: 'pin' };
}

export default function App() {
  const initial = useMemo(() => parseRoute(), []);
  const [mode, setMode] = useState<'pin' | 'find' | 'guide'>(initial.mode);
  const [codes, setCodes] = useState<LocationCodes | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [warnOutside, setWarnOutside] = useState(false);

  // Directions
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [originLabel, setOriginLabel] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [pickingOrigin, setPickingOrigin] = useState(false);

  const clearDirections = useCallback(() => {
    setOrigin(null);
    setOriginLabel(null);
    setRoute(null);
    setPickingOrigin(false);
  }, []);

  const applyPin = useCallback(
    async (lat: number, lng: number, opts?: { fly?: boolean; pushHash?: boolean }) => {
      const next = codesFromLatLng(lat, lng);
      setCodes(next);
      setSaved(false);
      setWarnOutside(!isInNigeria(lat, lng));
      // New destination clears previous route geometry until origin re-fetches
      setRoute(null);
      if (opts?.fly !== false) setFlyTo({ lat, lng, zoom: 16 });
      if (opts?.pushHash !== false) {
        const path = `#/c/${next.friendlyCode}`;
        if (window.location.hash !== path) {
          history.replaceState(null, '', path);
        }
      }
      setAddressLoading(true);
      setAddress(null);
      try {
        const rev = await reverseGeocode(lat, lng);
        setAddress(rev?.displayName ?? null);
      } catch {
        setAddress(null);
      } finally {
        setAddressLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!initial.code) return;
    const result = lookupCode(initial.code);
    if (result.ok) {
      void applyPin(result.lat, result.lng, { pushHash: true });
      setMode('pin');
    } else {
      setToast(result.error);
      setMode('find');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onHash() {
      const r = parseRoute();
      if (r.code) {
        const result = lookupCode(r.code);
        if (result.ok) {
          void applyPin(result.lat, result.lng, { pushHash: false });
          setMode('pin');
        }
      } else if (r.mode === 'guide') {
        setMode('guide');
      } else if (r.mode === 'find') {
        setMode('find');
      } else {
        setMode('pin');
      }
    }
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [applyPin]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  function onLocate() {
    if (!navigator.geolocation) {
      setToast('Geolocation not supported in this browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        void applyPin(pos.coords.latitude, pos.coords.longitude);
        setMode('pin');
      },
      () => {
        setLocating(false);
        setToast('Could not get your location. Check permissions.');
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  function onMode(m: 'pin' | 'find') {
    setMode(m);
    if (m === 'find') {
      history.replaceState(null, '', '#/find');
    } else if (codes) {
      history.replaceState(null, '', `#/c/${codes.friendlyCode}`);
    } else {
      history.replaceState(null, '', '#/');
    }
  }

  function onGuide() {
    setMode('guide');
    if (window.location.hash !== '#/guide') {
      history.pushState(null, '', '#/guide');
    }
  }

  function handleMapPick(lat: number, lng: number) {
    if (pickingOrigin) {
      setOrigin({ lat, lng });
      setOriginLabel('Map pin A');
      setPickingOrigin(false);
      setToast('Origin set');
      return;
    }
    void applyPin(lat, lng);
    setMode('pin');
  }

  const fitKey =
    route && origin && codes
      ? `${travelMode}-${origin.lat.toFixed(5)}-${codes.lat.toFixed(5)}-${route.distanceM}`
      : null;

  return (
    <div className="app">
      <Header
        mode={mode}
        onMode={onMode}
        onLocate={onLocate}
        locating={locating}
        onGuide={onGuide}
      />

      {mode === 'guide' ? (
        <GuidePage />
      ) : (
      <div className="map-shell">
        <div className="map-overlay-top">
          <SearchBox
            onSelect={(lat, lng) => {
              if (pickingOrigin) {
                setOrigin({ lat, lng });
                setOriginLabel('Search origin');
                setPickingOrigin(false);
                return;
              }
              void applyPin(lat, lng);
              setMode('pin');
            }}
          />
          {pickingOrigin && (
            <div className="pick-banner">Click the map to set origin (A) → pin is destination (B)</div>
          )}
        </div>

        <MapView
          lat={codes?.lat ?? null}
          lng={codes?.lng ?? null}
          origin={origin}
          route={route}
          onPick={handleMapPick}
          flyTo={flyTo}
          fitBoundsKey={fitKey}
        />

        <div className="side-stack">
          {mode === 'find' && (
            <FindPanel
              onFound={(lat, lng) => {
                void applyPin(lat, lng);
                setMode('pin');
              }}
            />
          )}
          {mode === 'pin' && codes && (
            <>
              <LocationPanel
                codes={codes}
                address={address}
                addressLoading={addressLoading}
                saved={saved}
                onSave={() => {
                  savePin({ ...codes, address: address ?? undefined });
                  setSaved(true);
                  setToast('Saved on this device');
                  void loadSaved();
                }}
              />
              <DirectionsPanel
                destination={{ lat: codes.lat, lng: codes.lng }}
                origin={origin}
                originLabel={originLabel}
                route={route}
                travelMode={travelMode}
                pickingOrigin={pickingOrigin}
                onTravelMode={setTravelMode}
                onOrigin={(o, label) => {
                  setOrigin(o);
                  setOriginLabel(label ?? null);
                  if (!o) clearDirections();
                }}
                onRoute={setRoute}
                onPickingOrigin={setPickingOrigin}
                onToast={setToast}
              />
            </>
          )}
          {mode === 'pin' && !codes && (
            <aside className="panel hint-panel">
              <p className="eyebrow">Get started</p>
              <h2>Drop a pin</h2>
              <p className="muted">
                Tap the map, search a place, or use your location to generate a stable LocateNG
                code you can share — plus a Google Plus Code for the same spot. Then get walking
                or driving directions to the pin.
              </p>
              <ul className="hint-list">
                <li>Codes are deterministic from coordinates (no server required)</li>
                <li>Share links restore the pin via URL hash</li>
                <li>Directions use free OSRM routing; Google Maps deep links included</li>
              </ul>
            </aside>
          )}
          {warnOutside && codes && (
            <p className="outside-warn">
              Pin is outside Nigeria — code still works globally via Plus Code.
            </p>
          )}
        </div>
      </div>
      )}

      <footer className="app-footer">
        <span>LocateNG · OpenStreetMap · Open Location Code · OSRM</span>
        <span className="muted">Nominatim · free routing (rate-limited)</span>
      </footer>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
