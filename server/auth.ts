import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;
const PARAMS = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 64, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [scheme, N, r, p, salt, key] = stored.split('$');
  if (scheme !== 'scrypt') return false;
  const expect = Buffer.from(key, 'base64');
  const got = await scrypt(pw, Buffer.from(salt, 'base64'), expect.length, { N: +N, r: +r, p: +p, maxmem: 64 * 1024 * 1024 });
  return got.length === expect.length && timingSafeEqual(got, expect);
}

export const newToken = () => randomBytes(32).toString('base64url');
export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

export function validateEmail(e: unknown): string | null {
  if (typeof e !== 'string') return null;
  const v = e.trim().toLowerCase();
  return v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
}

/** Length first (long passphrases welcome), then a short deny-list; no composition rules. */
export function passwordProblem(pw: unknown, email: string): string | null {
  if (typeof pw !== 'string') return 'Password is required.';
  if (pw.length < 10) return 'Use at least 10 characters (a short phrase works well).';
  if (pw.length > 200) return 'Password is too long.';
  const lower = pw.toLowerCase();
  if (lower.includes(email.split('@')[0]) && email.split('@')[0].length >= 4) return 'Password should not contain your email name.';
  if (['password12', 'passwordpassword', '1234567890', 'qwertyuiop', 'letmeinplease'].some((w) => lower.includes(w))) return 'That password is too common.';
  return null;
}

/** Tiny in-memory sliding-window limiter (per process). */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(private max: number, private windowMs: number) {}
  take(key: string): boolean {
    const now = Date.now();
    const arr = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (arr.length >= this.max) {
      this.hits.set(key, arr);
      return false;
    }
    arr.push(now);
    this.hits.set(key, arr);
    return true;
  }
  reset(key: string) {
    this.hits.delete(key);
  }
}
