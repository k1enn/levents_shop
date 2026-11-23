import { b64, safeEqual, unb64 } from "./crypto.server";

// OWASP figure for PBKDF2 SHA256. Old hashes still verify: the count is stored per hash.
const ITERATIONS = 600_000;

async function derive(pw: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256));
}

// stored as: pbkdf2$<iterations>$<saltB64>$<hashB64>
export async function hashPassword(pw: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(await derive(pw, salt, ITERATIONS))}`;
}

export async function verifyPassword(pw: string, stored: string) {
  const [kind, it, salt, hash] = stored.split("$");
  const iterations = Number(it);
  if (kind !== "pbkdf2" || !Number.isInteger(iterations) || iterations < 1) return false;
  return safeEqual(await derive(pw, unb64(salt), iterations), unb64(hash));
}
