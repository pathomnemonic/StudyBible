import { en, type Key } from '../i18n/en';
import { es } from '../i18n/es';
import { la } from '../i18n/la';
import { useSettings, getSettings } from './store';

export type Lang = 'en' | 'es' | 'la';
export const LANGS: [Lang, string][] = [['en', 'English'], ['es', 'Español'], ['la', 'Latina']];
const DICT: Record<Lang, Partial<Record<Key, string>>> = { en, es, la };

/** The language to start in: the browser's, if we have it. */
export function defaultLang(): Lang {
  const n = (typeof navigator !== 'undefined' ? navigator.language : 'en').slice(0, 2).toLowerCase();
  return n === 'es' ? 'es' : n === 'la' ? 'la' : 'en';
}
export const translate = (lang: Lang, key: Key): string => DICT[lang]?.[key] ?? en[key];
/** For code outside React. */
export const tNow = (key: Key) => translate(getSettings().language, key);
/** Date format locale for the language (Latin has none in browsers, so English formats are used). */
export const dateLocale = (lang: Lang) => (lang === 'es' ? 'es' : undefined);

export function useT(): (key: Key) => string {
  const [s] = useSettings();
  return (key) => translate(s.language, key);
}
