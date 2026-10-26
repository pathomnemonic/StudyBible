import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it, beforeAll } from 'vitest';

// serve /data/... from the repository so the real loaders run in node
beforeAll(() => {
  globalThis.fetch = (async (url: string) => {
    const p = `public${String(url).replace(/^https?:\/\/[^/]+/, '').replace(/^\.?\//, '/')}`;
    if (!existsSync(p)) return { ok: false, status: 404, json: async () => null } as Response;
    const txt = readFileSync(p, 'utf8');
    return { ok: true, status: 200, json: async () => JSON.parse(txt) } as Response;
  }) as typeof fetch;
});

describe('margin counts', () => {
  it('every chapter of every book has sensible margin counts', async () => {
    const { verseResourceCounts } = await import('../src/study/density');
    const ed = JSON.parse(readFileSync('public/data/editions.json', 'utf8')) as { editions: { scheme: string; verseCounts: Record<string, number[]> }[] };
    const vul = ed.editions.find((e) => e.scheme === 'vulgate')!;
    const rows: { book: string; ch: number; max: number; at: number; n: number; chap: number; last: number }[] = [];
    for (const [book, chs] of Object.entries(vul.verseCounts)) {
      for (let c = 1; c <= chs.length; c++) {
        const m = await verseResourceCounts(book, c, chs[c - 1]);
        const vs = [...m.entries()].filter(([k]) => k > 0);
        const [at, max] = vs.sort((a, b) => b[1] - a[1])[0] ?? [0, 0];
        rows.push({ book, ch: c, max, at, n: chs[c - 1], chap: m.get(0) ?? 0, last: m.get(chs[c - 1]) ?? 0 });
      }
    }
    // a verse can be richly annotated, but a count is never absurd, and whole-chapter notes are kept off the verses
    expect(Math.max(...rows.map((r) => r.max))).toBeLessThan(150);
    expect(Math.max(...rows.map((r) => r.chap))).toBeLessThan(60);
    expect(rows.every((r) => Number.isFinite(r.max) && r.max >= 0)).toBe(true);
    expect(rows.length).toBeGreaterThan(1000);
  }, 600000);
});
