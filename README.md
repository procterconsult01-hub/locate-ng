# LocateNG

**A shareable address for every place in Nigeria.**

LocateNG gives every map pin a stable, human-readable code you can share — plus a Google [Plus Code](https://maps.google.com/pluscodes/) (Open Location Code) for the same spot. Drop a pin, look up a code, and get **walking / driving directions** on the map. No paid map APIs and no backend required for the MVP.

## Live site

- **GitHub Pages:** https://procterconsult01-hub.github.io/locate-ng/
- Share links use hash routing and work under the Pages subpath, e.g. `https://procterconsult01-hub.github.io/locate-ng/#/c/NG-LA-6FR5G9FHQM`

Deploy: push to `main` runs `.github/workflows/deploy-pages.yml` (GitHub Actions → Pages).

## Features

- Drop a pin on an OpenStreetMap map (or search a place in Nigeria)
- Get a **LocateNG** friendly code and a **Plus Code**
- Copy coordinates, share URL, or open in Google Maps
- Look up either code format and restore the pin
- Share links like `/#/c/NG-LA-6FR5G9FHQM` work without a server
- **Directions**: walking & driving from my location, a searched place, or a second map pin (A→B)
- Route polyline on the map via free OSRM / FOSSGIS; distance + ETA
- Google Maps deep links with `travelmode=driving` / `walking`
- Recent pins can be saved in `localStorage` (demo only)

## Code format

| Kind | Example | Notes |
|------|---------|--------|
| **LocateNG (friendly)** | `NG-LA-6FR5G9FHQM` | `NG-{state}-{compact Plus Code}` |
| **Plus Code** | `6FR5G9FH+QM` | Open Location Code, ~14 m precision |

- Codes are **deterministic** from latitude/longitude (same pin → same codes).
- State abbrev (`LA`, `FC`, …) comes from coarse bounding boxes (MVP — not cadastral).
- Lookup accepts friendly codes **or** Plus Codes (full or short).
- Primary identity is the Plus Code; the friendly form is a Nigeria-flavored display that still decodes offline.

## Directions

1. Set a destination pin (map click, search, or share URL).
2. In **Directions**, choose **Driving** or **Walking**.
3. Set origin with **My location**, **Pick on map**, or search.
4. Route draws on the Leaflet map; distance and ETA come from OSRM.
5. Use **Google Maps · Drive / Walk** for turn-by-turn in Google Maps (no API key).

Routing endpoints (free, no key):

- Driving: `router.project-osrm.org`
- Walking: `routing.openstreetmap.de` (FOSSGIS foot profile)

## Stack

- Vite + React + TypeScript
- Leaflet + OpenStreetMap tiles (free)
- [`open-location-code`](https://www.npmjs.com/package/open-location-code)
- Nominatim for search / reverse geocode (free, rate-limited)
- OSRM / FOSSGIS for routing (free, rate-limited)

## Run locally

```bash
cd locate-ng
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Production build

```bash
npm run build
npm run preview
```

## Screenshots

See `screenshots/` after a local run (home, pin panel, find, directions).

## Limitations

- **Nominatim**: ≤ ~1 request/second; do not hammer from production without your own instance or caching.
- **OSRM public servers**: best-effort; may throttle or be unavailable; not for heavy production traffic.
- **State boxes**: Approximate; a pin near a border may show a neighbouring state code.
- **No NIPOST database**: This is not an official postal system.
- **localStorage** saves are device-local only.
- Map tiles, geocoding, and routing need network; encode/decode of codes works offline once the app is loaded.

## License

MVP / demo — use freely.
