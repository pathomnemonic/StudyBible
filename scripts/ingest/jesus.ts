import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { unzipSync } from 'fflate';
import { PUBLIC_DATA, RAW, Report, exists, readJson, writeJson } from './lib/util';
import { cleanInline } from './lib/usfm';
import { convertRef } from '../../src/lib/versification';

/**
 * The words of Jesus, marked in red in the reader. The World English Bible (Catholic edition) marks them in its source (\wj ... \wj*).
 * For it the exact spans are stored as character ranges inside each run of text. For the editions that number verses the Vulgate way
 * (Douay-Rheims, Clementine Vulgate, CPDV) the verses that are mostly his words in the WEB are marked as whole runs, because those
 * texts have no markup of their own; verses where he speaks only in part are left plain there rather than guessed.
 */
type Ranges = Record<string, Record<string, [number, number][]>>; // chapter -> "block.run" -> ranges

const NS = /\s+/g;

function spansOf(usfm: string): { c: number; v: number; text: string }[] {
  const src = usfm.replace(/\\f\s+[+\-?]\s+[\s\S]*?\\f\*/g, '').replace(/\\x\s[\s\S]*?\\x\*/g, '');
  const out: { c: number; v: number; text: string }[] = [];
  let c = 0, v = 0, inWj = false, buf = '', bufV = 0, bufC = 0;
  const flush = () => {
    const t = cleanInline(buf).replace(/\\[a-z]+\d?\*?/g, ' ').replace(NS, '');
    if (t) out.push({ c: bufC, v: bufV, text: t });
    buf = '';
  };
  for (const tok of src.split(/(\\c\s+\d+|\\v\s+\d+[a-z]?|\\\+?wj\*?)/)) {
    let m: RegExpMatchArray | null;
    if ((m = /^\\c\s+(\d+)/.exec(tok))) { if (inWj) flush(); c = +m[1]; v = 0; }
    else if ((m = /^\\v\s+(\d+)/.exec(tok))) { if (inWj) flush(); v = +m[1]; }
    else if (/^\\\+?wj/.test(tok)) { if (tok.endsWith('*')) { flush(); inWj = false; } else { inWj = true; bufV = v; bufC = c; } }
    else if (inWj) { if (!buf) { bufV = v; bufC = c; } buf += tok; }
  }
  if (inWj) flush();
  // a span may have been flushed at a verse boundary with its text belonging to the verse in force when it began: fine for ranges
  return out;
}

export function buildJesus(report: Report) {
  const zip = join(RAW, 'eng-web-c_usfm.zip');
  if (!exists(zip)) { report.warn('jesus: WEB-C source missing; red letters skipped'); return; }
  const files = unzipSync(new Uint8Array(readFileSync(zip)));
  const dec = new TextDecoder('utf-8');
  const eds = ['dra', 'vulgate', 'cpdv'];
  let spans = 0, missed = 0, books = 0;
  for (const [name, bytes] of Object.entries(files)) {
    if (!name.endsWith('.usfm')) continue;
    const txt = dec.decode(bytes);
    if (!txt.includes('\\wj')) continue;
    const code = /\\id\s+([A-Z0-9]{3})/.exec(txt)?.[1];
    const webPath = code && join(PUBLIC_DATA, 'bible/webc', `${code}.json`);
    if (!code || !webPath || !exists(webPath)) continue;
    const web = readJson(webPath);
    const all = spansOf(txt);
    const byChapter = new Map<number, typeof all>();
    for (const s of all) (byChapter.get(s.c) ?? byChapter.set(s.c, []).get(s.c)!).push(s);
    const outWeb: Ranges = {};
    const redVerse = new Map<string, number>(); // "c.v" -> red chars
    const lenVerse = new Map<string, number>();
    for (const ch of web.chapters) {
      type Pos = { b: number; r: number; i: number };
      const flat: Pos[] = [];
      let norm = '';
      let cur = 0;
      const vOf = new Map<string, number>();
      ch.blocks.forEach((b: any, bi: number) => {
        if (typeof b[1] === 'string') return;
        b[1].forEach((run: [number, string], ri: number) => {
          if (run[0] > 0) cur = run[0];
          vOf.set(`${bi}.${ri}`, cur);
          for (let i = 0; i < run[1].length; i++) if (!/\s/.test(run[1][i])) { flat.push({ b: bi, r: ri, i }); norm += run[1][i]; }
        });
      });
      let from = 0;
      const ranges: Record<string, [number, number][]> = {};
      for (const s of byChapter.get(ch.n) ?? []) {
        spans++;
        const at = norm.indexOf(s.text, from);
        if (at < 0) { missed++; report.warn(`jesus: ${code} ${ch.n}:${s.v} span not found in the text (${s.text.slice(0, 30)}…)`); continue; }
        from = at + s.text.length;
        let k = at;
        while (k < at + s.text.length) {
          const p = flat[k];
          let e = k;
          while (e + 1 < at + s.text.length && flat[e + 1].b === p.b && flat[e + 1].r === p.r) e++;
          const key = `${p.b}.${p.r}`;
          // extend across inner spaces: the range runs from the first to the last red character
          (ranges[key] ??= []).push([p.i, flat[e].i + 1]);
          const v = vOf.get(key) ?? 0;
          redVerse.set(`${ch.n}.${v}`, (redVerse.get(`${ch.n}.${v}`) ?? 0) + (flat[e].i + 1 - p.i));
          k = e + 1;
        }
      }
      ch.blocks.forEach((b: any, bi: number) => { if (typeof b[1] !== 'string') b[1].forEach((run: [number, string], ri: number) => { const v = vOf.get(`${bi}.${ri}`) ?? 0; lenVerse.set(`${ch.n}.${v}`, (lenVerse.get(`${ch.n}.${v}`) ?? 0) + run[1].length); }); });
      if (Object.keys(ranges).length) outWeb[ch.n] = ranges;
    }
    if (!Object.keys(outWeb).length) continue;
    books++;
    writeJson(join(PUBLIC_DATA, 'jesus/webc', `${code}.json`), outWeb);
    // whole verses (at least 70% red) carried to the Vulgate-numbered editions
    const whole = [...redVerse].filter(([k, n]) => n / Math.max(1, lenVerse.get(k) ?? 1) >= 0.7).map(([k]) => k.split('.').map(Number));
    for (const id of eds) {
      const edPath = join(PUBLIC_DATA, 'bible', id, `${code}.json`);
      if (!exists(edPath)) continue;
      const ed = readJson(edPath);
      const want = new Set<string>();
      for (const [c, v] of whole) {
        const r = convertRef('english', 'vulgate', { book: code, c1: c, v1: v, c2: c, v2: v }).ref;
        want.add(`${r.c1}.${r.v1}`);
      }
      const out: Ranges = {};
      for (const ch of ed.chapters) {
        let cur = 0;
        const ranges: Record<string, [number, number][]> = {};
        ch.blocks.forEach((b: any, bi: number) => {
          if (typeof b[1] === 'string') return;
          b[1].forEach((run: [number, string], ri: number) => {
            if (run[0] > 0) cur = run[0];
            if (cur && want.has(`${ch.n}.${cur}`) && run[1].trim()) ranges[`${bi}.${ri}`] = [[0, run[1].length]];
          });
        });
        if (Object.keys(ranges).length) out[ch.n] = ranges;
      }
      if (Object.keys(out).length) writeJson(join(PUBLIC_DATA, 'jesus', id, `${code}.json`), out);
    }
  }
  report.stats['jesus'] = { books, spans, missed };
}
