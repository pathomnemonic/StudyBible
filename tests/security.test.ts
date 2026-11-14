import { describe, expect, it } from 'vitest';
import { base32Decode, base32Encode, hashRecovery, lockMs, newRecoveryCodes, newTotpSecret, otpauthUrl, totpAt, verifyTotp } from '../server/security';

// RFC 6238 appendix B test vector: ASCII secret "12345678901234567890", SHA-1, 8 digits, T=59 s -> 94287082 (so 6 digits: 287082)
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890'));
describe('two-factor codes', () => {
  it('matches the RFC 6238 test vectors', () => {
    expect(totpAt(RFC_SECRET, Math.floor(59 / 30), 8)).toBe('94287082');
    expect(totpAt(RFC_SECRET, Math.floor(1111111109 / 30), 8)).toBe('07081804');
    expect(totpAt(RFC_SECRET, Math.floor(2000000000 / 30), 8)).toBe('69279037');
  });
  it('round-trips base32', () => {
    const b = Buffer.from([1, 2, 3, 250, 251, 252, 0, 99]);
    expect(base32Decode(base32Encode(b))).toEqual(b);
    expect(() => base32Decode('!!!')).toThrow();
  });
  it('accepts the current code and one step either side, and nothing else', () => {
    const s = newTotpSecret(), now = 1_700_000_000_000, step = Math.floor(now / 30_000);
    expect(verifyTotp(s, totpAt(s, step), now)).toBe(step);
    expect(verifyTotp(s, totpAt(s, step - 1), now)).toBe(step - 1);
    expect(verifyTotp(s, totpAt(s, step + 1), now)).toBe(step + 1);
    expect(verifyTotp(s, totpAt(s, step + 3), now)).toBeNull();
    expect(verifyTotp(s, '12345', now)).toBeNull();
    expect(verifyTotp(s, 'abcdef', now)).toBeNull();
  });
  it('refuses a code from a step already used (no replay)', () => {
    const s = newTotpSecret(), now = 1_700_000_000_000, step = Math.floor(now / 30_000);
    expect(verifyTotp(s, totpAt(s, step), now, step)).toBeNull();
    expect(verifyTotp(s, totpAt(s, step + 1), now, step)).toBe(step + 1);
  });
  it('builds an authenticator link', () => {
    const u = otpauthUrl('a@b.org', 'ABC234', 'Cathology');
    expect(u).toMatch(/^otpauth:\/\/totp\/Cathology:a%40b\.org\?secret=ABC234&issuer=Cathology/);
  });
});

describe('recovery codes and lockout', () => {
  it('makes ten distinct codes whose hashes match however the person types them', () => {
    const { codes, hashes } = newRecoveryCodes();
    expect(new Set(codes).size).toBe(10);
    expect(codes[0]).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
    expect(hashRecovery(`  ${codes[0].toUpperCase()} `)).toBe(hashes[0]);
    expect(hashRecovery(codes[0].replace(/-/g, ''))).not.toBe(hashes[0]);
  });
  it('locks only after repeated failures, for longer each time, up to an hour', () => {
    expect(lockMs(7)).toBe(0);
    expect(lockMs(8)).toBe(5 * 60_000);
    expect(lockMs(9)).toBe(10 * 60_000);
    expect(lockMs(40)).toBe(60 * 60_000);
  });
});
