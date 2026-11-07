import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { PNG_SIZES } from './fixtures/launchSizes';

const pngSize = (f: string) => { const b = readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const read = (f: string) => readFileSync(f, 'utf8');

describe('launch kit', () => {
  it('has every icon at its required size', () => {
    for (const [f, [w, h]] of Object.entries(PNG_SIZES)) {
      expect(existsSync(f), f).toBe(true);
      expect(pngSize(f), f).toEqual([w, h]);
    }
  });
  it('iOS 1024 icon has no alpha channel', () => {
    const b = readFileSync('store/ios/AppIcon/AppIcon-1024.png');
    const colorType = b[25]; // PNG IHDR colour type: 2 = RGB, 6 = RGBA, 3 = palette
    expect([2, 3]).toContain(colorType);
  });
  it('manifest source declares what stores and browsers need', () => {
    const v = read('vite.config.ts');
    for (const k of ["id: 'org.cathology.app'", "display: 'standalone'", "categories:", "purpose: 'maskable'", "scope:"]) expect(v, k).toContain(k);
    expect(read('index.html')).toMatch(/apple-touch-icon/);
    expect(read('index.html')).toMatch(/apple-mobile-web-app-capable/);
  });
  it('store listing fields respect the stores’ limits', () => {
    const a = read('store/android/listing.md');
    expect(a.match(/\*\*App name \(30\):\*\* (.+)/)![1].length).toBeLessThanOrEqual(30);
    expect(a.match(/\*\*Short description \(80\):\*\* (.+)/)![1].length).toBeLessThanOrEqual(80);
    const i = read('store/ios/listing.md');
    expect(i.match(/\*\*Name \(30\):\*\* (.+)/)![1].length).toBeLessThanOrEqual(30);
    expect(i.match(/\*\*Subtitle \(30\):\*\* (.+)/)![1].length).toBeLessThanOrEqual(30);
    expect(i.match(/\*\*Keywords \(100\):\*\* (.+)/)![1].length).toBeLessThanOrEqual(100);
    expect(i.match(/\*\*Promotional text \(170\):\*\* (.+)/)![1].length).toBeLessThanOrEqual(170);
  });
  it('screenshots exist for each store size and stay small enough to commit', () => {
    for (const d of ['android/screenshots/phone', 'ios/screenshots/iphone-6.7', 'ios/screenshots/ipad-12.9']) {
      for (const s of ['today', 'read', 'learn', 'game']) { const f = `store/${d}-${s}.png`; expect(existsSync(f), f).toBe(true); expect(statSync(f).size).toBeLessThan(900_000); }
    }
  });
});
