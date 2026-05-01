import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  STATIC_CONTENT_REGISTRY_BY_KEY,
  STATIC_CONTENT_ROUTE_PAGE_MAP,
  type StaticContentFieldType,
  type StaticContentPageId,
} from "./staticContentRegistry";

const SITE_FILE_MAP: Record<string, { file: string; contentType: string }> = {
  "/": { file: "index.html", contentType: "text/html; charset=utf-8" },
  "/index.html": { file: "index.html", contentType: "text/html; charset=utf-8" },
  "/about.html": { file: "about.html", contentType: "text/html; charset=utf-8" },
  "/services.html": { file: "services.html", contentType: "text/html; charset=utf-8" },
  "/portfolio.html": { file: "portfolio.html", contentType: "text/html; charset=utf-8" },
  "/contact.html": { file: "contact.html", contentType: "text/html; charset=utf-8" },
  "/styles.css": { file: "styles.css", contentType: "text/css; charset=utf-8" },
  "/portfolio-component.jsx": {
    file: "portfolio-component.jsx",
    contentType: "text/javascript; charset=utf-8",
  },
  "/tweaks-panel.jsx": {
    file: "tweaks-panel.jsx",
    contentType: "text/javascript; charset=utf-8",
  },
  "/admin-inline-editor.js": {
    file: "admin-inline-editor.js",
    contentType: "text/javascript; charset=utf-8",
  },
};

type StaticContentApiResponse = {
  pageId?: string;
  content?: Record<string, unknown>;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function keyRegexFragment(contentKey: string): string {
  return contentKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function withTextReplacement(html: string, contentKey: string, value: string, preserveBreaks = false): string {
  const key = keyRegexFragment(contentKey);
  const inner = preserveBreaks
    ? escapeHtml(value).replace(/\n/g, "<br/>")
    : escapeHtml(value);

  const pairedRegex = new RegExp(
    `(<([a-zA-Z0-9]+)([^>]*\\bdata-content-key="${key}"[^>]*)>)([\\s\\S]*?)(<\\/\\2>)`,
    "i"
  );
  if (pairedRegex.test(html)) {
    return html.replace(pairedRegex, `$1${inner}$5`);
  }

  const placeholderRegex = new RegExp(
    `(<(?:input|textarea)([^>]*\\bdata-content-key="${key}"[^>]*\\bplaceholder="))([^"]*)(")`,
    "i"
  );
  return html.replace(placeholderRegex, `$1${escapeHtml(value)}$4`);
}

function withStringListReplacement(html: string, contentKey: string, values: string[]): string {
  const list = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  if (list.length < 1) return html;
  const key = keyRegexFragment(contentKey);

  const selectRegex = new RegExp(
    `(<select([^>]*\\bdata-content-key="${key}"[^>]*)>)([\\s\\S]*?)(<\\/select>)`,
    "i"
  );
  if (selectRegex.test(html)) {
    const options = list
      .map((value, index) =>
        index === 0
          ? `<option value="" disabled selected>${escapeHtml(value)}</option>`
          : `<option>${escapeHtml(value)}</option>`
      )
      .join("");
    return html.replace(selectRegex, `$1${options}$4`);
  }

  const featuresRegex = new RegExp(
    `(<div([^>]*\\bdata-content-key="${key}"[^>]*\\bclass="[^"]*service-features[^"]*"[^>]*)>)([\\s\\S]*?)(<\\/div>)`,
    "i"
  );
  if (featuresRegex.test(html)) {
    const rows = list.map((value) => `<div class="service-feature">${escapeHtml(value)}</div>`).join("");
    return html.replace(featuresRegex, `$1${rows}$4`);
  }

  const nextStepsRegex = new RegExp(
    `(<div([^>]*\\bdata-content-key="${key}"[^>]*)>)([\\s\\S]*?)(<\\/div>)`,
    "i"
  );
  if (nextStepsRegex.test(html)) {
    const rows = list
      .map(
        (value, index) => `<div style="display:flex;gap:0.75rem;align-items:flex-start;">
              <div style="width:22px;height:22px;border-radius:50%;background:var(--accent-teal-dim);border:1px solid rgba(0,212,168,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.65rem;font-weight:700;color:var(--accent-teal);">${index + 1}</div>
              <div class="balance-wrap" style="font-size:0.85rem;color:var(--text-secondary);">${escapeHtml(value)}</div>
            </div>`
      )
      .join("");
    return html.replace(nextStepsRegex, `$1${rows}$4`);
  }

  return html;
}

function withFaqItemsReplacement(
  html: string,
  contentKey: string,
  value: Array<{ question?: unknown; answer?: unknown }>
): string {
  const rows = value
    .map((item) => ({
      question: typeof item.question === "string" ? item.question.trim() : "",
      answer: typeof item.answer === "string" ? item.answer.trim() : "",
    }))
    .filter((item) => item.question && item.answer);
  if (rows.length < 1) return html;
  const key = keyRegexFragment(contentKey);
  const containerRegex = new RegExp(
    `(<div([^>]*\\bdata-content-key="${key}"[^>]*)>)([\\s\\S]*?)(<\\/div>)`,
    "i"
  );
  if (!containerRegex.test(html)) return html;

  const details = rows
    .map(
      (item) => `<details class="faq-item">
        <summary class="faq-q">${escapeHtml(item.question)}<span class="faq-icon">+</span></summary>
        <div class="faq-a">${escapeHtml(item.answer)}</div>
      </details>`
    )
    .join("\n\n      ");

  return html.replace(containerRegex, `$1\n\n      ${details}\n\n    $4`);
}

function withTeamMembersReplacement(
  html: string,
  contentKey: string,
  value: Array<Record<string, unknown>>
): string {
  const members = value
    .map((item, index) => {
      const id = typeof item.id === "string" ? item.id.trim() : "";
      const initials = typeof item.initials === "string" ? item.initials.trim() : "";
      const name = typeof item.name === "string" ? item.name.trim() : "";
      const role = typeof item.role === "string" ? item.role.trim() : "";
      const bio = typeof item.bio === "string" ? item.bio.trim() : "";
      const accentStyle = typeof item.accentStyle === "string" ? item.accentStyle.trim() : "";
      const isActive = item.isActive === undefined ? true : Boolean(item.isActive);
      if (!id || !name || !role || !bio || !isActive) return null;
      return { initials, name, role, bio, accentStyle, index };
    })
    .filter(
      (
        item
      ): item is {
        initials: string;
        name: string;
        role: string;
        bio: string;
        accentStyle: string;
        index: number;
      } => item !== null
    );
  if (members.length < 1) return html;

  const key = keyRegexFragment(contentKey);
  const containerRegex = new RegExp(
    `(<div([^>]*\\bdata-content-key="${key}"[^>]*)>)([\\s\\S]*?)(<\\/div>)`,
    "i"
  );
  if (!containerRegex.test(html)) return html;

  const cards = members
    .map((member) => {
      const revealClass = member.index === 0 ? "reveal" : `reveal reveal-delay-${Math.min(member.index, 3)}`;
      const styleAttr = member.accentStyle ? ` style="${escapeHtml(member.accentStyle)}"` : "";
      return `<div class="team-card ${revealClass}">
        <div class="team-avatar">
          <div class="team-avatar-initials"${styleAttr}>${escapeHtml(member.initials)}</div>
        </div>
        <div class="team-info">
          <div class="team-name">${escapeHtml(member.name)}</div>
          <div class="team-role">${escapeHtml(member.role)}</div>
          <div class="team-bio">${escapeHtml(member.bio)}</div>
        </div>
      </div>`;
    })
    .join("\n      ");

  return html.replace(containerRegex, `$1\n      ${cards}\n    $4`);
}

function withStructuredListReplacement(
  html: string,
  contentKey: string,
  value: Array<Record<string, unknown>>
): string {
  const rows = value
    .map((item) => ({
      category: typeof item.category === "string" ? item.category.trim() : "",
      label: typeof item.label === "string" ? item.label.trim() : "",
    }))
    .filter((item) => item.category && item.label);
  if (rows.length < 1) return html;

  const key = keyRegexFragment(contentKey);
  const containerRegex = new RegExp(
    `(<div([^>]*\\bdata-content-key="${key}"[^>]*)>)([\\s\\S]*?)(<\\/div>)`,
    "i"
  );
  if (!containerRegex.test(html)) return html;

  const markup = rows
    .map(
      (row) =>
        `<div class="stack-item"><div class="stack-category">${escapeHtml(row.category)}</div>${escapeHtml(row.label)}</div>`
    )
    .join("\n      ");

  return html.replace(containerRegex, `$1\n      ${markup}\n    $4`);
}

async function fetchStaticContentForPage(pageId: StaticContentPageId): Promise<Record<string, unknown> | null> {
  const rawBase = process.env.WORKER_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (!rawBase) return null;

  const base = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;
  const url = new URL(`${base}/public/static-content`);
  url.searchParams.set("pageId", pageId);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as StaticContentApiResponse;
    if (!body.content || typeof body.content !== "object") return null;
    return body.content;
  } catch {
    return null;
  }
}

async function applyStaticContent(routePath: string, html: string): Promise<string> {
  const pageId = STATIC_CONTENT_ROUTE_PAGE_MAP[routePath];
  if (!pageId) return html;

  const content = await fetchStaticContentForPage(pageId);
  if (!content) return html;

  let rendered = html;
  for (const [contentKey, rawValue] of Object.entries(content)) {
    const registryEntry = STATIC_CONTENT_REGISTRY_BY_KEY.get(contentKey);
    if (!registryEntry) continue;

    if (registryEntry.fieldType === "text" || registryEntry.fieldType === "multiline_text") {
      if (typeof rawValue !== "string") continue;
      rendered = withTextReplacement(
        rendered,
        contentKey,
        rawValue,
        registryEntry.renderMode === "template_fragment"
      );
      continue;
    }

    if (registryEntry.fieldType === "string_list") {
      if (!Array.isArray(rawValue)) continue;
      rendered = withStringListReplacement(rendered, contentKey, rawValue as string[]);
      continue;
    }

    if (registryEntry.fieldType === "faq_items") {
      if (!Array.isArray(rawValue)) continue;
      rendered = withFaqItemsReplacement(
        rendered,
        contentKey,
        rawValue as Array<{ question?: unknown; answer?: unknown }>
      );
      continue;
    }

    if (registryEntry.fieldType === "team_members") {
      if (!Array.isArray(rawValue)) continue;
      rendered = withTeamMembersReplacement(rendered, contentKey, rawValue as Array<Record<string, unknown>>);
      continue;
    }

    if (registryEntry.fieldType === "structured_list") {
      if (!Array.isArray(rawValue)) continue;
      rendered = withStructuredListReplacement(
        rendered,
        contentKey,
        rawValue as Array<Record<string, unknown>>
      );
    }
  }

  return rendered;
}

function withInlineEditorScript(html: string): string {
  const scriptTag = '<script src="/admin-inline-editor.js" defer></script>';
  if (html.includes(scriptTag)) return html;
  if (html.includes("</body>")) {
    return html.replace("</body>", `  ${scriptTag}\n</body>`);
  }
  return `${html}\n${scriptTag}`;
}

export async function serveSiteFile(routePath: string): Promise<Response | null> {
  const entry = SITE_FILE_MAP[routePath];
  if (!entry) return null;

  const filePath = path.join(/* turbopackIgnore: true */ process.cwd(), entry.file);
  const template = await readFile(filePath, "utf8");
  const contents = entry.contentType.startsWith("text/html")
    ? withInlineEditorScript(await applyStaticContent(routePath, template))
    : template;
  return new Response(contents, {
    headers: {
      "content-type": entry.contentType,
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
