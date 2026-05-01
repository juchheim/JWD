# Admin Inline Editing Overview

## Goal
Make all visible static copy editable in place for a logged-in admin without turning the site into a separate CMS experience.

The desired interaction is:
- Admin logs in through the existing `/admin` flow.
- Admin visits any public page.
- Small edit buttons appear beside approved static copy blocks.
- Admin clicks `Edit`, updates the text, clicks `Save`, and sees the page update immediately.

This planning set assumes the current architecture stays intact:
- Public pages continue to originate from the existing static HTML templates.
- Admin auth and writes continue to flow through the existing Worker-backed admin API.
- Dynamic portfolio case-study content remains on its current data path and is not part of this feature.

## Doc Map
- `overview.md`: product scope and editing experience
- `content-inventory.md`: full editable surface across the five public pages
- `architecture.md`: render path, registry model, and admin overlay design
- `api-and-schema.md`: D1 table and Worker endpoint proposal
- `implementation-phases.md`: rollout order, testing, and rollback guidance

## MVP Scope
In scope:
- Visible static text on `index.html`, `about.html`, `services.html`, `contact.html`, and the non-dynamic shell of `portfolio.html`
- Headings, paragraphs, CTA labels, navigation labels, footer text, FAQ copy, service-card copy, team bios, form labels/placeholders, select options, and similar hardcoded text
- Repeatable team-member list editing on `/about.html` (add member, remove member, reorder, edit member fields)
- Shared copy managed once and reused across pages when the same message appears in multiple places
- Immediate publishing after save

Out of scope:
- Portfolio case studies rendered by `portfolio-component.jsx`
- Layout editing
- Styling or theme editing
- Image uploads or image swaps
- Multi-user roles, approvals, drafts, or revision history
- SEO metadata in the MVP

## Product Principles
- Keep the editing surface on the live page, not in a form-heavy back office.
- Use explicit, pre-approved editable regions instead of making arbitrary DOM text editable.
- Store content in D1, not by rewriting source HTML files.
- Render edited copy server-side so public visitors and crawlers get the final text immediately.
- Keep field types simple: single-line text, multiline text, string lists, and a few small structured values where needed.
- For repeated sections (team members, FAQ, etc.), use structured arrays with simple row-level add/remove controls.

## Recommended User Flow
1. Admin signs in through the existing login page.
2. Admin opens a public page such as `/about.html`.
3. The page detects the active admin session and shows an `Edit page` toggle.
4. When edit mode is on, approved copy blocks show a subtle edit affordance.
5. Clicking an affordance opens a compact editor near the field:
   - short labels use a text input
   - body copy uses a textarea
   - lists and select options use a simple repeater UI
   - team members use a repeatable row editor with `Add member` and `Delete member`
6. Saving sends the update through the existing same-origin `/api/worker/*` proxy.
7. The DOM updates optimistically and the saved value becomes the new public copy immediately.

## Why This Direction
- The site already serves raw template files through `app/route.ts`, `app/[...slug]/route.ts`, and `lib/siteFiles.ts`, so a small content-replacement layer is a better fit than moving the marketing site into a new page-builder model.
- The Worker API already owns authenticated admin writes, so static copy can follow the same operational model as the case-study admin.
- The public portfolio shell can be edited this way while still excluding the dynamic case-study grid itself.

## Existing Building Blocks
- Public file serving: `app/route.ts`, `app/[...slug]/route.ts`, `lib/siteFiles.ts`
- Admin auth and proxy pattern: `app/admin/login/page.tsx`, `lib/api.ts`, `app/api/worker/[...path]/route.ts`
- Worker-backed admin API foundation: `worker-api/src/index.ts`
- Existing lightweight edit-mode precedent: `index.html` and `tweaks-panel.jsx`

The existing tweak panel should be treated as UX inspiration only. The new inline-copy feature should not persist changes by rewriting `/*EDITMODE-BEGIN*/` blocks in source files.
