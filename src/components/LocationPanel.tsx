import { useState } from 'react';
import type { LocationCodes } from '../lib/codes';
import { shareUrl, googleMapsUrl } from '../lib/codes';
import { shortPlusDisplay } from '../lib/olc';

interface LocationPanelProps {
  codes: LocationCodes;
  address?: string | null;
  addressLoading?: boolean;
  onSave?: () => void;
  saved?: boolean;
}

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`btn btn-ghost copy-btn ${copied ? 'copied' : ''}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* ignore */
        }
      }}
      title={`Copy ${label}`}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function LocationPanel({
  codes,
  address,
  addressLoading,
  onSave,
  saved,
}: LocationPanelProps) {
  const url = shareUrl(codes.friendlyCode);
  const maps = googleMapsUrl(codes.lat, codes.lng);
  const shortPlus = shortPlusDisplay(
    codes.plusCode,
    codes.stateName !== 'Nigeria' ? codes.stateName : undefined,
  );

  return (
    <aside className="panel location-panel">
      <header className="panel-header">
        <div>
          <p className="eyebrow">Your LocateNG code</p>
          <h2 className="friendly-code">{codes.friendlyCode}</h2>
        </div>
        <CopyBtn text={codes.friendlyCode} label="friendly code" />
      </header>

      <div className="code-grid">
        <div className="code-row">
          <div>
            <span className="label">Plus Code</span>
            <p className="mono">{codes.plusCode}</p>
            <p className="muted small">{shortPlus}</p>
          </div>
          <CopyBtn text={codes.plusCode} label="Plus Code" />
        </div>

        <div className="code-row">
          <div>
            <span className="label">Coordinates</span>
            <p className="mono">
              {codes.lat.toFixed(6)}, {codes.lng.toFixed(6)}
            </p>
            <p className="muted small">{codes.stateName}</p>
          </div>
          <CopyBtn text={`${codes.lat.toFixed(6)}, ${codes.lng.toFixed(6)}`} label="coordinates" />
        </div>

        <div className="code-row address-row">
          <div>
            <span className="label">Approximate address</span>
            {addressLoading ? (
              <p className="muted">Looking up…</p>
            ) : (
              <p className="address">{address || 'Address unavailable'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="panel-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
            } catch {
              /* ignore */
            }
          }}
        >
          Copy share link
        </button>
        <a className="btn btn-secondary" href={maps} target="_blank" rel="noreferrer">
          Open in Google Maps
        </a>
        {onSave && (
          <button type="button" className="btn btn-ghost" onClick={onSave} disabled={saved}>
            {saved ? 'Saved' : 'Save locally'}
          </button>
        )}
      </div>

      <p className="share-hint muted small">
        Share URL: <span className="mono break">{url}</span>
      </p>
    </aside>
  );
}
