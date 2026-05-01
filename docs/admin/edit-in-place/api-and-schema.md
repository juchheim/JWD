# Inline Editing API And Schema

## Design Goal
Keep the data model simple enough to ship quickly while still supporting:
- shared copy
- page-specific copy
- a few structured field types
- strict validation against a code-defined registry

## Recommended Split Of Responsibilities

### Registry in code
Keep these concerns in code, not in D1:
- which keys are allowed
- which page each key belongs to
- how each key renders in the template
- what field type the overlay should show

This prevents D1 from becoming an unbounded key-value store.

### Values in D1
Keep these concerns in D1:
- the current saved value for each approved key
- scope and page lookup fields for quick queries
- timestamps for operational visibility

## Recommended D1 Table

### `static_content`
- `content_key` `TEXT PRIMARY KEY`
- `page_id` `TEXT NOT NULL`
- `scope` `TEXT NOT NULL`  
  Expected values: `shared`, `page`
- `field_type` `TEXT NOT NULL`  
  Expected values: `text`, `multiline_text`, `string_list`, `faq_items`, `team_members`, `email_parts`, `structured_list`
- `value_json` `TEXT NOT NULL`
- `created_at` `TEXT NOT NULL`
- `updated_at` `TEXT NOT NULL`

Suggested indexes:
- `INDEX idx_static_content_page_id ON static_content(page_id)`
- `INDEX idx_static_content_scope ON static_content(scope)`

Why one table is enough for MVP:
- keeps read and write paths straightforward
- supports plain strings and structured values through JSON
- avoids over-modeling content relationships before the editing surface is proven

## Value Shapes

### Plain text

```json
"Start a Project"
```

### Multiline text

```json
"We help small and midsize businesses and nonprofits..."
```

### String list

```json
[
  "Role-based access control",
  "Realtime features & WebSockets"
]
```

### FAQ items

```json
[
  {
    "question": "How do you price projects?",
    "answer": "We work on fixed-price contracts..."
  }
]
```

### Team members

```json
[
  {
    "id": "trip-juchheim",
    "initials": "TJ",
    "name": "Trip Juchheim",
    "role": "Founder · Lead Engineer",
    "bio": "Full-stack engineer with twenty-plus years building for the web.",
    "accentStyle": "teal",
    "sortOrder": 1,
    "isActive": true
  }
]
```

### Structured list
Use this for rows with a repeated label/value shape such as the technology grid.

```json
[
  { "category": "Frontend", "label": "Next.js" },
  { "category": "Frontend", "label": "React" }
]
```

### Email parts

```json
{
  "user": "juchheim",
  "domain": "gmail",
  "tld": "com",
  "displayText": "juchheim [at] gmail [dot] com"
}
```

## Public Endpoints

### `GET /public/static-content`
Purpose:
- return all content needed to render one page

Query:
- `pageId=home|about|services|contact|portfolio`

Response:

```json
{
  "pageId": "about",
  "content": {
    "global.nav.homeLabel": "Home",
    "about.hero.heading": "Independent practice, deep experience."
  }
}
```

Behavior:
- include all `scope = shared` rows
- include all `page_id = requested pageId` rows
- last write wins by `content_key`

This endpoint is intended for server-side rendering in Next.

## Admin Auth Endpoint

### `GET /admin/auth/session`
Purpose:
- allow public pages to detect whether the visitor is an authenticated admin

Success response:

```json
{ "ok": true }
```

Failure:
- `401 unauthorized`

## Admin Content Endpoints

### `GET /admin/static-content`
Purpose:
- fetch the editable payload for one page in the inline editor

Query:
- `pageId=home|about|services|contact|portfolio`

Response:

```json
{
  "pageId": "services",
  "content": {
    "services.hero.heading": {
      "fieldType": "multiline_text",
      "value": "Services built for serious products."
    }
  }
}
```

Note:
- it is acceptable for the admin response to include registry metadata such as `fieldType`
- do not include keys that are not in the registry

### `PUT /admin/static-content/:contentKey`
Purpose:
- update a single field from the inline editor

Body:

```json
{
  "value": "Start a Conversation"
}
```

Success response:

```json
{
  "ok": true,
  "entry": {
    "contentKey": "home.cta.button",
    "value": "Start a Conversation",
    "updatedAt": "2026-05-01T17:00:00.000Z"
  }
}
```

Validation:
- `contentKey` must exist in the registry
- payload shape must match the registered `fieldType`
- reject empty required values
- reject unknown object properties for structured types

### Optional: `PUT /admin/static-content`
Use only if batch-save becomes necessary later.

For MVP, single-key writes are simpler and line up with the requested inline editing flow.

## Validation Rules

### Global rules
- all values must match a known registry key
- no raw HTML input
- trim leading and trailing whitespace
- preserve meaningful internal spaces and line breaks
- reject values that exceed practical size limits

### Suggested size limits
- `text`: max 280 chars
- `multiline_text`: max 4000 chars
- list item strings: max 160 chars each
- FAQ answers: max 4000 chars

### Structured validation
- `string_list`: non-empty array of non-empty strings
- `faq_items`: non-empty ordered array of `{ question, answer }`
- `team_members`: ordered array of `{ id, initials, name, role, bio, sortOrder, isActive }` with optional `accentStyle`
- `structured_list`: each item must match the expected object shape for that key
- `email_parts`: `user`, `domain`, `tld`, and `displayText` all required

Team-member specific rules:
- `id` required and unique within the list
- `name`, `role`, and `bio` required for active members
- `initials` max 4 chars
- `sortOrder` integer >= 1
- if hard delete is used, removed members are omitted from the saved array; if soft hide is used, set `isActive=false`

### Rendering safety
- worker stores plain text JSON only
- Next renderer escapes values before inserting them into DOM nodes
- template markup remains the only source of HTML tags and wrappers

## Seed And Backfill Strategy
Seed the table from the current hardcoded copy before the UI ships.

Recommended process:
1. build the content registry
2. extract seed values from the current HTML files
3. insert initial rows with a migration or one-time seed script
4. let the renderer fall back to template defaults for any missing keys during rollout

Suggested seed artifact:
- `worker-api/scripts/seed-static-content.ts` or equivalent

## Error Shape
Follow the existing Worker API convention already used in `worker-api/src/index.ts`.

Recommended errors:
- `validation_error`
- `unknown_content_key`
- `unauthorized`
- `not_found`
- `internal_error`

Response shape:

```json
{
  "error": {
    "code": "validation_error",
    "message": "content value is invalid for field type multiline_text"
  }
}
```

## Migration Notes
- Do not alter the existing case-study tables for this feature.
- Add the new `static_content` table in a dedicated migration.
- Seed content after the table exists.
- Take a D1 backup before applying the migration on remote environments.
