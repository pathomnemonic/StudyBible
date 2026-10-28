import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });

describe('sticker book', () => {
  beforeEach(() => { store.clear(); vi.resetModules(); });
  it('gives the saints in order, once for each story, and one sticker for each game each day', async () => {
    const s = await import('../src/lib/stickers');
    expect(s.finishStory('a')?.id).toBe(s.STICKERS[0].id);
    expect(s.finishStory('a')).toBeNull();
    expect(s.finishStory('b')?.id).toBe(s.STICKERS[1].id);
    expect(s.gameSticker('verbum', 100)?.id).toBe(s.STICKERS[2].id);
    expect(s.gameSticker('verbum', 100)).toBeNull();
    expect(s.gameSticker('verbum', 101)?.id).toBe(s.STICKERS[3].id);
    expect(s.loadStickers().length).toBe(4);
  });
  it('has distinct stickers', async () => {
    const s = await import('../src/lib/stickers');
    expect(new Set(s.STICKERS.map((x) => x.id)).size).toBe(s.STICKERS.length);
    expect(s.STICKERS.length).toBeGreaterThanOrEqual(30);
  });
});
