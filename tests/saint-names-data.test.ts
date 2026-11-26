import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const names = JSON.parse(readFileSync('public/data/saints/butler/names.json', 'utf8')) as Record<string, string[]>;

describe('the saint name finder index (Nov 2026 audit, issue 63)', () => {
  it('has one row for St John the Baptist, carrying both his feasts', () => {
    expect(names['john the baptist']).toEqual(['06-24', '08-29']);
    expect(names['john baptist']).toBeUndefined();
  });
  it('has no bare first name row, and no feast posing as a saint', () => {
    expect(names['john']).toBeUndefined();
    expect(names['john before the latin']).toBeUndefined();
    expect(names['john before the latin gate']).toBeUndefined();
  });
  it('does not duplicate a saint under a shorter form of his name', () => {
    expect(names['john the apostle']).toBeUndefined();
    expect(names['john the apostle and evangelist']).toEqual(['12-27']);
    expect(names['john joseph']).toBeUndefined();
    expect(names['john joseph of the cross']).toEqual(['03-05']);
  });
  it('spells Damascene and Colombini as they are spelled now', () => {
    expect(names['john damascen']).toBeUndefined();
    expect(names['john damascene']).toEqual(['05-06']); // Butler places his life at May 6, and the day page there holds it
    expect(names['john columbini']).toBeUndefined();
    expect(names['john colombini']).toEqual(['07-31']);
  });
  it('includes modern saints who are not in Butler at all', () => {
    expect(names['john paul ii']).toEqual(['10-22']);
    expect(names['john vianney']).toEqual(['08-04']);
  });
});
