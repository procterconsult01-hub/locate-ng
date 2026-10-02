# LocateNG custom domain — deploy status

**Goal:** https://locate-ng.com/ (and www) on GitHub Pages  
**Repo:** procterconsult01-hub/locate-ng  
**Updated:** 2026-10-01 ~19:40 CT

## Deployed (2026-10-01 CT)

| Item | Status |
|------|--------|
| `main` push | Done — `ce172dc` (Hazard + Artisan + guide) |
| `gh-pages` push | Done — `2ae86d9` (CNAME `locate-ng.com` kept) |
| Live https://locate-ng.com/ | HTTP 200; new assets `index-C_Gt3noT.js` |
| Guide `#/guide` | SPA shell loads; client hash route reachable |
| `.github/workflows` | **Not** pushed (token has `repo` only, no `workflow`) |

Auth: `GH_TOKEN` worked for git push / Pages (`repo` scope).

## Done locally (ready to push)

| Item | Status |
|------|--------|
| `vite.config.ts` `base: '/'` | Done (commit `08eb8d8` on local `main`) |
| `public/CNAME` → `locate-ng.com` | Done |
| `npm run build` with apex asset paths (`/assets/...`) | Done |
| `dist/` includes `CNAME`, `.nojekyll`, `404.html` | Done |
| Staged Pages tree | `/tmp/locate-ng-pages-custom` (orphan `gh-pages` commit) |
| README live URL | Updated to locate-ng.com |

Local `main` is **1 commit ahead** of `origin/main` (`08eb8d8`).

## Auth blockers (cannot finish remote Pages setup from this box)

| Path | Result |
|------|--------|
| `GH_TOKEN` env | **Invalid** (`gh auth status` / git push 401) |
| `user-GitHub-xai` MCP | Authenticated as `procterconsult01-hub` but **read-only** (403 on `create_or_update_file` / `push_files`) |
| `cursor-github` MCP | `needsAuth` |
| Pages API (`PUT .../pages` cname / https_enforced) | Blocked — no write token |

## Commands to finish (needs write PAT: `repo` + prefer `workflow`)

```bash
# 1) Push source (base /, CNAME in public/)
cd /workspace/locate-ng
git push origin main

# 2) Force-publish rebuilt site to gh-pages
cd /tmp/locate-ng-pages-custom
git push -f origin HEAD:gh-pages

# 3) Set custom domain + HTTPS (after DNS propagates enough for cert)
gh api -X PUT repos/procterconsult01-hub/locate-ng/pages \
  -f cname='locate-ng.com' \
  -F https_enforced=true
```

Or in GitHub UI: **Settings → Pages → Custom domain** = `locate-ng.com` → Save → later check **Enforce HTTPS**.

Note: Saving custom domain in the UI while publishing from `gh-pages` will write/refresh the root `CNAME` on that branch.

## Namecheap Advanced DNS (exact records)

Domain list → **locate-ng.com** → **Advanced DNS**. Remove conflicting default URL Redirect / Parking / leftover A/CNAME for `@` and `www` first.

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | `@` | `185.199.108.153` | Automatic (or 30 min) |
| A Record | `@` | `185.199.109.153` | Automatic |
| A Record | `@` | `185.199.110.153` | Automatic |
| A Record | `@` | `185.199.111.153` | Automatic |
| AAAA Record | `@` | `2606:50c0:8000::153` | Automatic (optional IPv6) |
| AAAA Record | `@` | `2606:50c0:8001::153` | Automatic |
| AAAA Record | `@` | `2606:50c0:8002::153` | Automatic |
| AAAA Record | `@` | `2606:50c0:8003::153` | Automatic |
| CNAME Record | `www` | `procterconsult01-hub.github.io.` | Automatic |

Do **not** point `www` at `procterconsult01-hub.github.io/locate-ng` — host only, no repo path. Trailing dot is optional in Namecheap.

## Verification

```bash
dig locate-ng.com +noall +answer -t A
dig www.locate-ng.com +nostats +nocomments +nocmd
curl -sI https://locate-ng.com/ | head -15
curl -sI https://www.locate-ng.com/ | head -15
```

Expect A records = the four GitHub IPs; www CNAME → `procterconsult01-hub.github.io`. HTTPS may take up to ~1 hour after DNS is correct and the domain is saved in Pages settings.

## Live URL plan

1. Push `main` + `gh-pages` as above (site assets at `/` with CNAME).
2. Add Namecheap records.
3. Set Pages custom domain to `locate-ng.com`, then Enforce HTTPS when available.
4. Primary: **https://locate-ng.com/** — www should redirect to apex when both DNS sides are correct.
5. Old project URL `https://procterconsult01-hub.github.io/locate-ng/` will **break** after base `/` deploy (assets no longer under `/locate-ng/`); that is expected.

---

## Community layers (Hazard + Artisan) — 2026-10-01 CT

Implemented locally in `src/` (see `docs/map-layers-spec.md` implementation status).

- **Storage:** localStorage only — not shared across users until a backend is added.
- **Deploy:** push `main` (and rebuild `gh-pages`) when write credentials are available; same blockers as above (`GH_TOKEN` invalid / MCP read-only).
