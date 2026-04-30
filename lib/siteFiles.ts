import { readFile } from "node:fs/promises";
import path from "node:path";

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
};

export async function serveSiteFile(routePath: string): Promise<Response | null> {
  const entry = SITE_FILE_MAP[routePath];
  if (!entry) return null;

  const filePath = path.join(/* turbopackIgnore: true */ process.cwd(), entry.file);
  const contents = await readFile(filePath, "utf8");
  return new Response(contents, {
    headers: {
      "content-type": entry.contentType,
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
