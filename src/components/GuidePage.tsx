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

        <aside className="guide-tips">
          <h3>Tips</h3>
          <ul>
            <li>You need a network connection for search, addresses, and directions.</li>
            <li>The same pin always produces the same codes — they come from the coordinates, not a server.</li>
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
