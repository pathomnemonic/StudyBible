import { useSyncExternalStore } from 'react';

export type ThemeName = 'light' | 'dark' | 'sepia' | 'contrast' | 'contrast-dark' | 'system';

export interface PrayerReminder {
  id: string;
  label: string;
  time: string;
  message: string;
  enabled: boolean;
}

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
  /** read-aloud speed and voice (browser voice name; empty = default) */
  ttsRate: number;
  ttsVoice: string;
  /** Today page widgets: order and hidden ids */
  dashboard: { order: string[]; hidden: string[] };
  /** extra reminders (morning/evening prayer, verse of the day…) */
  prayerReminders: PrayerReminder[];
  /** never contact a sync server: hides account prompts */
  localOnly: boolean;
  /** remind me to back up every N days (0 = never) and when I last did */
  backupEveryDays: number;
  lastBackup: number;
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
  ttsRate: 1,
  ttsVoice: '',
  dashboard: { order: ['readings', 'session', 'biay', 'verse', 'continue', 'plans', 'memorize', 'notes', 'liturgy'], hidden: [] },
  prayerReminders: [],
  localOnly: false,
  backupEveryDays: 0,
  lastBackup: 0,
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
