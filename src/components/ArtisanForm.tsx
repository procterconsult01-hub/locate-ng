import { useMemo, useState, type FormEvent } from 'react';
import {
  ARTISAN_AVAILABILITIES,
  ARTISAN_TRADES,
  type ArtisanAvailability,
  type ArtisanTrade,
} from '../lib/pins';
import { createArtisanPin } from '../lib/pinStore';
import { codesFromLatLng } from '../lib/codes';

interface ArtisanFormProps {
  lat: number | null;
  lng: number | null;
  onCreated: (id: string, lat: number, lng: number) => void;
  onSetLocation: (lat: number, lng: number) => void;
  onCancel: () => void;
  onToast: (msg: string) => void;
  onNeedPin: () => void;
}

export default function ArtisanForm({
  lat,
  lng,
  onCreated,
  onSetLocation,
  onCancel,
  onToast,
  onNeedPin,
}: ArtisanFormProps) {
  const [trade, setTrade] = useState<ArtisanTrade>('plumber');
  const [tradesOther, setTradesOther] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [landmark, setLandmark] = useState('');
  const [phone, setPhone] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [serviceRadiusKm, setServiceRadiusKm] = useState('10');
  const [areasServed, setAreasServed] = useState('');
  const [availability, setAvailability] = useState<ArtisanAvailability>('weekdays');
  const [availabilityNote, setAvailabilityNote] = useState('');
  const [priceHint, setPriceHint] = useState('');
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
    if (!phone.trim()) {
      setError('Phone is recommended so people can reach you — add a number');
      return;
    }
    try {
      const years = yearsExperience.trim() ? Number(yearsExperience) : undefined;
      const radius = serviceRadiusKm.trim() ? Number(serviceRadiusKm) : undefined;
      const pin = createArtisanPin({
        title: t,
        body,
        landmark,
        phone,
        lat,
        lng,
        trade,
        tradesOther: trade === 'other' ? tradesOther : undefined,
        yearsExperience: Number.isFinite(years) ? years : undefined,
        serviceRadiusKm: Number.isFinite(radius) ? radius : undefined,
        areasServed: areasServed
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        availability,
        availabilityNote: availability === 'custom' ? availabilityNote : undefined,
        priceHint,
      });
      onToast('Artisan listed on this device');
      onCreated(pin.id, pin.lat, pin.lng);
    } catch {
      setError('Could not save artisan');
    }
  }

  return (
    <aside className="panel artisan-form-panel">
      <header className="panel-header">
        <div>
          <p className="eyebrow artisan-eyebrow">List artisan</p>
          <h2>Community pin</h2>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Close
        </button>
      </header>

      <form className="layer-form" onSubmit={onSubmit}>
        <label className="field">
          <span className="label">Trade</span>
          <select value={trade} onChange={(e) => setTrade(e.target.value as ArtisanTrade)}>
            {ARTISAN_TRADES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        {trade === 'other' && (
          <label className="field">
            <span className="label">Other trade</span>
            <input
              value={tradesOther}
              placeholder="e.g. tiler"
              onChange={(e) => setTradesOther(e.target.value)}
            />
          </label>
        )}

        <label className="field">
          <span className="label">Title</span>
          <input
            value={title}
            maxLength={80}
            placeholder="e.g. Reliable plumber — Surulere"
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span className="label">About (optional)</span>
          <textarea
            value={body}
            maxLength={500}
            rows={3}
            placeholder="Skills, what you fix, languages…"
            onChange={(e) => setBody(e.target.value)}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span className="label">Years experience</span>
            <input
              type="number"
              min={0}
              max={60}
              value={yearsExperience}
              placeholder="e.g. 8"
              onChange={(e) => setYearsExperience(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="label">Service radius (km)</span>
            <input
              type="number"
              min={1}
              max={200}
              value={serviceRadiusKm}
              onChange={(e) => setServiceRadiusKm(e.target.value)}
            />
          </label>
        </div>

        <label className="field">
          <span className="label">Areas served (comma-separated)</span>
          <input
            value={areasServed}
            placeholder="Surulere, Yaba, Ikeja"
            onChange={(e) => setAreasServed(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="label">Availability</span>
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value as ArtisanAvailability)}
          >
            {ARTISAN_AVAILABILITIES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        {availability === 'custom' && (
          <label className="field">
            <span className="label">Availability note</span>
            <input
              value={availabilityNote}
              placeholder="Saturdays 9–2 only"
              onChange={(e) => setAvailabilityNote(e.target.value)}
            />
          </label>
        )}

        <label className="field">
          <span className="label">Price hint (text only · no payments)</span>
          <input
            value={priceHint}
            placeholder="from ₦5k"
            onChange={(e) => setPriceHint(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="label">Landmark (optional)</span>
          <input
            value={landmark}
            placeholder="Near Shoprite, Adeniran Ogunsanya"
            onChange={(e) => setLandmark(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="label">Phone</span>
          <input
            type="tel"
            value={phone}
            placeholder="080…"
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>

        <div className="pin-loc-block">
          <span className="label">Base location</span>
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
          <button type="submit" className="btn btn-artisan">
            Post listing
          </button>
        </div>
        <p className="muted small">
          Expires in 90 days (renew later). No payments in LocateNG — call or WhatsApp only.
          Device-local until a shared backend exists.
        </p>
      </form>
    </aside>
  );
}
