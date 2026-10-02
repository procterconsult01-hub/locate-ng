# LocateNG

**A shareable address for every place in Nigeria.**

LocateNG gives every map pin a short **5-character zip** you can share — plus a Google [Plus Code](https://maps.google.com/pluscodes/) (Open Location Code) for the same spot. Drop a pin, look up a code, and get **walking / driving directions** on the map. No paid map APIs and no backend required for the MVP.

## Live site

- **Custom domain:** https://locate-ng.com/ (and https://www.locate-ng.com/)
- **GitHub Pages fallback:** https://procterconsult01-hub.github.io/locate-ng/
- Share links use hash routing, e.g. `https://locate-ng.com/#/c/82A6B`
- In-app guide: https://locate-ng.com/#/guide (codes, directions, Hazard & Artisan layers)

Deploy: push to `main` runs `.github/workflows/deploy-pages.yml` (GitHub Actions → Pages), or publish the `gh-pages` branch.

## Features

- Drop a pin on an OpenStreetMap map (or search a place in Nigeria)
- Get a **LocateNG** 5-char zip and a **Plus Code**
- Copy coordinates, share URL, or open in Google Maps
- Look up either code format and restore the pin
- Share links like `/#/c/82A6B` work without a server (old `/#/c/NG-LA-…` links still open)
- **Directions**: walking & driving from my location, a searched place, or a second map pin (A→B)
- Route polyline on the map via free OSRM / FOSSGIS; distance + ETA
- Google Maps deep links with `travelmode=driving` / `walking`
- Recent pins can be saved in `localStorage` (demo only)
- **Community layers (v1, device-local):** Hazard (red, 72h) and Artisan (blue, 90d) — toggle on the map, report/list, share deep links `?layer=hazard|artisan&pin=…`

## Code format

| Kind | Example | Notes |
|------|---------|--------|
| **LocateNG zip (primary)** | `82A6B` | 5-char Crockford-ish base32 over Nigeria grid, **~215 m** cell |
| **Plus Code** | `6FR5G9FH+QM` | Open Location Code, **~14 m** precision |
| **Legacy friendly** | `NG-LA-6FR5G9FHQM` | Old `NG-{state}-{compact Plus}` — still accepted on lookup |

- Short zip and Plus Code are **deterministic** from latitude/longitude (same cell/pin → same codes).
- **Tradeoff:** shorter zip ⇒ larger cell (~215 m). Use the Plus Code when you need building-level accuracy.
- Lookup accepts short zips, legacy `NG-…` codes, **or** Plus Codes (full or short).
- Share URLs use the short zip: `/#/c/82A6B`. Old long `#/c/NG-LA-…` deep links still resolve.

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
- **Community pins** (Hazard / Artisan) are also localStorage-only in v1 — not visible to other users until a backend is added. See `docs/map-layers-spec.md`.
- Map tiles, geocoding, and routing need network; encode/decode of codes works offline once the app is loaded.

## License

MVP / demo — use freely.
