import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createDeepSession, deepDiveStreak, editDistance, pauseDeepSession, recordDeepDive,
  resumeDeepSession, tickDeepSession,
} from '../src/lib/deepWatersSession';

const memory = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value); },
  removeItem: (key: string) => { memory.delete(key); },
  clear: () => memory.clear(),
});

describe('Deep Waters daily engine', () => {
  afterEach(() => { vi.restoreAllMocks(); memory.clear(); });

  it('starts with a three-second preview before the answer clock', () => {
    const session = createDeepSession({ day: 20, practice: false, practiceSeed: 1, promptIds: ['a','b','c','d','e','f','g'], now: 1000 });
    expect(session.phase).toBe('preview');
    expect(session.deadlineAt).toBe(4000);
    expect(tickDeepSession(session, 3999).phase).toBe('preview');
    const playing = tickDeepSession(session, 4000);
    expect(playing.phase).toBe('playing');
    expect(playing.deadlineAt).toBe(29000);
  });

  it('pauses using remaining time and resumes against a new deadline', () => {
    const initial = createDeepSession({ day: 20, practice: false, practiceSeed: 1, promptIds: ['a','b','c','d','e','f','g'], now: 1000 });
    const playing = tickDeepSession(initial, 4000);
    const paused = pauseDeepSession(playing, 9000);
    expect(paused.paused).toBe(true);
    expect(paused.remainingMs).toBe(20000);
    expect(paused.deadlineAt).toBeNull();
    expect(tickDeepSession(paused, 900000)).toEqual(paused);
    const resumed = resumeDeepSession(paused, 1000000);
    expect(resumed.deadlineAt).toBe(1020000);
  });

  it('locks a round when its deadline expires', () => {
    const initial = createDeepSession({ day: 20, practice: false, practiceSeed: 1, promptIds: ['a','b','c','d','e','f','g'], now: 1000 });
    const playing = tickDeepSession(initial, 4000);
    const expired = tickDeepSession(playing, 29000);
    expect(expired.phase).toBe('locked');
    expect(expired.history[0].timedOut).toBe(true);
    expect(expired.history[0].promptId).toBe('a');
  });

  it('records daily results once per day and computes consecutive-day streaks', () => {
    const entries = recordDeepDive({ day: 100, score: 18, scoredRounds: 3, totalRounds: 7, pearlFound: false, practice: false });
    const next = recordDeepDive({ day: 101, score: 25, scoredRounds: 4, totalRounds: 7, pearlFound: true, practice: false });
    expect(deepDiveStreak(next, 101)).toBe(2);
    expect(deepDiveStreak(next, 103)).toBe(0);
  });

  it('does not add practice dives to the logbook', () => {
    const before = localStorage.getItem('sb:deepwaters:logbook:v1');
    recordDeepDive({ day: 100, score: 99, scoredRounds: 7, totalRounds: 7, pearlFound: true, practice: true });
    expect(localStorage.getItem('sb:deepwaters:logbook:v1')).toBe(before);
  });

  it('calculates edit distance for explicit spelling suggestions', () => {
    expect(editDistance('polycarp', 'polycarp')).toBe(0);
    expect(editDistance('polycarp', 'polycarb')).toBe(1);
    expect(editDistance('ignatius', 'ignatuis')).toBe(2);
  });
});
