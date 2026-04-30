# Production Deploy Checklist (Vercel + Worker + D1 + R2)

Use this checklist in order. It is intentionally one page and execution-focused.

## 0) Readiness Snapshot

- [x] Next.js app builds successfully (`npm run build`)
- [x] Worker routes implemented (auth, CRUD, signed upload/read, confirm)
- [x] D1 schema migrated and bound in `wrangler.jsonc`
- [x] R2 bucket bound in `wrangler.jsonc`
- [x] Hardening implemented (CORS allowlist, login rate limit, structured logs, backup script)

## 1) Deploy Worker (Cloudflare)

- [ ] Confirm Wrangler auth/account:
  - `npx wrangler whoami`
- [ ] Ensure Worker config is correct:
  - `worker-api/wrangler.jsonc`
  - `d1_databases[0].database_id` is your real DB
  - `r2_buckets[0].bucket_name` is your real bucket
- [ ] Set Worker secrets (production):
  - `npx wrangler secret put ASSET_SIGNING_SECRET`
  - `npx wrangler secret put ADMIN_SHARED_PASSWORD`
  - `npx wrangler secret put ADMIN_SESSION_SECRET`
  - `npx wrangler secret put CORS_ALLOWLIST`
- [ ] Apply D1 migrations to remote:
  - `cd worker-api`
  - `npx wrangler d1 migrations apply jwd-admin-db --remote`
- [ ] Deploy Worker:
  - `npx wrangler deploy`
- [ ] Save deployed URL:
  - `https://<worker-name>.<account-subdomain>.workers.dev`

## 2) Configure Vercel Project

- [ ] Import repo in Vercel
- [ ] Framework: `Next.js` (auto-detected)
- [ ] Build command: default (`next build`)
- [ ] Output: default
- [ ] Set production env var:
  - `NEXT_PUBLIC_API_BASE_URL=https://<worker-url>`
- [ ] (Optional) set:
  - `NEXT_PUBLIC_SITE_URL=https://<your-domain>`
- [ ] Deploy Vercel production build

## 3) Post-Deploy Smoke Tests

### Public app
- [ ] Home page loads on Vercel domain
- [ ] Portfolio cards render from live API
- [ ] Timeline segments appear proportional by `durationWeeks`
- [ ] Public case-study image loads through signed URL flow

### Admin app
- [ ] `/admin/login` loads
- [ ] Valid password logs in successfully
- [ ] `/admin/case-studies` list loads
- [ ] Create category works
- [ ] Create case study works
- [ ] Update case study works
- [ ] Upload image works (sign -> PUT -> confirm)
- [ ] Reorder images works

### API-level quick checks
- [ ] `GET /public/case-studies` returns data
- [ ] `POST /admin/auth/login` invalid password eventually returns `429` after repeated failures
- [ ] `OPTIONS` preflight includes CORS headers for allowed origin

## 4) Security & Operations

- [ ] R2 remains private (no public bucket listing/read)
- [ ] `CORS_ALLOWLIST` contains only production/admin origins
- [ ] Rotate `ADMIN_SHARED_PASSWORD` if shared during testing
- [ ] Rotate `ASSET_SIGNING_SECRET` if needed
- [ ] Verify Worker logs are structured JSON in tail/observability
- [ ] Run first backup:
  - `cd worker-api && ./scripts/backup-d1.sh`
- [ ] Store backup artifact securely

## 5) Rollback Plan

- [ ] Vercel: keep previous deployment ready for instant rollback
- [ ] Worker: note current `Version ID` from deploy output
- [ ] D1: take backup before major schema/data changes

---

## Useful Commands

- Worker deploy: `cd worker-api && npx wrangler deploy`
- Worker logs: `cd worker-api && npx wrangler tail`
- D1 backup: `cd worker-api && ./scripts/backup-d1.sh`
- Local app run: `npm run dev`
