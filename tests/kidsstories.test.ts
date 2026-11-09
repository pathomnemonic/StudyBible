import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseRefs } from '../src/lib/refs';
import { BOOK_BY_ID } from '../src/lib/canon';

const read = (f: string) => JSON.parse(readFileSync(new URL(`../public/data/${f}`, import.meta.url), 'utf8'));
const a = read('kids_stories.json').stories;
const b = read('kids_stories2.json').stories;
const all = [...a, ...b];
const AGES = ['4-6', '7-9', '10-12'];
const words = (t: string) => t.split(/\s+/).filter(Boolean).length;
const sentences = (t: string) => t.split(/(?<=[.!?])['’”]?\s+/).filter(Boolean);

describe('second set of children’s stories', () => {
  it('brings the total to about 150', () => {
    expect(b.length).toBeGreaterThanOrEqual(75);
    expect(all.length).toBeGreaterThanOrEqual(143);
  });
  it('has unique ids across both files', () => {
    expect(new Set(all.map((s: any) => s.id)).size).toBe(all.length);
  });
  it('has the required fields', () => {
    for (const s of b) {
      expect(['OT', 'NT', 'saint'], s.id).toContain(s.testament);
      expect(s.title?.length, s.id).toBeGreaterThan(3);
      expect(s.emoji, s.id).toBeTruthy();
      expect(typeof s.hue, s.id).toBe('number');
      expect(s.refs.length, s.id).toBeGreaterThan(0);
      expect(s.talk.length, s.id).toBeGreaterThanOrEqual(3);
      expect(s.memory, s.id).toBeTruthy();
      expect(s.prayer?.length, s.id).toBeGreaterThan(15);
      const [x, y, z] = AGES.map((k) => s.text[k] as string);
      expect(x.length, s.id).toBeGreaterThan(150);
      expect(y.length, `${s.id} 7-9`).toBeGreaterThan(x.length);
      expect(z.length, `${s.id} 10-12`).toBeGreaterThan(300);
      for (const v of s.vocab ?? []) { expect(v.word).toBeTruthy(); expect(v.means).toBeTruthy(); }
    }
  });
  it('has references that parse and exist in the canon', () => {
    for (const s of b) {
      for (const r of [...s.refs, s.memory]) {
        const p = parseRefs(r);
        expect(p.ok, `${s.id}: ${r}`).toBe(true);
        if (p.ok) for (const x of p.refs) {
          const book = BOOK_BY_ID[x.ref.book];
          expect(book, `${s.id}: ${r}`).toBeTruthy();
          expect(x.ref.c2, `${s.id}: ${r}`).toBeLessThanOrEqual(book.chapters);
        }
      }
    }
  });
  it('uses short sentences, and no above or below', () => {
    for (const s of b) {
      const limits: Record<string, number> = { '4-6': 14, '7-9': 22, '10-12': 28 };
      for (const k of AGES) {
        const t = s.text[k] as string;
        const ss = sentences(t);
        expect(words(t) / ss.length, `${s.id} ${k} average sentence length`).toBeLessThan(limits[k]);
      }
      const all = JSON.stringify(s).toLowerCase();
      expect(all, s.id).not.toMatch(/\b(above|below)\b/);
    }
  });
});
