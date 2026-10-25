import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fromAnchor, loadVersification, toAnchor, bookAlignmentNote } from '../src/lib/versification';

const LIMIT_A = 58, LIMIT_B = 0; // recorded today: the 58 are verses the WEB's critical text omits
const read = (p: string) => JSON.parse(readFileSync(`public/data/${p}`, 'utf8'));

/** every verse of an edition as "BOOK.c.v" */
function verses(edition: string) {
  const out = new Set<string>();
  for (const f of readdirSync(`public/data/bible/${edition}`)) {
    const b = read(`bible/${edition}/${f}`);
    for (const ch of b.chapters) {
      let cur = 0;
      for (const blk of ch.blocks) {
        if (typeof blk[1] === 'string') continue;
        for (const [v] of blk[1] as [number, string][]) { if (v > 0) cur = v; if (cur) out.add(`${b.id}.${ch.n}.${cur}`); }
      }
    }
  }
  return out;
}

describe('versification regression', () => {
  loadVersification(read('versification.json'));
  const vul = verses('vulgate');
  const web = verses('webc');

  it('every Vulgate verse that maps exactly to the English numbering lands on a verse that exists in the WEB, outside the flagged books', () => {
    const misses: string[] = [];
    for (const key of vul) {
      const [book, c, v] = key.split('.');
      if (bookAlignmentNote('english', book)) continue;
      const m = fromAnchor('english', book, +c, +v);
      if (m.exact && !web.has(`${book}.${m.c}.${m.v1}`)) misses.push(`${key} -> ${m.c}:${m.v1}`);
    }
    // a small, recorded number of verses the WEB omits (critical-text omissions) is expected; more than that is a mapping bug
    expect(misses.length, misses.slice(0, 12).join('; ')).toBeLessThanOrEqual(LIMIT_A);
  });

  it('English verses map to the Vulgate and back to the same place when the mapping is exact', () => {
    const bad: string[] = [];
    for (const key of web) {
      const [book, c, v] = key.split('.');
      if (bookAlignmentNote('english', book)) continue;
      const a = toAnchor('english', book, +c, +v);
      if (!a.exact) continue;
      const back = fromAnchor('english', book, a.c, a.v1);
      if (back.c !== +c || back.v1 !== +v) bad.push(`${key} -> ${a.c}:${a.v1} -> ${back.c}:${back.v1}`);
    }
    expect(bad.length, bad.slice(0, 12).join('; ')).toBeLessThanOrEqual(LIMIT_B);
  });
});
