import { randomBytes, pbkdf2Sync, timingSafeEqual } from "crypto";

export function makeSalt(): string {
  return randomBytes(16).toString("hex");
}

export function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 120_000, 32, "sha256").toString("hex");
}

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const next = Buffer.from(hashPassword(password, salt), "hex");
  const prev = Buffer.from(storedHash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}
