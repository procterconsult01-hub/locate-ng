export default function GuidePage() {
  return (
    <main className="guide-page">
      <article className="guide-card">
        <p className="eyebrow">How to use</p>
        <h2>LocateNG in four steps</h2>
        <p className="muted">
          A shareable address for any place in Nigeria — a Google Plus Code plus a friendly
          NG-… code for the same pin.
        </p>

        <ol className="guide-steps">
          <li>
            <h3>Drop a pin</h3>
            <p>
              Tap the map, search a place, or use <strong>Use my location</strong>. LocateNG
              shows a Plus Code and a friendly code such as <span className="mono">NG-LA-…</span>.
            </p>
          </li>
          <li>
            <h3>Share the code or link</h3>
            <p>
              Copy the friendly code, the Plus Code, or the share link. Anyone with the link
              opens the same pin.
            </p>
          </li>
          <li>
            <h3>Find a code</h3>
            <p>
              Open <strong>Find code</strong> and paste either format — a Plus Code or an
              NG-… code. The map jumps to that spot.
            </p>
          </li>
          <li>
            <h3>Get directions</h3>
            <p>
              With a pin set, choose walking or driving. Set your origin from your location
              or by tapping the map, then follow the route (or open it in Google Maps).
            </p>
          </li>
        </ol>

        <h2>Community layers — Hazard &amp; Artisan</h2>
        <p className="muted">
          Optional map layers for neighbourhood hazards (red) and local artisans (blue). Turn
          them on from the <strong>Layers</strong> bar above the map.
        </p>

        <ol className="guide-steps">
          <li>
            <h3>Open Layers</h3>
            <p>
              Tap <strong>Hazard</strong> and/or <strong>Artisan</strong> to show those pins.
              With a layer on, you can filter by type (flood, pothole, …) or trade (plumber,
              electrician, …).
            </p>
          </li>
          <li>
            <h3>Report a hazard or list an artisan</h3>
            <p>
              With <strong>Hazard</strong> on, choose <strong>+ Report</strong>. With{' '}
              <strong>Artisan</strong> on, choose <strong>+ List</strong>. Tap the map to set
              the spot (or use your current location), then fill the form — title, type or
              trade, optional phone / WhatsApp, landmark, and notes — and save.
            </p>
          </li>
          <li>
            <h3>Open a pin</h3>
            <p>
              Tap a red or blue marker. The sheet shows the LocateNG code, expiry, and details.
              From there you can <strong>Call</strong>, <strong>WhatsApp</strong>, get{' '}
              <strong>Directions</strong>, <strong>Copy link</strong>, or <strong>Report</strong>{' '}
              a bad pin (hidden after enough reports).
            </p>
          </li>
          <li>
            <h3>Expiry, still there, and renew</h3>
            <p>
              Hazards expire after about <strong>72 hours</strong>. Anyone can tap{' '}
              <strong>Still there (+24h)</strong> to extend them. Artisan listings last about{' '}
              <strong>90 days</strong>; the person who listed them can <strong>Renew 90 days</strong>.
            </p>
          </li>
        </ol>

        <aside className="guide-tips">
          <h3>Tips</h3>
          <ul>
            <li>You need a network connection for search, addresses, and directions.</li>
            <li>The same pin always produces the same codes — they come from the coordinates, not a server.</li>
            <li>
              Hazard and Artisan pins are saved on <strong>this device only</strong> (
              <span className="mono">localStorage</span>) until a shared backend exists.
              Neighbours will not see your pins yet; a share link still opens the map at that
              place.
            </li>
          </ul>
        </aside>

        <p className="guide-back">
          <a className="btn btn-primary" href="#/">
            Back to the map
          </a>
        </p>
      </article>
    </main>
  );
}
