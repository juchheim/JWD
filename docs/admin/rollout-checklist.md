# Rollout Checklist (MVP)

## Phase 0: Foundation
- [ ] Decide frontend baseline (`Next.js` + TypeScript recommended).
- [ ] Create Worker project for API.
- [ ] Set up MongoDB Atlas database and user.
- [ ] Create R2 bucket for case-study assets.

## Phase 1: Data + API
- [ ] Implement Mongo collections (`caseStudies`, `categories`).
- [ ] Implement public portfolio endpoint.
- [ ] Implement admin auth login/logout with HTTP-only cookie sessions.
- [ ] Implement admin CRUD endpoints.
- [ ] Add request validation for timeline, colors, and multi-category assignment.

## Phase 2: Asset Uploads
- [ ] Implement signed R2 upload endpoint.
- [ ] Implement upload confirm endpoint.
- [ ] Implement signed read URL generation for image delivery.
- [ ] Store image metadata in Mongo.
- [ ] Add image ordering controls.

## Phase 3: Admin UI
- [ ] Build `/admin/login`.
- [ ] Build `/admin/case-studies` list.
- [ ] Build create/edit form with timeline step repeater.
- [ ] Build category manager view.
- [ ] Add optimistic save/refresh behavior.

## Phase 4: Public Integration
- [ ] Replace hardcoded `projects` with API data fetch.
- [ ] Map DB model to current card/modal UI.
- [ ] Render real uploaded images in modal carousel.
- [ ] Keep timeline segmented proportional by `durationWeeks`.

## Phase 5: Production Hardening
- [ ] Add basic rate limit on auth endpoint.
- [ ] Add CORS allowlist for frontend domain.
- [ ] Add structured logging in Worker.
- [ ] Add backup/export script for Mongo data.

## Acceptance Criteria
- [ ] You can log in to `/admin` with shared password.
- [ ] You can add/edit/delete categories.
- [ ] You can add/edit/delete case studies with 1..N categories.
- [ ] You can add 1..N timeline steps with week durations.
- [ ] You can upload and reorder multiple case-study images.
- [ ] Public images are delivered through short-lived signed URLs.
- [ ] Public portfolio reflects edits immediately.
