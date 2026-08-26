import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";

/**
 * Password hashing, kept separate from lib/users.ts so command-line scripts
 * (prisma/make-admin.ts) can use it. users.ts carries `import "server-only"`,
 * which only resolves inside the Next bundler.
 *
 * scrypt comes from Node's own crypto module — deliberately not bcrypt/argon2,
 * which are native modules that complicate serverless builds. It is memory-hard
 * and a sanctioned choice for password storage.
 */

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

export const KEY_LEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LEN);
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  try {
    const salt = Buffer.from(saltB64, "base64url");
    const expected = Buffer.from(hashB64, "base64url");
    const actual = await scrypt(password, salt, expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** A throwaway hash, used to keep sign-in timing constant for unknown emails. */
export function decoyHash(): string {
  return `scrypt$${randomBytes(16).toString("base64url")}$${randomBytes(KEY_LEN).toString("base64url")}`;
}
