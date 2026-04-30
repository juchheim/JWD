export type SignedAssetParams = {
  key: string;
  exp: number;
  sig: string;
};

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function constantTimeEqual(a: string, b: string): boolean {
  let aBytes: Uint8Array;
  let bBytes: Uint8Array;
  try {
    aBytes = fromBase64Url(a);
    bBytes = fromBase64Url(b);
  } catch {
    return false;
  }
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function payload(key: string, exp: number, scope: "read" | "upload"): string {
  return `${scope}:${key}:${exp}`;
}

export async function signAssetKey(
  key: string,
  exp: number,
  secret: string,
  scope: "read" | "upload" = "read"
): Promise<string> {
  const hmacKey = await getHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    encoder.encode(payload(key, exp, scope))
  );
  return toBase64Url(signature);
}

export async function verifySignature(
  key: string,
  exp: number,
  sig: string,
  secret: string,
  scope: "read" | "upload" = "read"
): Promise<boolean> {
  const expected = await signAssetKey(key, exp, secret, scope);
  return constantTimeEqual(sig, expected);
}

export async function generateSignedAssetUrl(input: {
  origin: string;
  key: string;
  ttlSeconds: number;
  secret: string;
}): Promise<{ signedUrl: string; expiresAt: string; exp: number }> {
  const exp = Math.floor(Date.now() / 1000) + input.ttlSeconds;
  const sig = await signAssetKey(input.key, exp, input.secret, "read");
  const encodedKey = encodeURIComponent(input.key);
  const signedUrl = `${input.origin}/public/assets/${encodedKey}?exp=${exp}&sig=${encodeURIComponent(sig)}`;
  return {
    signedUrl,
    expiresAt: new Date(exp * 1000).toISOString(),
    exp,
  };
}

export async function generateSignedUploadUrl(input: {
  origin: string;
  key: string;
  ttlSeconds: number;
  secret: string;
}): Promise<{ uploadUrl: string; expiresAt: string; exp: number }> {
  const exp = Math.floor(Date.now() / 1000) + input.ttlSeconds;
  const sig = await signAssetKey(input.key, exp, input.secret, "upload");
  const encodedKey = encodeURIComponent(input.key);
  const uploadUrl = `${input.origin}/admin/uploads/${encodedKey}?exp=${exp}&sig=${encodeURIComponent(sig)}`;
  return {
    uploadUrl,
    expiresAt: new Date(exp * 1000).toISOString(),
    exp,
  };
}

export function parseSignedUploadRequest(url: URL): SignedAssetParams | null {
  const prefix = "/admin/uploads/";
  if (!url.pathname.startsWith(prefix)) return null;
  const rawKey = url.pathname.slice(prefix.length);
  if (!rawKey) return null;

  const expRaw = url.searchParams.get("exp");
  const sig = url.searchParams.get("sig");
  if (!expRaw || !sig) return null;

  const exp = Number.parseInt(expRaw, 10);
  if (!Number.isFinite(exp)) return null;

  return {
    key: decodeURIComponent(rawKey),
    exp,
    sig,
  };
}

export function parseSignedAssetRequest(url: URL): SignedAssetParams | null {
  const prefix = "/public/assets/";
  if (!url.pathname.startsWith(prefix)) return null;
  const rawKey = url.pathname.slice(prefix.length);
  if (!rawKey) return null;

  const expRaw = url.searchParams.get("exp");
  const sig = url.searchParams.get("sig");
  if (!expRaw || !sig) return null;

  const exp = Number.parseInt(expRaw, 10);
  if (!Number.isFinite(exp)) return null;

  return {
    key: decodeURIComponent(rawKey),
    exp,
    sig,
  };
}
