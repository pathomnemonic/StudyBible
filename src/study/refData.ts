import { getJson } from '../data/loader';
import { parseRefs, refId, type Ref } from '../lib/refs';
import { convertRef } from '../lib/versification';

export interface BookInfo {
  intro: string;
  author?: string;
  date?: string;
  outline: [range: string, title: string][];
}
export const getBooksInfo = () => getJson<Record<string, BookInfo>>('reference/books.json', true);
export type IndexKind = 'parables' | 'miracles' | 'prophecies' | 'covenants';
export interface IndexData {
  parables: [string, string][];
  miracles: [string, string, string][];
  prophecies: [string, string, string][];
  covenants: [string, string, string][];
}
export const getIndexes = () => getJson<IndexData>('reference/indexes.json', true);
export const getSynopsis = () => getJson<{ rows: string[][] }>('reference/synopsis.json', true);
export interface PaulineLetter {
  name: string;
  date: string;
  theme: string;
  sections: [string, string, string][];
}
export const getPauline = () => getJson<{ letters: Record<string, PaulineLetter> }>('reference/pauline.json', true);
export interface Person {
  id: string;
  n: string;
  f?: string;
  m?: string;
  r?: string;
  note?: string;
}
export interface Genealogies {
  persons: Person[];
  lines: { matthew: { title: string; note: string; groups: [string, string[]][] }; luke: { title: string; names: string[] } };
}
export const getGenealogies = () => getJson<Genealogies>('reference/genealogies.json', true);

/** "Matthew 13:1-23; Mark 4:1-20" (English numbering) → anchor Refs. Invalid parts are skipped. */
export function refsFromText(text: string): Ref[] {
  const out: Ref[] = [];
  let book = '';
  for (const part of text.split(/;\s*/)) {
    const s = part.trim();
    if (!s) continue;
    const p = parseRefs(book && /^\d/.test(s) ? `${book} ${s}` : s);
    if (!p.ok) continue;
    for (const { ref, bookText } of p.refs) {
      book = bookText || book;
      out.push(convertRef('kjv', 'vulgate', ref).ref);
    }
  }
  return out;
}
export const idsFromText = (text: string) => refsFromText(text).map(refId);

/** the outline section (English numbering) that contains a chapter, e.g. for a one-line "what is in this chapter". */
export function sectionFor(info: BookInfo | undefined, chapter: number): string | null {
  if (!info) return null;
  for (const [range, title] of info.outline) {
    const m = /^(\d+)(?::\d+)?(?:-(\d+)(?::\d+)?)?/.exec(range);
    if (!m) continue;
    const a = +m[1];
    const b = m[2] ? +m[2] : a;
    if (chapter >= a && chapter <= b) return `${title}`;
  }
  return null;
}

export interface Theme {
  id: string;
  title: string;
  summary: string;
  stages: { label: string; refs: string; note: string }[];
  catholic: string;
  ccc: string[];
  related: string[];
}
export const getThemes = () => getJson<{ themes: Theme[] }>('reference/themes.json', true);
export interface Variant {
  id: string;
  title: string;
  refs: string;
  kind: 'NT' | 'OT';
  summary: string;
  evidence: string[];
  catholic?: string;
}
export const getVariants = () => getJson<{ variants: Variant[] }>('reference/variants.json', true);

export interface Journey {
  id: string;
  title: string;
  summary: string;
  color: string;
  caution?: string;
  stops: { place: string; ref: string; note: string }[];
}
export const getJourneys = () => getJson<{ journeys: Journey[] }>('reference/journeys.json', true);
export interface World {
  eras: { id: string; title: string; dates: string; summary: string; refs: string; context: string; places: string[] }[];
  finds: { name: string; date: string; where: string; note: string; refs: string }[];
}
export const getWorld = () => getJson<World>('reference/world.json', true);
