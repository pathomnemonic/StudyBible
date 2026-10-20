import type { SoundKind } from './ambience';
import { defaultLang, type Lang } from './i18n';
import { useSyncExternalStore } from 'react';

export type ThemeName = 'twilight' | 'ocean' | 'dawn' | 'mist' | 'dark' | 'midnight' | 'amoled' | 'forest' | 'mocha' | 'nord' | 'light' | 'paper' | 'rose' | 'sepia' | 'solarized' | 'contrast' | 'contrast-dark' | 'zen' | 'system';

/** Themes offered in Settings: [id, label, background, text, accent] (colours are preview swatches only). */
export const THEMES: [ThemeName, string, string, string, string][] = [
  ['twilight', 'Twilight (default)', '#0a0c1c', '#ecebf8', '#b7a8ff'],
  ['ocean', 'Ocean', '#06131b', '#e4f1f5', '#7fd6d0'],
  ['dark', 'Ember', '#121110', '#ecebe6', '#e28d95'],
  ['midnight', 'Midnight', '#0c111b', '#e6ebf5', '#8ab4f8'],
  ['amoled', 'Black (OLED)', '#000000', '#ecebe6', '#e28d95'],
  ['forest', 'Forest', '#0f1612', '#e5ece6', '#8fd1a3'],
  ['mocha', 'Mocha', '#1a1411', '#f0e6dc', '#e0b07a'],
  ['nord', 'Nord', '#242933', '#eceff4', '#88c0d0'],
  ['dawn', 'Dawn', '#fbf3ec', '#33283a', '#7a5aa8'],
  ['mist', 'Mist', '#eef3f2', '#1f302f', '#2f7a73'],
  ['light', 'Light', '#fbf8f3', '#2a2622', '#8a2f39'],
  ['paper', 'Paper', '#f4f5f7', '#1c2330', '#2c5aa0'],
  ['rose', 'Rose', '#faf1f0', '#3a2224', '#9b3350'],
  ['zen', 'Zen high contrast', '#000000', '#ffffff', '#ffd54a'],
  ['sepia', 'Sepia', '#f1e6cd', '#3a2f1b', '#6b2a22'],
  ['solarized', 'Solarized light', '#fdf6e3', '#4a5559', '#1f6f8b'],
  ['contrast-dark', 'High contrast (dark)', '#000000', '#ffffff', '#ffd54a'],
  ['contrast', 'High contrast (light)', '#ffffff', '#000000', '#5a0010'],
  ['system', 'Match my device', '#555555', '#ffffff', '#ffffff'],
];

export interface PrayerReminder {
  id: string;
  label: string;
  time: string;
  message: string;
  enabled: boolean;
}

export interface Settings {
  theme: ThemeName;
  /** the language of the app's own menus and screens */
  language: Lang;
  fontSize: number;
  lineHeight: number;
  margin: 'narrow' | 'normal' | 'wide';
  fontFamily: 'serif' | 'sans' | 'hyperlegible' | 'dyslexic';
  /** extra spacing between letters and words (em), for easier reading */
  letterSpacing: number;
  wordSpacing: number;
  /** keep every line left-aligned and never justified */
  plainAlign: boolean;
  /** full = all gentle animation; calm = slower, fewer; none = still */
  motion: 'full' | 'calm' | 'none';
  /** a short vibration on taps, where the device supports it */
  haptics: boolean;
  defaultEdition: string;
  parallelEdition: string | null;
  /** older or unfamiliar translations the reader chose to switch on (see Edition.offByDefault) */
  enabledEditions: string[];
  showVerseNumbers: boolean;
  scriptureOnly: boolean;
  /** on wide screens, keep the study panel open beside the text (chapter-level until a verse is selected) */
  studyDock: boolean;
  /** show commentary written in Latin or other languages (hidden by default) */
  showOtherLanguages: boolean;
  /** key words and phrases sparkle in the text; a tap opens a note about them */
  sparkles: boolean;
  /** a few soft drifting lights behind the text */
  motes: boolean;
  /** the one-time note about ambience has been shown */
  ambienceTipSeen: boolean;
  /** paintings of the scene shown inline in the text */
  inlineArt: boolean;
  /** words that act out their meaning: fire flickers, water ripples, light glows */
  wordFx: boolean;
  /** dismissed the one-time "tap a verse" hint */
  hintVerse: boolean;
  /** a soft backdrop that suits the book (or the passage); off keeps the plain theme */
  atmosphere: 'off' | 'book' | 'passage';
  /** low-volume ambience while reading: on by default (it starts at the first tap), recordings listed in public/audio/index.json */
  ambience: { kind: SoundKind; volume: number; match: boolean };
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
  theme: 'twilight',
  language: defaultLang(),
  fontSize: 19,
  lineHeight: 1.65,
  margin: 'normal',
  fontFamily: 'serif',
  letterSpacing: 0,
  wordSpacing: 0,
  plainAlign: false,
  motion: 'calm',
  haptics: false,
  defaultEdition: 'webc',
  parallelEdition: null,
  enabledEditions: [],
  showVerseNumbers: true,
  scriptureOnly: false,
  studyDock: true,
  showOtherLanguages: false,
  sparkles: true,
  motes: true,
  ambienceTipSeen: false,
  inlineArt: true,
  wordFx: true,
  hintVerse: false,
  atmosphere: 'passage',
  ambience: { kind: 'nature', volume: 0.25, match: false },
  refNumbering: 'edition',
  reminders: { enabled: false, time: '07:30', message: 'A quiet moment with Scripture, if you would like one.' },
  showStreaks: false,
  lectioMinutes: 15,
  last: null,
  diocese: 'universal',
  onboarded: false,
  ttsRate: 1,
  ttsVoice: '',
  dashboard: { order: ['continue', 'readings', 'biay', 'plans', 'verse', 'notes', 'memorize', 'liturgy', 'session'], hidden: ['memorize', 'liturgy', 'session'] },
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
    if (raw) {
      const saved = JSON.parse(raw);
      // the first home screen put the guided session first; move people still on that untouched default to the new one
      const prevDefaults = ['readings,session,biay,verse,continue,plans,memorize,notes,liturgy', 'continue,readings,biay,notes,plans,verse,memorize,liturgy,session'];
      if (prevDefaults.includes(saved.dashboard?.order?.join()) && !saved.dashboard?.hidden?.length) delete saved.dashboard;
      return { ...DEFAULTS, ...saved };
    }
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
