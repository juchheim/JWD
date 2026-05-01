export const STATIC_CONTENT_PAGE_IDS = [
  "home",
  "about",
  "services",
  "contact",
  "portfolio",
] as const;

export type StaticContentPageId = (typeof STATIC_CONTENT_PAGE_IDS)[number];
export type StaticContentOwner = StaticContentPageId | "global";
export type StaticContentScope = "shared" | "page";
export type StaticContentFieldType =
  | "text"
  | "multiline_text"
  | "string_list"
  | "faq_items"
  | "team_members"
  | "structured_list";
export type StaticContentRenderMode =
  | "text_content"
  | "template_fragment"
  | "string_list"
  | "faq_items"
  | "team_members"
  | "structured_list";

export type StaticContentEntry = {
  key: string;
  pageId: StaticContentOwner;
  scope: StaticContentScope;
  fieldType: StaticContentFieldType;
  selector: string;
  renderMode: StaticContentRenderMode;
};

export const STATIC_CONTENT_ROUTE_PAGE_MAP: Record<string, StaticContentPageId> = {
  "/": "home",
  "/index.html": "home",
  "/about.html": "about",
  "/services.html": "services",
  "/contact.html": "contact",
  "/portfolio.html": "portfolio",
};

function defaultRenderModeForFieldType(fieldType: StaticContentFieldType): StaticContentRenderMode {
  switch (fieldType) {
    case "string_list":
      return "string_list";
    case "faq_items":
      return "faq_items";
    case "team_members":
      return "team_members";
    case "structured_list":
      return "structured_list";
    default:
      return "text_content";
  }
}

function entry(input: {
  key: string;
  pageId: StaticContentOwner;
  scope: StaticContentScope;
  fieldType: StaticContentFieldType;
  renderMode?: StaticContentRenderMode;
  selector?: string;
}): StaticContentEntry {
  return {
    ...input,
    selector: input.selector ?? `[data-content-key="${input.key}"]`,
    renderMode: input.renderMode ?? defaultRenderModeForFieldType(input.fieldType),
  };
}

const sharedEntries: StaticContentEntry[] = [
  entry({ key: "global.nav.homeLabel", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.nav.servicesLabel", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.nav.portfolioLabel", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.nav.aboutLabel", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.nav.primaryCtaLabel", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.footer.tagline", pageId: "global", scope: "shared", fieldType: "multiline_text" }),
  entry({ key: "global.footer.pagesHeading", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.footer.pages.home", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.footer.pages.services", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.footer.pages.portfolio", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.footer.pages.about", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.footer.pages.contact", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.footer.servicesHeading", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.footer.services.saas", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.footer.services.cms", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.footer.services.performance", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.footer.services.api", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.footer.contactHeading", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.contact.emailDisplay", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.footer.contact.primaryCta", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.footer.copyright", pageId: "global", scope: "shared", fieldType: "text" }),
  entry({ key: "global.footer.closingLine", pageId: "global", scope: "shared", fieldType: "text" }),
];

const homeEntries: StaticContentEntry[] = [
  entry({ key: "home.hero.brandLabel", pageId: "home", scope: "page", fieldType: "text" }),
  entry({
    key: "home.hero.tagline",
    pageId: "home",
    scope: "page",
    fieldType: "multiline_text",
    renderMode: "template_fragment",
  }),
  entry({ key: "home.hero.body", pageId: "home", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "home.hero.primaryCta", pageId: "home", scope: "page", fieldType: "text" }),
  entry({ key: "home.hero.secondaryCta", pageId: "home", scope: "page", fieldType: "text" }),
  entry({ key: "home.hero.scrollLabel", pageId: "home", scope: "page", fieldType: "text" }),
  entry({ key: "home.about.label", pageId: "home", scope: "page", fieldType: "text" }),
  entry({
    key: "home.about.heading",
    pageId: "home",
    scope: "page",
    fieldType: "multiline_text",
    renderMode: "template_fragment",
  }),
  entry({ key: "home.about.bodyPrimary", pageId: "home", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "home.about.bodySecondary", pageId: "home", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "home.about.teamCta", pageId: "home", scope: "page", fieldType: "text" }),
  entry({ key: "home.about.servicesCta", pageId: "home", scope: "page", fieldType: "text" }),
  entry({ key: "home.about.stats.yearsLabel", pageId: "home", scope: "page", fieldType: "text" }),
  entry({ key: "home.about.stats.projectsLabel", pageId: "home", scope: "page", fieldType: "text" }),
  entry({ key: "home.portfolio.label", pageId: "home", scope: "page", fieldType: "text" }),
  entry({ key: "home.portfolio.heading", pageId: "home", scope: "page", fieldType: "text" }),
  entry({ key: "home.portfolio.body", pageId: "home", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "home.cta.label", pageId: "home", scope: "page", fieldType: "text" }),
  entry({
    key: "home.cta.heading",
    pageId: "home",
    scope: "page",
    fieldType: "multiline_text",
    renderMode: "template_fragment",
  }),
  entry({ key: "home.cta.body", pageId: "home", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "home.cta.button", pageId: "home", scope: "page", fieldType: "text" }),
];

const aboutEntries: StaticContentEntry[] = [
  entry({ key: "about.hero.label", pageId: "about", scope: "page", fieldType: "text" }),
  entry({
    key: "about.hero.heading",
    pageId: "about",
    scope: "page",
    fieldType: "multiline_text",
    renderMode: "template_fragment",
  }),
  entry({ key: "about.hero.body", pageId: "about", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "about.story.label", pageId: "about", scope: "page", fieldType: "text" }),
  entry({ key: "about.story.heading", pageId: "about", scope: "page", fieldType: "text" }),
  entry({ key: "about.story.bodyOne", pageId: "about", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "about.story.bodyTwo", pageId: "about", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "about.story.bodyThree", pageId: "about", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "about.story.primaryCta", pageId: "about", scope: "page", fieldType: "text" }),
  entry({ key: "about.story.secondaryCta", pageId: "about", scope: "page", fieldType: "text" }),
  entry({ key: "about.team.label", pageId: "about", scope: "page", fieldType: "text" }),
  entry({ key: "about.team.heading", pageId: "about", scope: "page", fieldType: "text" }),
  entry({ key: "about.team.body", pageId: "about", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "about.team.members", pageId: "about", scope: "page", fieldType: "team_members" }),
  entry({ key: "about.values.label", pageId: "about", scope: "page", fieldType: "text" }),
  entry({ key: "about.values.heading", pageId: "about", scope: "page", fieldType: "text" }),
  entry({ key: "about.values.precision.number", pageId: "about", scope: "page", fieldType: "text" }),
  entry({ key: "about.values.precision.title", pageId: "about", scope: "page", fieldType: "text" }),
  entry({ key: "about.values.precision.body", pageId: "about", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "about.values.transparency.number", pageId: "about", scope: "page", fieldType: "text" }),
  entry({ key: "about.values.transparency.title", pageId: "about", scope: "page", fieldType: "text" }),
  entry({
    key: "about.values.transparency.body",
    pageId: "about",
    scope: "page",
    fieldType: "multiline_text",
  }),
  entry({ key: "about.values.longevity.number", pageId: "about", scope: "page", fieldType: "text" }),
  entry({ key: "about.values.longevity.title", pageId: "about", scope: "page", fieldType: "text" }),
  entry({ key: "about.values.longevity.body", pageId: "about", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "about.values.selectivity.number", pageId: "about", scope: "page", fieldType: "text" }),
  entry({ key: "about.values.selectivity.title", pageId: "about", scope: "page", fieldType: "text" }),
  entry({
    key: "about.values.selectivity.body",
    pageId: "about",
    scope: "page",
    fieldType: "multiline_text",
  }),
];

const servicesEntries: StaticContentEntry[] = [
  entry({ key: "services.hero.label", pageId: "services", scope: "page", fieldType: "text" }),
  entry({
    key: "services.hero.heading",
    pageId: "services",
    scope: "page",
    fieldType: "multiline_text",
    renderMode: "template_fragment",
  }),
  entry({ key: "services.hero.body", pageId: "services", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "services.cards.saas.title", pageId: "services", scope: "page", fieldType: "text" }),
  entry({ key: "services.cards.saas.body", pageId: "services", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "services.cards.saas.features", pageId: "services", scope: "page", fieldType: "string_list" }),
  entry({ key: "services.cards.cms.title", pageId: "services", scope: "page", fieldType: "text" }),
  entry({ key: "services.cards.cms.body", pageId: "services", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "services.cards.cms.features", pageId: "services", scope: "page", fieldType: "string_list" }),
  entry({ key: "services.cards.design.title", pageId: "services", scope: "page", fieldType: "text" }),
  entry({
    key: "services.cards.design.body",
    pageId: "services",
    scope: "page",
    fieldType: "multiline_text",
  }),
  entry({
    key: "services.cards.design.features",
    pageId: "services",
    scope: "page",
    fieldType: "string_list",
  }),
  entry({
    key: "services.cards.performance.title",
    pageId: "services",
    scope: "page",
    fieldType: "text",
  }),
  entry({
    key: "services.cards.performance.body",
    pageId: "services",
    scope: "page",
    fieldType: "multiline_text",
  }),
  entry({
    key: "services.cards.performance.features",
    pageId: "services",
    scope: "page",
    fieldType: "string_list",
  }),
  entry({ key: "services.cards.api.title", pageId: "services", scope: "page", fieldType: "text" }),
  entry({ key: "services.cards.api.body", pageId: "services", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "services.cards.api.features", pageId: "services", scope: "page", fieldType: "string_list" }),
  entry({ key: "services.cards.retainer.title", pageId: "services", scope: "page", fieldType: "text" }),
  entry({
    key: "services.cards.retainer.body",
    pageId: "services",
    scope: "page",
    fieldType: "multiline_text",
  }),
  entry({
    key: "services.cards.retainer.features",
    pageId: "services",
    scope: "page",
    fieldType: "string_list",
  }),
  entry({ key: "services.process.label", pageId: "services", scope: "page", fieldType: "text" }),
  entry({ key: "services.process.heading", pageId: "services", scope: "page", fieldType: "text" }),
  entry({ key: "services.process.body", pageId: "services", scope: "page", fieldType: "multiline_text" }),
  entry({
    key: "services.process.discovery.title",
    pageId: "services",
    scope: "page",
    fieldType: "text",
  }),
  entry({
    key: "services.process.discovery.body",
    pageId: "services",
    scope: "page",
    fieldType: "multiline_text",
  }),
  entry({
    key: "services.process.scoping.title",
    pageId: "services",
    scope: "page",
    fieldType: "text",
  }),
  entry({
    key: "services.process.scoping.body",
    pageId: "services",
    scope: "page",
    fieldType: "multiline_text",
  }),
  entry({ key: "services.process.build.title", pageId: "services", scope: "page", fieldType: "text" }),
  entry({
    key: "services.process.build.body",
    pageId: "services",
    scope: "page",
    fieldType: "multiline_text",
  }),
  entry({ key: "services.process.launch.title", pageId: "services", scope: "page", fieldType: "text" }),
  entry({
    key: "services.process.launch.body",
    pageId: "services",
    scope: "page",
    fieldType: "multiline_text",
  }),
  entry({ key: "services.process.support.title", pageId: "services", scope: "page", fieldType: "text" }),
  entry({
    key: "services.process.support.body",
    pageId: "services",
    scope: "page",
    fieldType: "multiline_text",
  }),
  entry({ key: "services.stack.label", pageId: "services", scope: "page", fieldType: "text" }),
  entry({ key: "services.stack.heading", pageId: "services", scope: "page", fieldType: "text" }),
  entry({ key: "services.stack.body", pageId: "services", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "services.stack.items", pageId: "services", scope: "page", fieldType: "structured_list" }),
  entry({ key: "services.cta.label", pageId: "services", scope: "page", fieldType: "text" }),
  entry({ key: "services.cta.heading", pageId: "services", scope: "page", fieldType: "text" }),
  entry({ key: "services.cta.body", pageId: "services", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "services.cta.button", pageId: "services", scope: "page", fieldType: "text" }),
];

const contactEntries: StaticContentEntry[] = [
  entry({ key: "contact.hero.label", pageId: "contact", scope: "page", fieldType: "text" }),
  entry({
    key: "contact.hero.heading",
    pageId: "contact",
    scope: "page",
    fieldType: "multiline_text",
    renderMode: "template_fragment",
  }),
  entry({ key: "contact.hero.body", pageId: "contact", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "contact.form.nameLabel", pageId: "contact", scope: "page", fieldType: "text" }),
  entry({ key: "contact.form.namePlaceholder", pageId: "contact", scope: "page", fieldType: "text" }),
  entry({ key: "contact.form.emailLabel", pageId: "contact", scope: "page", fieldType: "text" }),
  entry({ key: "contact.form.emailPlaceholder", pageId: "contact", scope: "page", fieldType: "text" }),
  entry({ key: "contact.form.companyLabel", pageId: "contact", scope: "page", fieldType: "text" }),
  entry({
    key: "contact.form.companyPlaceholder",
    pageId: "contact",
    scope: "page",
    fieldType: "text",
  }),
  entry({ key: "contact.form.budgetLabel", pageId: "contact", scope: "page", fieldType: "text" }),
  entry({
    key: "contact.form.budgetPlaceholder",
    pageId: "contact",
    scope: "page",
    fieldType: "text",
  }),
  entry({ key: "contact.form.budgetOptions", pageId: "contact", scope: "page", fieldType: "string_list" }),
  entry({ key: "contact.form.serviceLabel", pageId: "contact", scope: "page", fieldType: "text" }),
  entry({
    key: "contact.form.servicePlaceholder",
    pageId: "contact",
    scope: "page",
    fieldType: "text",
  }),
  entry({ key: "contact.form.serviceOptions", pageId: "contact", scope: "page", fieldType: "string_list" }),
  entry({ key: "contact.form.messageLabel", pageId: "contact", scope: "page", fieldType: "text" }),
  entry({
    key: "contact.form.messagePlaceholder",
    pageId: "contact",
    scope: "page",
    fieldType: "multiline_text",
  }),
  entry({ key: "contact.form.note", pageId: "contact", scope: "page", fieldType: "text" }),
  entry({ key: "contact.form.submitButton", pageId: "contact", scope: "page", fieldType: "text" }),
  entry({ key: "contact.form.successHeading", pageId: "contact", scope: "page", fieldType: "text" }),
  entry({
    key: "contact.form.successBody",
    pageId: "contact",
    scope: "page",
    fieldType: "multiline_text",
  }),
  entry({
    key: "contact.sidebar.availabilityBadge",
    pageId: "contact",
    scope: "page",
    fieldType: "text",
  }),
  entry({
    key: "contact.sidebar.availabilityBody",
    pageId: "contact",
    scope: "page",
    fieldType: "multiline_text",
  }),
  entry({ key: "contact.sidebar.emailHeading", pageId: "contact", scope: "page", fieldType: "text" }),
  entry({ key: "contact.sidebar.emailBody", pageId: "contact", scope: "page", fieldType: "multiline_text" }),
  entry({
    key: "contact.sidebar.responseTimeHeading",
    pageId: "contact",
    scope: "page",
    fieldType: "text",
  }),
  entry({
    key: "contact.sidebar.responseTimeValue",
    pageId: "contact",
    scope: "page",
    fieldType: "text",
  }),
  entry({
    key: "contact.sidebar.responseTimeBody",
    pageId: "contact",
    scope: "page",
    fieldType: "multiline_text",
  }),
  entry({ key: "contact.sidebar.nextHeading", pageId: "contact", scope: "page", fieldType: "text" }),
  entry({ key: "contact.sidebar.nextSteps", pageId: "contact", scope: "page", fieldType: "string_list" }),
  entry({ key: "contact.faq.label", pageId: "contact", scope: "page", fieldType: "text" }),
  entry({ key: "contact.faq.heading", pageId: "contact", scope: "page", fieldType: "text" }),
  entry({ key: "contact.faq.items", pageId: "contact", scope: "page", fieldType: "faq_items" }),
];

const portfolioEntries: StaticContentEntry[] = [
  entry({ key: "portfolio.hero.label", pageId: "portfolio", scope: "page", fieldType: "text" }),
  entry({
    key: "portfolio.hero.heading",
    pageId: "portfolio",
    scope: "page",
    fieldType: "multiline_text",
    renderMode: "template_fragment",
  }),
  entry({ key: "portfolio.hero.body", pageId: "portfolio", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "portfolio.cta.label", pageId: "portfolio", scope: "page", fieldType: "text" }),
  entry({ key: "portfolio.cta.heading", pageId: "portfolio", scope: "page", fieldType: "text" }),
  entry({ key: "portfolio.cta.body", pageId: "portfolio", scope: "page", fieldType: "multiline_text" }),
  entry({ key: "portfolio.cta.button", pageId: "portfolio", scope: "page", fieldType: "text" }),
];

export const STATIC_CONTENT_REGISTRY: readonly StaticContentEntry[] = [
  ...sharedEntries,
  ...homeEntries,
  ...aboutEntries,
  ...servicesEntries,
  ...contactEntries,
  ...portfolioEntries,
];

export const STATIC_CONTENT_REGISTRY_BY_KEY = new Map<string, StaticContentEntry>(
  STATIC_CONTENT_REGISTRY.map((contentEntry) => [contentEntry.key, contentEntry])
);

export function getStaticContentEntriesForPage(pageId: StaticContentPageId): StaticContentEntry[] {
  return STATIC_CONTENT_REGISTRY.filter(
    (contentEntry) => contentEntry.scope === "shared" || contentEntry.pageId === pageId
  );
}
