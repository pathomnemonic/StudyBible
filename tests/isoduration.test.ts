import { describe, expect, it } from 'vitest';
import { isoSeconds } from '../src/lib/isoDuration';
describe('YouTube durations', () => {
  it('reads hours, minutes and seconds', () => {
    expect(isoSeconds('PT1H2M10S')).toBe(3730);
    expect(isoSeconds('PT45S')).toBe(45);
    expect(isoSeconds('PT12M')).toBe(720);
    expect(isoSeconds('P0D')).toBe(0);
    expect(isoSeconds('junk')).toBe(0);
  });
});
