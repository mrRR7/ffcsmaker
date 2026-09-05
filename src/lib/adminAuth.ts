// Admin authentication helpers.
//
// Previously the "admin_session" cookie's value was the raw ADMIN_SECRET_KEY
// itself, compared with a plain `!==`. That meant the one shared admin
// password sat in plaintext in every admin browser's cookie jar for 24h, and
// there was no rate limiting on the login route at all. This module fixes
// both:
//
//  - The cookie now holds a short-lived HMAC-signed session token derived
//    from the secret, never the secret itself. Leaking the cookie no longer
//    hands over the permanent admin password.
//  - Password comparisons and token verification both run in constant time
//    via Web Crypto (digest/HMAC), instead of `!==`/`===` on raw strings.
//  - `checkAdminAuthRateLimit` throttles login attempts per IP.
//
// Uses the global Web Crypto API (`crypto.subtle`) exclusively so this file
// works unchanged in both the Node.js API routes and the Edge middleware.

import { rateLimit, type RateLimitResult } from "./rateLimit";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

const encoder = new TextEncoder();

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return toHex(digest);
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time comparison of two equal-length hex strings. */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Constant-time-ish comparison of the submitted password against the secret. */
export async function verifyAdminPassword(password: unknown): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET_KEY;
  if (!secret || typeof password !== "string" || password.length === 0) {
    return false;
  }
  const [passwordHash, secretHash] = await Promise.all([
    sha256Hex(password),
    sha256Hex(secret)
  ]);
  return timingSafeEqualHex(passwordHash, secretHash);
}

/** Issues a new signed, time-limited session token. Never the raw secret. */
export async function createAdminSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_SECRET_KEY;
  if (!secret) {
    throw new Error("ADMIN_SECRET_KEY is not configured");
  }
  const issuedAt = Date.now().toString();
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(issuedAt));
  return `${issuedAt}.${toHex(signature)}`;
}

/** Verifies a session token's signature and expiry. */
export async function isValidAdminSessionToken(
  token: string | undefined | null
): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET_KEY;
  if (!secret || !token) {
    return false;
  }

  const separatorIndex = token.indexOf(".");
  if (separatorIndex <= 0) {
    return false;
  }
  const issuedAtRaw = token.slice(0, separatorIndex);
  const signatureHex = token.slice(separatorIndex + 1);
  if (!issuedAtRaw || !signatureHex) {
    return false;
  }

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) {
    return false;
  }

  const now = Date.now();
  const ageMs = now - issuedAt;
  const CLOCK_SKEW_TOLERANCE_MS = 60_000;
  if (ageMs < -CLOCK_SKEW_TOLERANCE_MS) {
    return false; // token claims to be issued in the future
  }
  if (ageMs > ADMIN_SESSION_MAX_AGE_SECONDS * 1000) {
    return false; // expired
  }

  try {
    const key = await hmacKey(secret);
    const expectedSignature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(issuedAtRaw)
    );
    return timingSafeEqualHex(toHex(expectedSignature), signatureHex);
  } catch {
    return false;
  }
}

const AUTH_RATE_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 };

/** Throttles login attempts per client key (normally the caller's IP). */
export function checkAdminAuthRateLimit(clientKey: string): RateLimitResult {
  return rateLimit(`admin-auth:${clientKey}`, AUTH_RATE_LIMIT);
}
