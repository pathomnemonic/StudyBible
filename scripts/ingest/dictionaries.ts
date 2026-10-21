import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PUBLIC_DATA, RAW, Report, readJson, writeJson } from './lib/util';
import { decodeEntities, parseOsis } from './lib/thml';
import { parseRefs, refId, MAX_VERSE, type Ref } from '../../src/lib/refs';
import { convertRef, isLoaded, loadVersification } from '../../src/lib/versification';

/**
 * Three nineteenth-century Bible reference works, public domain, from CCEL (ThML):
 *   Easton's Bible Dictionary (M. G. Easton, 1897; ccel easton/ebd2),
 *   Smith's Bible Dictionary (William Smith, 1884 American edition, ed. Hackett and Abbott; ccel smith_w/bibledict),
 *   Nave's Topical Bible (Orville J. Nave, 1896/1897; ccel nave/bible).
 * They are Protestant works (KJV numbering, Protestant canon and theology) and the UI must label them as such.
 * Raw files are cached under data/raw (ignored by git); the build writes public/data/dictionary.
 */
const UA = 'StudyBibleApp/1.0 (+https://github.com/pathomnemonic/StudyBible)';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const WORKS = [
  { id: 'easton', ccel: 'easton/ebd2', file: 'ccel_easton_ebd2.xml' },
  { id: 'smith', ccel: 'smith_w/bibledict', file: 'ccel_smith_w_bibledict.xml' },
  { id: 'nave', ccel: 'nave/bible', file: 'ccel_nave_bible.xml' },
];

export async function fetchDictionaries() {
  mkdirSync(RAW, { recursive: true });
  for (const w of WORKS) {
    const f = join(RAW, w.file);
    if (existsSync(f)) continue;
    const r = await fetch(`https://www.ccel.org/ccel/${w.ccel}.xml`, { headers: { 'user-agent': UA } });
    if (!r.ok) throw new Error(`${w.ccel}: HTTP ${r.status}`);
    writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    console.log(`dictionaries: ${w.ccel} fetched`);
    await sleep(1200);
  }
}

const SRC = (id: string) => `https://ccel.org/ccel/${WORKS.find((w) => w.id === id)!.ccel}`;
const META = {
  easton: {
    source: "Easton's Bible Dictionary, M. G. Easton (Illustrated Bible Dictionary, 3rd ed., Thomas Nelson, 1897). Christian Classics Ethereal Library.",
    edition: "1897 (third edition, published three years after the author's death); CCEL text from the Online Bible, illustrations omitted",
    license: 'Public domain (CCEL records Rights: Public Domain; first published 1897). Nineteenth-century Protestant work, KJV numbering.',
  },
  smith: {
    source: "Smith's Bible Dictionary, William Smith (American edition, revised by H. B. Hackett with E. Abbott). Christian Classics Ethereal Library.",
    edition: '1884 (as given on the CCEL title page)',
    license: 'Public domain (CCEL records Rights: Public Domain; published 1884). Nineteenth-century Protestant work, KJV numbering.',
  },
  nave: {
    source: "Nave's Topical Bible, Orville J. Nave. Christian Classics Ethereal Library.",
    edition: 'Orville J. Nave, 1896 (CCEL: "created ... in 1896"; the first printed edition is commonly dated 1896/1897)',
    license: 'Public domain by age (Nave died 1917; first published 1896/97). CCEL leaves its Rights field blank for this work, so the basis is publication date and author death, not a CCEL statement.',
  },
};

const clean = (s: string) =>
  decodeEntities(s.replace(/<note\b[\s\S]*?<\/note>/g, '').replace(/<pb\b[^>]*\/>/g, '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();

interface Counts { tagged: number; viaParse: number; viaOsis: number; failed: number; disagree: number }
const failures: string[] = [];

/** One tagged scripRef → KJV-numbered Refs, via parseRefs on the printed passage (fallback: the OSIS tag(s) CCEL attached). */
function refOf(attrs: string, c: Counts): Ref[] {
  c.tagged++;
  const passage = /passage="([^"]*)"/.exec(attrs)?.[1];
  const osisAll = (/osisRef="([^"]*)"/.exec(attrs)?.[1] ?? '').split(/\s+/).filter(Boolean).map((x) => x.replace(/^Bible(?:\.[a-z]+)?:/, ''));
  const os = osisAll.map((x) => parseOsis(x));
  let p: Ref | null = null;
  if (passage && osisAll.length <= 1) {
    const r = parseRefs(decodeEntities(passage));
    if (r.ok && r.refs.length === 1) p = r.refs[0].ref;
  }
  if (p) {
    const o = os[0];
    if (o && (o.book !== p.book || o.c1 !== p.c1 || (o.v1 ?? 0) !== (p.v1 ?? 0))) {
      c.disagree++;
      if (failures.length < 400) failures.push(`disagree: "${passage}" parse=${refId(p)} osis=${osisAll[0]}`);
      // the printed book name is ambiguous at times (Nave's "Jud" is Judges, parseRefs reads Jude); CCEL's own tag wins when they differ
      const f = finish(o, c, 'osis');
      return f ? [f] : [];
    }
    const f = finish(p, c, 'parse');
    return f ? [f] : [];
  }
  const out: Ref[] = [];
  if (os.length && os.every(Boolean)) {
    for (const o of os) { const f = finish(o!, c, 'osis'); if (f) out.push(f); }
    return out;
  }
  c.failed++;
  if (failures.length < 400) failures.push(`unparsed: "${passage}" ${osisAll.join(' ')}`);
  return [];
}
function finish(r: { book: string; c1: number; v1?: number; c2: number; v2?: number }, c: Counts, via: 'parse' | 'osis'): Ref | null {
  if (!r.c1 || r.c1 > 200 || (r.v1 !== undefined && !r.v1) || (r.v2 !== undefined && !r.v2) || r.c2 < r.c1 || (r.c2 === r.c1 && r.v1 !== undefined && r.v2 !== undefined && r.v2 < r.v1)) {
    c.failed++;
    if (failures.length < 400) failures.push(`invalid: ${r.book}.${r.c1}.${r.v1}-${r.c2}.${r.v2}`);
    return null;
  }
  if (via === 'parse') c.viaParse++;
  else c.viaOsis++;
  return { book: r.book, c1: r.c1, v1: r.v1, c2: r.c2, v2: r.v2 };
}

/** KJV-numbered Ref → Clementine-Vulgate anchor Ref (whole chapters stay whole chapters). */
function anchorOf(r: Ref): Ref {
  if (r.v1 === undefined) {
    const a = convertRef('kjv', 'vulgate', { ...r, v1: 1, v2: MAX_VERSE });
    return { book: r.book, c1: a.ref.c1, c2: a.ref.c2 };
  }
  return convertRef('kjv', 'vulgate', { ...r, v2: r.v2 ?? r.v1 }).ref;
}

const TERM_BLOCK = /<term\b[^>]*>([\s\S]*?)<\/term>\s*<def\b([^>]*)>([\s\S]*?)<\/def>/g;

function glossary(xml: string): { termRaw: string; defAttrs: string; body: string }[] {
  const start = xml.indexOf('<glossary');
  return [...xml.slice(start).matchAll(TERM_BLOCK)].map((m) => ({ termRaw: m[1], defAttrs: m[2], body: m[3] }));
}

function buildDict(id: 'easton' | 'smith', xml: string, c: Counts, report: Report) {
  const entries: { term: string; aliases?: string[]; text: string[]; refs?: string[] }[] = [];
  for (const g of glossary(xml)) {
    const term = clean(g.termRaw);
    if (!term) continue;
    const text = g.body
      .replace(/<\/?(?:p|li|ul|ol|div|h\d)\b[^>]*>/g, '\u0001')
      .split('\u0001')
      .map(clean)
      .filter(Boolean);
    const refs: string[] = [];
    for (const m of g.body.matchAll(/<scripRef\b([^>]*)>/g)) {
      for (const r of refOf(m[1], c)) {
        const rid = refId(anchorOf(r));
        if (!refs.includes(rid)) refs.push(rid);
      }
    }
    const e: (typeof entries)[number] = { term, text };
    // headwords printed as "Abia, Abiah, Or Abijah" yield lookup aliases (only when every part is a single word; "Atonement, Day of" is not a variant list); the term itself is kept as published
    const al = new Set<string>();
    const parts = term.split(/\s*,\s*(?:or\s+)?|\s+or\s+/i);
    if (parts.length > 1 && parts.every((x) => /^[A-Za-z][A-Za-z'’-]{1,30}$/.test(x))) for (const part of parts) al.add(part);
    if (al.size) e.aliases = [...al];
    if (refs.length) e.refs = refs;
    entries.push(e);
  }
  const m = META[id];
  writeJson(join(PUBLIC_DATA, 'dictionary', `${id}.json`), { source: m.source, edition: m.edition, license: m.license, url: SRC(id), tradition: 'Protestant (nineteenth century)', scheme: 'refs converted from KJV numbering to the app anchor (Clementine Vulgate) numbering', entries });
  report.stats[`dictionary-${id}`] = { entries: entries.length, withRefs: entries.filter((e) => e.refs).length, refs: entries.reduce((n, e) => n + (e.refs?.length ?? 0), 0) };
  return entries;
}

function buildNave(xml: string, c: Counts, report: Report) {
  interface Sub { label: string; refs: string[]; level?: number }
  interface Topic { topic: string; subtopics?: Sub[]; refs: string[]; see?: string[] }
  const topics: Topic[] = [];
  const byBook = new Map<string, Map<string, [number, number, number, number, number]>>();
  for (const g of glossary(xml)) {
    const topic = clean(g.termRaw);
    if (!topic) continue;
    const idx = topics.length;
    const t: Topic = { topic, refs: [] };
    const all = new Set<string>();
    const see: string[] = [];
    for (const pm of g.body.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/g)) {
      const level = +(/class="index(\d)"/.exec(pm[1])?.[1] ?? 2);
      const html = pm[2];
      const hasRef = /<scripRef\b/.test(html);
      const plainText = clean(html).replace(/^[–.\s]+/, '');
      if (!hasRef && /^see\b/i.test(plainText)) {
        // "–See HOMICIDE": a cross-reference to another topic
        for (const a of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)) { const s = clean(a[1]); if (s && !see.includes(s)) see.push(s); }
        continue;
      }
      const label = clean(html.split(/<scripRef\b/)[0]).replace(/^[–.\s]+/, '').replace(/[\s,;:]+$/, '');
      const refs: string[] = [];
      for (const m of html.matchAll(/<scripRef\b([^>]*)>/g)) {
        for (const r of refOf(m[1], c)) {
          const a = anchorOf(r);
          const rid = refId(a);
          if (!refs.includes(rid)) refs.push(rid);
          if (!all.has(rid)) {
            all.add(rid);
            const rows = byBook.get(a.book) ?? byBook.set(a.book, new Map()).get(a.book)!;
            rows.set(`${rid}|${idx}`, [a.c1, a.v1 ?? 1, a.c2, a.v2 ?? (a.v1 === undefined ? MAX_VERSE : a.v1), idx]);
          }
        }
      }
      if (!label && !refs.length) continue;
      const s: Sub = { label, refs };
      if (level !== 2) s.level = level;
      (t.subtopics ??= []).push(s);
    }
    t.refs = [...all];
    if (see.length) t.see = see;
    // a topic with a single unlabeled run of references needs no subtopic list
    if (t.subtopics?.length === 1 && !t.subtopics[0].label) delete t.subtopics;
    topics.push(t);
  }
  const m = META.nave;
  writeJson(join(PUBLIC_DATA, 'dictionary', 'nave.json'), { source: m.source, edition: m.edition, license: m.license, url: SRC('nave'), tradition: 'Protestant (nineteenth century)', scheme: 'refs converted from KJV numbering to the app anchor (Clementine Vulgate) numbering', topics });
  let rows = 0;
  for (const [book, map] of byBook) {
    const arr = [...map.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[4] - b[4]);
    rows += arr.length;
    writeJson(join(PUBLIC_DATA, 'dictionary', 'nave-by-book', `${book}.json`), arr);
  }
  report.stats['dictionary-nave'] = { topics: topics.length, withSee: topics.filter((x) => x.see).length, subtopics: topics.reduce((n, x) => n + (x.subtopics?.length ?? 0), 0), verseRefs: topics.reduce((n, x) => n + x.refs.length, 0), byBookRows: rows, books: byBook.size };
  return topics;
}

export function buildDictionaries(report: Report) {
  const missing = WORKS.filter((w) => !existsSync(join(RAW, w.file)));
  if (missing.length) { report.warn(`dictionaries: raw files missing (${missing.map((w) => w.file).join(', ')}); run: npx tsx scripts/ingest/dictionaries.ts fetch; skipped`); return; }
  if (!isLoaded()) loadVersification(readJson(join(PUBLIC_DATA, 'versification.json')));
  const xml = (id: string) => readFileSync(join(RAW, WORKS.find((w) => w.id === id)!.file), 'utf8');
  const counts: Record<string, Counts> = {};
  const mk = (id: string) => (counts[id] = { tagged: 0, viaParse: 0, viaOsis: 0, failed: 0, disagree: 0 });
  const easton = buildDict('easton', xml('easton'), mk('easton'), report);
  const smith = buildDict('smith', xml('smith'), mk('smith'), report);
  const nave = buildNave(xml('nave'), mk('nave'), report);
  const lookup = (names: (string | undefined)[][]) => {
    const out: Record<string, number | number[]> = {};
    let dup = 0;
    names.forEach((ns, i) => {
      for (const n of new Set(ns.filter(Boolean).map((x) => x!.toLowerCase()))) {
        const cur = out[n];
        if (cur === undefined) out[n] = i;
        else {
          const arr = Array.isArray(cur) ? cur : [cur];
          if (!arr.includes(i)) { arr.push(i); out[n] = arr; dup++; }
        }
      }
    });
    return { out, dup };
  };
  const te = lookup(easton.map((e) => [e.term, ...(e.aliases ?? [])]));
  const ts = lookup(smith.map((e) => [e.term, ...(e.aliases ?? [])]));
  writeJson(join(PUBLIC_DATA, 'dictionary', 'terms.json'), { easton: te.out, smith: ts.out });
  writeJson(join(PUBLIC_DATA, 'dictionary', 'index.json'), {
    note: 'Nineteenth-century Protestant reference works (KJV numbering, Protestant canon and theology). The UI must label them as such. Scripture references are stored in the app anchor (Clementine Vulgate) numbering.',
    terms: 'terms.json maps lowercase term/alias to an entry index, or to an array of indexes when several entries share the name',
    works: {
      easton: { ...META.easton, url: SRC('easton'), entries: easton.length, file: 'easton.json' },
      smith: { ...META.smith, url: SRC('smith'), entries: smith.length, file: 'smith.json' },
      nave: { ...META.nave, url: SRC('nave'), topics: nave.length, file: 'nave.json', byBook: 'nave-by-book/<BOOK>.json rows [c1,v1,c2,v2,topicIndex]' },
    },
    counts: { easton: easton.length, smith: smith.length, nave: nave.length, scriptureRefsTagged: counts },
  });
  for (const [k, c] of Object.entries(counts)) {
    report.stats[`dictionary-${k}-refs`] = c;
    if (c.failed) report.warn(`dictionaries: ${k}: ${c.failed} of ${c.tagged} tagged verse references did not parse`);
  }
  report.stats['dictionary-terms'] = { easton: Object.keys(te.out).length, smith: Object.keys(ts.out).length, duplicatesEaston: te.dup, duplicatesSmith: ts.dup };
  if (failures.length) writeFileSync(join(RAW, 'dictionaries-ref-failures.txt'), failures.join('\n') + '\n');
}

if (process.argv[2] === 'fetch') fetchDictionaries().then(() => console.log('dictionaries fetched'));
if (process.argv[2] === 'build') {
  const r = new Report();
  buildDictionaries(r);
  console.log(JSON.stringify({ stats: r.stats, warnings: r.warnings }, null, 1));
}
