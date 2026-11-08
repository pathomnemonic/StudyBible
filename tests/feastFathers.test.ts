import { describe, expect, it } from 'vitest';
import { FEAST_FATHERS } from '../src/data/feastFathers';
import { FEASTS } from '../src/data/feasts';
import { norm, sourceText } from '../scripts/chains/verify';

const MAJOR = ['christmas', 'epiphany', 'baptism-lord', 'ash-wednesday', 'annunciation', 'palm-sunday', 'holy-thursday', 'good-friday', 'easter', 'ascension', 'pentecost', 'trinity', 'corpus-christi', 'transfiguration', 'assumption', 'triumph-cross', 'all-saints', 'all-souls', 'immaculate-conception', 'presentation', 'peter-paul', 'john-baptist', 'archangels', 'christ-king', 'holy-family', 'mary-mother-of-god'];

describe('From the Fathers', () => {
  it('has an entry for each major feast, and every key is a real feast id', () => {
    const ids = new Set(FEASTS.map((f) => f.id));
    for (const k of Object.keys(FEAST_FATHERS)) expect(ids.has(k), `unknown feast ${k}`).toBe(true);
    for (const k of MAJOR) expect(FEAST_FATHERS[k], `missing ${k}`).toBeTruthy();
  });
  for (const [id, e] of Object.entries(FEAST_FATHERS)) {
    it(`${id}: the quote is in ${e.work} / ${e.section}, word for word`, () => {
      const { text, err } = sourceText({ work: e.work, section: e.section } as never);
      expect(err).toBeUndefined();
      const hay = norm(text!);
      // an ellipsis joins two stretches of one work; a closing mark added at a cut is ignored by norm
      for (const seg of e.quote.split(/…/)) {
        const n = norm(seg);
        if (!n) continue;
        expect(n.length, `${id}: stretch too short`).toBeGreaterThan(40);
        expect(hay.includes(n), `${id}: not found: ${seg.slice(0, 70)}`).toBe(true);
      }
      expect(e.note.length).toBeGreaterThan(40);
      expect(e.author && e.source).toBeTruthy();
    });
  }
});
