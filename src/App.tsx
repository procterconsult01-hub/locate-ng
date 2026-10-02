import { useCallback, useEffect, useMemo, useState } from 'react';
import MapView from './components/MapView';
import SearchBox from './components/SearchBox';
import LocationPanel from './components/LocationPanel';
import FindPanel from './components/FindPanel';
import DirectionsPanel from './components/DirectionsPanel';
import Header from './components/Header';
import GuidePage from './components/GuidePage';
import LayerToggle, { type ActiveCommunityLayer } from './components/LayerToggle';
import HazardForm from './components/HazardForm';
import ArtisanForm from './components/ArtisanForm';
import PinDetailSheet from './components/PinDetailSheet';
import { codesFromLatLng, lookupCode, type LocationCodes } from './lib/codes';
import { reverseGeocode } from './lib/geocode';
import { savePin, loadSaved } from './lib/storage';
import { isInNigeria } from './lib/states';
import type { LatLng, RouteResult, TravelMode } from './lib/routing';
import { getPinById, loadVisiblePins } from './lib/pinStore';
import type { CommunityPin, HazardPin, ArtisanPin } from './lib/pins';
import 'leaflet/dist/leaflet.css';

type AppMode = 'pin' | 'find' | 'guide';

function parseHashQuery(): URLSearchParams {
  const hash = window.location.hash.replace(/^#/, '');
  const qIndex = hash.indexOf('?');
  if (qIndex >= 0) return new URLSearchParams(hash.slice(qIndex + 1));
  return new URLSearchParams(window.location.search);
}

function parseRoute(): {
  mode: AppMode;
  code?: string;
  layer?: ActiveCommunityLayer;
  pinId?: string;
} {
  const hash = window.location.hash.replace(/^#/, '');
  const pathOnly = hash.split('?')[0];
  const q = parseHashQuery();
  const layerRaw = q.get('layer');
  const layer =
    layerRaw === 'hazard' || layerRaw === 'artisan' ? layerRaw : undefined;
  const pinId = q.get('pin') || q.get('pinId') || undefined;

  const codeMatch = pathOnly.match(/^\/?c\/([^/?#]+)/i);
  if (codeMatch) {
    return { mode: 'pin', code: decodeURIComponent(codeMatch[1]), layer, pinId };
  }
  const params = new URLSearchParams(window.location.search);
  const qCode = params.get('code') || q.get('code');
  if (qCode) return { mode: 'pin', code: qCode, layer, pinId };
  if (/^\/?guide\/?$/i.test(pathOnly)) return { mode: 'guide', layer, pinId };
  if (/^\/?find/i.test(pathOnly)) return { mode: 'find', layer, pinId };
  return { mode: 'pin', layer, pinId };
}

function buildHash(
  mode: AppMode,
  friendlyCode?: string | null,
  opts?: { layer?: ActiveCommunityLayer | null; pinId?: string | null },
): string {
  let path = '#/';
  if (mode === 'guide') path = '#/guide';
  else if (mode === 'find') path = '#/find';
  else if (friendlyCode) path = `#/c/${friendlyCode}`;

  const q = new URLSearchParams();
  if (opts?.layer) q.set('layer', opts.layer);
  if (opts?.pinId) q.set('pin', opts.pinId);
  const qs = q.toString();
  return qs ? `${path}?${qs}` : path;
}

export default function App() {
  const initial = useMemo(() => parseRoute(), []);
  const [mode, setMode] = useState<AppMode>(initial.mode);
  const [codes, setCodes] = useState<LocationCodes | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [warnOutside, setWarnOutside] = useState(false);

  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [originLabel, setOriginLabel] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [pickingOrigin, setPickingOrigin] = useState(false);

  // Community layers
  const [activeLayers, setActiveLayers] = useState<Set<ActiveCommunityLayer>>(() => {
    const s = new Set<ActiveCommunityLayer>();
    if (initial.layer) s.add(initial.layer);
    return s;
  });
  const [hazardFilter, setHazardFilter] = useState('');
  const [tradeFilter, setTradeFilter] = useState('');
  const [pinsVersion, setPinsVersion] = useState(0);
  const [selectedPin, setSelectedPin] = useState<CommunityPin | null>(null);
  const [addingLayer, setAddingLayer] = useState<ActiveCommunityLayer | null>(null);
  const [pickingForLayer, setPickingForLayer] = useState(false);

  const refreshPins = useCallback(() => setPinsVersion((v) => v + 1), []);

  const communityPins = useMemo(() => {
    const layers = [...activeLayers];
    let pins = loadVisiblePins(layers);
    if (hazardFilter && activeLayers.has('hazard')) {
      pins = pins.filter(
        (p) => p.layer !== 'hazard' || (p as HazardPin).hazardType === hazardFilter,
      );
    }
    if (tradeFilter && activeLayers.has('artisan')) {
      pins = pins.filter(
        (p) => p.layer !== 'artisan' || (p as ArtisanPin).trade === tradeFilter,
      );
    }
    return pins;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayers, hazardFilter, tradeFilter, pinsVersion]);

  const clearDirections = useCallback(() => {
    setOrigin(null);
    setOriginLabel(null);
    setRoute(null);
    setPickingOrigin(false);
  }, []);

  const syncHash = useCallback(
    (
      nextMode: AppMode,
      nextCodes: LocationCodes | null,
      opts?: { layer?: ActiveCommunityLayer | null; pinId?: string | null },
    ) => {
      const layer =
        opts?.layer !== undefined
          ? opts.layer
          : selectedPin
            ? (selectedPin.layer as ActiveCommunityLayer)
            : activeLayers.size === 1
              ? [...activeLayers][0]
              : null;
      const pinId =
        opts?.pinId !== undefined ? opts.pinId : selectedPin?.id ?? null;
      const path = buildHash(nextMode, nextCodes?.friendlyCode, {
        layer: layer || undefined,
        pinId: pinId || undefined,
      });
      if (window.location.hash !== path.replace(/^#/, '') && `#${window.location.hash.replace(/^#/, '')}` !== path) {
        // compare without worrying about leading #
        const cur = window.location.hash.startsWith('#')
          ? window.location.hash
          : `#${window.location.hash}`;
        if (cur !== path) history.replaceState(null, '', path);
      }
    },
    [activeLayers, selectedPin],
  );

  const applyPin = useCallback(
    async (lat: number, lng: number, opts?: { fly?: boolean; pushHash?: boolean }) => {
      const next = codesFromLatLng(lat, lng);
      setCodes(next);
      setSaved(false);
      setWarnOutside(!isInNigeria(lat, lng));
      setRoute(null);
      if (opts?.fly !== false) setFlyTo({ lat, lng, zoom: 16 });
      if (opts?.pushHash !== false) {
        syncHash('pin', next, {
          layer: selectedPin ? (selectedPin.layer as ActiveCommunityLayer) : undefined,
          pinId: selectedPin?.id,
        });
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
    [syncHash, selectedPin],
  );

  // Initial deep link
  useEffect(() => {
    if (initial.layer) {
      setActiveLayers((prev) => new Set(prev).add(initial.layer!));
    }
    if (initial.pinId) {
      const pin = getPinById(initial.pinId);
      if (pin && (pin.layer === 'hazard' || pin.layer === 'artisan')) {
        setActiveLayers((prev) => new Set(prev).add(pin.layer));
        setSelectedPin(pin);
        setMode('pin');
        void applyPin(pin.lat, pin.lng, { pushHash: false });
        return;
      }
    }
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
      if (r.layer) {
        setActiveLayers((prev) => new Set(prev).add(r.layer!));
      }
      if (r.pinId) {
        const pin = getPinById(r.pinId);
        if (pin) {
          setSelectedPin(pin);
          setActiveLayers((prev) => new Set(prev).add(pin.layer as ActiveCommunityLayer));
          void applyPin(pin.lat, pin.lng, { pushHash: false });
          setMode('pin');
          return;
        }
      }
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
      history.replaceState(null, '', buildHash('find', null));
    } else {
      syncHash('pin', codes);
    }
  }

  function onGuide() {
    setMode('guide');
    if (window.location.hash !== '#/guide') {
      history.pushState(null, '', '#/guide');
    }
  }

  function toggleLayer(layer: ActiveCommunityLayer) {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) {
        next.delete(layer);
        if (selectedPin?.layer === layer) setSelectedPin(null);
        if (addingLayer === layer) setAddingLayer(null);
      } else {
        next.add(layer);
      }
      return next;
    });
  }

  function handleMapPick(lat: number, lng: number) {
    if (pickingOrigin) {
      setOrigin({ lat, lng });
      setOriginLabel('Map pin A');
      setPickingOrigin(false);
      setToast('Origin set');
      return;
    }
    if (pickingForLayer || addingLayer) {
      void applyPin(lat, lng);
      setPickingForLayer(false);
      setMode('pin');
      setToast('Pin set — finish the form');
      return;
    }
    void applyPin(lat, lng);
    setMode('pin');
    setSelectedPin(null);
  }

  function openCommunityPin(pin: CommunityPin) {
    setSelectedPin(pin);
    setAddingLayer(null);
    setMode('pin');
    setActiveLayers((prev) => new Set(prev).add(pin.layer as ActiveCommunityLayer));
    void applyPin(pin.lat, pin.lng, { fly: true });
    const path = buildHash('pin', pin.code, {
      layer: pin.layer as ActiveCommunityLayer,
      pinId: pin.id,
    });
    history.replaceState(null, '', path);
  }

  function onPinCreated(id: string, lat: number, lng: number) {
    refreshPins();
    setAddingLayer(null);
    setPickingForLayer(false);
    const pin = getPinById(id);
    if (pin) openCommunityPin(pin);
    else void applyPin(lat, lng);
  }

  const fitKey =
    route && origin && codes
      ? `${travelMode}-${origin.lat.toFixed(5)}-${codes.lat.toFixed(5)}-${route.distanceM}`
      : null;

  const showLocationPanel = mode === 'pin' && codes && !selectedPin && !addingLayer;

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
                if (!addingLayer) setSelectedPin(null);
              }}
            />
            <LayerToggle
              active={activeLayers}
              onToggle={toggleLayer}
              onAdd={(layer) => {
                setAddingLayer(layer);
                setSelectedPin(null);
                setPickingForLayer(true);
                setMode('pin');
                setToast(
                  layer === 'hazard'
                    ? 'Tap the map to place the hazard'
                    : 'Tap the map to place your base location',
                );
              }}
              hazardFilter={hazardFilter}
              onHazardFilter={setHazardFilter}
              tradeFilter={tradeFilter}
              onTradeFilter={setTradeFilter}
            />
            {pickingOrigin && (
              <div className="pick-banner">
                Click the map to set origin (A) → pin is destination (B)
              </div>
            )}
            {pickingForLayer && addingLayer && (
              <div className={`pick-banner pick-${addingLayer}`}>
                Tap the map to set the {addingLayer} pin location
              </div>
            )}
          </div>

          <MapView
            lat={codes?.lat ?? null}
            lng={codes?.lng ?? null}
            origin={origin}
            route={route}
            communityPins={communityPins}
            selectedPinId={selectedPin?.id}
            onPick={handleMapPick}
            onCommunityPinClick={openCommunityPin}
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

            {addingLayer === 'hazard' && (
              <HazardForm
                lat={codes?.lat ?? null}
                lng={codes?.lng ?? null}
                onCreated={onPinCreated}
                onSetLocation={(lat, lng) => {
                  void applyPin(lat, lng);
                  setPickingForLayer(false);
                }}
                onCancel={() => {
                  setAddingLayer(null);
                  setPickingForLayer(false);
                }}
                onToast={setToast}
                onNeedPin={() => {
                  setPickingForLayer(true);
                  setToast('Tap the map to place the hazard');
                }}
              />
            )}

            {addingLayer === 'artisan' && (
              <ArtisanForm
                lat={codes?.lat ?? null}
                lng={codes?.lng ?? null}
                onCreated={onPinCreated}
                onSetLocation={(lat, lng) => {
                  void applyPin(lat, lng);
                  setPickingForLayer(false);
                }}
                onCancel={() => {
                  setAddingLayer(null);
                  setPickingForLayer(false);
                }}
                onToast={setToast}
                onNeedPin={() => {
                  setPickingForLayer(true);
                  setToast('Tap the map to place your base location');
                }}
              />
            )}

            {selectedPin && !addingLayer && (
              <PinDetailSheet
                pin={selectedPin}
                onClose={() => {
                  setSelectedPin(null);
                  syncHash('pin', codes, { layer: null, pinId: null });
                }}
                onChanged={() => {
                  refreshPins();
                  const fresh = selectedPin ? getPinById(selectedPin.id) : undefined;
                  if (!fresh || fresh.status === 'hidden' || fresh.status === 'expired') {
                    setSelectedPin(null);
                  } else {
                    setSelectedPin(fresh);
                  }
                }}
                onToast={setToast}
                onDirections={(lat, lng) => {
                  void applyPin(lat, lng);
                  setSelectedPin(null);
                  setToast('Destination set — choose origin in Directions');
                }}
              />
            )}

            {showLocationPanel && (
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

            {mode === 'pin' && !codes && !addingLayer && !selectedPin && (
              <aside className="panel hint-panel">
                <p className="eyebrow">Get started</p>
                <h2>Drop a pin</h2>
                <p className="muted">
                  Tap the map, search a place, or use your location to generate a stable LocateNG
                  code. Toggle <strong>Hazard</strong> or <strong>Artisan</strong> layers to see
                  community pins (saved on this device in v1).
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
        <span className="muted">Community pins · device-local v1</span>
      </footer>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
