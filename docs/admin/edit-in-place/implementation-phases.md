# Implementation Phases

## Delivery Goal
Ship admin-only inline editing in small, reversible steps so the public site stays stable throughout rollout.

## Phase 1: Registry And Template Markup
Deliverables:
- define the static content registry
- assign stable `contentKey` values for every approved field
- add `data-content-key` hooks to the public HTML templates
- confirm shared vs page-specific ownership
- define `about.team.members` as a repeatable structured field in MVP

Success criteria:
- every editable field in `content-inventory.md` has a registry entry
- duplicated nav and footer text uses shared keys
- `portfolio-component.jsx` remains untouched by this feature

Notes:
- keep values in the templates during this phase
- use template defaults as fallback copy for the initial rollout

## Phase 2: D1 Schema And Seed Data
Deliverables:
- add a D1 migration for `static_content`
- seed the table with the current hardcoded copy
- verify local and remote database state after seeding

Success criteria:
- every approved key has a seeded row
- no source HTML rewriting is required to establish the initial content set
- remote backup is taken before migration and seed on production data

Recommended checks:
- query row count by `page_id`
- spot-check shared keys
- confirm structured fields deserialize cleanly

## Phase 3: Worker API
Deliverables:
- add `GET /public/static-content`
- add `GET /admin/auth/session`
- add `GET /admin/static-content`
- add `PUT /admin/static-content/:contentKey`
- enforce registry-backed validation

Success criteria:
- public reads return shared plus page-specific values
- invalid keys and invalid payloads fail cleanly
- authenticated admin writes succeed through the existing session model

Recommended checks:
- unauthenticated admin requests return `401`
- updating one key does not affect unrelated keys
- structured content types round-trip correctly

## Phase 4: Public Render Integration
Deliverables:
- replace raw `serveSiteFile()` response flow with resolved content rendering
- map route paths to page IDs
- fetch Worker content server-side
- replace template values before returning HTML

Success criteria:
- public pages render saved copy without client-side hydration
- missing content falls back to template defaults
- render failure does not blank the page

Recommended checks:
- all five public pages still load if the Worker is temporarily unreachable
- shared footer edits appear everywhere
- a page-specific edit only changes one page

## Phase 5: Admin Overlay
Deliverables:
- add session-aware `Edit page` toggle on public pages
- mount overlay only for authenticated admins
- render edit affordances beside approved fields
- support single-field save with optimistic DOM update
- support team-member list actions on `/about.html`: add, remove, reorder, and edit member fields

Success criteria:
- a logged-in admin can click, edit, save, and see immediate change
- visitors never see admin controls
- one field failure does not break the rest of the page

Recommended UX rules:
- one open editor at a time
- clear `Save`, `Cancel`, and loading states
- concise inline errors
- no `contenteditable`

## Phase 6: Hardening And Rollout
Deliverables:
- manual QA on all five pages
- regression pass on nav, footer, and contact form behavior
- docs for future phase covering SEO metadata
- operational notes for backups and rollback

Success criteria:
- admin save flow works on desktop and mobile viewport widths
- shared content remains in sync across pages
- no regression to contact-form submission, portfolio rendering, or existing admin case-study workflows

## Testing Checklist

### Functional
- log in via the existing admin UI
- load each public page and confirm the edit toggle appears
- edit a heading, paragraph, CTA label, list field, and FAQ item
- add a team member on `/about.html`, save, refresh, and confirm persistence
- remove (or soft-hide) a team member on `/about.html`, save, refresh, and confirm persistence
- refresh the page and confirm persistence
- open a second page that shares footer content and confirm the shared update appears there too

### Negative
- confirm visitors without a session do not see the overlay
- submit invalid values and verify validation errors
- simulate a failed save and verify the page does not lose current content
- confirm unknown keys cannot be written

### Regression
- contact form still submits successfully
- portfolio case studies still load from the existing API
- mobile nav still opens and closes correctly
- obfuscated email links still build a correct `mailto:` target

## Rollback Strategy
- take a D1 backup before migration and again before major seed updates
- keep template defaults in the source HTML so the site can still render if static-content reads are bypassed
- gate the overlay behind a simple feature flag if the first rollout needs a quick disable

Recommended rollout order:
1. deploy schema and seed
2. deploy public render path with overlay disabled
3. verify public pages
4. enable overlay for admin sessions
5. train on editing flow after smoke test passes

## Future Phase
After the MVP is stable, the next logical phase is:
- editable SEO metadata
- richer contact-form configuration
- a fallback `/admin/content` list view for bulk edits
- lightweight revision history if operationally necessary
