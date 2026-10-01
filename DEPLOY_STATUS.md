# LocateNG deploy status (guide page)

## Done locally
- In-app How-to guide at hash route `#/guide` (`GuidePage.tsx`)
- Header link **How to use** → `#/guide`
- `shareUrl` uses Vite `import.meta.env.BASE_URL` so shares stay under `/locate-ng/`
- `npm run build` succeeds; `dist/` + `/tmp/locate-ng-pages-new` ready for `gh-pages`
- Commit on `main`: `bdbbafb` Add shareable How-to guide at #/guide (ahead of origin by 1)

## Live site (pre-push)
- https://procterconsult01-hub.github.io/locate-ng/ → HTTP 200 (old build, no guide yet)
- Intended guide URL after deploy: https://procterconsult01-hub.github.io/locate-ng/#/guide

## Blockers (push)
- `git push` fails: no GitHub credentials (`could not read Username`)
- Prior `x-access-token` in `/tmp/locate-ng-pages` remote → **401 expired/revoked** (scrubbed)
- `user-GitHub-xai` MCP: read-only (403 on `push_files` / tree create)
- `cursor-github` MCP: `needsAuth`
- `gh` CLI: not logged in; no `GH_TOKEN` in env

## To finish deploy (needs write PAT or `gh auth login`)
```bash
cd /workspace/locate-ng && git push origin main
cd /tmp/locate-ng-pages-new && git push -f origin gh-pages
```
Or set Pages to GitHub Actions (workflow already committed on local main) after pushing `main`.
