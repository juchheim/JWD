# Admin CMS MVP Plan

## Goal
Make the portfolio editable with the smallest reliable stack:
- Frontend hosted on Vercel.
- Admin/content API on Cloudflare Workers.
- Data in Cloudflare D1.
- Images in Cloudflare R2.
- Single shared password for admin access.

This MVP is portfolio-only, single-admin, and edits are live immediately.

## Current UI-Derived Data Model
Based on the existing `portfolio-component.jsx`, the UI currently expects:
- `id`
- `title`
- `category` (string today)
- `tagline` (short description)
- `accent`
- `bg`
- `timeline[]` items with:
  - `phase`
  - `duration` (string like `2 wk`)
  - `description`

The modal has a visual carousel currently mocked via SVG screens. For CMS, this becomes uploaded images.

## MVP Scope
- CRUD case studies.
- CRUD categories.
- Multi-category assignment per case study.
- Upload/select multiple case-study images from R2.
- Reorder timeline steps and case studies.
- Publish immediately (no drafts).
- Basic password-protected admin area.

Out of scope for MVP:
- Multi-user roles.
- Revision history.
- Scheduled publishing.
- Rich text editor beyond plain textarea.

## Recommended Frontend Direction
Use `Next.js` + TypeScript for long-term maintainability and easy Vercel deployment.

Why:
- Best fit with your React/TypeScript preference.
- Easy protected admin route implementation.
- Straightforward fetch from Cloudflare Worker APIs.

## Timeline Structure Recommendation
Use a strict but flexible timeline schema:
- Variable number of steps (minimum 1).
- Each step includes:
  - `name` (required, short label)
  - `durationWeeks` (required positive integer)
  - `summary` (required body text)
  - `sortOrder` (integer for stable ordering)

UI mapping:
- Segment width = `durationWeeks`.
- Label = `name`.
- Display duration as `${durationWeeks} wk` or `${durationWeeks} wks`.
- Body panel = `summary`.

This preserves the current proportional timeline behavior while avoiding fragile free-form duration strings.

## Proposed MVP Delivery Phases
1. Define schema + API contract.
2. Build Worker API + auth middleware.
3. Add R2 image upload flow.
4. Build admin UI pages and forms.
5. Wire public portfolio page to API.
6. Add seed script and smoke tests.

## Confirmed Decisions
- Categories: multi-select per case study in MVP.
- Admin auth transport: HTTP-only cookie.
- Visibility model: keep `isActive` soft-hide toggle.
- Asset delivery: signed image URLs from day one.
