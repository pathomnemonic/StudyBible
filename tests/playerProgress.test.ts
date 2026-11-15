import { describe, expect, it } from 'vitest';
import { playbackProgressPatch } from '../src/data/playerProgress';

describe('player progress completion', () => {
  it('does not mark an episode complete merely because a periodic save is near the end', () => {
    expect(playbackProgressPatch(1790, 1800, false)).toEqual({
      position: 1790, duration: 1800, completed: undefined, ranToEnd: false,
    });
  });

  it('marks completion only for the actual ended event and resets the resume position', () => {
    expect(playbackProgressPatch(1800, 1800, true)).toEqual({
      position: 0, duration: 1800, completed: true, ranToEnd: true,
    });
  });

  it('normalizes non-finite progress without inventing an end event', () => {
    expect(playbackProgressPatch(Number.NaN, Number.POSITIVE_INFINITY, false)).toEqual({
      position: 0, duration: undefined, completed: undefined, ranToEnd: false,
    });
  });
});
