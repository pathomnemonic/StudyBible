import { describe, it, expect } from 'vitest';
import { DEFAULTS } from '../src/lib/store';

describe('everyday settings defaults', () => {
  it('start at values that change nothing for a new reader', () => {
    expect(DEFAULTS.startPage).toBe('today');
    expect(DEFAULTS.weekStart).toBe('sun');
    expect(DEFAULTS.lessonView).toBe('path');
    expect(DEFAULTS.lessonPictures).toBe(true);
    expect(DEFAULTS.recordHistory).toBe(true);
    expect(DEFAULTS.bigTargets).toBe(false);
    expect(DEFAULTS.underlineLinks).toBe(false);
    expect(DEFAULTS.longerTimers).toBe(false);
  });
});
