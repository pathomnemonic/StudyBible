import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PUBLIC_DATA, RAW, Report, writeJson } from './lib/util';
import { parseRefs } from '../../src/lib/refs';
import { convertRef } from '../../src/lib/versification';

/**
 * The Catechism of the Catholic Church, English text, from the Holy See's own edition (vatican.va, IntraText).
 * The app's owner has confirmed permission to quote it in full; see docs/DATA_SOURCES.md. The raw pages are cached under data/raw/ccc
 * (ignored by git); the build turns them into public/data/ccc: a small index and the paragraphs in blocks of 100.
 */
const BASE = 'https://www.vatican.va/archive/ENG0015/';
const UA = 'StudyBibleApp/1.0 (+https://github.com/pathomnemonic/StudyBible)';
const DIR = join(RAW, 'ccc');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchCcc() {
  mkdirSync(DIR, { recursive: true });
  const get = async (name: string) => {
    const f = join(DIR, name);
    if (existsSync(f)) return readFileSync(f, 'latin1');
    const r = await fetch(BASE + name, { headers: { 'user-agent': UA } });
    if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    writeFileSync(f, buf);
    await sleep(900);
    return buf.toString('latin1');
  };
  const idx = await get('_INDEX.HTM');
  const pages = [...new Set([...idx.matchAll(/href=(__P[0-9A-Z]+\.HTM)/gi)].map((m) => m[1].toUpperCase()))];
  console.log(`ccc: ${pages.length} pages`);
  let n = 0;
  for (const p of pages) {
    await get(p);
    if (++n % 40 === 0) console.log(`ccc: ${n}/${pages.length}`);
  }
}

const ent = (s: string) => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(+n)).replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘').replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”').replace(/&eacute;/g, 'é').replace(/&egrave;/g, 'è').replace(/&agrave;/g, 'à').replace(/&ouml;/g, 'ö').replace(/&uuml;/g, 'ü');

export interface CccPara { n: number; t: string; fn: { id: number; t: string }[] }

export function buildCcc(report: Report) {
  if (!existsSync(DIR)) { report.warn('ccc: raw pages missing (run: npx tsx scripts/ingest/ccc.ts fetch); the Catechism is skipped'); return; }
  const files = (readFileSync(join(DIR, '_INDEX.HTM'), 'latin1').match(/href=__P[0-9A-Z]+\.HTM/gi) ?? []).map((h) => h.slice(5).toUpperCase());
  const paras = new Map<number, CccPara>();
  const heads: { before: number; level: string; t: string }[] = [];
  let last = 0;
  for (const name of [...new Set(files)]) {
    const f = join(DIR, name);
    if (!existsSync(f)) continue;
    const html = readFileSync(f, 'latin1');
    const notes = new Map<string, string>();
    for (const m of html.matchAll(/<a name=\$([0-9A-Z]+) href=#-[0-9A-Z]+>\d+<\/a><\/b><\/font><font[^>]*>([\s\S]*?)<br>/gi)) notes.set(m[1], ent(m[2].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim());
    // where this page sits in the Catechism (Part › Section › Chapter › Article), from the page's own outline
    const outline = html.match(/<ul type=square>[\s\S]*?<\/font>/i)?.[0] ?? '';
    const path = [...outline.matchAll(/<li>([^<]*)/g)].map((x) => ent(x[1]).replace(/\s+/g, ' ').trim()).filter(Boolean);
    let firstOnPage = 0;
    for (const m of html.matchAll(/<p class=MsoNormal[^>]*>([\s\S]*?)<\/p>/gi)) {
      const raw = m[1];
      const fns = [...raw.matchAll(/<sup><a name=-([0-9A-Z]+)[^>]*>(\d+)<\/a>/gi)].map((x) => ({ key: x[1], id: +x[2] }));
      const text = ent(raw.replace(/<font[^>]*><sup>[\s\S]*?<\/sup><\/font>/gi, '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
      if (!text) continue;
      const fnOf = () => fns.map((x) => ({ id: x.id, t: notes.get(x.key) ?? '' })).filter((x) => x.t);
      const pm = /^(\d{1,4})\s+(.+)$/s.exec(text);
      if (pm && +pm[1] > last && +pm[1] <= last + 3) {
        last = +pm[1];
        if (!firstOnPage) { firstOnPage = last; if (path.length) heads.push({ before: last, level: 'path', t: path.join(' › ') }); }
        paras.set(last, { n: last, t: pm[2], fn: fnOf() });
        // two short paragraphs can arrive in one line ("... validity of the Decalogue. 2077 The")
        const next = new RegExp(`^(.*?)\\s${last + 1}\\s+(\\S.*)$`, 's').exec(pm[2]);
        if (next) { paras.get(last)!.t = next[1]; last += 1; paras.set(last, { n: last, t: next[2], fn: [] }); }
        continue;
      }
      // a paragraph number can sit at the end of the line before ("...Decalogue. 2077 The")
      const tail = last ? new RegExp(`^(.*?)\\s${last + 1}\\s+(\\S.*)$`, 's').exec(text) : null;
      if (tail && paras.get(last)) {
        paras.get(last)!.t += ' ' + tail[1];
        last += 1;
        paras.set(last, { n: last, t: tail[2], fn: fnOf() });
        continue;
      }
      // short unnumbered lines are headings; longer ones continue the paragraph before (a list or quotation inside it)
      const open = !!paras.get(last) && !/[.!?:;"”)]$/.test(paras.get(last)!.t.trim());
      if (!open && text.length < 110 && !/[.;:,]$/.test(text) && !/^[-–—•(]/.test(text)) heads.push({ before: last + 1, level: 'h', t: text });
      else if (paras.get(last)) {
        paras.get(last)!.t += (open ? ' ' : '\n') + text;
        paras.get(last)!.fn.push(...fnOf());
      }
    }
  }
  const all = [...paras.values()].sort((a, b) => a.n - b.n);
  const missing: number[] = [];
  for (let i = 1; i <= 2865; i++) if (!paras.has(i)) missing.push(i);
  if (missing.length) report.warn(`ccc: ${missing.length} paragraphs not found (first: ${missing.slice(0, 12).join(', ')})`);
  // the Catechism's own footnotes cite Scripture: that is the verse-to-paragraph index (a footnote without "Cf." is a quotation)
  const byBook: Record<string, [number, number, number, number, number, number][]> = {};
  let cites = 0;
  for (const p of all) {
    for (const f of p.fn) {
      const quoted = !/^\s*(cf\.?|see|compare)\b/i.test(f.t);
      let book = '';
      for (let piece of f.t.replace(/^\s*(?:cf\.?|see|compare)\s+(?:also\s+)?/i, '').split(/[;]/)) {
        piece = piece.trim().replace(/^(?:cf\.?|also)\s+/i, '').replace(/\b(\d+)\s+(\d+)\b(?!:)/, '$1:$2').replace(/\.$/, '');
        let txt = piece;
        if (/^\d+(?::\d+)?(?:[-–]\d+)?(?:,\s*\d+)*$/.test(piece) && book) txt = `${book} ${piece}`;
        const m = /^((?:[1-3]\s)?[A-Za-z]+)\s+\d/.exec(txt);
        const r = parseRefs(txt);
        if (!r.ok) continue;
        if (m) book = m[1];
        for (const { ref } of r.refs) {
          const a = convertRef('kjv', 'vulgate', { ...ref, v1: ref.v1 ?? 1, v2: ref.v2 ?? ref.v1 ?? 1 }).ref;
          (byBook[ref.book] ??= []).push([a.c1, a.v1 ?? 1, a.c2, a.v2 ?? a.v1 ?? 1, p.n, quoted ? 1 : 0]);
          cites++;
        }
      }
    }
  }
  mkdirSync(join(PUBLIC_DATA, 'ccc'), { recursive: true });
  for (const [b, rows] of Object.entries(byBook)) writeJson(join(PUBLIC_DATA, 'ccc/scripture', `${b}.json`), rows);
  for (let b = 0; b * 100 < 2866; b++) {
    const chunk = all.filter((p) => p.n >= b * 100 && p.n < (b + 1) * 100);
    if (chunk.length) writeJson(join(PUBLIC_DATA, 'ccc', `p${b}.json`), chunk);
  }
  writeJson(join(PUBLIC_DATA, 'ccc', 'index.json'), { source: 'Catechism of the Catholic Church, English, Libreria Editrice Vaticana (vatican.va)', paragraphs: all.length, headings: heads });
  report.stats['ccc'] = { paragraphs: all.length, missing: missing.length, headings: heads.length, scriptureCitations: cites };
}

if (process.argv[2] === 'fetch') fetchCcc().then(() => console.log('ccc fetched'));
