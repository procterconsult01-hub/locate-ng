import { useState } from 'react';
import {
  artisanTradeLabel,
  formatExpiresIn,
  hazardTypeLabel,
  pinDeepLink,
  type ArtisanPin,
  type CommunityPin,
  type HazardPin,
  ARTISAN_AVAILABILITIES,
} from '../lib/pins';
import { confirmStillThere, getDeviceId, renewArtisanPin, reportPin } from '../lib/pinStore';
import { googleMapsUrl } from '../lib/codes';

interface PinDetailSheetProps {
  pin: CommunityPin;
  onClose: () => void;
  onChanged: () => void;
  onToast: (msg: string) => void;
  onDirections: (lat: number, lng: number) => void;
}

export default function PinDetailSheet({
  pin,
  onClose,
  onChanged,
  onToast,
  onDirections,
}: PinDetailSheetProps) {
  const [copied, setCopied] = useState(false);
  const link = pinDeepLink(pin);
  const maps = googleMapsUrl(pin.lat, pin.lng);
  const isOwner = pin.createdBy && pin.createdBy === getDeviceId();

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      onToast('Link copied');
      setTimeout(() => setCopied(false), 1600);
    } catch {
      onToast('Could not copy');
    }
  }

  function onReport() {
    const updated = reportPin(pin.id);
    onChanged();
    if (!updated || updated.status === 'hidden') {
      onToast('Thanks — pin hidden after reports');
      onClose();
    } else {
      onToast(`Reported (${updated.reportCount}/3)`);
    }
  }

  function onStillThere() {
    confirmStillThere(pin.id);
    onChanged();
    onToast('Extended +24h — thanks');
  }

  function onRenew() {
    renewArtisanPin(pin.id);
    onChanged();
    onToast('Listing renewed for 90 days');
  }

  const wa = pin.whatsapp
    ? `https://wa.me/${pin.whatsapp}`
    : pin.phone
      ? `https://wa.me/${pin.phone.replace(/\D/g, '')}`
      : null;

  return (
    <aside className={`panel pin-sheet layer-${pin.layer}`}>
      <header className="panel-header">
        <div>
          <p className={`eyebrow ${pin.layer}-eyebrow`}>
            {pin.layer === 'hazard' ? 'Hazard' : 'Artisan'}
          </p>
          <h2>{pin.title}</h2>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Close">
          Close
        </button>
      </header>

      <div className="pin-meta">
        <span className={`badge badge-${pin.layer}`}>{pin.layer}</span>
        <span className="mono small">{pin.code}</span>
        <span className="muted small">{formatExpiresIn(pin.expiresAt)}</span>
      </div>

      {pin.layer === 'hazard' && <HazardDetails pin={pin} />}
      {pin.layer === 'artisan' && <ArtisanDetails pin={pin} />}

      {pin.landmark && (
        <p className="pin-body">
          <strong>Landmark:</strong> {pin.landmark}
        </p>
      )}
      {pin.body && <p className="pin-body">{pin.body}</p>}
      {pin.state && <p className="muted small">{pin.state}</p>}

      <div className="panel-actions">
        {pin.phone && (
          <a className="btn btn-secondary" href={`tel:${pin.phone}`}>
            Call
          </a>
        )}
        {wa && (
          <a className="btn btn-secondary" href={wa} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onDirections(pin.lat, pin.lng)}
        >
          Directions
        </button>
        <a className="btn btn-ghost" href={maps} target="_blank" rel="noreferrer">
          Google Maps
        </a>
        <button type="button" className="btn btn-ghost" onClick={copyLink}>
          {copied ? 'Copied' : 'Copy link'}
        </button>
        {pin.layer === 'hazard' && (
          <button type="button" className="btn btn-ghost" onClick={onStillThere}>
            Still there (+24h)
          </button>
        )}
        {pin.layer === 'artisan' && isOwner && (
          <button type="button" className="btn btn-ghost" onClick={onRenew}>
            Renew 90 days
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-report" onClick={onReport}>
          Report
        </button>
      </div>
      <p className="muted small share-hint">
        Share: <span className="mono break">{link}</span>
      </p>
    </aside>
  );
}

function HazardDetails({ pin }: { pin: HazardPin }) {
  return (
    <div className="code-grid">
      <div className="code-row">
        <div>
          <span className="label">Type</span>
          <p>{hazardTypeLabel(pin.hazardType)}</p>
        </div>
        <div>
          <span className="label">Severity</span>
          <p className={`severity-${pin.severity}`}>{pin.severity}</p>
        </div>
      </div>
      {pin.directionHint && (
        <div className="code-row">
          <div>
            <span className="label">Direction</span>
            <p>{pin.directionHint}</p>
          </div>
        </div>
      )}
      <div className="code-row">
        <div>
          <span className="label">Confirmed</span>
          <p>{pin.confirmedCount || 0} neighbour(s)</p>
        </div>
      </div>
    </div>
  );
}

function ArtisanDetails({ pin }: { pin: ArtisanPin }) {
  const avail =
    ARTISAN_AVAILABILITIES.find((a) => a.value === pin.availability)?.label ?? pin.availability;
  return (
    <div className="code-grid">
      <div className="code-row">
        <div>
          <span className="label">Trade</span>
          <p>{artisanTradeLabel(pin.trade, pin.tradesOther)}</p>
        </div>
        {pin.yearsExperience != null && (
          <div>
            <span className="label">Experience</span>
            <p>{pin.yearsExperience} yrs</p>
          </div>
        )}
      </div>
      {(pin.serviceRadiusKm != null || pin.areasServed?.length) && (
        <div className="code-row">
          <div>
            <span className="label">Serves</span>
            <p>
              {pin.serviceRadiusKm != null ? `${pin.serviceRadiusKm} km` : ''}
              {pin.serviceRadiusKm != null && pin.areasServed?.length ? ' · ' : ''}
              {pin.areasServed?.join(', ') ?? ''}
            </p>
          </div>
        </div>
      )}
      <div className="code-row">
        <div>
          <span className="label">Availability</span>
          <p>
            {avail}
            {pin.availabilityNote ? ` — ${pin.availabilityNote}` : ''}
          </p>
        </div>
        {pin.priceHint && (
          <div>
            <span className="label">Price hint</span>
            <p>{pin.priceHint}</p>
          </div>
        )}
      </div>
      {pin.verifiedHint && (
        <p className="muted small">Verified (admin hint)</p>
      )}
    </div>
  );
}
