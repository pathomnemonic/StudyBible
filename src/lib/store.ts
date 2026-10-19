import { useSyncExternalStore } from 'react';

export type ThemeName = 'light' | 'dark' | 'sepia' | 'system';

export interface Settings {
  theme: ThemeName;
  fontSize: number;
  lineHeight: number;
  margin: 'narrow' | 'normal' | 'wide';
  fontFamily: 'serif' | 'sans';
  defaultEdition: string;
  parallelEdition: string | null;
  showVerseNumbers: boolean;
  scriptureOnly: boolean;
  /** how to interpret typed references like "Ps 23" */
  refNumbering: 'edition' | 'vulgate' | 'english';
  reminders: { enabled: boolean; time: string; message: string };
  showStreaks: boolean;
  lectioMinutes: number;
  last: { edition: string; book: string; chapter: number; verse?: number } | null;
  diocese: string; // liturgical calendar: 'universal' | 'usa' ...
  onboarded: boolean;
}

export const DEFAULTS: Settings = {
  theme: 'system',
  fontSize: 19,
  lineHeight: 1.65,
  margin: 'normal',
  fontFamily: 'serif',
  defaultEdition: 'dra',
  parallelEdition: null,
  showVerseNumbers: true,
  scriptureOnly: false,
  refNumbering: 'edition',
  reminders: { enabled: false, time: '07:30', message: 'A quiet moment with Scripture, if you would like one.' },
  showStreaks: false,
  lectioMinutes: 15,
  last: null,
  diocese: 'universal',
  onboarded: false,
};

const KEY = 'studybible.settings.v1';
let state: Settings = load();
const listeners = new Set<() => void>();

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* private mode etc. */
  }
  return { ...DEFAULTS };
}

export function getSettings() {
  return state;
}

export const settingsChangeHooks: (() => void)[] = [];

export function updateSettings(patch: Partial<Settings>) {
  state = { ...state, ...patch };
  settingsChangeHooks.forEach((h) => h());
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useSettings(): [Settings, (p: Partial<Settings>) => void] {
  const s = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
  return [s, updateSettings];
}
