# Worker API: Signed R2 Delivery URLs

This Worker implements signed image delivery URLs for private R2 assets.

## Endpoints
- `POST /public/assets/sign-read`
  - body: `{ "r2Key": "case-studies/flowboard/hero.jpg", "ttlSeconds": 300 }`
  - returns: `{ "signedUrl": "...", "expiresAt": "..." }`
- `GET /public/assets/:key?exp=<unix>&sig=<hmac>`
  - validates expiration and signature
  - streams private R2 asset

## Secrets and Setup
1. Install Wrangler:
   - `npm i -D wrangler`
2. Set signing secret:
   - `npx wrangler secret put ASSET_SIGNING_SECRET`
3. Ensure `bucket_name` in `wrangler.jsonc` matches your real R2 bucket.
4. Run locally:
   - `npx wrangler dev`

## Frontend Usage Pattern
1. Portfolio API returns each image `r2Key`.
2. Frontend requests signed reads for keys through `POST /public/assets/sign-read`.
3. Frontend renders returned `signedUrl`.
4. If image fetch returns `401`, request a new signed URL and retry.
