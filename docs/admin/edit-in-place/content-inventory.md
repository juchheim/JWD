# Static Copy Inventory

## Inventory Rules
- This inventory covers visible static copy only.
- `portfolio-component.jsx` case-study content is explicitly excluded.
- SEO metadata is listed as a follow-up surface, not part of the MVP.
- Repeated copy should be modeled once under shared keys and reused wherever it appears.

## Shared Copy Families

### Global navigation
Use shared keys so desktop and mobile nav stay in sync.

Suggested key family:
- `global.nav.homeLabel`
- `global.nav.servicesLabel`
- `global.nav.portfolioLabel`
- `global.nav.aboutLabel`
- `global.nav.contactLabel`
- `global.nav.primaryCtaLabel`

Applies to:
- desktop nav links across all five public pages
- mobile overlay links across all five public pages

### Global footer
The footer copy is largely shared and should be managed centrally.

Suggested key family:
- `global.footer.tagline`
- `global.footer.pagesHeading`
- `global.footer.pages.home`
- `global.footer.pages.services`
- `global.footer.pages.portfolio`
- `global.footer.pages.about`
- `global.footer.pages.contact`
- `global.footer.servicesHeading`
- `global.footer.services.saas`
- `global.footer.services.cms`
- `global.footer.services.performance`
- `global.footer.services.api`
- `global.footer.contactHeading`
- `global.footer.contact.emailDisplay`
- `global.footer.contact.primaryCta`
- `global.footer.copyright`
- `global.footer.closingLine`

Notes:
- `index.html` currently uses `© 2026 Juchheim Web Development. All rights reserved.` while the other pages use a shorter copyright line. Pick one canonical value before seeding, or split the copyright key if that difference is intentional.
- The visible obfuscated email text should not be the only stored field; the underlying address parts should be structured separately in the data model.

### Shared contact identity
Some values are static text plus behavior.

Suggested structured keys:
- `global.contact.email.user`
- `global.contact.email.domain`
- `global.contact.email.tld`
- `global.contact.email.displayText`
- `global.contact.responseTime.short`
- `global.contact.responseTime.detail`

These values currently power:
- footer email link text
- contact-page email block
- obfuscated click-to-compose behavior

## Page-Specific Surface

## `index.html`

### Hero
Suggested keys:
- `home.hero.brandLabel`
- `home.hero.tagline`
- `home.hero.body`
- `home.hero.primaryCta`
- `home.hero.secondaryCta`
- `home.hero.scrollLabel`

Editable copy:
- `Juchheim Web Development`
- `Straight talk. Solid delivery.`
- hero supporting paragraph
- `View Our Work`
- `Start a Project`
- `Scroll`

### About teaser
Suggested keys:
- `home.about.label`
- `home.about.heading`
- `home.about.bodyPrimary`
- `home.about.bodySecondary`
- `home.about.teamCta`
- `home.about.servicesCta`
- `home.about.stats.yearsLabel`
- `home.about.stats.projectsLabel`

Editable copy:
- `Who We Are`
- `A small shop with a serious standard.`
- two intro paragraphs
- `Meet the Team`
- `Our Services`
- `Years building for the web`
- `Projects delivered`

The numeric stat values can stay file-based in MVP unless you want numbers editable too. If they should be editable, add:
- `home.about.stats.yearsValue`
- `home.about.stats.projectsValue`

### Portfolio intro shell
Suggested keys:
- `home.portfolio.label`
- `home.portfolio.heading`
- `home.portfolio.body`

Editable copy:
- `Selected Work`
- `Projects we're proud of.`
- section supporting paragraph

The case-study cards inside `#portfolio-root` are excluded.

### CTA band
Suggested keys:
- `home.cta.label`
- `home.cta.heading`
- `home.cta.body`
- `home.cta.button`

Editable copy:
- `Ready?`
- `Let's build something worth remembering.`
- supporting paragraph
- `Start a Conversation`

## `about.html`

### Hero
Suggested keys:
- `about.hero.label`
- `about.hero.heading`
- `about.hero.body`

### Story section
Suggested keys:
- `about.story.label`
- `about.story.heading`
- `about.story.bodyOne`
- `about.story.bodyTwo`
- `about.story.bodyThree`
- `about.story.primaryCta`
- `about.story.secondaryCta`

### Team section intro
Suggested keys:
- `about.team.label`
- `about.team.heading`
- `about.team.body`

### Team cards
Team members should be modeled as a repeatable list in MVP so admins can add, remove, and reorder members without code changes.

Suggested key:
- `about.team.members`

Recommended shape:
- array of:
  - `id` (stable string id)
  - `initials` (short avatar initials)
  - `name`
  - `role`
  - `bio`
  - `accentStyle` (optional, for avatar color preset/class)
  - `sortOrder`
  - `isActive` (optional soft-hide flag)

Notes:
- Prefer soft hide via `isActive` for safe rollback, with optional hard delete action in the UI.
- Keep team-card structure in template markup; only list data should be dynamic.

### Values section
Suggested keys:
- `about.values.label`
- `about.values.heading`
- `about.values.precision.number`
- `about.values.precision.title`
- `about.values.precision.body`
- `about.values.transparency.number`
- `about.values.transparency.title`
- `about.values.transparency.body`
- `about.values.longevity.number`
- `about.values.longevity.title`
- `about.values.longevity.body`
- `about.values.selectivity.number`
- `about.values.selectivity.title`
- `about.values.selectivity.body`

## `services.html`

### Hero
Suggested keys:
- `services.hero.label`
- `services.hero.heading`
- `services.hero.body`

### Service cards
Each card has a title, description, and feature bullets.

Suggested keys:
- `services.cards.saas.title`
- `services.cards.saas.body`
- `services.cards.saas.features`
- `services.cards.cms.title`
- `services.cards.cms.body`
- `services.cards.cms.features`
- `services.cards.design.title`
- `services.cards.design.body`
- `services.cards.design.features`
- `services.cards.performance.title`
- `services.cards.performance.body`
- `services.cards.performance.features`
- `services.cards.api.title`
- `services.cards.api.body`
- `services.cards.api.features`
- `services.cards.retainer.title`
- `services.cards.retainer.body`
- `services.cards.retainer.features`

Store each `features` field as a string array so the editor can manage bullet rows cleanly.

### Process section
Suggested keys:
- `services.process.label`
- `services.process.heading`
- `services.process.body`
- `services.process.discovery.title`
- `services.process.discovery.body`
- `services.process.scoping.title`
- `services.process.scoping.body`
- `services.process.build.title`
- `services.process.build.body`
- `services.process.launch.title`
- `services.process.launch.body`
- `services.process.support.title`
- `services.process.support.body`

Process step numbers can stay file-based in MVP.

### Stack section
Suggested keys:
- `services.stack.label`
- `services.stack.heading`
- `services.stack.body`
- `services.stack.items`

Recommended shape for `services.stack.items`:
- array of `{ category, label }`

This keeps the static technology grid editable without inventing a separate CMS screen.

### CTA band
Suggested keys:
- `services.cta.label`
- `services.cta.heading`
- `services.cta.body`
- `services.cta.button`

## `contact.html`

### Hero
Suggested keys:
- `contact.hero.label`
- `contact.hero.heading`
- `contact.hero.body`

### Form labels and helper copy
Suggested keys:
- `contact.form.nameLabel`
- `contact.form.namePlaceholder`
- `contact.form.emailLabel`
- `contact.form.emailPlaceholder`
- `contact.form.companyLabel`
- `contact.form.companyPlaceholder`
- `contact.form.budgetLabel`
- `contact.form.budgetPlaceholder`
- `contact.form.budgetOptions`
- `contact.form.serviceLabel`
- `contact.form.servicePlaceholder`
- `contact.form.serviceOptions`
- `contact.form.messageLabel`
- `contact.form.messagePlaceholder`
- `contact.form.note`
- `contact.form.submitButton`
- `contact.form.successHeading`
- `contact.form.successBody`

Recommended shapes:
- `budgetOptions`: string array
- `serviceOptions`: string array

Validation-error strings can remain file-based in MVP unless you want admin-editable tone for validation messaging.

### Sidebar
Suggested keys:
- `contact.sidebar.availabilityBadge`
- `contact.sidebar.availabilityBody`
- `contact.sidebar.emailHeading`
- `contact.sidebar.emailBody`
- `contact.sidebar.responseTimeHeading`
- `contact.sidebar.responseTimeValue`
- `contact.sidebar.responseTimeBody`
- `contact.sidebar.nextHeading`
- `contact.sidebar.nextSteps`

Recommended shape:
- `nextSteps`: string array with three rows

### FAQ
Suggested keys:
- `contact.faq.label`
- `contact.faq.heading`
- `contact.faq.items`

Recommended shape:
- array of `{ question, answer }`

Current FAQ count: 6

## `portfolio.html`

### Hero shell
Suggested keys:
- `portfolio.hero.label`
- `portfolio.hero.heading`
- `portfolio.hero.body`

### CTA band
Suggested keys:
- `portfolio.cta.label`
- `portfolio.cta.heading`
- `portfolio.cta.body`
- `portfolio.cta.button`

### Explicit exclusion
Do not include:
- anything rendered inside `#portfolio-root`
- any case-study title, category, timeline, image, or modal content

Those continue to come from the existing case-study API and admin flows.

## Deferred Surface For Later Phase
These are static today, but recommended for a later phase:
- page `<title>`
- `meta name="description"`
- Open Graph and Twitter metadata
- aria labels that are not visible content
- icon-only or SVG-only affordances
