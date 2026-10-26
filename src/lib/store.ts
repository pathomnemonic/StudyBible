import type { SoundKind } from './ambience';
import { defaultLang, type Lang } from './i18n';
import { useSyncExternalStore } from 'react';

export type ThemeName = 'twilight' | 'ocean' | 'dawn' | 'mist' | 'dark' | 'midnight' | 'amoled' | 'forest' | 'mocha' | 'nord' | 'light' | 'paper' | 'rose' | 'sepia' | 'solarized' | 'contrast' | 'contrast-dark' | 'zen' | 'system';

/** Themes offered in Settings: [id, label, background, text, accent] (colors are preview swatches only). */
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
  /** spelling of the app's own words: US English (default) or British */
  spelling: 'us' | 'uk';
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
  /** one chapter at a time, or an unbroken scroll through the chapters that follow */
  scrollMode: 'pages' | 'infinite';
  /** a quiet progress line in the corner while reading: minutes left in the chapter and how far */
  readProgress: boolean;
  /** the Children's Bible reading level */
  kidsAge: '4-6' | '7-9' | '10-12';
  /** what focus mode (scriptureOnly) means to this reader */
  focus: { scroll: boolean; numbers: boolean; markers: boolean; art: boolean; effects: boolean; sparkles: boolean; sound: boolean };
  /** the sound was switched off once by default (v16); do not do it again */
  soundOffV16: boolean;
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
  /** keep the screen on while reading (where the browser allows) */
  keepAwake: boolean;
  /** one verse per line instead of running paragraphs */
  verseLines: boolean;
  /** how Copy formats a selected verse: numbers kept, plain text, or a quotation with a citation */
  copyStyle: 'numbers' | 'plain' | 'quote';
  /** study-panel sections the reader has chosen not to see */
  studyHidden: string[];
  /** the Catholic Church the reader belongs to; the Roman Rite is the default */
  tradition: 'latin' | 'ordinariate' | 'byzantine' | 'syro-malabar' | 'syro-malankara' | 'maronite' | 'chaldean' | 'armenian' | 'alexandrian';
  /** Byzantine Churches: date Pascha by the Julian reckoning (as the Orthodox do) rather than Rome's */
  paschaJulian: boolean;
  /** Byzantine Churches: keep fixed feasts on the old (Julian) calendar, 13 days later */
  oldCalendar: boolean;
  /** the small † footnote marks and the verse markers for notes in the text */
  showNoteMarks: boolean;
  /** the words of Jesus in red, where the translation marks them */
  redLetters: boolean;
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
  /** red dots on things not yet opened, and one-time tips the first time a feature is used */
  hints: boolean;
  /** what the reader said they came for (set in the welcome), used to suggest where to start */
  interests: string[];
  /** read-aloud speed and voice (browser voice name; empty = default) */
  ttsRate: number;
  ttsVoice: string;
  /** Today page widgets: order and hidden ids */
  dashboard: { order: string[]; hidden: string[] };
  /** extra reminders (morning/evening prayer, verse of the day…) */
  prayerReminders: PrayerReminder[];
  /** never contact a sync server: hides account prompts */
  localOnly: boolean;
  /** Google Drive backup: connected on this device, the OAuth client id to use (if not built in), when the nudge was last dismissed */
  drive: { connected: boolean; clientId: string; lastOk: number; lastError: string; nudgeUntil: number };
  /** remind me to back up every N days (0 = never) and when I last did */
  backupEveryDays: number;
  lastBackup: number;
}

export const DEFAULTS: Settings = {
  theme: 'twilight',
  language: defaultLang(),
  spelling: 'us',
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
  scrollMode: 'pages',
  readProgress: true,
  kidsAge: '7-9',
  focus: { scroll: true, numbers: true, markers: false, art: false, effects: false, sparkles: false, sound: true },
  soundOffV16: true,
  studyDock: true,
  showOtherLanguages: false,
  sparkles: true,
  motes: true,
  ambienceTipSeen: false,
  inlineArt: true,
  wordFx: true,
  redLetters: true,
  keepAwake: false,
  verseLines: false,
  copyStyle: 'numbers',
  studyHidden: [],
  tradition: 'latin',
  paschaJulian: false,
  oldCalendar: false,
  showNoteMarks: true,
  hintVerse: false,
  atmosphere: 'passage',
  ambience: { kind: 'off', volume: 0.25, match: false },
  refNumbering: 'edition',
  reminders: { enabled: false, time: '07:30', message: 'A quiet moment with Scripture, if you would like one.' },
  showStreaks: false,
  lectioMinutes: 15,
  last: null,
  diocese: 'universal',
  onboarded: false,
  hints: true,
  interests: [],
  ttsRate: 1,
  ttsVoice: '',
  dashboard: { order: ['continue', 'readings', 'biay', 'plans', 'verse', 'notes', 'memorize', 'liturgy', 'session'], hidden: ['memorize', 'liturgy', 'session'] },
  prayerReminders: [],
  localOnly: false,
  drive: { connected: false, clientId: '', lastOk: 0, lastError: '', nudgeUntil: 0 },
  backupEveryDays: 0,
  lastBackup: 0,
};

const KEY = 'studybible.settings.v1';
let state: Settings = load();
const listeners = new Set<() => void>();

/** Settings can come from an old version, a restored backup or another device: any value of the wrong kind falls back to its default instead of breaking a page. */
function sanitize(s: Settings): Settings {
  const out: any = { ...s };
  for (const k of Object.keys(DEFAULTS) as (keyof Settings)[]) {
    const d: any = DEFAULTS[k];
    const v: any = out[k];
    if (d === null || d === undefined || v === null || v === undefined) continue;
    const kind = (x: any) => (Array.isArray(x) ? 'array' : typeof x);
    if (kind(d) !== kind(v)) out[k] = d;
    else if (typeof d === 'number' && !Number.isFinite(v)) out[k] = d;
  }
  return out;
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...DEFAULTS };
      const saved = parsed;
      const part = (v: any) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
      // the first home screen put the guided session first; move people still on that untouched default to the new one
      const prevDefaults = ['readings,session,biay,verse,continue,plans,memorize,notes,liturgy', 'continue,readings,biay,notes,plans,verse,memorize,liturgy,session'];
      if (prevDefaults.includes(saved.dashboard?.order?.join()) && !saved.dashboard?.hidden?.length) delete saved.dashboard;
      // sound used to start on by default; it now starts off (people can turn it on from the tour or the reading settings)
      if (!saved.soundOffV16) { saved.ambience = { ...DEFAULTS.ambience, ...part(saved.ambience), kind: 'off' }; saved.soundOffV16 = true; }
      return sanitize({ ...DEFAULTS, ...saved, focus: { ...DEFAULTS.focus, ...part(saved.focus) }, drive: { ...DEFAULTS.drive, ...part(saved.drive) }, ambience: { ...DEFAULTS.ambience, ...part(saved.ambience) } });
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
