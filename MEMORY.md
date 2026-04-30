# Project Memory

## Entities
- `Website`: Juchheim Web Development marketing site.
- `PortfolioModule`: React/Babel portfolio UI in `portfolio-component.jsx`.
- `CaseStudy`: Portfolio item with timeline phases and visual carousel.
- `AdminMVP`: Planned CMS surface for managing portfolio content only.
- `WorkerAPI`: Cloudflare Worker scaffold for signed R2 asset delivery.
- `CursorRule`: Always-on project rule for best practices and secret safety.

## Relationships
- `Website` includes `PortfolioModule` on `portfolio.html`.
- `PortfolioModule` renders many `CaseStudy` objects.
- `AdminMVP` will manage `CaseStudy` and `Category` records through Cloudflare Worker APIs.
- `CaseStudy` now relates to many `Category` entities (multi-category support).
- `WorkerAPI` signs and serves `CaseStudy` image assets from private R2.
- `CursorRule` governs agent behavior across all project tasks.

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
