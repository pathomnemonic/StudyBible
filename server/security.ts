import { createHmac, randomBytes, createHash, timingSafeEqual } from 'node:crypto';

/** Two-factor sign-in (RFC 6238 time-based codes, as used by every authenticator app), one-time recovery codes and the small helpers around them. No dependencies. */

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0, value = 0, out = '';
  for (const b of buf) { value = (value << 8) | b; bits += 8; while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Buffer {
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const c of s.replace(/=+$/, '').toUpperCase().replace(/\s+/g, '')) {
    const i = B32.indexOf(c);
    if (i < 0) throw new Error('Not a valid secret.');
    value = (value << 5) | i; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

export const newTotpSecret = () => base32Encode(randomBytes(20));

/** the six-digit code for a time step (30 seconds) */
export function totpAt(secret: string, step: number, digits = 6): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(step));
  const h = createHmac('sha1', base32Decode(secret)).update(msg).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 10 ** digits).padStart(digits, '0');
}

/** The time step a code matches (this one or one either side, for clock drift), or null. `after` refuses a step already used, so a code cannot be replayed. */
export function verifyTotp(secret: string, code: string, now = Date.now(), after = -1): number | null {
  const c = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(c)) return null;
  const step = Math.floor(now / 30_000);
  for (const s of [step, step - 1, step + 1]) {
    if (s <= after) continue;
    const want = Buffer.from(totpAt(secret, s));
    if (timingSafeEqual(want, Buffer.from(c))) return s;
  }
  return null;
}

export function otpauthUrl(email: string, secret: string, issuer: string): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
/** ten one-time codes shaped like "k3x9-m2pq-7vdh"; only their hashes are kept */
export function newRecoveryCodes(n = 10): { codes: string[]; hashes: string[] } {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const codes = Array.from({ length: n }, () => { const r = randomBytes(12); const ch = [...r].map((b) => alphabet[b % alphabet.length]).join(''); return `${ch.slice(0, 4)}-${ch.slice(4, 8)}-${ch.slice(8, 12)}`; });
  return { codes, hashes: codes.map((c) => sha(c)) };
}
export const normaliseRecovery = (c: string) => c.trim().toLowerCase().replace(/\s+/g, '');
export const hashRecovery = (c: string) => sha(normaliseRecovery(c));

/** how long a failed-sign-in lock lasts, after this many failures in a row (0 means no lock yet) */
export function lockMs(failures: number): number {
  if (failures < 8) return 0;
  return Math.min(60, 5 * 2 ** Math.min(failures - 8, 4)) * 60_000; // 5, 10, 20, 40, 60 minutes
}
