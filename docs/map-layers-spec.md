# LocateNG map layers — one-page spec

**Goal:** Add optional community pins on the existing LocateNG map without turning it into a full marketplace.

## Principles
- Every pin has a **LocateNG code** + lat/lng + layer type.
- Layers are **filters**, not separate apps.
- Time-sensitive pins **auto-expire**.
- Share URL opens map zoomed on that pin:  
  `https://locate-ng.com/#/?code=XXXX&layer=hazard` (exact query shape TBD to match current hash router).
- v1 ships **one** community layer; others stay schema-ready.

## Pin model — shared fields (all layers)

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| id | uuid | yes | |
| layer | enum | yes | hazard \| artisan \| housing \| centre \| urgent |
| title | string ≤80 | yes | shown on map card |
| slug | string | no | short share token if not using id |
| code | string | yes | LocateNG / Plus Code |
| lat, lng | number | yes | |
| accuracyM | number | no | from GPS when dropped |
| state | string | no | e.g. Lagos (for filters) |
| lga | string | no | |
| landmark | string | no | “by First Bank, third street” |
| phone | string | no | tel: link |
| whatsapp | string | no | wa.me link (can default from phone) |
| email | string | no | rare |
| body | string ≤500 | no | description |
| photoUrls | string[] | no | 0–3 images; compress client-side |
| tags | string[] | no | freeform chips |
| language | string | no | en \| pidgin \| etc. |
| createdAt | ISO | yes | |
| updatedAt | ISO | yes | |
| expiresAt | ISO | yes* | *nullable only for centre |
| status | enum | yes | active \| expired \| hidden \| taken |
| reportCount | number | yes | default 0 |
| createdBy | string | no | anon ok; device/session id |
| source | enum | no | app \| import \| admin |
| deepLink | string | computed | share URL |

## Layer-specific fields

### 1. Hazard (recommended v1)
| Field | Notes |
|-------|--------|
| hazardType | flood \| road_cut \| pothole \| drain \| accident \| other |
| severity | low \| medium \| high |
| directionHint | e.g. “both lanes / one side” |
| stillThere | boolean \| unknown | optional “confirm still there” bump |
| confirmedCount | number | neighbours tapping “still there” |
| photoUrls | strongly encouraged |

**Colour:** red. **Expiry:** 48–72h (extend +24h on confirm). **Moderation:** report → hide after N.

### 2. Artisan
| Field | Notes |
|-------|--------|
| trade | plumber \| electrician \| ac \| carpenter \| painter \| welder \| other |
| tradesOther | string if other |
| yearsExperience | number optional |
| serviceRadiusKm | number | how far they’ll travel |
| areasServed | string[] | neighbourhood names |
| availability | weekdays \| weekends \| anytime \| custom note |
| priceHint | string | “from ₦5k” — text only, no checkout |
| verifiedHint | boolean | manual admin flag later |

**Colour:** blue. **Expiry:** 90 days (renew). **No payments/escrow.**

### 3. Housing
| Field | Notes |
|-------|--------|
| housingType | room \| self_contain \| flat \| shared \| short_let |
| rentAmount | number | ₦ |
| rentPeriod | monthly \| yearly \| nightly |
| agencyFee | number \| null |
| availableFrom | date |
| genderPref | any \| male \| female \| n/a |
| furnished | boolean \| partial |
| utilitiesIncluded | boolean \| note |
| corpFriendly | boolean | NYSC / corp members |
| takenAt | ISO | when marked taken |

**Colour:** green. **Expiry:** 14–30 days or status=taken. **No deposits in-app.**

### 4. Centre
| Field | Notes |
|-------|--------|
| centreType | exam \| clinic \| hospital \| estate_gate \| school \| worship \| other |
| institutionName | string |
| openingHours | string |
| examBodies | string[] | WAEC, NECO, JAMB if exam |
| wheelchairAccess | boolean \| unknown |

**Colour:** purple/grey. **Expiry:** none or annual review.

### 5. Urgent (blood / help)
| Field | Notes |
|-------|--------|
| urgentType | blood \| other_help |
| bloodGroup | A+ A- B+ B- AB+ AB- O+ O- \| unknown |
| unitsNeeded | number optional |
| hospitalName | string |
| patientInitials | string optional | privacy — avoid full name |
| neededBy | ISO datetime |
| fulfilled | boolean | |

**Colour:** pulsing orange. **Expiry:** 24h. **Disclaimer:** not a medical service.

## Map UX
1. Default map = today’s LocateNG (codes / walk-drive).
2. Toggle **Layers** chip → multi-select filters.
3. Cluster pins when zoomed out.
4. Tap → bottom sheet: title, layer badge, code, landmark, key layer fields, Call / WhatsApp / Directions / Copy link / Report.
5. “Add pin” only when a layer that allows create is selected.
6. Optional filters by **state / LGA / trade / hazardType**.

## Deep links
- Open code: existing behaviour.
- Open pin: `code` + `layer` + `pinId` so the sheet opens automatically.
- Other products (RentProof, EstatePass) only store/link a **code**, they don’t invent a new map.

## Build order
1. Schema (shared + hazard fields) + Hazard layer + expiry + share link.  
2. Artisan layer.  
3. Housing or Centres.  
4. Urgent last (moderation + disclaimer).

## Out of scope
Payments, ratings wars, chat, Selar, full classifieds like Jiji.

## Success
Someone in Lagos can report a flooded street, share a link, and a neighbour opens LocateNG zoomed to that red pin with walk/drive ready.

---

## Implementation status (2026-10-01 CT)

### Shipped in UI (v1 — device-local)

| Layer | Status | Notes |
|-------|--------|--------|
| **Hazard** | Done | Red pins, form, filters, detail sheet, 72h expiry, still-there +24h, report→hide@3, deep link `layer=hazard&pin=` |
| **Artisan** | Done | Blue pins, trade/radius/areas/availability/price hint, 90d expiry + renew (owner), no payments, deep link `layer=artisan&pin=` |
| Housing / Centre / Urgent | Schema-ready only | Not in UI yet |

### Storage

- Pins live in **`localStorage`** key `locate-ng:community-pins` (per browser/device).
- Works on static GitHub Pages with **no backend**.
- **Multi-user sync** needs a free backend later (e.g. Supabase table, Firebase, or a tiny JSON API). Until then, neighbours only see pins created on their own device; share links open the map at the code/coords but the pin sheet only appears if that `pin` id exists locally.
- Photos on hazard form are preview-only (object URL); not persisted (quota / no upload).

### Deep links

- `https://locate-ng.com/#/c/NG-LA-…?layer=hazard&pin=<uuid>`
- `https://locate-ng.com/#/c/NG-LA-…?layer=artisan&pin=<uuid>`
- Hash query params; fits existing `#/c/…` router.
