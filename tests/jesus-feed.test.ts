import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

describe('words of Jesus (red letters)', () => {
  it('marks the Sermon on the Mount opening words in the WEB-C data', () => {
    const w = JSON.parse(readFileSync('public/data/jesus/webc/MAT.json', 'utf8'));
    const b = JSON.parse(readFileSync('public/data/bible/webc/MAT.json', 'utf8'));
    const ch = b.chapters.find((c: any) => c.n === 5);
    const red: string[] = [];
    for (const [k, rs] of Object.entries(w['5'] as Record<string, [number, number][]>)) {
      const [bi, ri] = k.split('.').map(Number);
      const t = ch.blocks[bi][1][ri][1] as string;
      for (const [s, e] of rs) red.push(t.slice(s, e));
    }
    expect(red.join(' ')).toContain('Blessed are the poor in spirit');
    expect(red.join(' ')).not.toContain('Seeing the multitudes');
  });
  it('carries whole verses to the Douay-Rheims', () => {
    expect(existsSync('public/data/jesus/dra/JHN.json')).toBe(true);
  });
});
