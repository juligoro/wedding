const encoder = new TextEncoder();

export const ADMIN_COOKIE_NAME = "wedding_admin_session";
export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || "";
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlEncodeText(value: string): string {
  return base64UrlEncodeBytes(encoder.encode(value));
}

function base64UrlDecodeText(value: string): string {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));

  return base64UrlEncodeBytes(new Uint8Array(signature));
}

export async function createAdminSession(): Promise<string> {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET");
  }

  const payload = base64UrlEncodeText(
    JSON.stringify({
      exp: Date.now() + ADMIN_SESSION_MAX_AGE * 1000,
    }),
  );
  const signature = await sign(payload, secret);

  return `${payload}.${signature}`;
}

export async function verifyAdminSession(token: string | null | undefined): Promise<boolean> {
  const secret = getSessionSecret();

  if (!secret || !token) {
    return false;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = await sign(payload, secret);

  if (signature !== expectedSignature) {
    return false;
  }

  try {
    const session = JSON.parse(base64UrlDecodeText(payload));

    return typeof session.exp === "number" && session.exp > Date.now();
  } catch {
    return false;
  }
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
