import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
vi.stubGlobal('window', { matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) });

describe('settings from old versions, backups and other devices', () => {
  beforeEach(() => { store.clear(); vi.resetModules(); });
  it('replaces wrong kinds of value with defaults and keeps valid ones', async () => {
    store.set('studybible.settings.v1', JSON.stringify({ fontSize: 'big', lineHeight: null, theme: 7, showVerseNumbers: 'yes', margin: Infinity, reminders: 5, ambience: 'loud', focus: 'abc' }));
    const { getSettings, DEFAULTS } = await import('../src/lib/store');
    const s = getSettings() as any;
    expect(s.fontSize).toBe(DEFAULTS.fontSize);
    expect(s.theme).toBe(DEFAULTS.theme);
    expect(s.showVerseNumbers).toBe(DEFAULTS.showVerseNumbers);
    expect(typeof s.ambience).toBe('object');
    expect(typeof s.focus).toBe('object');
    expect(Object.keys(s.focus)).not.toContain('0');
  });
  it('survives text that is not JSON, and JSON that is not an object', async () => {
    for (const raw of ['{oops', 'null', '[]', '"x"', '12']) {
      store.set('studybible.settings.v1', raw);
      vi.resetModules();
      const { getSettings, DEFAULTS } = await import('../src/lib/store');
      expect(getSettings().fontSize, raw).toBe(DEFAULTS.fontSize);
    }
  });
});
