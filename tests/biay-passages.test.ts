import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const d = JSON.parse(readFileSync(new URL('../public/data/media/biay.json', import.meta.url), 'utf8'));
const day = (n: number) => d.episodes.find((e: any) => e.kind === 'day' && e.day === n).passages as string[];

describe('Bible in a Year passages', () => {
  it('lists only the readings the plan names, not books the commentary merely mentions', () => {
    expect(day(251)).not.toContain('GEN.3');
    expect(day(220)).not.toContain('LUK.4');
    expect(day(2)).toContain('GEN.3');
  });
  it('gives each chapter of Genesis 1-11 to the early days only', () => {
    for (const e of d.episodes.filter((x: any) => x.kind === 'day' && x.day > 20)) for (const p of e.passages) expect(/^GEN\.([1-9]|10|11)$/.test(p), `day ${e.day} ${p}`).toBe(false);
  });
});
