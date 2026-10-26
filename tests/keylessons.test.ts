import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { KEY_LESSONS } from '../src/curriculum/keyLessons';

describe('key lessons', () => {
  const dir = 'public/data/curriculum';
  const grades = readdirSync(dir).filter((f) => /^grade-.*\.json$/.test(f)).map((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')) as { id: string; units: { lessons: { id: string }[] }[] });
  it('names a handful of real lessons for every grade', () => {
    for (const g of grades) {
      const ids = new Set(g.units.flatMap((u) => u.lessons.map((l) => l.id)));
      const keys = KEY_LESSONS[g.id];
      expect(keys, `grade ${g.id} has key lessons`).toBeTruthy();
      expect(keys.length).toBeGreaterThanOrEqual(5);
      expect(keys.length).toBeLessThanOrEqual(8);
      for (const k of keys) expect(ids.has(k), `${k} exists in grade ${g.id}`).toBe(true);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});
