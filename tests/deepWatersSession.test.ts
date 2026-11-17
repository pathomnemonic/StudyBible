import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createDeepSession, deepDiveStreak, editDistance, pauseDeepSession, recordDeepDive,
  resumeDeepSession, tickDeepSession, saveDeepSession, loadDeepSession, clearDeepSession,
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
    expect(playing.deadlineAt).toBe(34000);
  });

  it('pauses using remaining time and resumes against a new deadline', () => {
    const initial = createDeepSession({ day: 20, practice: false, practiceSeed: 1, promptIds: ['a','b','c','d','e','f','g'], now: 1000 });
    const playing = tickDeepSession(initial, 4000);
    const paused = pauseDeepSession(playing, 9000);
    expect(paused.paused).toBe(true);
    expect(paused.remainingMs).toBe(25000);
    expect(paused.deadlineAt).toBeNull();
    expect(tickDeepSession(paused, 900000)).toEqual(paused);
    const resumed = resumeDeepSession(paused, 1000000);
    expect(resumed.deadlineAt).toBe(1025000);
  });

  it('locks a round when its deadline expires', () => {
    const initial = createDeepSession({ day: 20, practice: false, practiceSeed: 1, promptIds: ['a','b','c','d','e','f','g'], now: 1000 });
    const playing = tickDeepSession(initial, 4000);
    const expired = tickDeepSession(playing, 34000);
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

  it('saves, restores and clears a valid in-progress dive', () => {
    const session = createDeepSession({ day: 20, practice: false, practiceSeed: 1, promptIds: ['a','b','c','d','e','f','g'], now: 1000 });
    const paused = pauseDeepSession(session, 2000);
    saveDeepSession(paused);
    expect(loadDeepSession(20)).toEqual(paused);
    expect(loadDeepSession(21)).toBeNull();
    clearDeepSession();
    expect(loadDeepSession(20)).toBeNull();
  });

  it('preserves remaining time when a paused session is reloaded later', () => {
    const initial = createDeepSession({ day: 20, practice: false, practiceSeed: 1, promptIds: ['a','b','c','d','e','f','g'], now: 1000 });
    const paused = pauseDeepSession(initial, 2000);
    saveDeepSession(paused);
    const restored = loadDeepSession(20)!;
    expect(restored.remainingMs).toBe(2000);
    expect(resumeDeepSession(restored, 100000).deadlineAt).toBe(102000);
  });

  it('replaces a same-day logbook entry rather than double-counting a completion', () => {
    recordDeepDive({ day: 100, score: 10, scoredRounds: 2, totalRounds: 7, pearlFound: false, practice: false });
    const entries = recordDeepDive({ day: 100, score: 20, scoredRounds: 4, totalRounds: 7, pearlFound: true, practice: false });
    expect(entries).toHaveLength(1);
    expect(entries[0].score).toBe(20);
  });

  it('calculates edit distance for explicit spelling suggestions', () => {
    expect(editDistance('polycarp', 'polycarp')).toBe(0);
    expect(editDistance('polycarp', 'polycarb')).toBe(1);
    expect(editDistance('ignatius', 'ignatuis')).toBe(2);
  });
});
