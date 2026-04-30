export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RAW_WORKER_BASE_URL =
  process.env.WORKER_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";

function buildWorkerUrl(path: string[], search: string): string {
  if (!RAW_WORKER_BASE_URL) {
    throw new Error("Missing WORKER_API_BASE_URL (or NEXT_PUBLIC_API_BASE_URL).");
  }
  const base = RAW_WORKER_BASE_URL.endsWith("/")
    ? RAW_WORKER_BASE_URL.slice(0, -1)
    : RAW_WORKER_BASE_URL;
  const url = new URL(`${base}/${path.join("/")}`);
  url.search = search;
  return url.toString();
}

async function proxyRequest(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const targetUrl = buildWorkerUrl(path, incomingUrl.search);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("host");

  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" || method === "OPTIONS"
      ? undefined
      : await request.arrayBuffer();

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers: requestHeaders,
    body,
    redirect: "manual",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context);
}

export async function OPTIONS(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context);
}
