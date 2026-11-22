import { describe, expect, it } from 'vitest';
import { TIP_URL, tipVisible } from '../src/lib/tip';

describe('the tip link', () => {
  it('points at the one tip page, over https', () => { expect(TIP_URL).toBe('https://ko-fi.com/pathomnemonic'); });
  it('shows on the web, and not inside a native store app', () => {
    expect(tipVisible(undefined)).toBe(true);
    expect(tipVisible({})).toBe(true);
    expect(tipVisible({ Capacitor: { isNativePlatform: () => false } })).toBe(true);
    expect(tipVisible({ Capacitor: { isNativePlatform: () => true } })).toBe(false);
  });
});
