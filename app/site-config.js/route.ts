export const runtime = "nodejs";

export async function GET() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const contents = `window.__SITE_CONFIG = ${JSON.stringify({ apiBaseUrl })};`;
  return new Response(contents, {
    headers: {
      "content-type": "text/javascript; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
