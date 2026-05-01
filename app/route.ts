import { serveSiteFile } from "../lib/siteFiles";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const response = await serveSiteFile("/", request.url);
  return response ?? new Response("Not found", { status: 404 });
}
