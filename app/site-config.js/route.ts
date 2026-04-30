export const runtime = "nodejs";

export async function GET() {
  // Same-origin proxy (`app/api/worker/*`) so portfolio + public API work on every
  // Vercel hostname without expanding Worker `CORS_ALLOWLIST`.
  const apiBaseUrl = "/api/worker";
  const contents = `window.__SITE_CONFIG = ${JSON.stringify({ apiBaseUrl })};`;
  return new Response(contents, {
    headers: {
      "content-type": "text/javascript; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
