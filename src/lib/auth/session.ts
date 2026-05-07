import "server-only";

const COOKIE_NAME = "aquira_admin_auth";
const SIGNING_PREFIX = "aqüira_session_v1:";

async function hmacSign(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getSecret(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD is not set");
  return password;
}

export async function createSessionToken(): Promise<string> {
  const secret = getSecret();
  return hmacSign(secret, SIGNING_PREFIX + "authenticated");
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const expected = await createSessionToken();
    if (token.length !== expected.length) return false;

    const a = new TextEncoder().encode(token);
    const b = new TextEncoder().encode(expected);
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) {
      mismatch |= a[i] ^ b[i];
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24,
  path: "/",
};
