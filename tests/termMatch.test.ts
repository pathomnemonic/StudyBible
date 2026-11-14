import { describe, expect, it } from 'vitest';
import { GLOSSARY } from '../src/data/glossary';
import { buildRound, maskMeaning } from '../src/lib/termMatch';

describe('Match the term', () => {
  it('blanks the term and its other names out of the meaning', () => {
    const t = maskMeaning({ term: 'Baptism', aliases: ['baptize', 'baptized'], definition: 'The first sacrament; to be baptized is to be baptism-ready.' });
    expect(t).not.toMatch(/baptiz|baptism/i);
    expect(t).toContain('____');
  });
  it('builds the same round for the same seed and a different one for another', () => {
    const a = buildRound(GLOSSARY, 7), b = buildRound(GLOSSARY, 7), c = buildRound(GLOSSARY, 8);
    expect(a).toEqual(b);
    expect(a.pairs.map((p) => p.term)).not.toEqual(c.pairs.map((p) => p.term));
  });
  it('gives five distinct terms whose meanings do not contain their own term', () => {
    for (const seed of [1, 2, 3, 99, 4242]) {
      const r = buildRound(GLOSSARY, seed);
      expect(r.pairs).toHaveLength(5);
      expect(new Set(r.pairs.map((p) => p.term)).size).toBe(5);
      for (const p of r.pairs) expect(p.meaning.toLowerCase()).not.toContain(p.term.toLowerCase());
    }
  });
});
