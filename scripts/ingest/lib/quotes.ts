import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { BOOKS } from '../../../src/lib/canon';
import { convertRef } from '../../../src/lib/versification';
import { PUBLIC_DATA } from './util';
import type { Ref } from '../../../src/lib/refs';

/**
 * Quotations that carry no citation. Every verse of the Douay-Rheims, the CPDV and the World English Bible is cut into six-word
 * windows; a paragraph that repeats a run of nine or more words of a verse (or most of a short verse) is taken to quote it.
 * Windows made mostly of small words, and windows that occur in more than four verses (refrains, formulas), are ignored.
 */
const N = 6;
const words = (s: string) => (s.toLowerCase().replace(/[’']/g, '').match(/[a-z]+/g) ?? []);
const content = (w: string[]) => w.filter((x) => x.length >= 4).length;

type Hit = { id: number; words: number };
let index: Map<string, number[]> | null = null;
const verseWords = new Map<number, number>();
const bookIdx = new Map(BOOKS.map((b, i) => [b.id, i + 1] as const));
const bookOf = (n: number) => BOOKS[Math.floor(n / 1e6) - 1].id;
const pack = (book: string, c: number, v: number) => (bookIdx.get(book)! * 1e6) + c * 1e3 + v;

function load(): Map<string, number[]> {
  if (index) return index;
  const m = new Map<string, number[]>();
  for (const ed of ['dra', 'cpdv', 'webc']) {
    const scheme = ed === 'webc' ? 'english' : 'vulgate';
    for (const b of BOOKS) {
      const f = join(PUBLIC_DATA, 'bible', ed, `${b.id}.json`);
      if (!existsSync(f)) continue;
      const d = JSON.parse(readFileSync(f, 'utf8'));
      for (const ch of d.chapters) {
        const verses = new Map<number, string>();
        let cur = 0;
        for (const bl of ch.blocks) {
          if (typeof bl[1] === 'string') continue;
          for (const [v, t] of bl[1] as [number, string][]) { if (v > 0) cur = v; if (cur) verses.set(cur, (verses.get(cur) ?? '') + ' ' + t); }
        }
        for (const [v, text] of verses) {
          let id: number;
          if (scheme === 'vulgate') id = pack(b.id, ch.n, v);
          else { const a = convertRef('english', 'vulgate', { book: b.id, c1: ch.n, v1: v, c2: ch.n, v2: v }).ref; id = pack(b.id, a.c1, a.v1 ?? v); }
          const w = words(text);
          verseWords.set(id, Math.max(verseWords.get(id) ?? 0, w.length));
          for (let i = 0; i + N <= w.length; i++) {
            const g = w.slice(i, i + N);
            if (content(g) < 3) continue;
            const k = g.join(' ');
            const arr = m.get(k);
            if (!arr) m.set(k, [id]);
            else if (!arr.includes(id) && arr.length <= 4) arr.push(id);
          }
        }
      }
    }
  }
  for (const [k, v] of m) if (v.length > 4) m.delete(k);
  return (index = m);
}

/** where each word starts and ends in the original text (apostrophes are dropped from words, as in `words`) */
function wordSpans(s: string): [number, number][] {
  const kept: string[] = [];
  const map: number[] = [];
  for (let i = 0; i < s.length; i++) { if (s[i] === '’' || s[i] === "'") continue; kept.push(s[i].toLowerCase()); map.push(i); }
  const out: [number, number][] = [];
  for (const m of kept.join('').matchAll(/[a-z]+/g)) out.push([map[m.index!], map[m.index! + m[0].length - 1] + 1]);
  return out;
}

export type QuoteAt = Ref & { at?: number; len?: number };

/** the verses a paragraph quotes, as anchor refs (adjacent verses joined into one range) */
export function quotedVerses(text: string): QuoteAt[] {
  const idx = load();
  const w = words(text);
  if (w.length < 9) return [];
  const spans = wordSpans(text);
  const firstAt = new Map<number, number>();
  const pos = new Map<number, number[]>();
  for (let i = 0; i + N <= w.length; i++) {
    const ids = idx.get(w.slice(i, i + N).join(' '));
    if (ids) for (const id of ids) { (pos.get(id) ?? pos.set(id, []).get(id)!).push(i); if (!firstAt.has(id)) firstAt.set(id, i); }
  }
  const ok: number[] = [];
  for (const [id, ps] of pos) {
    ps.sort((a, b) => a - b);
    let run = 1, best = 1;
    for (let i = 1; i < ps.length; i++) { run = ps[i] === ps[i - 1] + 1 ? run + 1 : 1; best = Math.max(best, run); }
    const total = verseWords.get(id) ?? 99;
    if (best + N - 1 >= 9 || (total <= 14 && best + N - 1 >= 7)) ok.push(id);
  }
  ok.sort((a, b) => a - b);
  const out: QuoteAt[] = [];
  for (const id of ok) {
    const book = bookOf(id), c = Math.floor((id % 1e6) / 1e3), v = id % 1e3;
    const last = out[out.length - 1];
    if (last && last.book === book && last.c1 === c && v - (last.v2 ?? 0) <= 1) last.v2 = v;
    else {
      const wi = firstAt.get(id);
      const sp = wi !== undefined && spans[wi] && spans[wi + N - 1] ? spans[wi] : null;
      out.push({ book, c1: c, c2: c, v1: v, v2: v, at: sp?.[0], len: sp ? spans[wi! + N - 1][1] - sp[0] : undefined });
    }
  }
  return out;
}
