# API Spec (MVP)

## Conventions
- Base URL: `https://<worker-domain>`
- JSON request/response.
- Public endpoints: no auth.
- Admin endpoints: require signed HTTP-only session cookie from login.

## Public Endpoints

### `GET /public/case-studies`
Returns active case studies for portfolio display, ordered by `sortOrder`.

Response fields:
- `id`, `slug`, `title`, `shortDescription`, `category`, `tags`
- `accentColor`, `backgroundColor`
- `images[]`
- `timelineSteps[]`

## Admin Auth

### `POST /admin/auth/login`
Body:
- `password`

Success response:
- `ok: true`
- sets secure HTTP-only cookie (for example `admin_session`)
- optional `expiresAt`

### `POST /admin/auth/logout`
Clears the HTTP-only session cookie.

## Categories

### `GET /admin/categories`
List all categories.

### `POST /admin/categories`
Create category.

Body:
- `name`
- `slug` (optional; generated from name if omitted)
- `sortOrder` (optional)

### `PUT /admin/categories/:id`
Update category.

### `DELETE /admin/categories/:id`
Delete category if no case studies depend on it.

## Case Studies

### `GET /admin/case-studies`
List all case studies with admin metadata.

### `POST /admin/case-studies`
Create case study.

Body:
- `title`
- `slug` (optional)
- `shortDescription`
- `categoryIds` (string[], minimum length 1)
- `tags`
- `accentColor`
- `backgroundColor`
- `images`
- `timelineSteps`
- `sortOrder`
- `isActive`

Validation:
- `timelineSteps.length >= 1`
- `categoryIds.length >= 1`
- each step has `name`, `durationWeeks >= 1`, `summary`
- `images` may be empty initially

### `PUT /admin/case-studies/:id`
Update case study.

### `DELETE /admin/case-studies/:id`
Delete case study.

## Assets (R2)

### `POST /admin/uploads/sign`
Body:
- `filename`
- `contentType`

Response:
- `uploadUrl`
- `r2Key`
- `publicUrl` (if deterministic)

### `POST /admin/assets/confirm`
Body:
- `r2Key`
- `alt`

Response:
- image object to append into `caseStudies.images`.

### `POST /public/assets/sign-read`
Body:
- `r2Key`

Response:
- `signedUrl`
- `expiresAt`

## Error Shape
All errors return:
- `error.code`
- `error.message`
- optional `error.details`
