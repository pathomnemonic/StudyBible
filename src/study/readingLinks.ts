import type { Ref } from '../lib/refs';
import { convertRef } from '../lib/versification';
import { getBook } from '../lib/canon';
import type { StudyItem } from './providers';

/**
 * Chapter-level reading links, built from the page address patterns of three Catholic Bible sites. They exist so that every
 * chapter of the 73 books has at least one place to read the text with notes. They are not matched to individual verses and
 * the pages' contents are not checked by this app.
 *
 * Book codes: New Advent and DRBO number chapters in the Douay/Vulgate way (the app's anchor numbering); USCCB uses its own
 * (NABRE) numbering, approximated here with the English scheme plus Joel and Malachi, which differ.
 */
// id → [New Advent code, USCCB slug, DRBO book number]
const SITE: Record<string, [string, string, number]> = {
  GEN: ['gen', 'genesis', 1], EXO: ['exo', 'exodus', 2], LEV: ['lev', 'leviticus', 3], NUM: ['num', 'numbers', 4], DEU: ['deu', 'deuteronomy', 5],
  JOS: ['jos', 'joshua', 6], JDG: ['jdg', 'judges', 7], RUT: ['rut', 'ruth', 8], '1SA': ['1sa', '1samuel', 9], '2SA': ['2sa', '2samuel', 10],
  '1KI': ['1ki', '1kings', 11], '2KI': ['2ki', '2kings', 12], '1CH': ['1ch', '1chronicles', 13], '2CH': ['2ch', '2chronicles', 14],
  EZR: ['ezr', 'ezra', 15], NEH: ['neh', 'nehemiah', 16], TOB: ['tob', 'tobit', 17], JDT: ['jth', 'judith', 18], EST: ['est', 'esther', 19],
  JOB: ['job', 'job', 20], PSA: ['psa', 'psalms', 21], PRO: ['pro', 'proverbs', 22], ECC: ['ecc', 'ecclesiastes', 23], SNG: ['son', 'songofsongs', 24],
  WIS: ['wis', 'wisdom', 25], SIR: ['sir', 'sirach', 26], ISA: ['isa', 'isaiah', 27], JER: ['jer', 'jeremiah', 28], LAM: ['lam', 'lamentations', 29],
  BAR: ['bar', 'baruch', 30], EZK: ['eze', 'ezekiel', 31], DAN: ['dan', 'daniel', 32], HOS: ['hos', 'hosea', 33], JOL: ['joe', 'joel', 34],
  AMO: ['amo', 'amos', 35], OBA: ['oba', 'obadiah', 36], JON: ['jon', 'jonah', 37], MIC: ['mic', 'micah', 38], NAM: ['nah', 'nahum', 39],
  HAB: ['hab', 'habakkuk', 40], ZEP: ['zep', 'zephaniah', 41], HAG: ['hag', 'haggai', 42], ZEC: ['zec', 'zechariah', 43], MAL: ['mal', 'malachi', 44],
  '1MA': ['1ma', '1maccabees', 45], '2MA': ['2ma', '2maccabees', 46], MAT: ['mat', 'matthew', 47], MRK: ['mar', 'mark', 48], LUK: ['luk', 'luke', 49],
  JHN: ['joh', 'john', 50], ACT: ['act', 'acts', 51], ROM: ['rom', 'romans', 52], '1CO': ['1co', '1corinthians', 53], '2CO': ['2co', '2corinthians', 54],
  GAL: ['gal', 'galatians', 55], EPH: ['eph', 'ephesians', 56], PHP: ['phi', 'philippians', 57], COL: ['col', 'colossians', 58],
  '1TH': ['1th', '1thessalonians', 59], '2TH': ['2th', '2thessalonians', 60], '1TI': ['1ti', '1timothy', 61], '2TI': ['2ti', '2timothy', 62],
  TIT: ['tit', 'titus', 63], PHM: ['phm', 'philemon', 64], HEB: ['heb', 'hebrews', 65], JAS: ['jam', 'james', 66], '1PE': ['1pe', '1peter', 67],
  '2PE': ['2pe', '2peter', 68], '1JN': ['1jo', '1john', 69], '2JN': ['2jo', '2john', 70], '3JN': ['3jo', '3john', 71], JUD: ['jud', 'jude', 72], REV: ['rev', 'revelation', 73],
};

const pad = (n: number, w: number) => String(n).padStart(w, '0');

export function usccbChapter(book: string, anchorCh: number, anchorV: number): number {
  const e = convertRef('vulgate', 'english', { book, c1: anchorCh, v1: anchorV, c2: anchorCh, v2: anchorV }).ref;
  if (book === 'JOL') return e.c1 === 2 && e.v1 && e.v1 >= 28 ? 3 : e.c1 === 3 ? 4 : e.c1;
  if (book === 'MAL') return Math.min(e.c1, 3);
  if (book === 'EST') return Math.min(e.c1, 10);
  return e.c1;
}

export function chapterReadingItems(refs: Ref[]): StudyItem[] {
  const r = refs[0];
  const site = SITE[r.book];
  if (!site) return [];
  const [na, us, dr] = site;
  const name = getBook(r.book).name;
  const ch = r.c1;
  const usCh = usccbChapter(r.book, ch, r.v1 ?? 1);
  const base = {
    section: 'commentary' as const,
    authority: 'historical' as const,
    format: 'external-link' as const,
    match: 'passage' as const,
    kind: 'Read with notes',
    ref: `${r.book}.${ch}`,
    basis: 'Page address pattern; the page itself is not read or checked by this app.',
  };
  return [
    { ...base, id: `rd-drbo-${r.book}-${ch}`, title: `${name} ${ch}: Douay-Rheims with Challoner’s footnotes (DRBO)`, url: `https://www.drbo.org/chapter/${pad(dr, 2)}${pad(ch, 3)}.htm`, why: `The whole chapter in the Douay-Rheims Bible Online (Vulgate numbering), with Bishop Challoner’s footnotes. Chapter-level, not this exact verse.`, sourceName: 'Douay-Rheims Bible Online (drbo.org)' },
    { ...base, id: `rd-na-${r.book}-${ch}`, title: `${name} ${ch}: Douay-Rheims text (New Advent)`, url: `https://www.newadvent.org/bible/${na}${pad(ch, 3)}.htm`, why: `The whole chapter in the Douay-Rheims text on New Advent, with links to the Latin Vulgate and the Fathers. Chapter-level, not this exact verse.`, sourceName: 'New Advent' },
    { ...base, id: `rd-usccb-${r.book}-${usCh}`, title: `${name} ${usCh}: NABRE with the bishops’ study notes (USCCB)`, url: `https://bible.usccb.org/bible/${us}/${usCh}`, why: `The chapter in the New American Bible, Revised Edition (the Mass lectionary’s base text) with the footnotes of the US bishops’ conference. Uses the USCCB’s own chapter numbering, which can differ slightly from this app’s.`, sourceName: 'USCCB (bible.usccb.org)' },
  ];
}
