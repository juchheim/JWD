# Architecture (MVP)

## Components
- `Vercel Frontend`:
  - Public site routes.
  - `/admin` login + case study editor UI.
- `Cloudflare Worker API`:
  - Auth check for admin endpoints.
  - CRUD for `caseStudies` and `categories`.
  - Signed upload URLs for R2.
- `Cloudflare D1`:
  - Metadata and structured content.
- `Cloudflare R2`:
  - Case-study images.

## Request Flow
- Public portfolio page:
  - Browser -> Worker `GET /public/case-studies` -> D1.
- Admin list/edit:
  - Browser -> Worker `/admin/*` endpoints with auth header/cookie -> D1.
- Image upload:
  - Browser -> Worker `POST /admin/uploads/sign` -> signed URL.
  - Browser -> R2 direct upload.
  - Browser -> Worker `POST /admin/assets/confirm` (save metadata in D1).

## D1 Tables

### `categories`
- `id`
- `slug` (unique)
- `name` (unique)
- `sort_order`
- `created_at`
- `updated_at`

### `case_studies`
- `id`
- `slug` (unique)
- `title`
- `short_description`
- `tags_json` (stringified JSON array)
- `accent_color`
- `background_color`
- `sort_order`
- `is_active` (`0/1`)
- `created_at`
- `updated_at`

### `case_study_categories`
- `case_study_id`
- `category_id`

### `case_study_images`
- `id`
- `case_study_id`
- `r2_key`
- `alt`
- `sort_order`

### `timeline_steps`
- `id`
- `case_study_id`
- `name`
- `duration_weeks` (int >= 1)
- `summary`
- `sort_order`

## Auth (MVP)
- Single shared password in Worker secret: `ADMIN_SHARED_PASSWORD`.
- Login endpoint validates password and sets a signed short-lived HTTP-only cookie.
- Admin endpoints require that secure cookie.
- Add simple rate limiting to login route.

## Signed Delivery URLs
- Keep R2 bucket private (no public listing/read).
- Public portfolio endpoint returns short-lived signed URLs for image reads.
- Signed URLs can be generated on each response or cached briefly server-side.
- Include `expiresAt` so frontend can refresh stale URLs gracefully.

## Deployment Notes
- Frontend stays on Vercel.
- Worker deployed independently with Wrangler.
- Vercel needs `WORKER_API_BASE_URL` or `NEXT_PUBLIC_API_BASE_URL` pointing at the Worker so `/api/worker/*` can proxy; the static marketing bundle reads `apiBaseUrl` `/api/worker` from `site-config.js` (same-origin).
- Keep Worker secrets with `wrangler secret put`.
