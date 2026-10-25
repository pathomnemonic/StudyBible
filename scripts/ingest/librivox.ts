import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { BOOKS } from '../../src/lib/canon';
import { PUBLIC_DATA, RAW, Report, exists, readJson, writeJson } from './lib/util';

/**
 * Recorded readings of the whole Bible by LibriVox volunteers (public domain): the Douay-Rheims (1899 American edition) and the World
 * English Bible. Each recording is cut into hour-long files that run over several chapters ("Genesis 1-16"). For each chapter we work out
 * where in its file it begins and ends, from how many words precede it, so the app can start a recording at the chapter or verse in
 * front of the reader. The recordings carry no timestamps, so these are estimates (the app says so); reading pace is steady enough that
 * they land within a few seconds.
 */
const WORKS: { id: string; edition: string; file: string; bible: string }[] = [
  { id: 'librivox-18352', edition: 'dra', file: 'librivox_18352.json', bible: 'dra' },
  { id: 'librivox-21093', edition: 'webc', file: 'librivox_21093.json', bible: 'webc' },
];

const FIX: Record<string, string> = { exekiel: 'ezekiel', ephisians: 'ephesians', 'song of solomon': 'song of songs' };
const names = new Map<string, string>();
for (const b of BOOKS) for (const n of [b.name, b.douayName ?? '', ...b.aliases]) if (n) names.set(n.toLowerCase(), b.id);
names.set('psalms', 'PSA'); names.set('song of solomon', 'SNG'); names.set('tobit', 'TOB'); names.set('sirach', 'SIR'); names.set('wisdom', 'WIS'); names.set('baruch', 'BAR');
const bookOf = (s: string) => { const k = s.trim().toLowerCase(); return names.get(FIX[k] ?? k) ?? names.get(k); };

function runsText(ch: any): string[] {
  const out: string[] = [];
  for (const b of ch.blocks ?? []) if (Array.isArray(b[1])) for (const r of b[1]) out.push(r[1]);
  return out;
}

export function buildLibrivox(report: Report) {
  const out: Record<string, any> = {};
  for (const w of WORKS) {
    const path = join(RAW, w.file);
    if (!exists(path)) { report.warn(`librivox: ${w.file} not fetched`); continue; }
    const d = JSON.parse(readFileSync(path, 'utf8')).books[0];
    const files: { url: string; secs: number; title: string }[] = [];
    const map: Record<string, [number, number, number]> = {};
    const wordsCache = new Map<string, Map<number, number>>();
    const words = (book: string, c: number): number => {
      if (!wordsCache.has(book)) {
        const f = join(PUBLIC_DATA, 'bible', w.bible, `${book}.json`);
        const m = new Map<number, number>();
        if (exists(f)) for (const ch of readJson(f).chapters) m.set(ch.n, runsText(ch).join(' ').split(/\s+/).filter(Boolean).length);
        wordsCache.set(book, m);
      }
      return wordsCache.get(book)!.get(c) ?? 0;
    };
    let placed = 0, unplaced = 0;
    for (const sec of d.sections as any[]) {
      const secs = +sec.playtime;
      // "Genesis 1-16", "Psalms 1 - 33", "1 John 1 - 5, 2 John 1, 3 John 1"
      const chapters: { book: string; c: number }[] = [];
      let book: string | undefined;
      for (const seg of String(sec.title).split(',')) {
        const m = /^\s*(?:(.*?)\s+)?(\d+)(?:\s*-\s*(\d+))?\s*$/.exec(seg);
        const mb = m && m[1] ? bookOf(m[1]) : undefined;
        if (mb) book = mb;
        if (!m || !book) { const bare = bookOf(seg); if (bare) { book = bare; chapters.push({ book, c: 1 }); } continue; }
        const a = +m[2], b = m[3] ? +m[3] : a;
        for (let c = a; c <= b; c++) chapters.push({ book, c });
      }
      if (!chapters.length) { report.warn(`librivox: cannot read "${sec.title}"`); unplaced++; continue; }
      const ws = chapters.map((x) => words(x.book, x.c));
      const total = ws.reduce((a, b) => a + b, 0);
      if (!total) { report.warn(`librivox: no text for "${sec.title}" in ${w.bible}`); unplaced++; continue; }
      const fi = files.push({ url: String(sec.listen_url).replace(/^http:/, 'https:'), secs, title: sec.title }) - 1;
      let at = 0;
      chapters.forEach((x, i) => {
        const t0 = Math.round((at / total) * secs), t1 = Math.round(((at + ws[i]) / total) * secs);
        map[`${x.book}.${x.c}`] = [fi, t0, t1];
        at += ws[i];
        placed++;
      });
    }
    out[w.edition] = {
      title: d.title,
      reader: (d.sections[0]?.readers ?? []).map((r: any) => r.display_name).join(', '),
      page: d.url_librivox,
      note: 'Recorded by volunteers for LibriVox and dedicated to the public domain. Positions inside each file are estimated from the text, not marked in the recording.',
      files,
      map,
    };
    report.stats[`librivox-${w.edition}`] = { files: files.length, chapters: placed, unplaced };
  }
  writeJson(join(PUBLIC_DATA, 'media/librivox.json'), out);
}
