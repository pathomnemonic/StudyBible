import { beforeEach, describe, expect, it, vi } from 'vitest';
const mem = new Map<string, string>();
const listeners: ((e: Event) => void)[] = [];
vi.stubGlobal('localStorage', { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k), clear: () => mem.clear() });
vi.stubGlobal('CustomEvent', class { type: string; detail: unknown; constructor(t: string, i: { detail?: unknown } = {}) { this.type = t; this.detail = i.detail; } });
vi.stubGlobal('window', { addEventListener: (_: string, h: (e: Event) => void) => listeners.push(h), removeEventListener: (_: string, h: (e: Event) => void) => { listeners.splice(listeners.indexOf(h), 1); }, dispatchEvent: (e: Event) => listeners.forEach((h) => h(e)) });
import { DEFAULTS, updateSettings } from '../src/lib/store';
import { isStreakTrophy, playTotals, recordPlay, streaksHidden, TROPHY_LIST } from '../src/lib/dailyGame';

beforeEach(() => { localStorage.clear(); updateSettings({ hideStreaks: DEFAULTS.hideStreaks }); });

describe('optional streaks', () => {
  it('streaks are shown by default', () => { expect(DEFAULTS.hideStreaks).toBe(false); expect(streaksHidden()).toBe(false); });
  it('turning the setting on hides them', () => { updateSettings({ hideStreaks: true }); expect(streaksHidden()).toBe(true); });
  it('streak trophies are the day-count ones only', () => {
    expect(TROPHY_LIST.filter(isStreakTrophy).map((t) => t.id)).toEqual(['streak3', 'streak7', 'streak30']);
  });
  it('totals count games and days, not runs', () => {
    recordPlay('verbum'); recordPlay('verbum'); recordPlay('quartets');
    expect(playTotals()).toEqual({ games: 3, days: 1, kinds: 2 });
  });
  it('no streak trophy toast fires while streaks are hidden', () => {
    updateSettings({ hideStreaks: true });
    const seen: string[][] = [];
    const h = (e: Event) => seen.push(((e as CustomEvent).detail as { id: string }[]).map((t) => t.id));
    window.addEventListener('studybible:trophy', h);
    const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
    localStorage.setItem('sb:plays:v1', JSON.stringify({ days: [day - 2, day - 1], games: { verbum: 1 }, perfect: {}, dailyByDay: {} }));
    recordPlay('verbum');
    window.removeEventListener('studybible:trophy', h);
    expect(seen.flat()).not.toContain('streak3');
    expect(JSON.parse(localStorage.getItem('sb:trophies:v1') ?? '{}').streak3).toBeTruthy();
  });
});
