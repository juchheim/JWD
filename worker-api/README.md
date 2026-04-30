# Worker API: Phase 1 Foundation

This Worker now includes:
- signed image delivery URLs for private R2 assets
- admin auth login/logout with HTTP-only cookie sessions
- public case-studies endpoint backed by Cloudflare D1

## Endpoints
- `GET /public/case-studies`
  - returns `isActive: true` case studies sorted by `sortOrder`
- `GET /admin/case-studies`
  - requires admin session cookie
  - returns all case studies (`isActive` true/false)
- `GET /admin/categories`
  - requires admin session cookie
  - returns categories sorted by `sortOrder`
- `POST /admin/case-studies`
  - requires admin session cookie
  - validates multi-category IDs + timeline steps + color fields
- `POST /admin/categories`
  - requires admin session cookie
  - validates name/slug uniqueness
- `PUT /admin/case-studies/:id`
  - requires admin session cookie
  - replaces category/timeline/image relations with validated payload
- `DELETE /admin/case-studies/:id`
  - requires admin session cookie
  - hard deletes a case study (related rows removed by foreign key cascades)
- `POST /admin/auth/login`
  - body: `{ "password": "..." }`
  - returns `ok` and sets `admin_session` HTTP-only cookie
- `POST /admin/auth/logout`
  - requires valid `admin_session` cookie
  - clears cookie
- `POST /admin/uploads/sign`
  - requires admin session cookie
  - returns one-time signed upload URL and target `r2Key`
- `PUT /admin/uploads/:key?exp&sig`
  - verifies signed upload URL and writes binary payload to R2
- `POST /admin/assets/confirm`
  - requires admin session cookie
  - verifies uploaded object exists in R2 and returns normalized image metadata
- `POST /public/assets/sign-read`
  - body: `{ "r2Key": "case-studies/flowboard/hero.jpg", "ttlSeconds": 300 }`
  - returns: `{ "signedUrl": "...", "expiresAt": "..." }`
- `GET /public/assets/:key?exp=<unix>&sig=<hmac>`
  - validates expiration and signature
  - streams private R2 asset

## Secrets and Setup
1. Install Wrangler:
   - `npm i -D wrangler`
2. Set secrets:
   - `npx wrangler secret put ASSET_SIGNING_SECRET`
   - `npx wrangler secret put ADMIN_SHARED_PASSWORD`
   - `npx wrangler secret put ADMIN_SESSION_SECRET` (recommended; falls back to signing secret if omitted)
3. Create D1 database:
   - `npx wrangler d1 create jwd-admin-db`
   - copy `database_id` into `wrangler.jsonc` under `d1_databases[0].database_id`
4. Apply migrations:
   - `npx wrangler d1 migrations apply jwd-admin-db --local`
   - `npx wrangler d1 migrations apply jwd-admin-db --remote`
5. Ensure `bucket_name` in `wrangler.jsonc` matches your real R2 bucket.
6. Run locally:
   - `npx wrangler dev`

## Production Hardening
- CORS allowlist:
  - set Worker secret `CORS_ALLOWLIST` as comma-separated origins
  - example: `https://your-vercel-domain.vercel.app,https://juchheim.dev`
- Basic auth rate limit:
  - login endpoint rate-limits invalid attempts per client IP
- Structured logs:
  - JSON logs emitted for each request (`http.request.complete`) and failures (`http.request.error`)

## Backup / Export
- Run remote D1 export:
  - `./scripts/backup-d1.sh`
- Optional custom DB name:
  - `./scripts/backup-d1.sh jwd-admin-db`

## D1 Data Model
- `case_studies`
- `categories`
- `case_study_categories` (multi-category join table)
- `timeline_steps`
- `case_study_images`

See migration file: `worker-api/migrations/0001_init.sql`.

## Frontend Usage Pattern
1. Portfolio API returns each image `r2Key`.
2. Frontend requests signed reads for keys through `POST /public/assets/sign-read`.
3. Frontend renders returned `signedUrl`.
4. If image fetch returns `401`, request a new signed URL and retry.
