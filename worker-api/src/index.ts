import {
  generateSignedAssetUrl,
  parseSignedAssetRequest,
  verifySignature,
} from "./signedUrls";

type Env = {
  ASSETS: R2Bucket;
  ASSET_SIGNING_SECRET: string;
};

const DEFAULT_SIGNED_URL_TTL_SECONDS = 5 * 60;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
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

    if (request.method === "POST" && url.pathname === "/public/assets/sign-read") {
      return handleSignRead(request, env);
    }

    if (request.method === "GET" && url.pathname.startsWith("/public/assets/")) {
      return handleAssetDelivery(request, env);
    }

    return json({ ok: true, service: "worker-api", message: "ready" });
  },
};
