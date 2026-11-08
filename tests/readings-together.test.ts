import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const read = (rel: string) => JSON.parse(readFileSync(`public/data/${rel}`, 'utf8'));

describe('readings together', () => {
  for (const y of [2026, 2027, 2028]) {
    const file = `public/data/readings-together/${y}.json`;
    it(`${y}: has days, and every written quotation exists verbatim in its source file`, () => {
      expect(existsSync(file)).toBe(true);
      const days = read(`readings-together/${y}.json`).days as Record<string, any>;
      expect(Object.keys(days).length).toBeGreaterThan(20);
      let checked = 0;
      for (const [date, d] of Object.entries(days)) {
        if (!d.quote) continue;
        const src = read(d.quote.file);
        const items = src.groups.flatMap((g: any) => g.items) as { a: string; t: string }[];
        const hit = items.find((it) => it.a === d.quote.author && it.t.includes(d.quote.text));
        expect(hit, `${date}: ${d.quote.author}`).toBeTruthy();
        expect(d.quote.text.length).toBeGreaterThan(80);
        checked++;
      }
      expect(checked).toBeGreaterThan(15);
    });
    it(`${y}: links only name the readings of that day`, () => {
      const days = read(`readings-together/${y}.json`).days as Record<string, any>;
      for (const [date, d] of Object.entries(days)) for (const l of d.links) {
        expect(d.readings[l.a], `${date} ${l.a}`).toBeTruthy();
        expect(d.readings[l.b], `${date} ${l.b}`).toBeTruthy();
        expect(l.from && l.to).toBeTruthy();
      }
    });
  }
});
