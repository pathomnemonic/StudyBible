import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PUBLIC_DATA, RAW, Report, readJson, sha256, today, writeJson } from './lib/util';
import { BOOK_ORDER } from '../../src/lib/canon';
import { fromAnchor, loadVersification, toAnchor, type VersificationData } from '../../src/lib/versification';

/**
 * People and places reference data from two open datasets (licence evidence is in docs/DATA_SOURCES.md):
 *
 *  A. STEPBible-Data (Tyndale House Cambridge / STEPBible.org), CC BY 4.0:
 *       TIPNR  proper names with meanings, relationships and exhaustive verse lists  -> public/data/reference/step/names*.json
 *       TBESG  brief Greek lexicon (Abbott-Smith / Middle Liddell)                    -> public/data/reference/step/lexicon-greek.json
 *     TBESH (brief Hebrew lexicon) is downloaded for the licence record only and is NOT ingested: its own header says the
 *     definitions are Online Bible's abridged BDB and "permission should be gained from Online Bible" before use.
 *  B. Theographic Bible Metadata (Robert Rouse / viz.bible), CC BY-SA 4.0 -> public/data/reference/theographic/*.json
 *
 * Both sources number verses the English (KJV/NRSV) way, so every reference goes through the app's `kjv` scheme to the anchor
 * (Clementine Vulgate) numbering. Raw files are cached under data/raw/names (ignored by git).
 *   npx tsx scripts/ingest/names.ts fetch | build | verify [seed]
 */
const STEP_BASE = 'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/';
const THEO_BASE = 'https://raw.githubusercontent.com/robertrouse/theographic-bible-metadata/master/';
const UA = 'StudyBibleApp/1.0 (+https://github.com/pathomnemonic/StudyBible)';
const DIR = join(RAW, 'names');
const OUT_STEP = join(PUBLIC_DATA, 'reference/step');
const OUT_THEO = join(PUBLIC_DATA, 'reference/theographic');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** local name -> path in the upstream repository */
const STEP_FILES: Record<string, string> = {
  'step/README.md': 'README.md',
  'step/TIPNR.txt': 'Proper Nouns/TIPNR - Translators Individualised Proper Names with all References - STEPBible.org CC BY.txt',
  'step/TBESG.txt': 'Lexicons/TBESG - Translators Brief lexicon of Extended Strongs for Greek - STEPBible.org CC BY.txt',
  'step/TBESH.txt': 'Lexicons/TBESH - Translators Brief lexicon of Extended Strongs for Hebrew - STEPBible.org CC BY.txt', // licence record only
};
const THEO_FILES: Record<string, string> = {
  'theographic/LICENSE': 'LICENSE',
  'theographic/readme.md': 'readme.md',
  'theographic/data-source-bibliography.md': 'docs/data-source-bibliography.md',
  'theographic/chronology-and-dates.md': 'docs/chronology-and-dates.md',
  'theographic/people.json': 'json/people.json',
  'theographic/places.json': 'json/places.json',
  'theographic/events.json': 'json/events.json',
  'theographic/verses.json': 'json/verses.json',
};

export async function fetchNames() {
  for (const [files, base] of [[STEP_FILES, STEP_BASE], [THEO_FILES, THEO_BASE]] as const) {
    for (const [local, remote] of Object.entries(files)) {
      const f = join(DIR, local);
      if (existsSync(f)) continue;
      mkdirSync(join(f, '..'), { recursive: true });
      const r = await fetch(base + remote.split('/').map(encodeURIComponent).join('/'), { headers: { 'user-agent': UA } });
      if (!r.ok) throw new Error(`${remote}: HTTP ${r.status}`);
      writeFileSync(f, Buffer.from(await r.arrayBuffer()));
      console.log(`names: fetched ${local}`);
      await sleep(500);
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// shared: references -> anchor ids
// ---------------------------------------------------------------------------------------------------------------------

const BOOK_IDX = new Map<string, number>(Object.entries(BOOK_ORDER));
const pad = (n: number) => String(n).padStart(3, '0');

/** Counts how references were converted, so the build report says what was approximate. */
class Anchorer {
  total = 0;
  exact = 0;
  grouped = 0; // one English verse -> a run of anchor verses (or the reverse), recorded as the run
  inexact = 0; // the app's own mapping flags this chapter as unverified / outside rules
  inexactBooks = new Map<string, number>();
  /** English (book, c, v) -> anchor verses [c, v1, v2] */
  to(book: string, c: number, v: number): [number, number, number] {
    const a = toAnchor('kjv', book, c, v);
    this.total++;
    if (a.exact) this.exact++;
    else {
      this.inexact++;
      this.inexactBooks.set(book, (this.inexactBooks.get(book) ?? 0) + 1);
    }
    if (a.v2 !== a.v1) this.grouped++;
    return [a.c, a.v1, Math.max(a.v1, a.v2)];
  }
  stats() {
    return { converted: this.total, exact: this.exact, approximate: this.inexact, runs: this.grouped, approximateByBook: Object.fromEntries([...this.inexactBooks].sort((a, b) => b[1] - a[1]).slice(0, 12)) };
  }
}

/** Accumulates, per entry, the anchor verses it occurs in; produces the sorted id list and the by-book row index. */
class RefSet {
  private byBook = new Map<string, Set<number>>(); // book -> c*1000+v
  add(book: string, [c, v1, v2]: [number, number, number]) {
    let s = this.byBook.get(book);
    if (!s) this.byBook.set(book, (s = new Set()));
    for (let v = v1; v <= v2; v++) s.add(c * 1000 + v);
  }
  get size() {
    let n = 0;
    for (const s of this.byBook.values()) n += s.size;
    return n;
  }
  ids(): string[] {
    const out: string[] = [];
    for (const b of [...this.byBook.keys()].sort((x, y) => (BOOK_IDX.get(x) ?? 999) - (BOOK_IDX.get(y) ?? 999)))
      for (const k of [...this.byBook.get(b)!].sort((x, y) => x - y)) out.push(`${b}.${Math.floor(k / 1000)}.${k % 1000}`);
    return out;
  }
  /** first verse in canonical order */
  first(): string | undefined {
    return this.ids()[0];
  }
  /** adjacent verses of one chapter are merged into a range; lossless */
  rows(book: string, idx: number): number[][] {
    const s = this.byBook.get(book);
    if (!s) return [];
    const rows: number[][] = [];
    for (const k of [...s].sort((a, b) => a - b)) {
      const c = Math.floor(k / 1000);
      const v = k % 1000;
      const last = rows[rows.length - 1];
      if (last && last[0] === c && last[3] === v - 1) last[3] = v;
      else rows.push([c, v, c, v, idx]);
    }
    return rows;
  }
  books() {
    return [...this.byBook.keys()];
  }
}

function writeByBook(dir: string, sets: RefSet[]): number {
  const rows = new Map<string, number[][]>();
  sets.forEach((set, i) => {
    for (const b of set.books()) {
      let arr = rows.get(b);
      if (!arr) rows.set(b, (arr = []));
      arr.push(...set.rows(b, i));
    }
  });
  let n = 0;
  for (const [b, arr] of rows) {
    arr.sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[4] - y[4]);
    writeJson(join(dir, `${b}.json`), arr);
    n += arr.length;
  }
  return n;
}

function loadVers() {
  loadVersification(readJson<VersificationData>(join(PUBLIC_DATA, 'versification.json')));
}

const ents = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const fileInfo = (rel: string) => {
  const buf = readFileSync(join(DIR, rel));
  return { file: rel, bytes: buf.length, sha256: sha256(buf) };
};

// ---------------------------------------------------------------------------------------------------------------------
// A. STEPBible
// ---------------------------------------------------------------------------------------------------------------------

/** STEP's three-letter book codes are the app's ids in upper case (Gen, Mrk, Jhn, 1Sa, ...). */
const stepBook = (abbr: string) => {
  const id = abbr.toUpperCase();
  return BOOK_IDX.has(id) && !['TOB', 'JDT', 'WIS', 'SIR', 'BAR', '1MA', '2MA'].includes(id) ? id : undefined;
};

const REF_RE = /^(LXX\.)?([1-3]?[A-Za-z]{2,3})\.(\d+)\.(\d+)[a-z]?$/;

/** "Amram@Exo.6.18-1Ch + Jochebed@Exo.6.20-Num" -> display names */
const relNames = (s: string | undefined): string[] =>
  (s ?? '')
    .split(/,| \+ /)
    .map((x) =>
      x
        .replace(/\((?:\?|[daf])\)/g, '')
        .replace(/@[^\s,+]*/g, '')
        .split('|')
        .pop()!
        .replace(/^[=\s+>]+$/, '')
        .trim(),
    )
    .filter(Boolean);

const tidy = (s: string | undefined) => ents((s ?? '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

export interface StepEntry {
  id: string;
  name: string;
  kind: 'person' | 'place' | 'other';
  /** STEP's own type: Male, Female, Group, Place, Supernatural, Title, Time, Language, Other ... */
  type?: string;
  /** Meaning / identification in up to ten words (STEP @Brief) */
  meaning?: string;
  desc?: string;
  notes: string[];
  refs: string[];
  forms?: { s: string; o?: string; t?: string }[];
  rel?: Record<string, string[] | string>;
  lat?: number;
  lon?: number;
  area?: string;
}

interface Rec { section: string; head: string[]; subs: string[][]; extra: Record<string, string> }

function parseTipnr(text: string): Rec[] {
  const recs: Rec[] = [];
  let cur: Rec | null = null;
  let section = '';
  let expectHead = false;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (line.startsWith('$=')) {
      section = line.split('\t')[0].replace(/^\$=+\s*/, '').trim();
      expectHead = true;
      cur = null;
      continue;
    }
    if (expectHead) {
      expectHead = false;
      if (/^Uni(?:fied|que)Name=/.test(line)) continue; // the legend block at the top of the file
      cur = { section, head: line.split('\t'), subs: [], extra: {} };
      recs.push(cur);
      continue;
    }
    if (!cur) continue;
    if (line.startsWith('–')) cur.subs.push(line.split('\t'));
    else if (line.startsWith('@')) {
      const m = /^@(\w+)=\s*(.*)$/.exec(line);
      if (m) cur.extra[m[1]] = m[2].replace(/\t+$/, '').trim();
    }
  }
  return recs;
}

export function buildStepNames(report: Report) {
  const src = join(DIR, 'step/TIPNR.txt');
  loadVers();
  const recs = parseTipnr(readFileSync(src, 'utf8'));
  const anc = new Anchorer();
  const entries: StepEntry[] = [];
  const sets: RefSet[] = [];
  const bad = new Map<string, number>();
  let skippedExcluded = 0;
  let lxxRefs = 0;
  let refsRead = 0;
  const idSeen = new Map<string, number>();

  for (const rec of recs) {
    if (/^EXCLUDED/.test(rec.section)) { skippedExcluded++; continue; }
    const h = rec.head;
    const m0 = /^(.*?)@([^=]*)(?:=(.*))?$/.exec(h[0].trim());
    if (!m0) { report.warn(`names: unparseable TIPNR header ${h[0].slice(0, 60)}`); continue; }
    const name = m0[1].split('|').pop()!.trim();
    const ustrong = (m0[3] ?? '').trim();
    const si = h.findIndex((x) => x.startsWith('#'));
    const type = si >= 0 ? (h.slice(si + 1).find((x) => x.trim()) ?? '').trim() : '';
    const isPlace = /^PLACE/.test(rec.section);
    const kind: StepEntry['kind'] = isPlace ? 'place' : rec.section.startsWith('PERSON') ? (/^(Male|Female)$/.test(type) ? 'person' : 'other') : 'other';

    // exhaustive refs: every sub-record except "Total" (whose list is abbreviated, "27ff"). Column 4 is the ref list; some records
    // carry a stepbible.org URL there, in which case the list is the next column. The URL uses different book codes, so skip it.
    const set = new RefSet();
    const forms: NonNullable<StepEntry['forms']> = [];
    for (const sub of rec.subs) {
      if (/^–\s*Total/.test(sub[0])) continue;
      const refCol = sub.slice(4).find((c) => c.trim() && !/^https?:/.test(c.trim()));
      let prev = ''; // a bare "16" after "Num.13.8," means verse 16 of the same chapter
      for (let tok of (refCol ?? '').split(/[;,]/).map((t) => t.trim()).filter(Boolean)) {
        refsRead++;
        if (/^\d+$/.test(tok) && prev) tok = `${prev}.${tok}`;
        const rm = REF_RE.exec(tok);
        if (rm) prev = `${rm[2]}.${rm[3]}`;
        if (!rm) { bad.set(tok, (bad.get(tok) ?? 0) + 1); continue; }
        if (rm[1]) { lxxRefs++; continue; } // LXX-only occurrences use the Greek OT's own numbering; not mapped
        const book = stepBook(rm[2]);
        if (!book) { bad.set(rm[2], (bad.get(rm[2]) ?? 0) + 1); continue; }
        set.add(book, anc.to(book, +rm[3], +rm[4]));
      }
      const fm = /^([GH]\d+[A-Za-z]?)(?:«[^=]*)?=(.*)$/.exec((sub[2] ?? '').trim());
      if (fm && !forms.some((f) => f.s === fm[1])) forms.push({ s: fm[1], o: fm[2].trim() || undefined, t: tidy((sub[3] ?? '').split('=')[0]) || undefined });
    }

    const notes: string[] = [];
    if (rec.extra.Short) notes.push(tidy(rec.extra.Short));
    for (const p of (rec.extra.Article ?? '').split(/<br\s*\/?>/i)) if (tidy(p)) notes.push(tidy(p));
    const e: StepEntry = { id: ustrong || name, name, kind, notes, refs: [] };
    if (type) e.type = type;
    const meaning = tidy(rec.extra.Brief) || tidy(rec.extra.Briefest);
    if (meaning) e.meaning = meaning;

    const rel: Record<string, string[] | string> = {};
    if (isPlace) {
      const gm = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),\d+z/.exec(h[4] ?? '') ?? /palopenmaps.*@(-?\d+\.\d+),(-?\d+\.\d+)\s*$/.exec(h[5] ?? '');
      if (gm) { e.lat = +(+gm[1]).toFixed(5); e.lon = +(+gm[2]).toFixed(5); }
      const founder = relNames(h[2]);
      if (founder.length) rel.founder = founder;
      const peoples = relNames(h[3]);
      if (peoples.length) rel.peoples = peoples;
      if (h[6] && h[6].trim() && h[6].trim() !== '>') e.area = h[6].trim();
    } else {
      if (h[1]?.trim()) e.desc = tidy(h[1]);
      const parents = (h[2] ?? '').split(' + ');
      const father = relNames(parents[0])[0];
      const mother = relNames(parents[1])[0];
      if (father) rel.father = father;
      if (mother) rel.mother = mother;
      for (const [k, i] of [['siblings', 3], ['partners', 4], ['offspring', 5]] as const) {
        const v = relNames(h[i]);
        if (v.length) rel[k] = v;
      }
      if (h[6]?.trim() && h[6].trim() !== '>') rel.tribe = tidy(h[6]);
    }
    if (Object.keys(rel).length) e.rel = rel;
    if (forms.length) e.forms = forms;
    if (!set.size && !forms.length) continue; // nothing usable
    entries.push(e);
    sets.push(set);
    idSeen.set(e.id, (idSeen.get(e.id) ?? 0) + 1);
  }
  // ids: the unified Strong's number identifies the individual; where two records share one, suffix the name
  entries.forEach((e, i) => {
    if (idSeen.get(e.id)! > 1) e.id = `${e.id}-${e.name}`;
    e.refs = sets[i].ids();
  });
  const idCheck = new Set(entries.map((e) => e.id));
  if (idCheck.size !== entries.length) report.warn(`names: ${entries.length - idCheck.size} duplicate STEP ids`);

  writeJson(join(OUT_STEP, 'names.json'), entries);
  const rows = writeByBook(join(OUT_STEP, 'names-by-book'), sets);
  if (bad.size) report.warn(`names: ${[...bad.values()].reduce((a, b) => a + b, 0)} STEP reference tokens not understood, e.g. ${[...bad.keys()].slice(0, 8).join(' | ')}`);
  const kinds = entries.reduce<Record<string, number>>((a, e) => ((a[e.kind] = (a[e.kind] ?? 0) + 1), a), {});
  const stats = { records: recs.length, excludedSections: skippedExcluded, entries: entries.length, kinds, refTokensRead: refsRead, lxxOnlyRefsNotMapped: lxxRefs, anchorVerses: sets.reduce((a, s) => a + s.size, 0), byBookRows: rows, withCoordinates: entries.filter((e) => e.lat !== undefined).length, withMeaning: entries.filter((e) => e.meaning).length, withNotes: entries.filter((e) => e.notes.length).length, versification: anc.stats() };
  report.stats['names.step'] = stats;
  return { stats, tipnr: fileInfo('step/TIPNR.txt') };
}

/** TBESG: eStrong, dStrong, uStrong, Greek, transliteration, morph, gloss, definition (HTML-ish). */
export function buildStepLexicon(report: Report) {
  const text = readFileSync(join(DIR, 'step/TBESG.txt'), 'utf8');
  const out: Record<string, { g: string; tr?: string; m?: string; gloss: string; def: string; d?: string }> = {};
  let n = 0;
  let renamed = 0;
  for (const raw of text.split('\n')) {
    const c = raw.replace(/\r$/, '').split('\t');
    if (c.length < 8 || !/^G\d+$/.test(c[0])) continue;
    n++;
    const dStrong = c[1].replace(/\s*=\s*$/, '').trim();
    const def = ents(
      c[7]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ''),
    )
      .split('\n')
      .map((l) => l.replace(/^[\s_]+/, '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n');
    const entry = { g: c[3].trim(), tr: c[4].trim() || undefined, m: c[5].trim() || undefined, gloss: c[6].trim(), def, d: dStrong };
    // keyed by extended Strong's; the 100-odd numbers STEP splits into several words (G0001G/G0001H) keep their disambiguated key
    let key = c[0];
    if (out[key]) { key = dStrong; renamed++; }
    out[key] = entry;
  }
  writeJson(join(OUT_STEP, 'lexicon-greek.json'), out);
  report.stats['names.lexicon-greek'] = { entries: n, keyedByDisambiguatedStrong: renamed };
  return { entries: n, renamed, tbesg: fileInfo('step/TBESG.txt'), tbesh: fileInfo('step/TBESH.txt') };
}

// ---------------------------------------------------------------------------------------------------------------------
// B. Theographic
// ---------------------------------------------------------------------------------------------------------------------

/** Theographic's OSIS names, in canonical (Protestant) order */
const THEO_BOOKS: Record<string, string> = {
  Gen: 'GEN', Exod: 'EXO', Lev: 'LEV', Num: 'NUM', Deut: 'DEU', Josh: 'JOS', Judg: 'JDG', Ruth: 'RUT', '1Sam': '1SA', '2Sam': '2SA', '1Kgs': '1KI', '2Kgs': '2KI', '1Chr': '1CH', '2Chr': '2CH', Ezra: 'EZR', Neh: 'NEH', Esth: 'EST', Job: 'JOB', Ps: 'PSA', Prov: 'PRO', Eccl: 'ECC', Song: 'SNG', Isa: 'ISA', Jer: 'JER', Lam: 'LAM', Ezek: 'EZK', Dan: 'DAN', Hos: 'HOS', Joel: 'JOL', Amos: 'AMO', Obad: 'OBA', Jonah: 'JON', Mic: 'MIC', Nah: 'NAM', Hab: 'HAB', Zeph: 'ZEP', Hag: 'HAG', Zech: 'ZEC', Mal: 'MAL', Matt: 'MAT', Mark: 'MRK', Luke: 'LUK', John: 'JHN', Acts: 'ACT', Rom: 'ROM', '1Cor': '1CO', '2Cor': '2CO', Gal: 'GAL', Eph: 'EPH', Phil: 'PHP', Col: 'COL', '1Thess': '1TH', '2Thess': '2TH', '1Tim': '1TI', '2Tim': '2TI', Titus: 'TIT', Phlm: 'PHM', Heb: 'HEB', Jas: 'JAS', '1Pet': '1PE', '2Pet': '2PE', '1John': '1JN', '2John': '2JN', '3John': '3JN', Jude: 'JUD', Rev: 'REV',
};

interface TRec { id: string; fields: Record<string, any> }

export function buildTheographic(report: Report) {
  loadVers();
  const dir = join(DIR, 'theographic');
  const rd = (f: string) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as TRec[];
  const verses = rd('verses.json');
  const people = rd('people.json');
  const places = rd('places.json');
  const events = rd('events.json');
  const anc = new Anchorer();

  // record id -> English (book, chapter, verse); anchor conversion is cached per verse
  const vmap = new Map<string, { b: string; c: number; v: number; key: number }>();
  const cache = new Map<string, [number, number, number]>();
  let unknownBook = 0;
  for (const r of verses) {
    const [ob, c, v] = String(r.fields.osisRef).split('.');
    const b = THEO_BOOKS[ob];
    if (!b) { unknownBook++; continue; }
    vmap.set(r.id, { b, c: +c, v: +v, key: (BOOK_IDX.get(b) ?? 0) * 1e6 + +c * 1e3 + +v });
  }
  if (unknownBook) report.warn(`names: ${unknownBook} Theographic verses with an unknown book`);
  const anchorOf = (rid: string): { b: string; a: [number, number, number] } | undefined => {
    const x = vmap.get(rid);
    if (!x) return undefined;
    const k = `${x.b}.${x.c}.${x.v}`;
    let a = cache.get(k);
    if (!a) cache.set(k, (a = anc.to(x.b, x.c, x.v)));
    return { b: x.b, a };
  };
  const setOf = (rids: string[] | undefined) => {
    const s = new RefSet();
    for (const rid of rids ?? []) {
      const x = anchorOf(rid);
      if (x) s.add(x.b, x.a);
    }
    return s;
  };
  const firstOf = (rids: string[] | undefined) => {
    let best: string | undefined;
    let bk = Infinity;
    for (const rid of rids ?? []) {
      const x = vmap.get(rid);
      if (x && x.key < bk) { bk = x.key; best = rid; }
    }
    if (!best) return undefined;
    const x = anchorOf(best)!;
    return `${x.b}.${x.a[0]}.${x.a[1]}`;
  };

  const pTitle = new Map(people.map((p) => [p.id, (p.fields.displayTitle || p.fields.name) as string]));
  const plTitle = new Map(places.map((p) => [p.id, (p.fields.displayTitle || p.fields.kjvName) as string]));
  const evTitle = new Map(events.map((p) => [p.id, p.fields.title as string]));
  const names = (ids: string[] | undefined, m: Map<string, string>) => [...new Set((ids ?? []).map((i) => m.get(i)).filter((x): x is string => !!x))];
  const int = (s: unknown) => (s !== undefined && s !== '' && Number.isFinite(+(s as string)) ? Math.round(+(s as string)) : undefined);
  const list = (s: unknown) => String(s ?? '').split(/[,;]/).map((x) => x.trim()).filter(Boolean);
  const clean = <T extends Record<string, any>>(o: T): T => {
    for (const k of Object.keys(o)) if (o[k] === undefined || (Array.isArray(o[k]) && !o[k].length)) delete o[k];
    return o;
  };

  // people
  const pSets: RefSet[] = [];
  const pOut = people
    .filter((p) => (p.fields.verses ?? []).length)
    .map((p) => {
      const f = p.fields;
      const s = setOf(f.verses);
      pSets.push(s);
      const alias = list(f.alsoCalled).filter((a) => a !== f.name);
      return clean({
        id: f.personLookup as string,
        name: f.name as string,
        title: f.displayTitle && f.displayTitle !== f.name ? (f.displayTitle as string) : undefined,
        aliases: alias,
        gender: f.gender ? String(f.gender).toLowerCase() : undefined,
        proper: f.isProperName === false ? false : undefined,
        birth: int(f.birthYear),
        death: int(f.deathYear),
        father: names(f.father, pTitle),
        mother: names(f.mother, pTitle),
        siblings: names(f.siblings, pTitle),
        halfSiblings: names([...(f.halfSiblingsSameFather ?? []), ...(f.halfSiblingsSameMother ?? [])], pTitle),
        partners: names(f.partners, pTitle),
        children: names(f.children, pTitle),
        birthPlace: names(f.birthPlace, plTitle),
        deathPlace: names(f.deathPlace, plTitle),
        first: firstOf(f.verses),
        n: s.size,
      });
    });
  // father/mother as single names, as the other files do
  for (const p of pOut as any[]) { if (p.father) p.father = p.father[0]; if (p.mother) p.mother = p.mother[0]; }
  writeJson(join(OUT_THEO, 'people.json'), pOut);
  const pRows = writeByBook(join(OUT_THEO, 'people-by-book'), pSets);

  // places
  const plSets: RefSet[] = [];
  const plOut = places
    .filter((p) => (p.fields.verses ?? []).length)
    .map((p) => {
      const f = p.fields;
      const s = setOf(f.verses);
      plSets.push(s);
      const lat = Number.parseFloat(f.latitude ?? f.openBibleLat);
      const lon = Number.parseFloat(f.longitude ?? f.openBibleLong);
      const alias = [...list(f.aliases), f.esvName && f.esvName !== f.kjvName ? String(f.esvName) : ''].filter((a) => a && a !== f.kjvName);
      return clean({
        id: f.placeLookup as string,
        name: f.kjvName as string,
        title: f.displayTitle && f.displayTitle !== f.kjvName ? (f.displayTitle as string) : undefined,
        aliases: [...new Set(alias)],
        lat: Number.isFinite(lat) && Number.isFinite(lon) ? +lat.toFixed(5) : undefined,
        lon: Number.isFinite(lat) && Number.isFinite(lon) ? +lon.toFixed(5) : undefined,
        kind: String(f.featureType ?? f.recogitoType ?? 'unknown').toLowerCase(),
        sub: f.featureSubType ? String(f.featureSubType).toLowerCase() : undefined,
        precision: f.precision || undefined,
        partOf: names(f.partOf, plTitle),
        verses: s.ids(),
      });
    });
  writeJson(join(OUT_THEO, 'places.json'), plOut);
  const plRows = writeByBook(join(OUT_THEO, 'places-by-book'), plSets);

  // events
  const eSets: RefSet[] = [];
  const eOut = events
    .filter((e) => e.fields.title && (e.fields.verses ?? []).length)
    .sort((a, b) => (a.fields.sortKey ?? 0) - (b.fields.sortKey ?? 0))
    .map((e) => {
      const f = e.fields;
      const s = setOf(f.verses);
      eSets.push(s);
      return clean({
        id: f.eventID as number,
        title: f.title as string,
        start: f.startDate as string | undefined, // ISO astronomical year ("-4003" = 4004 BC) or a calendar date; Floyd Nolen Jones's chronology
        duration: f.duration as string | undefined,
        approx: f.rangeFlag ? true : undefined,
        partOf: names(f.partOf, evTitle),
        participants: names(f.participants, pTitle),
        places: names(f.locations, plTitle),
        verses: s.ids(),
      });
    });
  writeJson(join(OUT_THEO, 'events.json'), eOut);
  const eRows = writeByBook(join(OUT_THEO, 'events-by-book'), eSets);

  const stats = {
    people: pOut.length, peopleDropped: people.length - pOut.length,
    places: plOut.length, placesWithCoordinates: plOut.filter((p: any) => p.lat !== undefined).length,
    events: eOut.length,
    rowsByBook: { people: pRows, places: plRows, events: eRows },
    versification: anc.stats(),
  };
  report.stats['names.theographic'] = stats;
  return { stats, files: ['LICENSE', 'readme.md', 'data-source-bibliography.md', 'people.json', 'places.json', 'events.json', 'verses.json'].map((f) => fileInfo(`theographic/${f}`)) };
}

// ---------------------------------------------------------------------------------------------------------------------

export function buildNames(report: Report) {
  if (!existsSync(join(DIR, 'step/TIPNR.txt')) || !existsSync(join(DIR, 'theographic/people.json'))) {
    report.warn('names: raw files missing (run: npx tsx scripts/ingest/names.ts fetch); people and places reference data is skipped');
    return;
  }
  const step = buildStepNames(report);
  const lex = buildStepLexicon(report);
  writeJson(join(OUT_STEP, 'index.json'), {
    source: 'STEP Bible (STEPBible.org), data created by Tyndale House Cambridge',
    sourceUrl: 'https://github.com/STEPBible/STEPBible-Data',
    licence: 'CC BY 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Data from STEP Bible (STEPBible.org), created by Tyndale House, Cambridge, licensed CC BY 4.0. Names: TIPNR; Greek lexicon: TBESG (after Abbott-Smith and Middle Liddell). Changes: converted to JSON, verse numbers converted to the app\'s numbering.',
    notice: 'Short/brief descriptions and articles in names.json are adapted by STEPBible from output by Claude 3 Opus (April 2024).',
    retrieved: today(),
    files: { 'names.json': 'entries [{id,name,kind,type,meaning,desc,notes,refs,forms,rel,lat,lon,area}]', 'names-by-book/<BOOK>.json': 'rows [c1,v1,c2,v2,entryIndex] (anchor numbering; entryIndex into names.json)', 'lexicon-greek.json': 'extended Strong\'s -> {g,tr,m,gloss,def,d}' },
    notIngested: { 'TBESH (Hebrew brief lexicon)': 'header: definitions are Online Bible\'s abridged BDB and "Permission should be gained from Online Bible before these definitions are applied in any project"' },
    versification: 'STEP refs use standard English (NRSV/KJV) numbering; converted with the app\'s `kjv` scheme (toAnchor). Occurrences only in the LXX (prefix LXX.) use the Greek numbering and are not mapped. Books outside the Protestant canon are not covered by TIPNR.',
    stats: step.stats,
    lexicon: { entries: lex.entries, keyedByDisambiguatedStrong: lex.renamed },
    sourceFiles: [step.tipnr, lex.tbesg, fileInfo('step/README.md')],
  });
  const theo = buildTheographic(report);
  writeJson(join(OUT_THEO, 'index.json'), {
    source: 'Theographic Bible Metadata, Robert Rouse (viz.bible)',
    sourceUrl: 'https://github.com/robertrouse/theographic-bible-metadata',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    attribution: 'Theographic Bible Metadata by Robert Rouse (viz.bible), CC BY-SA 4.0. Draws on STEPBible TIPNR (CC BY 4.0), OpenBible.info geocoding (CC BY), Floyd Nolen Jones\'s chronology. Changes: compacted to JSON, verse numbers converted to the app\'s numbering.',
    shareAlike: 'The files in this directory are adaptations of the Theographic data and must be redistributed under CC BY-SA 4.0 (or a compatible licence).',
    notIncluded: 'Easton\'s Bible Dictionary text and KJV verse text that Theographic also carries.',
    chronologyNote: 'Event dates and birth/death years follow Floyd Nolen Jones (a young-earth Ussher-style chronology), as ISO 8601 astronomical years (-4003 = 4004 BC). They are one scholar\'s chronology, not consensus dates.',
    retrieved: today(),
    versification: 'Theographic verses are KJV-numbered; converted with the app\'s `kjv` scheme.',
    stats: theo.stats,
    sourceFiles: theo.files,
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// quality gate: random entries, refs checked against the verse text in public/data/bible/webc
// ---------------------------------------------------------------------------------------------------------------------

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function verifyNames(seed = 7) {
  loadVers();
  let st = seed >>> 0;
  const rnd = () => ((st = (Math.imul(st, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const pick = <T,>(a: T[], n: number) => { const c = [...a]; const o: T[] = []; while (o.length < n && c.length) o.push(c.splice(Math.floor(rnd() * c.length), 1)[0]); return o; };
  const cache = new Map<string, Map<string, string>>();
  const verse = (anchor: string) => {
    const [b, c, v] = anchor.split('.');
    const n = fromAnchor('english', b, +c, +v); // WEB-C is in the English tradition
    if (!cache.has(b)) {
      const m = new Map<string, string>();
      const f = join(PUBLIC_DATA, 'bible/webc', `${b}.json`);
      if (existsSync(f)) for (const ch of JSON.parse(readFileSync(f, 'utf8')).chapters) for (const bl of ch.blocks) if (Array.isArray(bl[1]) && Array.isArray(bl[1][0])) for (const [vn, t] of bl[1]) m.set(`${ch.n}.${vn}`, ((m.get(`${ch.n}.${vn}`) ?? '') + ' ' + t).trim());
      cache.set(b, m);
    }
    return { at: `${b} ${n.c}:${n.v1}${n.v2 !== n.v1 ? '-' + n.v2 : ''}`, text: cache.get(b)!.get(`${n.c}.${n.v1}`) };
  };
  const hit = (variants: string[], text: string | undefined) => {
    if (!text) return undefined;
    const t = fold(text);
    return variants.some((v) => v.length >= 3 && (t.includes(fold(v)) || (v.length > 4 && t.includes(fold(v).slice(0, -1)))));
  };
  const report = (label: string, rows: { name: string; variants: string[]; refs: string[] }[], count = 6) => {
    console.log(`\n=== ${label}`);
    for (const r of pick(rows, count)) {
      console.log(`- ${r.name}  (${r.refs.length} refs)`);
      for (const ref of pick(r.refs, 2)) {
        const v = verse(ref);
        const ok = hit(r.variants, v.text);
        console.log(`    ${ref} -> WEB-C ${v.at}  [${ok === undefined ? 'no text' : ok ? 'name found' : 'NAME NOT FOUND'}]  ${v.text?.slice(0, 110) ?? ''}`);
      }
    }
    // overall hit rate over a larger random sample
    let ok = 0, miss = 0, none = 0;
    for (const r of pick(rows, 400)) for (const ref of pick(r.refs, 2)) { const h = hit(r.variants, verse(ref).text); if (h === undefined) none++; else if (h) ok++; else miss++; }
    console.log(`  sample of ${ok + miss + none} refs: ${ok} name found, ${miss} not found (translation/spelling differences), ${none} no text`);
  };
  const step = JSON.parse(readFileSync(join(OUT_STEP, 'names.json'), 'utf8')) as StepEntry[];
  const sv = (e: StepEntry) => [e.name, ...(e.forms ?? []).map((f) => f.t ?? '')].filter(Boolean);
  report('STEP people', step.filter((e) => e.kind === 'person' && e.refs.length).map((e) => ({ name: e.name, variants: sv(e), refs: e.refs })));
  report('STEP places', step.filter((e) => e.kind === 'place' && e.refs.length).map((e) => ({ name: e.name, variants: sv(e), refs: e.refs })));
  const tp = JSON.parse(readFileSync(join(OUT_THEO, 'people.json'), 'utf8'));
  const tpl = JSON.parse(readFileSync(join(OUT_THEO, 'places.json'), 'utf8'));
  // people.json keeps only the first mention; the full verse list is the people-by-book row index
  const pv = new Map<number, string[]>();
  const pdir = join(OUT_THEO, 'people-by-book');
  for (const f of readdirSync(pdir)) for (const r of JSON.parse(readFileSync(join(pdir, f), 'utf8'))) for (let v = r[1]; v <= r[3]; v++) (pv.get(r[4]) ?? pv.set(r[4], []).get(r[4])!).push(`${f.replace('.json', '')}.${r[0]}.${v}`);
  report('Theographic people', tp.map((p: any, i: number) => ({ name: p.name, variants: [p.name, ...(p.aliases ?? [])], refs: pv.get(i) ?? [] })).filter((x: any) => x.refs.length));
  report('Theographic places', tpl.map((p: any) => ({ name: p.name, variants: [p.name, ...(p.aliases ?? [])], refs: p.verses })));
}

if (process.argv[1]?.endsWith('names.ts')) {
  const [, , cmd, arg] = process.argv;
  if (cmd === 'fetch') fetchNames().then(() => console.log('names fetched'));
  else if (cmd === 'build') { const r = new Report(); buildNames(r); console.log(JSON.stringify(r.stats, null, 1)); console.log(r.warnings, r.errors); }
  else if (cmd === 'verify') verifyNames(arg ? +arg : 7);
}
