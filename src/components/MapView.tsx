import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { LAGOS_CENTER, DEFAULT_ZOOM } from '../lib/states';
import type { RouteResult } from '../lib/routing';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const destIcon = L.divIcon({
  className: 'locate-pin',
  html: `<div class="locate-pin-inner"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const originIcon = L.divIcon({
  className: 'locate-pin origin',
  html: `<div class="locate-pin-inner origin"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

interface MapViewProps {
  lat: number | null;
  lng: number | null;
  origin?: { lat: number; lng: number } | null;
  route?: RouteResult | null;
  pickMode?: 'dest' | 'origin';
  onPick: (lat: number, lng: number) => void;
  flyTo?: { lat: number; lng: number; zoom?: number } | null;
  fitBoundsKey?: string | null;
}

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ target }: { target: { lat: number; lng: number; zoom?: number } | null | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], target.zoom ?? Math.max(map.getZoom(), 15), {
      duration: 0.8,
    });
  }, [target, map]);
  return null;
}

function FitRoute({
  route,
  origin,
  dest,
  fitKey,
}: {
  route: RouteResult | null | undefined;
  origin?: { lat: number; lng: number } | null;
  dest: { lat: number; lng: number } | null;
  fitKey?: string | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!route?.coordinates?.length) return;
    const bounds = L.latLngBounds(route.coordinates.map(([a, b]) => L.latLng(a, b)));
    if (origin) bounds.extend([origin.lat, origin.lng]);
    if (dest) bounds.extend([dest.lat, dest.lng]);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
  }, [fitKey, route, origin, dest, map]);
  return null;
}

export default function MapView({
  lat,
  lng,
  origin,
  route,
  onPick,
  flyTo,
  fitBoundsKey,
}: MapViewProps) {
  const center = useMemo<[number, number]>(() => {
    if (lat != null && lng != null) return [lat, lng];
    return LAGOS_CENTER;
  }, [lat, lng]);

  const dest = lat != null && lng != null ? { lat, lng } : null;
  const lineColor = route?.mode === 'walking' ? '#1a6bb5' : '#0b7a3e';

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      className="map-root"
      zoomControl={false}
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      <FlyTo target={flyTo} />
      <FitRoute route={route} origin={origin} dest={dest} fitKey={fitBoundsKey} />
      {route && route.coordinates.length > 1 && (
        <Polyline
          positions={route.coordinates}
          pathOptions={{ color: lineColor, weight: 5, opacity: 0.85 }}
        />
      )}
      {origin && <Marker position={[origin.lat, origin.lng]} icon={originIcon} />}
      {lat != null && lng != null && <Marker position={[lat, lng]} icon={destIcon} />}
    </MapContainer>
  );
}
