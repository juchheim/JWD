import { serveSiteFile } from "../lib/siteFiles";

export const runtime = "nodejs";

export async function GET() {
  const response = await serveSiteFile("/");
  return response ?? new Response("Not found", { status: 404 });
}
