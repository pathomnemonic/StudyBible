import { getJson } from '../data/loader';
import { convertRef } from '../lib/versification';
import type { Ref } from '../lib/refs';
import type { EditionRecord } from '../data/loader';

/** Greek words: [text, strongs, parse, lemmaIfNoStrongs?]; Hebrew words: [text, strongs, morph]. */
export type Word = [string, string, string, string?];
type Verses = Word[][][]; // chapter → verse → words
export type LexEntry = [lemma: string, translit: string, gloss: string, kjv: string, derivation: string];
export type Lang = 'grc' | 'hbo';

export const NT_BOOKS = new Set(['MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV']);
const OT_HEBREW = new Set(['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL']);

export const languageOf = (book: string): Lang | null => (NT_BOOKS.has(book) ? 'grc' : OT_HEBREW.has(book) ? 'hbo' : null);
export const loadText = (lang: Lang, book: string) => getJson<Verses>(`original/${lang}/${book}.json`, true);
const lexCache: Partial<Record<Lang, Promise<Record<string, LexEntry> | null>>> = {};
export const loadLexicon = (lang: Lang) => (lexCache[lang] ??= getJson<Record<string, LexEntry>>(`original/lex-${lang}.json`, true));

export interface VerseWords {
  /** the verse numbering of the original text (Hebrew numbering for the Old Testament) */
  label: string;
  words: Word[];
}
export interface OriginalResult {
  lang: Lang;
  verses: VerseWords[];
  note?: string;
}

/**
 * Words for an anchor (Vulgate-numbered) passage. The Greek follows English numbering. The Hebrew text uses the Hebrew
 * (Masoretic) numbering, so a verse is only shown when its chapter provably lines up with the English verse count
 * (same count, or a Psalm whose Hebrew count exceeds the English by its title lines); otherwise nothing is guessed.
 */
export async function originalFor(ref: Ref, english: EditionRecord | undefined, max = 8): Promise<OriginalResult | null> {
  const lang = languageOf(ref.book);
  if (!lang) return null;
  const kjv = convertRef('vulgate', 'kjv', ref).ref;
  const text = await loadText(lang, ref.book);
  if (!text) return null;
  const c = kjv.c1;
  const v1 = kjv.v1 ?? 1;
  const v2 = Math.min(kjv.c2 === c ? (kjv.v2 ?? v1) : (text[c - 1]?.length ?? v1), v1 + max - 1);
  const chap = text[c - 1];
  if (!chap) return { lang, verses: [], note: 'This chapter is not in the original-language text for this book.' };
  let shift = 0;
  let note: string | undefined;
  if (lang === 'hbo') {
    const eng = english?.verseCounts?.[ref.book]?.[c - 1];
    const heb = chap.length;
    if (eng && heb !== eng) {
      if (ref.book === 'PSA' && heb - eng >= 1 && heb - eng <= 3) {
        shift = heb - eng;
        note = `The Hebrew counts the title of this psalm as verse${shift > 1 ? 's' : ''}, so Hebrew verses are numbered ${shift} higher. Alignment inside the psalm is approximate.`;
      } else {
        return { lang, verses: [], note: `The Hebrew chapter has ${heb} verses and the English ${eng}, so the numbers do not line up in this chapter. Open the chapter in an interlinear to compare.` };
      }
    }
  }
  const verses: VerseWords[] = [];
  for (let v = v1; v <= v2; v++) {
    const words = chap[v - 1 + shift];
    if (words?.length) verses.push({ label: `${c}:${v + shift}`, words });
  }
  return { lang, verses, note };
}

// ---------------------------------------------------------------- parsing codes
const G_POS: Record<string, string> = { 'A-': 'adjective', 'C-': 'conjunction', 'D-': 'adverb', 'I-': 'interjection', 'N-': 'noun', 'P-': 'preposition', RA: 'article', RD: 'demonstrative pronoun', RI: 'interrogative/indefinite pronoun', RP: 'personal pronoun', RR: 'relative pronoun', 'V-': 'verb', 'X-': 'particle' };
const G_TENSE: Record<string, string> = { P: 'present', I: 'imperfect', F: 'future', A: 'aorist', X: 'perfect', Y: 'pluperfect' };
const G_VOICE: Record<string, string> = { A: 'active', M: 'middle', P: 'passive' };
const G_MOOD: Record<string, string> = { I: 'indicative', D: 'imperative', S: 'subjunctive', O: 'optative', N: 'infinitive', P: 'participle' };
const G_CASE: Record<string, string> = { N: 'nominative', G: 'genitive', D: 'dative', A: 'accusative', V: 'vocative' };
const G_NUM: Record<string, string> = { S: 'singular', P: 'plural' };
const G_GEN: Record<string, string> = { M: 'masculine', F: 'feminine', N: 'neuter' };
const G_DEG: Record<string, string> = { C: 'comparative', S: 'superlative' };

export function parseGreek(code: string): string {
  const pos = G_POS[code.slice(0, 2)] ?? code.slice(0, 2);
  const p = code.slice(2);
  const bits: string[] = [];
  const person = p[0] !== '-' ? ({ '1': '1st person', '2': '2nd person', '3': '3rd person' } as Record<string, string>)[p[0]] : '';
  for (const b of [person, G_TENSE[p[1]], G_VOICE[p[2]], G_MOOD[p[3]], G_CASE[p[4]], G_NUM[p[5]], G_GEN[p[6]], G_DEG[p[7]]]) if (b) bits.push(b);
  return [pos, ...bits].join(', ');
}

const H_POS: Record<string, string> = { A: 'adjective', C: 'conjunction', D: 'adverb', N: 'noun', P: 'pronoun', R: 'preposition', S: 'suffix', T: 'particle', V: 'verb' };
const H_STEM: Record<string, string> = { q: 'Qal', N: 'Niphal', p: 'Piel', P: 'Pual', h: 'Hiphil', H: 'Hophal', t: 'Hithpael', o: 'Polel', O: 'Polal', r: 'Hithpolel', m: 'Poel', k: 'Palel', M: 'Pulal', l: 'Pilpel', L: 'Poal', f: 'Pealal', D: 'Hithpoel', j: 'Hishtaphel', i: 'Nithpael', u: 'Hothpaal', c: 'Tiphil', v: 'Hithpalpel', w: 'Nithpalel', y: 'Nithpoel', z: 'Hithpoal' };
const H_ASPECT: Record<string, string> = { p: 'perfect', q: 'sequential perfect', i: 'imperfect', w: 'sequential imperfect', h: 'cohortative', j: 'jussive', v: 'imperative', r: 'active participle', s: 'passive participle', a: 'infinitive absolute', c: 'infinitive construct' };
const H_GEN: Record<string, string> = { m: 'masculine', f: 'feminine', b: 'common', c: 'common' };
const H_NUM: Record<string, string> = { s: 'singular', p: 'plural', d: 'dual' };
const H_STATE: Record<string, string> = { a: 'absolute', c: 'construct', d: 'determined' };
const H_NTYPE: Record<string, string> = { c: 'common noun', p: 'proper noun', g: 'gentilic' };
const H_PREFIX: Record<string, string> = { C: 'and', D: 'adverb', R: 'preposition', Td: 'the', Ti: 'interrogative', Tr: 'relative', Tm: 'object marker', Tc: 'conjunction' };

/** The meaningful (last) morpheme of an OSHB morph code, with its prefixes spelled out. */
export function parseHebrew(code: string): string {
  const segs = code.split('/');
  const main = segs[segs.length - 1];
  const prefixes = segs.slice(0, -1).map((s) => H_PREFIX[s] ?? H_PREFIX[s.slice(0, 2)] ?? s);
  const pos = H_POS[main[0]] ?? main[0];
  const bits: string[] = [];
  if (main[0] === 'V') {
    const [, stem, aspect, ...rest] = main;
    const r = rest.join('');
    bits.push(H_STEM[stem] ?? stem, H_ASPECT[aspect] ?? aspect);
    if (/^[123]/.test(r)) bits.push(({ '1': '1st person', '2': '2nd person', '3': '3rd person' } as Record<string, string>)[r[0]], H_GEN[r[1]], H_NUM[r[2]]);
    else bits.push(H_GEN[r[0]], H_NUM[r[1]], H_STATE[r[2]]);
  } else if (main[0] === 'N') {
    bits.push(H_NTYPE[main[1]], H_GEN[main[2]], H_NUM[main[3]], H_STATE[main[4]]);
  } else if (main[0] === 'A') {
    bits.push(H_GEN[main[2]], H_NUM[main[3]], H_STATE[main[4]]);
  }
  return [prefixes.length ? `prefix: ${prefixes.join(' + ')}` : '', pos, ...bits.filter(Boolean)].filter(Boolean).join(', ');
}
