import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseRefs } from '../src/lib/refs';

const d = JSON.parse(readFileSync(new URL('../public/data/kids_stories.json', import.meta.url), 'utf8'));
describe("children's Bible stories", () => {
  it('tell each story at three levels, getting longer, with questions and a memory verse that parse', () => {
    expect(d.stories.length).toBeGreaterThanOrEqual(68);
    expect(new Set(d.stories.map((s: any) => s.id)).size).toBe(d.stories.length);
    for (const s of d.stories) {
      const [a, b, c] = ['4-6', '7-9', '10-12'].map((k) => s.text[k] as string);
      expect(a.length, s.id).toBeGreaterThan(150);
      expect(b.length, `${s.id} 7-9 vs 4-6`).toBeGreaterThan(a.length);
      expect(c.length, s.id).toBeGreaterThan(300);
      expect(s.talk.length, s.id).toBeGreaterThanOrEqual(3);
      for (const r of [...s.refs, s.memory].filter(Boolean)) expect(parseRefs(r).ok, `${s.id} ${r}`).toBe(true);
    }
  });
});
