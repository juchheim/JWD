# Project Memory

## Entities
- `Website`: Juchheim Web Development marketing site.
- `PortfolioModule`: React/Babel portfolio UI in `portfolio-component.jsx`.
- `CaseStudy`: Portfolio item with timeline phases and visual carousel.
- `AdminMVP`: Planned CMS surface for managing portfolio content only.
- `WorkerAPI`: Cloudflare Worker scaffold for signed R2 asset delivery.
- `CursorRule`: Always-on project rule for best practices and secret safety.
- `D1Schema`: SQLite schema for case studies, categories, timelines, images, and category joins.

## Relationships
- `Website` includes `PortfolioModule` on `portfolio.html`.
- `PortfolioModule` renders many `CaseStudy` objects.
- `AdminMVP` will manage `CaseStudy` and `Category` records through Cloudflare Worker APIs.
- `CaseStudy` now relates to many `Category` entities (multi-category support).
- `WorkerAPI` signs and serves `CaseStudy` image assets from private R2.
- `CursorRule` governs agent behavior across all project tasks.
- `WorkerAPI` now reads public case-study data from D1 via `env.DB`.
- `D1Schema` is applied through Wrangler migrations to local and remote environments.
- `WorkerAPI` now also exposes authenticated admin read endpoints for case studies and categories.
- `NextAdminUI`: Next.js + TypeScript admin shell with login and case-study list pages.

## Observations
- Current portfolio data is hardcoded in a `projects` array.
- Timeline UI supports variable number of phases and uses duration strings like `2 wk`.
- Current cards and modal rely on fields: `title`, `category`, `tagline`, `accent`, `bg`, and `timeline[]`.
- Planning docs for admin MVP now exist in `docs/admin/`.
- `.gitignore` now includes broad `.env*` coverage and common local artifacts.
- Decisions confirmed: HTTP-only cookie admin auth, signed read URLs for R2, and `isActive` soft-hide behavior.
- Added `worker-api/` with signed read URL issuance and verification endpoints.
- Added Phase 0 env scaffolding in `.env.local` and `worker-api/.dev.vars`.
- Added always-apply Cursor rule forbidding access to `.env.local` and `worker-api/.dev.vars`.
- Verified local Worker binding for R2 (`env.ASSETS`) and smoke-tested signed delivery.
- Fixed signed URL verifier edge case so malformed signatures return `401` instead of `500`.
- Verified remote R2 smoke flow (`--remote`): upload + sign-read + valid `200` / invalid `401` via preview endpoint.
- Updated `docs/admin/rollout-checklist.md` to mark Phase 0 complete and track signed URL verification/deploy status.
- Implemented Phase 1 foundation endpoints: `GET /public/case-studies`, `POST /admin/auth/login`, `POST /admin/auth/logout`.
- Added HTTP-only cookie session signing/verification and D1-backed public case-studies query logic.
- Created D1 database `jwd-admin-db`, bound it in `wrangler.jsonc`, and applied migrations locally/remotely.
- Added onboarding doc `docs/admin/d1-setup-guide.md` for first-time D1 usage.
- Seeded remote D1 with initial category/case-study/timeline/image rows for API validation.
- Verified deployed `GET /public/case-studies` returns seeded data and admin endpoints enforce auth.
- Implemented `POST /admin/case-studies` with validation for required fields, category existence, timeline structure, and color format.
- Implemented `POST /admin/categories`, `PUT /admin/case-studies/:id`, and `DELETE /admin/case-studies/:id` with auth guards and validation.
- Added Next.js app foundation (`app/`, `lib/`) and wired `/admin/login` + `/admin/case-studies` to Worker endpoints.
- Added create/edit case-study form UI with timeline repeater, image rows, and category management on `/admin/case-studies`.
- Added optimistic save/refresh behavior and inline validation feedback for admin case-study/category writes.
- Implemented Phase 2 upload flow: signed upload URL endpoint, upload PUT handler, asset confirm endpoint, and admin UI file upload wiring.
- Implemented Phase 4 public integration on `app/page.tsx` with live case-study API fetch, signed image rendering, and proportional timeline segments.
- Implemented Phase 5 hardening: CORS allowlist support, login rate limiting, structured JSON logging, and D1 backup export script.
