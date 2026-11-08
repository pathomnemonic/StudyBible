/** Builds public/data/readings-together/<year>.json: for every Sunday and major feast in the bundled lectionary years,
 *  (a) the cross-references that join the readings to each other (OpenBible cross-references and the app's "quoted in the New Testament" notes),
 *  (b) the best Church-Father comment on the Gospel from the bundled Catena Aurea, quoted verbatim.
 *  Nothing is interpreted here: every line is either a reference found in the data, or a quotation copied from a source file.
 *  Run: npx tsx scripts/launch/make-readings-together.ts */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRefs, refContains, formatRef, type Ref } from '../../src/lib/refs';
import { convertRef, chapterToAnchorRefs, loadVersification } from '../../src/lib/versification';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = join(ROOT, 'public', 'data');
const json = <T = any>(rel: string): T => JSON.parse(readFileSync(join(DATA, rel), 'utf8'));
loadVersification(json('versification.json'));

type Slot = 'first_reading' | 'responsorial_psalm' | 'second_reading' | 'gospel';
const SLOTS: Slot[] = ['first_reading', 'responsorial_psalm', 'second_reading', 'gospel'];
const SLOT_NAME: Record<Slot, string> = { first_reading: 'first reading', responsorial_psalm: 'psalm', second_reading: 'second reading', gospel: 'Gospel' };

/** Same reading of the lectionary strings as src/liturgy/readings.ts (Lectionary = KJV numbering; Psalms by whole psalm). */
function toRefs(text: string): Ref[] {
  const refs: Ref[] = [];
  for (const piece of text.split('|')) {
    const p = parseRefs(piece.replace(/(\d)[a-d]+\b/g, '$1').replace(/\s*[–—]\s*/g, '-').replace(/\(\d+\)/g, ''));
    if (!p.ok) continue;
    for (const { ref } of p.refs) {
      if (ref.book === 'PSA') for (let c = ref.c1; c <= ref.c2; c++) refs.push(...chapterToAnchorRefs('kjv', 'PSA', c).map((x) => x.ref));
      else refs.push(convertRef('kjv', 'vulgate', ref).ref);
    }
  }
  return refs;
}
const label = (rs: Ref[]) => rs.map((r) => formatRef(r)).join('; ');

const xrefCache = new Map<string, Record<string, [string, number][]>>();
const xrefs = (book: string) => {
  if (!xrefCache.has(book)) xrefCache.set(book, existsSync(join(DATA, 'xrefs', `${book}.json`)) ? json(`xrefs/${book}.json`) : {});
  return xrefCache.get(book)!;
};
const TARGET = /^(\w+)\.(\d+)\.(\d+)(?:-(?:(\d+)\.)?(\d+))?$/;
function parseTarget(t: string): Ref | null {
  const m = TARGET.exec(t); if (!m) return null;
  const c1 = +m[2], v1 = +m[3];
  return { book: m[1], c1, v1, c2: m[4] ? +m[4] : c1, v2: m[5] ? +m[5] : v1 };
}
const inAny = (rs: Ref[], x: Ref) => {
  for (const r of rs) {
    if (r.book !== x.book) continue;
    for (let c = x.c1; c <= x.c2; c++) for (const v of [x.v1!, x.v2!]) if (refContains(r, x.book, c, v)) return true;
  }
  return false;
};

interface Link { a: Slot; b: Slot; from: string; to: string; votes: number; kind: 'xref' }
interface Quoted { a: Slot; b: Slot; from: string; to: string; note: string; kind: 'quoted' }

/** OpenBible cross-references running either way between two passages. */
function xrefLinks(a: Slot, ra: Ref[], b: Slot, rb: Ref[]): Link[] {
  const out = new Map<string, Link>();
  for (const [from, rf, other, rt] of [[a, ra, b, rb], [b, rb, a, ra]] as const) {
    for (const r of rf) {
      const table = xrefs(r.book);
      for (const [key, list] of Object.entries(table)) {
        const [c, v] = key.split('.').map(Number);
        if (!refContains(r, r.book, c, v)) continue;
        for (const [t, votes] of list) {
          const tr = parseTarget(t); if (!tr || !inAny(rt, tr)) continue;
          const src: Ref = { book: r.book, c1: c, v1: v, c2: c, v2: v };
          const id = `${from}:${key}->${t}`;
          const l: Link = from === a
            ? { a, b, from: formatRef(src), to: formatRef(tr), votes, kind: 'xref' }
            : { a, b, from: formatRef(tr), to: formatRef(src), votes, kind: 'xref' };
          if (!out.has(id)) out.set(id, l);
        }
      }
    }
  }
  return [...out.values()];
}

const quotes = json('lens/quotes.json').entries as { kind: string; note: string; a: string[]; b: string[] }[];
const vidRef = (id: string): Ref | null => { const m = /^(\w+)\.(\d+)\.(\d+)$/.exec(id); return m ? { book: m[1], c1: +m[2], v1: +m[3], c2: +m[2], v2: +m[3] } : null; };
function quotedLinks(a: Slot, ra: Ref[], b: Slot, rb: Ref[]): Quoted[] {
  const out: Quoted[] = [];
  for (const q of quotes) {
    const A = q.a.map(vidRef).filter(Boolean) as Ref[], B = q.b.map(vidRef).filter(Boolean) as Ref[];
    // "a" is the New Testament text, "b" the Old Testament text it quotes
    for (const [x, y] of [[ra, rb], [rb, ra]] as const) {
      const nt = A.filter((r) => inAny(x, r)), ot = B.filter((r) => inAny(y, r));
      if (nt.length && ot.length) {
        const fromSlot = x === ra ? a : b, toSlot = x === ra ? b : a;
        out.push({ a: fromSlot, b: toSlot, from: label(nt), to: label(ot), note: q.note, kind: 'quoted' });
      }
    }
  }
  return out;
}

const FATHERS = /^(Augustine|Aug\.|Chrysostom|Chrys\.|Jerome|Ambrose|Gregory|Greg\.|Origen|Hilary|Cyril|Bede|Basil|Leo|Theophylact|Athanasius|Eusebius|Maximus|Peter Chrysologus|Isidore)/;
const catenaCache = new Map<string, any>();
const catena = (book: string) => {
  if (!catenaCache.has(book)) catenaCache.set(book, existsSync(join(DATA, 'commentary', 'catena', `${book}.json`)) ? json(`commentary/catena/${book}.json`) : null);
  return catenaCache.get(book);
};
/** Up to ~380 characters of the item, cut at a sentence end: always an exact substring of the source text. */
function excerpt(t: string): string | null {
  const ends = [...t.matchAll(/[.!?]["”’')]?(?=\s|$)/g)].map((m) => m.index! + m[0].length);
  let cut = 0;
  for (const e of ends) { if (e <= 380) cut = e; else break; }
  if (!cut && t.length <= 460) cut = t.length;
  const s = t.slice(0, cut).trim();
  return s.length >= 90 ? s : null;
}
function bestComment(gospel: Ref[]) {
  const g = gospel[0]; if (!g) return null;
  const cat = catena(g.book); if (!cat) return null;
  // the group that covers most of the Gospel passage (first section of it if the lectionary skips verses)
  let best: { grp: any; covered: number; span: number } | null = null;
  for (const grp of cat.groups) {
    let covered = 0;
    for (let v = grp.v1; v <= grp.v2; v++) if (gospel.some((r) => refContains(r, g.book, grp.c, v))) covered++;
    if (!covered) continue;
    const span = grp.v2 - grp.v1 + 1;
    if (!best || covered > best.covered || (covered === best.covered && span < best.span)) best = { grp, covered, span };
  }
  if (!best) return null;
  const cands = best.grp.items
    .map((it: any, idx: number) => ({ it, idx }))
    .filter(({ it }: any) => FATHERS.test(it.a) && !/^Pseudo/i.test(it.a) && it.t.length >= 140);
  for (const { it } of cands) {
    const q = excerpt(it.t);
    if (q) return { grp: best.grp, item: it, text: q, book: g.book };
  }
  return null;
}

const SUNDAY_OR_MAJOR = /^Solemnity|Presentation of the Lord|Transfiguration|Exaltation of the Holy Cross|Dedication of the Lateran|Good Friday|Holy Saturday|Holy Thursday|Palm Sunday|Epiphany|Faithful Departed|Ascension|Pentecost|Nativity of the Lord|Baptism of the Lord/;
const CCC = [128, 129, 130, 140, 1093, 1094, 1095];

const years = [2026, 2027, 2028];
mkdirSync(join(DATA, 'readings-together'), { recursive: true });
for (const y of years) {
  const src = json(`lectionary/${y}.json`).days as Record<string, { t: string; r: Record<string, string> }>;
  const days: Record<string, any> = {};
  let withLink = 0, withQuote = 0;
  for (const [date, d] of Object.entries(src)) {
    const sunday = new Date(date + 'T12:00:00Z').getUTCDay() === 0;
    if (!sunday && !SUNDAY_OR_MAJOR.test(d.t)) continue;
    if (!d.r.gospel) continue;
    const refs: Partial<Record<Slot, Ref[]>> = {};
    for (const s of SLOTS) if (d.r[s]) refs[s] = toRefs(d.r[s]);
    const links: (Link | Quoted)[] = [];
    const pairs: [Slot, Slot][] = [['first_reading', 'gospel'], ['second_reading', 'gospel'], ['responsorial_psalm', 'gospel'], ['first_reading', 'responsorial_psalm']];
    for (const [a, b] of pairs) {
      const ra = refs[a], rb = refs[b]; if (!ra?.length || !rb?.length) continue;
      links.push(...quotedLinks(a, ra, b, rb));
      const seen = new Set<string>();
      const top = xrefLinks(a, ra, b, rb).filter((l) => l.votes >= 3).sort((x, y) => y.votes - x.votes).filter((l) => {
        const k1 = `f:${l.from}`, k2 = `t:${l.to}`; if (seen.has(k1) || seen.has(k2)) return false; seen.add(k1); seen.add(k2); return true;
      });
      links.push(...top.slice(0, 2));
    }
    const c = refs.gospel ? bestComment(refs.gospel) : null;
    const quote = c ? {
      author: c.item.a, label: c.item.l,
      work: 'Catena Aurea (St. Thomas Aquinas, quoting the Fathers)',
      file: `commentary/catena/${c.book}.json`,
      on: `${formatRef({ book: c.book, c1: c.grp.c, v1: c.grp.v1, c2: c.grp.c, v2: c.grp.v2 })}`,
      text: c.text,
    } : null;
    if (links.length) withLink++;
    if (quote) withQuote++;
    days[date] = {
      title: d.t,
      readings: Object.fromEntries(SLOTS.filter((s) => d.r[s]).map((s) => [s, d.r[s]])),
      links, quote,
    };
  }
  writeFileSync(join(DATA, 'readings-together', `${y}.json`), JSON.stringify({
    about: 'Where the readings of a Sunday or major feast meet in the Bible\'s own cross-references, and a Father\'s comment on the Gospel. Built by scripts/launch/make-readings-together.ts.',
    sources: {
      xrefs: 'OpenBible.info cross references (CC BY 4.0); votes are community relevance scores, not Church teaching',
      quoted: 'The app\'s own notes on New Testament quotations of the Old (public/data/lens/quotes.json)',
      quote: 'Catena Aurea, as bundled (public/data/commentary/catena)',
      ccc: CCC,
    },
    days,
  }));
  console.log(`${y}: ${Object.keys(days).length} days, ${withLink} with a link, ${withQuote} with a quotation`);
}
void SLOT_NAME;
