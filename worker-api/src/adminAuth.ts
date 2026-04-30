const encoder = new TextEncoder();

export const ADMIN_SESSION_COOKIE = "admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const binary = String.fromCharCode(...array);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(signature);
}

export async function createAdminSessionToken(secret: string): Promise<{
  token: string;
  expiresAt: string;
}> {
  const exp = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS;
  const nonce = crypto.randomUUID();
  const payload = JSON.stringify({ exp, nonce });
  const payloadB64 = toBase64Url(encoder.encode(payload));
  const sig = await sign(payloadB64, secret);
  return {
    token: `${payloadB64}.${sig}`,
    expiresAt: new Date(exp * 1000).toISOString(),
  };
}

export async function verifyAdminSessionToken(
  token: string,
  secret: string
): Promise<boolean> {
  const [payloadB64, providedSig] = token.split(".");
  if (!payloadB64 || !providedSig) return false;

  const expectedSig = await sign(payloadB64, secret);
  let provided: Uint8Array;
  let expected: Uint8Array;
  try {
    provided = fromBase64Url(providedSig);
    expected = fromBase64Url(expectedSig);
  } catch {
    return false;
  }
  if (!constantTimeEqual(provided, expected)) return false;

  try {
    const payloadBytes = fromBase64Url(payloadB64);
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as { exp?: number };
    const exp = payload.exp ?? 0;
    return exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function buildAdminSessionCookie(
  token: string,
  secure = true
): string {
  const attributes = [
    `${ADMIN_SESSION_COOKIE}=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${ADMIN_SESSION_TTL_SECONDS}`,
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

export function clearAdminSessionCookie(secure = true): string {
  const attributes = [
    `${ADMIN_SESSION_COOKIE}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

export function getCookieValue(request: Request, cookieName: string): string | null {
  const raw = request.headers.get("cookie");
  if (!raw) return null;
  const parts = raw.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (part.startsWith(`${cookieName}=`)) return part.slice(cookieName.length + 1);
  }
  return null;
}

export async function safePasswordCompare(
  provided: string,
  expected: string
): Promise<boolean> {
  const providedBytes = encoder.encode(provided);
  const expectedBytes = encoder.encode(expected);
  return constantTimeEqual(providedBytes, expectedBytes);
}
