# Worker API: Phase 1 Foundation

This Worker now includes:
- signed image delivery URLs for private R2 assets
- admin auth login/logout with HTTP-only cookie sessions
- public case-studies endpoint backed by Cloudflare D1

## Endpoints
- `GET /public/case-studies`
  - returns `isActive: true` case studies sorted by `sortOrder`
- `POST /public/contact`
  - accepts `{ name, email, company?, budget?, service?, message, website?, sourcePage? }`
  - validates required fields and honeypot spam field (`website`)
  - provider adapter: `log` (structured log only) or `resend` ([Resend](https://resend.com/docs) API)
  - returns `503 email_provider_not_configured` when `CONTACT_EMAIL_PROVIDER` is unset
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
   - `cd worker-api && npx wrangler dev` (default URL is usually `http://127.0.0.1:8787`)

### Contact form + Next.js (`npm run dev`)

The site posts to same-origin `/api/worker/*`, which Next proxies using **`WORKER_API_BASE_URL`** (or `NEXT_PUBLIC_API_BASE_URL`) from **`.env.local`** — not from `worker-api/.dev.vars`.

To exercise Resend or `CONTACT_EMAIL_PROVIDER` from `.dev.vars`, run **both**:

1. `cd worker-api && npx wrangler dev`
2. In `.env.local`, set `WORKER_API_BASE_URL` to the URL Wrangler prints (e.g. `http://127.0.0.1:8787`), then `npm run dev`.

Without that, the proxy hits your **deployed** Worker, which will return “not configured” until you set `CONTACT_EMAIL_PROVIDER` and secrets there too.

## Production Hardening
- CORS allowlist:
  - set Worker secret `CORS_ALLOWLIST` as comma-separated origins
  - example: `https://your-vercel-domain.vercel.app,https://juchheim.dev`
- Contact form delivery adapter:
  - set `CONTACT_EMAIL_PROVIDER` to `log` or `resend`
  - set secret `RESEND_API_KEY` (replace `re_xxxxxxxxx` in the curl example with your real key). Same variable name in `worker-api/.dev.vars` for local dev.
  - optional: `CONTACT_EMAIL_TO` (defaults to `juchheim@gmail.com`)
  - optional: `CONTACT_EMAIL_FROM` — must be allowed by Resend (verify a domain or use `onboarding@resend.dev` for limited testing; see [Resend docs](https://resend.com/docs))

### Resend smoke test (curl)

Replace `re_xxxxxxxxx` with your real API key from the Resend dashboard:

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_xxxxxxxxx' \
  -H 'Content-Type: application/json' \
  -d $'{
    "from": "onboarding@resend.dev",
    "to": "juchheim@gmail.com",
    "subject": "Hello World",
    "html": "<p>Congrats on sending your <strong>first email</strong>!</p>"
  }'
```

The Worker uses the same `POST https://api.resend.com/emails` endpoint and bearer auth; set `CONTACT_EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and a valid `CONTACT_EMAIL_FROM`.

- Basic auth rate limit:
  - login endpoint rate-limits invalid attempts per client IP
- Structured logs:
  - JSON logs emitted for each request (`http.request.complete`) and failures (`http.request.error`)

## Backup / Export
- Run remote D1 export:
  - `./scripts/backup-d1.sh`
- Optional custom DB name:
  - `./scripts/backup-d1.sh jwd-admin-db`

## Static Content Seed (Phase 2)
- Generate SQL from current template defaults + `data-content-key` markup:
  - `node ./scripts/seed-static-content.mjs`
- Apply locally:
  - `./scripts/seed-static-content.sh jwd-admin-db local`
- Apply remotely:
  - `./scripts/seed-static-content.sh jwd-admin-db remote`

This seed targets the `static_content` table introduced in `migrations/0002_static_content.sql`.

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
