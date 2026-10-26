import { readFileSync, existsSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
  globalThis.fetch = (async (url: string) => {
    const p = `public${String(url).replace(/^https?:\/\/[^/]+/, '').replace(/^\.?\//, '/')}`;
    if (!existsSync(p)) return { ok: false, status: 404, json: async () => null } as Response;
    const txt = readFileSync(p, 'utf8');
    return { ok: true, status: 200, json: async () => JSON.parse(txt) } as Response;
  }) as typeof fetch;
});

describe('pictures in the text', () => {
  it('never shows the same picture, or two pictures at the same spot, twice in a chapter', async () => {
    const { artForChapter } = await import('../src/study/inlineArt');
    const ed = JSON.parse(readFileSync('public/data/editions.json', 'utf8')) as { editions: { scheme: string; verseCounts: Record<string, number[]> }[] };
    const vul = ed.editions.find((e) => e.scheme === 'vulgate')!;
    let shown = 0;
    for (const [book, chs] of Object.entries(vul.verseCounts)) for (let c = 1; c <= chs.length; c++) {
      const figs = await artForChapter(book, [c]);
      shown += figs.length;
      const titles = figs.map((f) => f.title.toLowerCase().replace(/[^a-z0-9]+/g, ''));
      expect(new Set(titles).size, `${book} ${c}: ${titles.join(' | ')}`).toBe(titles.length);
      const spots = figs.map((f) => `${f.ref.c1}.${f.ref.v1}`);
      expect(new Set(spots).size, `${book} ${c}: spots ${spots.join(',')}`).toBe(spots.length);
      expect(figs.length).toBeLessThanOrEqual(3);
    }
    expect(shown).toBeGreaterThan(300);
  }, 300000);
});
