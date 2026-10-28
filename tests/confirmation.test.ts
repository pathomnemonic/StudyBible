import { describe, expect, it } from 'vitest';
import { NAME_SAINTS } from '../src/data/confirmationSaints';
import { rank } from '../src/pages/study/ConfirmationNamePage';

describe('confirmation name saints', () => {
  it('have valid feast dates and no repeated names', () => {
    expect(NAME_SAINTS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(NAME_SAINTS.map((s) => s.name)).size).toBe(NAME_SAINTS.length);
    for (const s of NAME_SAINTS) {
      expect(s.feast, s.name).toMatch(/^\d{2}-\d{2}$/);
      const d = new Date(Date.UTC(2024, +s.feast.slice(0, 2) - 1, +s.feast.slice(3)));
      expect(d.getUTCMonth() + 1, s.name).toBe(+s.feast.slice(0, 2));
      expect(s.why.length, s.name).toBeGreaterThan(20);
      expect(s.tags.length, s.name).toBeGreaterThan(1);
    }
  });
  it('ranks saints by the answers and honors a chosen gender', () => {
    const r = rank(['youth', 'courage', 'g:f']);
    expect(r.length).toBeGreaterThan(2);
    expect(r.every((s) => s.g === 'f')).toBe(true);
    expect(r[0].tags.includes('youth') && r[0].tags.includes('courage')).toBe(true);
  });
});
