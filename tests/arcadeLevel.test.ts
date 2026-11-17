import { describe, expect, it } from 'vitest';
import { levelOf } from '../src/lib/arcadeLevel';

describe('arcade level', () => {
  it('starts at level 1 with nothing', () => { expect(levelOf(0, 0, 0)).toEqual({ level: 1, xp: 0, into: 0, need: 80 }); });
  it('levels up and each level costs more', () => {
    expect(levelOf(8, 0, 0).level).toBe(2);
    const a = levelOf(100, 30, 10); const b = levelOf(200, 60, 20);
    expect(b.level).toBeGreaterThan(a.level);
    expect(a.into).toBeLessThan(a.need);
  });
  it('ignores bad input', () => { expect(levelOf(-5, -1, -9).level).toBe(1); });
});
