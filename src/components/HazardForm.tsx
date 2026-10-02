import { useMemo, useState, type FormEvent } from 'react';
import {
  HAZARD_SEVERITIES,
  HAZARD_TYPES,
  type HazardSeverity,
  type HazardType,
} from '../lib/pins';
import { createHazardPin } from '../lib/pinStore';
import { codesFromLatLng } from '../lib/codes';

interface HazardFormProps {
  lat: number | null;
  lng: number | null;
  onCreated: (id: string, lat: number, lng: number) => void;
  onSetLocation: (lat: number, lng: number) => void;
  onCancel: () => void;
  onToast: (msg: string) => void;
  onNeedPin: () => void;
}

export default function HazardForm({
  lat,
  lng,
  onCreated,
  onSetLocation,
  onCancel,
  onToast,
  onNeedPin,
}: HazardFormProps) {
  const [hazardType, setHazardType] = useState<HazardType>('flood');
  const [severity, setSeverity] = useState<HazardSeverity>('medium');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [landmark, setLandmark] = useState('');
  const [directionHint, setDirectionHint] = useState('');
  const [phone, setPhone] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const previewCode = useMemo(() => {
    if (lat == null || lng == null) return null;
    return codesFromLatLng(lat, lng).friendlyCode;
  }, [lat, lng]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      onToast('Geolocation not supported');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onSetLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocating(false);
        onToast('Could not get location');
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  function onPhoto(file: File | null) {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    if (!file) {
      setPhotoPreview(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      onToast('Please choose an image');
      return;
    }
    setPhotoPreview(URL.createObjectURL(file));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (lat == null || lng == null) {
      setError('Drop a pin on the map or use your location first');
      onNeedPin();
      return;
    }
    const t = title.trim();
    if (!t) {
      setError('Title is required');
      return;
    }
    try {
      const pin = createHazardPin({
        title: t,
        body,
        landmark,
        phone,
        lat,
        lng,
        hazardType,
        severity,
        directionHint,
      });
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      onToast('Hazard reported on this device');
      onCreated(pin.id, pin.lat, pin.lng);
    } catch {
      setError('Could not save hazard');
    }
  }

  return (
    <aside className="panel hazard-form-panel">
      <header className="panel-header">
        <div>
          <p className="eyebrow hazard-eyebrow">Report hazard</p>
          <h2>Community pin</h2>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Close
        </button>
      </header>

      <form className="layer-form" onSubmit={onSubmit}>
        <label className="field">
          <span className="label">Type</span>
          <select value={hazardType} onChange={(e) => setHazardType(e.target.value as HazardType)}>
            {HAZARD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="label">Severity</span>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as HazardSeverity)}
          >
            {HAZARD_SEVERITIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="label">Title</span>
          <input
            value={title}
            maxLength={80}
            placeholder="e.g. Flooded street by First Bank"
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span className="label">Details (optional)</span>
          <textarea
            value={body}
            maxLength={500}
            rows={3}
            placeholder="What should neighbours know?"
            onChange={(e) => setBody(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="label">Landmark (optional)</span>
          <input
            value={landmark}
            placeholder="By First Bank, third street"
            onChange={(e) => setLandmark(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="label">Direction hint (optional)</span>
          <input
            value={directionHint}
            placeholder="Both lanes / one side"
            onChange={(e) => setDirectionHint(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="label">Phone (optional)</span>
          <input
            type="tel"
            value={phone}
            placeholder="080…"
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="label">Photo (optional · preview only, not synced)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
          />
          {photoPreview && (
            <img className="photo-preview" src={photoPreview} alt="Hazard preview" />
          )}
        </label>

        <div className="pin-loc-block">
          <span className="label">Location</span>
          {previewCode ? (
            <p className="mono small">{previewCode}</p>
          ) : (
            <p className="muted small">Tap the map to set the pin, or use your location</p>
          )}
          <div className="panel-actions tight">
            <button type="button" className="btn btn-secondary" onClick={onNeedPin}>
              Tap map for pin
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={useMyLocation}
              disabled={locating}
            >
              {locating ? 'Locating…' : 'Use my location'}
            </button>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="panel-actions">
          <button type="submit" className="btn btn-hazard">
            Post hazard
          </button>
        </div>
        <p className="muted small">
          Expires in 72 hours. Saved on this device only until a shared backend exists.
        </p>
      </form>
    </aside>
  );
}
