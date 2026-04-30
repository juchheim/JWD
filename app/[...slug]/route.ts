import { serveSiteFile } from "../../lib/siteFiles";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
  const routePath = `/${slug.join("/")}`;
  const response = await serveSiteFile(routePath);
  return response ?? new Response("Not found", { status: 404 });
}
