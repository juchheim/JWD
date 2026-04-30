# Architecture (MVP)

## Components
- `Vercel Frontend`:
  - Public site routes.
  - `/admin` login + case study editor UI.
- `Cloudflare Worker API`:
  - Auth check for admin endpoints.
  - CRUD for `caseStudies` and `categories`.
  - Signed upload URLs for R2.
- `MongoDB Atlas`:
  - Metadata and structured content.
- `Cloudflare R2`:
  - Case-study images.

## Request Flow
- Public portfolio page:
  - Browser -> Worker `GET /public/case-studies` -> MongoDB.
- Admin list/edit:
  - Browser -> Worker `/admin/*` endpoints with auth header/cookie -> MongoDB.
- Image upload:
  - Browser -> Worker `POST /admin/uploads/sign` -> signed URL.
  - Browser -> R2 direct upload.
  - Browser -> Worker `POST /admin/assets/confirm` (save metadata in MongoDB).

## Collections

### `categories`
- `_id`
- `slug` (unique)
- `name` (unique)
- `sortOrder` (number)
- `createdAt`
- `updatedAt`

### `caseStudies`
- `_id`
- `slug` (unique)
- `title`
- `shortDescription` (maps current `tagline`)
- `categoryIds` (array of refs to `categories._id`)
- `tags` (string[])
- `accentColor` (hex)
- `backgroundColor` (hex)
- `images` (array of image objects)
- `timelineSteps` (array)
- `sortOrder` (number)
- `isActive` (boolean; if false hidden from public)
- `createdAt`
- `updatedAt`

### `images[]` object
- `id`
- `r2Key`
- `url`
- `alt`
- `sortOrder`

### `timelineSteps[]` object
- `id`
- `name`
- `durationWeeks` (int >= 1)
- `summary`
- `sortOrder`

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
- Keep API base URL in Vercel env: `NEXT_PUBLIC_API_BASE_URL`.
- Keep Worker secrets with `wrangler secret put`.
