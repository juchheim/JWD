import {
  generateSignedAssetUrl,
  generateSignedUploadUrl,
  parseSignedAssetRequest,
  parseSignedUploadRequest,
  verifySignature,
} from "./signedUrls";
import {
  ADMIN_SESSION_COOKIE,
  buildAdminSessionCookie,
  clearAdminSessionCookie,
  createAdminSessionToken,
  getCookieValue,
  safePasswordCompare,
  verifyAdminSessionToken,
} from "./adminAuth";

type Env = {
  ASSETS: R2Bucket;
  DB: D1Database;
  ASSET_SIGNING_SECRET: string;
  ADMIN_SHARED_PASSWORD: string;
  ADMIN_SESSION_SECRET?: string;
  CORS_ALLOWLIST?: string;
  CONTACT_EMAIL_PROVIDER?: string;
  CONTACT_EMAIL_TO?: string;
  CONTACT_EMAIL_FROM?: string;
  RESEND_API_KEY?: string;
};

const DEFAULT_SIGNED_URL_TTL_SECONDS = 5 * 60;
const DEFAULT_SIGNED_UPLOAD_TTL_SECONDS = 5 * 60;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

type LoginAttemptState = {
  firstAttemptAt: number;
  attemptCount: number;
  lockedUntil?: number;
};

const loginAttempts = new Map<string, LoginAttemptState>();

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function logEvent(
  level: "info" | "warn" | "error",
  event: string,
  data: Record<string, unknown> = {}
): void {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...data,
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

function secureCookieForRequest(request: Request): boolean {
  return new URL(request.url).protocol === "https:";
}

function getClientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") || "unknown";
}

function isOriginAllowed(request: Request, env: Env): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const allowlist = (env.CORS_ALLOWLIST ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (allowlist.length === 0) return true;
  return allowlist.includes(origin);
}

function withCors(response: Response, request: Request, env: Env): Response {
  const headers = new Headers(response.headers);
  const origin = request.headers.get("origin");
  if (origin && isOriginAllowed(request, env)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-credentials", "true");
    headers.set("access-control-allow-methods", "GET,POST,PUT,DELETE,OPTIONS");
    headers.set("access-control-allow-headers", "content-type, authorization");
    headers.set("vary", "Origin");
  }
  return new Response(response.body, { status: response.status, headers });
}

function corsPreflight(request: Request, env: Env): Response {
  if (!isOriginAllowed(request, env)) {
    return new Response("Origin not allowed", { status: 403 });
  }
  const response = new Response(null, { status: 204 });
  return withCors(response, request, env);
}

function checkLoginRateLimit(clientIp: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const current = loginAttempts.get(clientIp);
  if (!current) {
    loginAttempts.set(clientIp, { firstAttemptAt: now, attemptCount: 0 });
    return { allowed: true };
  }

  if (current.lockedUntil && current.lockedUntil > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((current.lockedUntil - now) / 1000) };
  }

  if (now - current.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(clientIp, { firstAttemptAt: now, attemptCount: 0 });
  }

  return { allowed: true };
}

function noteFailedLoginAttempt(clientIp: string): void {
  const now = Date.now();
  const current = loginAttempts.get(clientIp) ?? {
    firstAttemptAt: now,
    attemptCount: 0,
  };

  if (now - current.firstAttemptAt > LOGIN_WINDOW_MS) {
    current.firstAttemptAt = now;
    current.attemptCount = 0;
    current.lockedUntil = undefined;
  }

  current.attemptCount += 1;
  if (current.attemptCount >= LOGIN_MAX_ATTEMPTS) {
    current.lockedUntil = now + LOGIN_LOCK_MS;
  }
  loginAttempts.set(clientIp, current);
}

function clearFailedLoginAttempts(clientIp: string): void {
  loginAttempts.delete(clientIp);
}

type CaseStudyRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  tags_json: string | null;
  accent_color: string;
  background_color: string;
  sort_order: number;
  is_active: number;
};

type TimelineStepRow = {
  id: string;
  case_study_id: string;
  name: string;
  duration_weeks: number;
  summary: string;
  sort_order: number;
};

type ImageRow = {
  id: string;
  case_study_id: string;
  r2_key: string;
  alt: string;
  sort_order: number;
};

type CategoryRow = {
  case_study_id: string;
  category_name: string;
};

type CategoryListRow = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

type CreateCaseStudyPayload = {
  title?: unknown;
  slug?: unknown;
  shortDescription?: unknown;
  categoryIds?: unknown;
  tags?: unknown;
  accentColor?: unknown;
  backgroundColor?: unknown;
  images?: unknown;
  timelineSteps?: unknown;
  sortOrder?: unknown;
  isActive?: unknown;
};

type CreateTimelineStepInput = {
  name: string;
  durationWeeks: number;
  summary: string;
  sortOrder: number;
};

type CreateImageInput = {
  r2Key: string;
  alt: string;
  sortOrder: number;
};

type CreateCategoryPayload = {
  name?: unknown;
  slug?: unknown;
  sortOrder?: unknown;
};

type SignUploadPayload = {
  filename?: unknown;
  contentType?: unknown;
  caseStudySlug?: unknown;
};

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  budget?: unknown;
  service?: unknown;
  message?: unknown;
  website?: unknown;
  sourcePage?: unknown;
};

type NormalizedContactPayload = {
  name: string;
  email: string;
  company: string;
  budget: string;
  service: string;
  message: string;
  sourcePage: string;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isValidHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function badRequest(message: string, details?: unknown): Response {
  return json({ error: { code: "validation_error", message, details } }, 400);
}

function normalizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeContactPayload(body: ContactPayload): NormalizedContactPayload | null {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const budget = typeof body.budget === "string" ? body.budget.trim() : "";
  const service = typeof body.service === "string" ? body.service.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const sourcePage = typeof body.sourcePage === "string" ? body.sourcePage.trim() : "";

  if (!name || name.length > 120) return null;
  if (!email || email.length > 254 || !isValidEmail(email)) return null;
  if (company.length > 120 || budget.length > 120 || service.length > 120) return null;
  if (!message || message.length < 10 || message.length > 4000) return null;

  return {
    name,
    email,
    company,
    budget,
    service,
    message,
    sourcePage: sourcePage || "/contact.html",
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildContactEmailPlainText(payload: NormalizedContactPayload): string {
  const lines = [
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    payload.company ? `Company: ${payload.company}` : null,
    payload.budget ? `Budget: ${payload.budget}` : null,
    payload.service ? `Service: ${payload.service}` : null,
    `Source page: ${payload.sourcePage}`,
    "",
    "Message:",
    payload.message,
  ];
  return lines.filter((line): line is string => line !== null).join("\n");
}

function buildContactEmailHtml(payload: NormalizedContactPayload): string {
  const text = buildContactEmailPlainText(payload);
  return `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>`;
}

async function sendContactViaResend(
  payload: NormalizedContactPayload,
  request: Request,
  env: Env,
  recipient: string,
  sender: string
): Promise<{ ok: true } | { ok: false; reason: "resend_not_configured" | "resend_request_failed" }> {
  const apiKey = (env.RESEND_API_KEY ?? "").trim();
  if (!apiKey) {
    logEvent("error", "contact.resend.missing_api_key", { clientIp: getClientIp(request) });
    return { ok: false, reason: "resend_not_configured" };
  }

  const subject = `Site contact: ${payload.name} (${payload.sourcePage})`;
  const text = buildContactEmailPlainText(payload);
  const html = buildContactEmailHtml(payload);
  const fromHeader = sender.includes("<") ? sender : `Website contact <${sender}>`;

  const mailBody: Record<string, unknown> = {
    from: fromHeader,
    to: [recipient],
    subject,
    text,
    html,
    reply_to: payload.email,
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(mailBody),
  });

  if (!res.ok) {
    let resendHint: string | undefined;
    try {
      const errText = (await res.text()).slice(0, 500);
      const parsed = JSON.parse(errText) as { message?: string; name?: string };
      const msg =
        typeof parsed.message === "string" && parsed.message.length > 0
          ? parsed.message
          : errText.length > 0
            ? errText
            : undefined;
      if (msg) {
        resendHint = msg.length > 240 ? `${msg.slice(0, 237)}...` : msg;
      }
    } catch {
      // ignore parse failures
    }
    logEvent("error", "contact.resend.api_error", {
      clientIp: getClientIp(request),
      status: res.status,
      ...(resendHint ? { resendHint } : {}),
    });
    return { ok: false, reason: "resend_request_failed" };
  }

  logEvent("info", "contact.resend.sent", {
    requestId: crypto.randomUUID(),
    clientIp: getClientIp(request),
    to: recipient,
  });
  return { ok: true };
}

type ContactDispatchFailure =
  | "provider_not_configured"
  | "provider_not_supported"
  | "resend_not_configured"
  | "resend_request_failed";

async function dispatchContactEmail(
  payload: NormalizedContactPayload,
  request: Request,
  env: Env
): Promise<{ ok: true } | { ok: false; reason: ContactDispatchFailure }> {
  const provider = (env.CONTACT_EMAIL_PROVIDER ?? "").trim().toLowerCase();
  const recipient = (env.CONTACT_EMAIL_TO ?? "juchheim@gmail.com").trim();
  const sender = (env.CONTACT_EMAIL_FROM ?? "contact@tripjuchheim.com").trim();

  if (!provider) {
    return { ok: false, reason: "provider_not_configured" };
  }

  if (provider === "log") {
    logEvent("info", "contact.message.received", {
      requestId: crypto.randomUUID(),
      clientIp: getClientIp(request),
      to: recipient,
      from: sender,
      payload,
    });
    return { ok: true };
  }

  if (provider === "resend") {
    return sendContactViaResend(payload, request, env, recipient, sender);
  }

  return { ok: false, reason: "provider_not_supported" };
}

function parseTimelineSteps(input: unknown): CreateTimelineStepInput[] | null {
  if (!Array.isArray(input) || input.length < 1) return null;
  const parsed: CreateTimelineStepInput[] = [];
  for (let i = 0; i < input.length; i += 1) {
    const row = input[i] as Record<string, unknown>;
    const name = typeof row?.name === "string" ? row.name.trim() : "";
    const durationWeeks = Number(row?.durationWeeks);
    const summary = typeof row?.summary === "string" ? row.summary.trim() : "";
    const sortOrderRaw = Number(row?.sortOrder);
    const sortOrder = Number.isFinite(sortOrderRaw) ? sortOrderRaw : i + 1;
    if (!name || !Number.isInteger(durationWeeks) || durationWeeks < 1) return null;
    parsed.push({ name, durationWeeks, summary, sortOrder });
  }
  return parsed;
}

function parseImages(input: unknown): CreateImageInput[] | null {
  if (!Array.isArray(input)) return [];
  const parsed: CreateImageInput[] = [];
  for (let i = 0; i < input.length; i += 1) {
    const row = input[i] as Record<string, unknown>;
    const r2Key = typeof row?.r2Key === "string" ? row.r2Key.trim() : "";
    const alt = typeof row?.alt === "string" ? row.alt.trim() : "";
    const sortOrderRaw = Number(row?.sortOrder);
    const sortOrder = Number.isFinite(sortOrderRaw) ? sortOrderRaw : i + 1;
    if (!r2Key) return null;
    parsed.push({ r2Key, alt, sortOrder });
  }
  return parsed;
}

async function loadCaseStudies(
  env: Env,
  includeInactive = false
): Promise<
  Array<{
    id: string;
    slug: string;
    title: string;
    shortDescription: string;
    categories: string[];
    tags: string[];
    accentColor: string;
    backgroundColor: string;
    images: Array<{ id: string; r2Key: string; alt: string; sortOrder: number }>;
    timelineSteps: Array<{
      id: string;
      name: string;
      durationWeeks: number;
      summary: string;
      sortOrder: number;
    }>;
    sortOrder: number;
    isActive: boolean;
  }>
> {
  const caseStudiesQuery = includeInactive
    ? `SELECT id, slug, title, short_description, tags_json, accent_color, background_color, sort_order, is_active
       FROM case_studies
       ORDER BY sort_order ASC, created_at ASC`
    : `SELECT id, slug, title, short_description, tags_json, accent_color, background_color, sort_order, is_active
       FROM case_studies
       WHERE is_active = 1
       ORDER BY sort_order ASC, created_at ASC`;

  const caseStudiesResult = await env.DB.prepare(caseStudiesQuery).all<CaseStudyRow>();

  const caseStudies = caseStudiesResult.results ?? [];
  if (caseStudies.length === 0) return [];

  const ids = caseStudies.map((cs) => cs.id);
  const placeholders = ids.map(() => "?").join(", ");

  const timelineStepsResult = await env.DB.prepare(
    `SELECT id, case_study_id, name, duration_weeks, summary, sort_order
     FROM timeline_steps
     WHERE case_study_id IN (${placeholders})
     ORDER BY sort_order ASC, created_at ASC`
  )
    .bind(...ids)
    .all<TimelineStepRow>();

  const imagesResult = await env.DB.prepare(
    `SELECT id, case_study_id, r2_key, alt, sort_order
     FROM case_study_images
     WHERE case_study_id IN (${placeholders})
     ORDER BY sort_order ASC, created_at ASC`
  )
    .bind(...ids)
    .all<ImageRow>();

  const categoriesResult = await env.DB.prepare(
    `SELECT csc.case_study_id as case_study_id, c.name as category_name
     FROM case_study_categories csc
     JOIN categories c ON c.id = csc.category_id
     WHERE csc.case_study_id IN (${placeholders})
     ORDER BY c.sort_order ASC, c.name ASC`
  )
    .bind(...ids)
    .all<CategoryRow>();

  const timelineByCaseStudy = new Map<string, TimelineStepRow[]>();
  for (const step of timelineStepsResult.results ?? []) {
    const list = timelineByCaseStudy.get(step.case_study_id) ?? [];
    list.push(step);
    timelineByCaseStudy.set(step.case_study_id, list);
  }

  const imagesByCaseStudy = new Map<string, ImageRow[]>();
  for (const image of imagesResult.results ?? []) {
    const list = imagesByCaseStudy.get(image.case_study_id) ?? [];
    list.push(image);
    imagesByCaseStudy.set(image.case_study_id, list);
  }

  const categoriesByCaseStudy = new Map<string, string[]>();
  for (const category of categoriesResult.results ?? []) {
    const list = categoriesByCaseStudy.get(category.case_study_id) ?? [];
    list.push(category.category_name);
    categoriesByCaseStudy.set(category.case_study_id, list);
  }

  return caseStudies.map((caseStudy) => ({
      id: caseStudy.id,
      slug: caseStudy.slug,
      title: caseStudy.title,
      shortDescription: caseStudy.short_description,
      categories: categoriesByCaseStudy.get(caseStudy.id) ?? [],
      tags: caseStudy.tags_json ? JSON.parse(caseStudy.tags_json) : [],
      accentColor: caseStudy.accent_color,
      backgroundColor: caseStudy.background_color,
      images: (imagesByCaseStudy.get(caseStudy.id) ?? []).map((image) => ({
        id: image.id,
        r2Key: image.r2_key,
        alt: image.alt,
        sortOrder: image.sort_order,
      })),
      timelineSteps: (timelineByCaseStudy.get(caseStudy.id) ?? []).map((step) => ({
        id: step.id,
        name: step.name,
        durationWeeks: step.duration_weeks,
        summary: step.summary,
        sortOrder: step.sort_order,
      })),
      sortOrder: caseStudy.sort_order,
      isActive: caseStudy.is_active === 1,
    }));
}

async function handlePublicCaseStudies(env: Env): Promise<Response> {
  const caseStudies = await loadCaseStudies(env, false);
  return json({ caseStudies });
}

async function handlePublicContact(request: Request, env: Env): Promise<Response> {
  let body: ContactPayload;
  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return json({ error: { code: "bad_json", message: "Invalid JSON body." } }, 400);
  }

  const honeypot = typeof body.website === "string" ? body.website.trim() : "";
  if (honeypot) {
    // Pretend success for bots.
    return json({ ok: true }, 202);
  }

  const payload = normalizeContactPayload(body);
  if (!payload) {
    return badRequest(
      "name, valid email, and message (10-4000 chars) are required. Optional fields must be <= 120 chars."
    );
  }

  const delivery = await dispatchContactEmail(payload, request, env);
  if (!delivery.ok) {
    if (delivery.reason === "provider_not_configured") {
      return json(
        {
          error: {
            code: "email_provider_not_configured",
            message: "Contact form delivery is not configured yet.",
          },
        },
        503
      );
    }

    if (delivery.reason === "resend_not_configured") {
      return json(
        {
          error: {
            code: "email_delivery_misconfigured",
            message: "Contact form delivery is misconfigured on the server.",
          },
        },
        503
      );
    }

    if (delivery.reason === "resend_request_failed") {
      return json(
        {
          error: {
            code: "email_delivery_failed",
            message: "We could not send your message right now. Please try again or email us directly.",
          },
        },
        502
      );
    }

    return json(
      {
        error: {
          code: "email_provider_not_supported",
          message: "Configured email provider is not supported yet.",
        },
      },
      503
    );
  }

  return json({ ok: true }, 202);
}

async function handleAdminCaseStudies(env: Env): Promise<Response> {
  const caseStudies = await loadCaseStudies(env, true);
  return json({ caseStudies });
}

async function handleAdminCategories(env: Env): Promise<Response> {
  const categories = await env.DB.prepare(
    `SELECT id, name, slug, sort_order
     FROM categories
     ORDER BY sort_order ASC, name ASC`
  ).all<CategoryListRow>();
  return json({
    categories: (categories.results ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      sortOrder: category.sort_order,
    })),
  });
}

async function handleCreateCaseStudy(request: Request, env: Env): Promise<Response> {
  let body: CreateCaseStudyPayload;
  try {
    body = (await request.json()) as CreateCaseStudyPayload;
  } catch {
    return json({ error: { code: "bad_json", message: "Invalid JSON body." } }, 400);
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const shortDescription =
    typeof body.shortDescription === "string" ? body.shortDescription.trim() : "";
  const candidateSlug =
    typeof body.slug === "string" && body.slug.trim().length > 0 ? body.slug.trim() : title;
  const slug = slugify(candidateSlug);

  const categoryIds = normalizeStringArray(body.categoryIds);
  const tags = normalizeStringArray(body.tags);
  const accentColor =
    typeof body.accentColor === "string" ? body.accentColor.trim() : "#00d4a8";
  const backgroundColor =
    typeof body.backgroundColor === "string" ? body.backgroundColor.trim() : "#0a2218";
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;
  const isActive = Boolean(body.isActive ?? true);

  if (!title) return badRequest("title is required.");
  if (!shortDescription) return badRequest("shortDescription is required.");
  if (!slug) return badRequest("slug is required and must contain alphanumeric characters.");
  if (categoryIds.length < 1) return badRequest("categoryIds must include at least one ID.");
  if (!isValidHexColor(accentColor)) return badRequest("accentColor must be a valid hex color.");
  if (!isValidHexColor(backgroundColor))
    return badRequest("backgroundColor must be a valid hex color.");

  const timelineSteps = parseTimelineSteps(body.timelineSteps);
  if (!timelineSteps) {
    return badRequest("timelineSteps must include at least one valid step.");
  }

  const images = parseImages(body.images);
  if (!images) return badRequest("images contains invalid rows.");

  const placeholders = categoryIds.map(() => "?").join(", ");
  const categoryQuery = await env.DB.prepare(
    `SELECT id FROM categories WHERE id IN (${placeholders})`
  )
    .bind(...categoryIds)
    .all<{ id: string }>();
  const foundCategoryIds = new Set((categoryQuery.results ?? []).map((row) => row.id));
  const missingCategoryIds = categoryIds.filter((id) => !foundCategoryIds.has(id));
  if (missingCategoryIds.length > 0) {
    return badRequest("Some categoryIds do not exist.", { missingCategoryIds });
  }

  const existing = await env.DB.prepare("SELECT id FROM case_studies WHERE slug = ?")
    .bind(slug)
    .first<{ id: string }>();
  if (existing) {
    return badRequest("slug already exists. Please choose another.");
  }

  const caseStudyId = crypto.randomUUID();
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [];

  statements.push(
    env.DB.prepare(
      `INSERT INTO case_studies (
        id, slug, title, short_description, tags_json, accent_color, background_color, sort_order, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      caseStudyId,
      slug,
      title,
      shortDescription,
      JSON.stringify(tags),
      accentColor,
      backgroundColor,
      sortOrder,
      isActive ? 1 : 0,
      now,
      now
    )
  );

  for (const categoryId of categoryIds) {
    statements.push(
      env.DB.prepare(
        "INSERT INTO case_study_categories (case_study_id, category_id, created_at) VALUES (?, ?, ?)"
      ).bind(caseStudyId, categoryId, now)
    );
  }

  for (const step of timelineSteps) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO timeline_steps (
          id, case_study_id, name, duration_weeks, summary, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(),
        caseStudyId,
        step.name,
        step.durationWeeks,
        step.summary,
        step.sortOrder,
        now,
        now
      )
    );
  }

  for (const image of images) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO case_study_images (
          id, case_study_id, r2_key, alt, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(),
        caseStudyId,
        image.r2Key,
        image.alt,
        image.sortOrder,
        now,
        now
      )
    );
  }

  await env.DB.batch(statements);

  return json(
    {
      ok: true,
      caseStudy: { id: caseStudyId, slug, title, shortDescription, sortOrder, isActive },
    },
    201
  );
}

async function handleCreateCategory(request: Request, env: Env): Promise<Response> {
  let body: CreateCategoryPayload;
  try {
    body = (await request.json()) as CreateCategoryPayload;
  } catch {
    return json({ error: { code: "bad_json", message: "Invalid JSON body." } }, 400);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return badRequest("name is required.");
  const slugInput = typeof body.slug === "string" && body.slug.trim() ? body.slug : name;
  const baseSlug = slugify(slugInput);
  if (!baseSlug) return badRequest("name must include at least one letter or number.");
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;

  const existsByName = await env.DB.prepare("SELECT id FROM categories WHERE lower(name) = lower(?)")
    .bind(name)
    .first<{ id: string }>();
  if (existsByName) return badRequest("name already exists. Please choose another.");

  // Auto-resolve slug collisions so punctuation variants like "test!" can still be created.
  const existingSlugRows = await env.DB.prepare(
    "SELECT slug FROM categories WHERE slug = ? OR slug LIKE ?"
  )
    .bind(baseSlug, `${baseSlug}-%`)
    .all<{ slug: string }>();
  const usedSlugs = new Set((existingSlugRows.results ?? []).map((row) => row.slug));
  let slug = baseSlug;
  if (usedSlugs.has(slug)) {
    let nextSuffix = 2;
    while (usedSlugs.has(`${baseSlug}-${nextSuffix}`)) {
      nextSuffix += 1;
    }
    slug = `${baseSlug}-${nextSuffix}`;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO categories (id, name, slug, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(id, name, slug, sortOrder, now, now)
    .run();

  return json({ ok: true, category: { id, name, slug, sortOrder } }, 201);
}

async function handleDeleteCategory(env: Env, categoryId: string): Promise<Response> {
  const trimmedId = categoryId.trim();
  if (!trimmedId) return badRequest("categoryId is required.");

  const category = await env.DB.prepare("SELECT id FROM categories WHERE id = ?")
    .bind(trimmedId)
    .first<{ id: string }>();
  if (!category) {
    return json({ error: { code: "not_found", message: "Category not found." } }, 404);
  }

  const assignments = await env.DB.prepare(
    `SELECT cs.id, cs.title, cs.slug
     FROM case_study_categories csc
     JOIN case_studies cs ON cs.id = csc.case_study_id
     WHERE csc.category_id = ?
     ORDER BY cs.updated_at DESC, cs.created_at DESC`
  )
    .bind(trimmedId)
    .all<{ id: string; title: string; slug: string }>();
  const usedBy = assignments.results ?? [];
  if (usedBy.length > 0) {
    return json(
      {
        error: {
          code: "category_in_use",
          message: "Cannot delete category because it is assigned to one or more case studies.",
          details: {
            usedBy: usedBy.map((item) => ({
              id: item.id,
              title: item.title,
              slug: item.slug,
            })),
          },
        },
      },
      409
    );
  }

  await env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(trimmedId).run();
  return json({ ok: true, deletedId: trimmedId });
}

async function handleSignUpload(request: Request, env: Env): Promise<Response> {
  let body: SignUploadPayload;
  try {
    body = (await request.json()) as SignUploadPayload;
  } catch {
    return json({ error: { code: "bad_json", message: "Invalid JSON body." } }, 400);
  }

  const filenameRaw = typeof body.filename === "string" ? body.filename.trim() : "";
  if (!filenameRaw) return badRequest("filename is required.");
  const contentType = typeof body.contentType === "string" ? body.contentType.trim() : "";
  if (!contentType) return badRequest("contentType is required.");
  const caseStudySlug =
    typeof body.caseStudySlug === "string" && body.caseStudySlug.trim()
      ? slugify(body.caseStudySlug.trim())
      : "unassigned";
  const safeFilename = filenameRaw.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `case-studies/${caseStudySlug}/${crypto.randomUUID()}-${safeFilename}`;

  const { uploadUrl, expiresAt } = await generateSignedUploadUrl({
    origin: new URL(request.url).origin,
    key,
    ttlSeconds: DEFAULT_SIGNED_UPLOAD_TTL_SECONDS,
    secret: env.ASSET_SIGNING_SECRET,
  });

  return json({ uploadUrl, r2Key: key, expiresAt });
}

async function handleUploadPut(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const params = parseSignedUploadRequest(url);
  if (!params) return new Response("Invalid upload URL parameters.", { status: 400 });

  const now = Math.floor(Date.now() / 1000);
  if (params.exp <= now) return new Response("Upload URL expired.", { status: 401 });

  const valid = await verifySignature(
    params.key,
    params.exp,
    params.sig,
    env.ASSET_SIGNING_SECRET,
    "upload"
  );
  if (!valid) return new Response("Invalid upload signature.", { status: 401 });

  const contentLengthRaw = request.headers.get("content-length");
  const contentLength = contentLengthRaw ? Number.parseInt(contentLengthRaw, 10) : null;
  if (contentLength !== null && Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
    return new Response("Upload too large.", { status: 413 });
  }

  if (!request.body) return new Response("Missing upload body.", { status: 400 });
  const contentType = request.headers.get("content-type") ?? "application/octet-stream";

  await env.ASSETS.put(params.key, request.body, {
    httpMetadata: {
      contentType,
    },
  });

  return new Response(null, { status: 204 });
}

async function handleConfirmAsset(request: Request, env: Env): Promise<Response> {
  let body: { r2Key?: unknown; alt?: unknown; sortOrder?: unknown };
  try {
    body = (await request.json()) as { r2Key?: unknown; alt?: unknown; sortOrder?: unknown };
  } catch {
    return json({ error: { code: "bad_json", message: "Invalid JSON body." } }, 400);
  }

  const r2Key = typeof body.r2Key === "string" ? body.r2Key.trim() : "";
  if (!r2Key) return badRequest("r2Key is required.");
  const object = await env.ASSETS.head(r2Key);
  if (!object) return json({ error: { code: "not_found", message: "Asset not found in R2." } }, 404);

  const alt = typeof body.alt === "string" ? body.alt.trim() : "";
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;
  return json({
    ok: true,
    image: {
      id: crypto.randomUUID(),
      r2Key,
      alt,
      sortOrder,
    },
  });
}

async function handleUpdateCaseStudy(
  request: Request,
  env: Env,
  caseStudyId: string
): Promise<Response> {
  const existing = await env.DB.prepare("SELECT id FROM case_studies WHERE id = ?")
    .bind(caseStudyId)
    .first<{ id: string }>();
  if (!existing) return json({ error: { code: "not_found", message: "Case study not found." } }, 404);

  let body: CreateCaseStudyPayload;
  try {
    body = (await request.json()) as CreateCaseStudyPayload;
  } catch {
    return json({ error: { code: "bad_json", message: "Invalid JSON body." } }, 400);
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const shortDescription =
    typeof body.shortDescription === "string" ? body.shortDescription.trim() : "";
  const candidateSlug =
    typeof body.slug === "string" && body.slug.trim().length > 0 ? body.slug.trim() : title;
  const slug = slugify(candidateSlug);
  const categoryIds = normalizeStringArray(body.categoryIds);
  const tags = normalizeStringArray(body.tags);
  const accentColor = typeof body.accentColor === "string" ? body.accentColor.trim() : "";
  const backgroundColor = typeof body.backgroundColor === "string" ? body.backgroundColor.trim() : "";
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;
  const isActive = Boolean(body.isActive ?? true);

  if (!title) return badRequest("title is required.");
  if (!shortDescription) return badRequest("shortDescription is required.");
  if (!slug) return badRequest("slug is required and must contain alphanumeric characters.");
  if (categoryIds.length < 1) return badRequest("categoryIds must include at least one ID.");
  if (!isValidHexColor(accentColor)) return badRequest("accentColor must be a valid hex color.");
  if (!isValidHexColor(backgroundColor)) return badRequest("backgroundColor must be a valid hex color.");

  const timelineSteps = parseTimelineSteps(body.timelineSteps);
  if (!timelineSteps) return badRequest("timelineSteps must include at least one valid step.");
  const images = parseImages(body.images);
  if (!images) return badRequest("images contains invalid rows.");

  const placeholders = categoryIds.map(() => "?").join(", ");
  const categoryQuery = await env.DB.prepare(
    `SELECT id FROM categories WHERE id IN (${placeholders})`
  )
    .bind(...categoryIds)
    .all<{ id: string }>();
  const foundCategoryIds = new Set((categoryQuery.results ?? []).map((row) => row.id));
  const missingCategoryIds = categoryIds.filter((id) => !foundCategoryIds.has(id));
  if (missingCategoryIds.length > 0) return badRequest("Some categoryIds do not exist.", { missingCategoryIds });

  const duplicateSlug = await env.DB.prepare("SELECT id FROM case_studies WHERE slug = ? AND id != ?")
    .bind(slug, caseStudyId)
    .first<{ id: string }>();
  if (duplicateSlug) return badRequest("slug already exists. Please choose another.");

  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [];
  statements.push(
    env.DB.prepare(
      `UPDATE case_studies
       SET slug = ?, title = ?, short_description = ?, tags_json = ?, accent_color = ?, background_color = ?, sort_order = ?, is_active = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      slug,
      title,
      shortDescription,
      JSON.stringify(tags),
      accentColor,
      backgroundColor,
      sortOrder,
      isActive ? 1 : 0,
      now,
      caseStudyId
    )
  );
  statements.push(env.DB.prepare("DELETE FROM case_study_categories WHERE case_study_id = ?").bind(caseStudyId));
  statements.push(env.DB.prepare("DELETE FROM timeline_steps WHERE case_study_id = ?").bind(caseStudyId));
  statements.push(env.DB.prepare("DELETE FROM case_study_images WHERE case_study_id = ?").bind(caseStudyId));

  for (const categoryId of categoryIds) {
    statements.push(
      env.DB.prepare(
        "INSERT INTO case_study_categories (case_study_id, category_id, created_at) VALUES (?, ?, ?)"
      ).bind(caseStudyId, categoryId, now)
    );
  }
  for (const step of timelineSteps) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO timeline_steps (id, case_study_id, name, duration_weeks, summary, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(crypto.randomUUID(), caseStudyId, step.name, step.durationWeeks, step.summary, step.sortOrder, now, now)
    );
  }
  for (const image of images) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO case_study_images (id, case_study_id, r2_key, alt, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(crypto.randomUUID(), caseStudyId, image.r2Key, image.alt, image.sortOrder, now, now)
    );
  }
  await env.DB.batch(statements);
  return json({ ok: true, caseStudy: { id: caseStudyId, slug, title, shortDescription, sortOrder, isActive } });
}

async function handleDeleteCaseStudy(env: Env, caseStudyId: string): Promise<Response> {
  const result = await env.DB.prepare("DELETE FROM case_studies WHERE id = ?").bind(caseStudyId).run();
  if (!result.success) return json({ error: { code: "delete_failed", message: "Delete failed." } }, 500);
  if ((result.meta?.changes ?? 0) < 1) {
    return json({ error: { code: "not_found", message: "Case study not found." } }, 404);
  }
  return json({ ok: true });
}

async function handleAdminLogin(request: Request, env: Env): Promise<Response> {
  const clientIp = getClientIp(request);
  const rateLimit = checkLoginRateLimit(clientIp);
  if (!rateLimit.allowed) {
    logEvent("warn", "auth.login.rate_limited", { clientIp });
    const response = json(
      { error: { code: "rate_limited", message: "Too many login attempts. Try again later." } },
      429
    );
    if (rateLimit.retryAfterSeconds) {
      response.headers.set("retry-after", String(rateLimit.retryAfterSeconds));
    }
    return response;
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return json({ error: { code: "bad_json", message: "Invalid JSON body." } }, 400);
  }

  const password = body.password ?? "";
  const validPassword = await safePasswordCompare(password, env.ADMIN_SHARED_PASSWORD);
  if (!validPassword) {
    noteFailedLoginAttempt(clientIp);
    logEvent("warn", "auth.login.invalid_credentials", { clientIp });
    return json({ error: { code: "invalid_credentials", message: "Invalid password." } }, 401);
  }

  clearFailedLoginAttempts(clientIp);
  const sessionSecret = env.ADMIN_SESSION_SECRET || env.ASSET_SIGNING_SECRET;
  const { token, expiresAt } = await createAdminSessionToken(sessionSecret);
  const response = json({ ok: true, expiresAt });
  response.headers.set("set-cookie", buildAdminSessionCookie(token, secureCookieForRequest(request)));
  logEvent("info", "auth.login.success", { clientIp });
  return response;
}

async function requireAdminSession(request: Request, env: Env): Promise<Response | null> {
  const token = getCookieValue(request, ADMIN_SESSION_COOKIE);
  if (!token) {
    return json({ error: { code: "unauthorized", message: "Missing admin session." } }, 401);
  }
  const sessionSecret = env.ADMIN_SESSION_SECRET || env.ASSET_SIGNING_SECRET;
  const valid = await verifyAdminSessionToken(token, sessionSecret);
  if (!valid) {
    return json({ error: { code: "unauthorized", message: "Invalid admin session." } }, 401);
  }
  return null;
}

async function handleAdminLogout(request: Request): Promise<Response> {
  const response = json({ ok: true });
  response.headers.set("set-cookie", clearAdminSessionCookie(secureCookieForRequest(request)));
  return response;
}

async function handleSignRead(request: Request, env: Env): Promise<Response> {
  let body: { r2Key?: string; ttlSeconds?: number };
  try {
    body = (await request.json()) as { r2Key?: string; ttlSeconds?: number };
  } catch {
    return json({ error: { code: "bad_json", message: "Invalid JSON body." } }, 400);
  }

  const key = body.r2Key?.trim();
  if (!key) {
    return json({ error: { code: "missing_key", message: "r2Key is required." } }, 400);
  }

  const ttlSeconds = Math.max(
    60,
    Math.min(body.ttlSeconds ?? DEFAULT_SIGNED_URL_TTL_SECONDS, 60 * 15)
  );

  const { signedUrl, expiresAt } = await generateSignedAssetUrl({
    origin: new URL(request.url).origin,
    key,
    ttlSeconds,
    secret: env.ASSET_SIGNING_SECRET,
  });

  return json({ signedUrl, expiresAt });
}

async function handleAssetDelivery(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const params = parseSignedAssetRequest(url);
  if (!params) {
    return new Response("Invalid signed URL parameters.", { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  if (params.exp <= now) {
    return new Response("Signed URL expired.", { status: 401 });
  }

  const valid = await verifySignature(
    params.key,
    params.exp,
    params.sig,
    env.ASSET_SIGNING_SECRET
  );
  if (!valid) {
    return new Response("Invalid signed URL signature.", { status: 401 });
  }

  const object = await env.ASSETS.get(params.key);
  if (!object) {
    return new Response("Asset not found.", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "private, max-age=60");

  return new Response(object.body, { headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const caseStudyMatch = /^\/admin\/case-studies\/([^/]+)$/.exec(url.pathname);
    const categoryMatch = /^\/admin\/categories\/([^/]+)$/.exec(url.pathname);
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();

    try {
      if (request.method === "OPTIONS") {
        return corsPreflight(request, env);
      }

      if (!isOriginAllowed(request, env)) {
        return withCors(new Response("Origin not allowed", { status: 403 }), request, env);
      }

      let response: Response;
      if (request.method === "GET" && url.pathname === "/public/case-studies") {
        response = await handlePublicCaseStudies(env);
      } else if (request.method === "POST" && url.pathname === "/public/contact") {
        response = await handlePublicContact(request, env);
      } else if (request.method === "POST" && url.pathname === "/public/assets/sign-read") {
        response = await handleSignRead(request, env);
      } else if (request.method === "POST" && url.pathname === "/admin/auth/login") {
        response = await handleAdminLogin(request, env);
      } else if (request.method === "POST" && url.pathname === "/admin/auth/logout") {
        const unauthorized = await requireAdminSession(request, env);
        response = unauthorized ?? (await handleAdminLogout(request));
      } else if (request.method === "GET" && url.pathname === "/admin/case-studies") {
        const unauthorized = await requireAdminSession(request, env);
        response = unauthorized ?? (await handleAdminCaseStudies(env));
      } else if (request.method === "GET" && url.pathname === "/admin/categories") {
        const unauthorized = await requireAdminSession(request, env);
        response = unauthorized ?? (await handleAdminCategories(env));
      } else if (request.method === "POST" && url.pathname === "/admin/case-studies") {
        const unauthorized = await requireAdminSession(request, env);
        response = unauthorized ?? (await handleCreateCaseStudy(request, env));
      } else if (request.method === "POST" && url.pathname === "/admin/uploads/sign") {
        const unauthorized = await requireAdminSession(request, env);
        response = unauthorized ?? (await handleSignUpload(request, env));
      } else if (request.method === "PUT" && url.pathname.startsWith("/admin/uploads/")) {
        response = await handleUploadPut(request, env);
      } else if (request.method === "POST" && url.pathname === "/admin/assets/confirm") {
        const unauthorized = await requireAdminSession(request, env);
        response = unauthorized ?? (await handleConfirmAsset(request, env));
      } else if (request.method === "POST" && url.pathname === "/admin/categories") {
        const unauthorized = await requireAdminSession(request, env);
        response = unauthorized ?? (await handleCreateCategory(request, env));
      } else if (request.method === "DELETE" && categoryMatch) {
        const unauthorized = await requireAdminSession(request, env);
        response = unauthorized ?? (await handleDeleteCategory(env, categoryMatch[1]));
      } else if (request.method === "PUT" && caseStudyMatch) {
        const unauthorized = await requireAdminSession(request, env);
        response = unauthorized ?? (await handleUpdateCaseStudy(request, env, caseStudyMatch[1]));
      } else if (request.method === "DELETE" && caseStudyMatch) {
        const unauthorized = await requireAdminSession(request, env);
        response = unauthorized ?? (await handleDeleteCaseStudy(env, caseStudyMatch[1]));
      } else if (request.method === "GET" && url.pathname.startsWith("/public/assets/")) {
        response = await handleAssetDelivery(request, env);
      } else {
        response = json({ ok: true, service: "worker-api", message: "ready" });
      }

      logEvent("info", "http.request.complete", {
        requestId,
        method: request.method,
        path: url.pathname,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      return withCors(response, request, env);
    } catch (error) {
      logEvent("error", "http.request.error", {
        requestId,
        method: request.method,
        path: url.pathname,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return withCors(
        json({ error: { code: "internal_error", message: "Unexpected server error." } }, 500),
        request,
        env
      );
    }
  },
};
