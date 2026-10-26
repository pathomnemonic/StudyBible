import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { KEY_LESSONS } from '../src/curriculum/keyLessons';

describe('key lessons', () => {
  it('name real lessons, few per grade, in each grade', () => {
    for (const [g, ids] of Object.entries(KEY_LESSONS)) {
      const d = JSON.parse(readFileSync(new URL(`../public/data/curriculum/grade-${g}.json`, import.meta.url), 'utf8'));
      const all = new Set(d.units.flatMap((u: { lessons: { id: string }[] }) => u.lessons.map((l) => l.id)));
      expect(ids.length, `grade ${g}`).toBeLessThanOrEqual(6);
      expect(ids.length, `grade ${g}`).toBeGreaterThanOrEqual(4);
      for (const id of ids) expect(all.has(id), id).toBe(true);
    }
  });
  it('together cover the essentials the program promises', () => {
    const titles: string[] = [];
    for (const [g, ids] of Object.entries(KEY_LESSONS)) {
      const d = JSON.parse(readFileSync(new URL(`../public/data/curriculum/grade-${g}.json`, import.meta.url), 'utf8'));
      for (const u of d.units) for (const l of u.lessons) if (ids.includes(l.id)) titles.push(l.title.toLowerCase());
    }
    const text = titles.join(' | ');
    for (const w of ['trinity', 'true god', 'resurrection', 'creed', 'baptism', 'present', 'confession|reconciliation|penance', 'beatitudes', 'our father', 'heaven|judgment', 'conscience', 'church']) expect(new RegExp(w).test(text), w).toBe(true);
  });
});
