import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CURATED, PUBLIC_DATA, RAW, Report, readJson, writeJson } from './lib/util';
import { parseRefs } from '../../src/lib/refs';
import { BOOKS, BOOK_BY_ID } from '../../src/lib/canon';
import { BOOK_ARTICLES, MULTI_BOOK, TOPICS, TOPIC_PREFIXES, EXACT_PERSONS, PERSONS, PLACES } from './cathen-lists';

/**
 * The Catholic Encyclopedia (Robert Appleton Company, New York, 1907-1914; 1913 printing), as transcribed by New Advent
 * (newadvent.org/cathen). Public domain in the United States. We do NOT crawl the whole work: a selection of articles that matter for
 * Bible study (one per canon book, biblical persons and places named in this app's own data, and a modest set of Scripture topics)
 * is listed in data/curated/cathen-select.json. Raw pages are cached under data/raw/cathen (ignored by git); the build writes
 * public/data/encyclopedia: index.json, names.json and a/<slug>.json.
 *
 *   npx tsx scripts/ingest/cathen.ts fetch     # fetch index pages, (re)select, fetch the articles (resumable, 1.2 s between requests)
 *   npx tsx scripts/ingest/cathen.ts select    # (re)build data/curated/cathen-select.json from the cached index (+ cross-links)
 *   npx tsx scripts/ingest/cathen.ts build     # raw -> public/data/encyclopedia
 */
const BASE = 'https://www.newadvent.org/cathen/';
const UA = 'StudyBibleApp/1.0 (+https://github.com/pathomnemonic/StudyBible)';
const DIR = join(RAW, 'cathen');
const IDX = join(DIR, 'idx');
const ART = join(DIR, 'a');
const SELECT = join(CURATED, 'cathen-select.json');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

// ---------------------------------------------------------------------------------------------------------------- fetching

let lastReq = 0;
async function get(url: string, file: string): Promise<string | null> {
  if (existsSync(file)) return readFileSync(file, 'utf8');
  for (let attempt = 0; attempt < 4; attempt++) {
    const wait = lastReq + 1200 - Date.now();
    if (wait > 0) await sleep(wait);
    lastReq = Date.now();
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA } });
      if (r.status === 404) { writeFileSync(file + '.404', ''); return null; }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const html = await r.text();
      writeFileSync(file, html);
      return html;
    } catch (e) {
      console.log(`cathen: ${url}: ${(e as Error).message} (retry ${attempt + 1})`);
      await sleep(3000 * (attempt + 1));
    }
  }
  return null;
}

export async function fetchCathen() {
  mkdirSync(IDX, { recursive: true });
  mkdirSync(ART, { recursive: true });
  for (const l of LETTERS) await get(`${BASE}${l}.htm`, join(IDX, `${l}.htm`));
  console.log('cathen: index pages cached');
  // round 1: the selection from the index; round 2: names found as links inside those articles; round 3: links inside round 2
  for (let round = 0; round < 3; round++) {
    const sel = selectCathen();
    const todo = sel.filter((s) => !existsSync(join(ART, `${s.id}.htm`)) && !existsSync(join(ART, `${s.id}.htm.404`)));
    console.log(`cathen: round ${round + 1}: ${sel.length} selected, ${todo.length} to fetch`);
    if (!todo.length) break;
    let n = 0;
    for (const s of todo) {
      await get(`${BASE}${s.id}.htm`, join(ART, `${s.id}.htm`));
      if (++n % 25 === 0) console.log(`cathen: ${n}/${todo.length}`);
    }
  }
  selectCathen(true);
}

// ---------------------------------------------------------------------------------------------------------------- text helpers

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', mdash: '—', ndash: '–', hellip: '…', AElig: 'Æ', aelig: 'æ', OElig: 'Œ', oelig: 'œ', szlig: 'ß', deg: '°', sect: '§', para: '¶', times: '×', middot: '·', frac12: '½', frac14: '¼', frac34: '¾', laquo: '«', raquo: '»', copy: '©', pound: '£', cent: '¢', eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë', Eacute: 'É', Egrave: 'È', aacute: 'á', agrave: 'à', acirc: 'â', auml: 'ä', aring: 'å', Aacute: 'Á', iacute: 'í', igrave: 'ì', icirc: 'î', iuml: 'ï', Iacute: 'Í', oacute: 'ó', ograve: 'ò', ocirc: 'ô', ouml: 'ö', otilde: 'õ', oslash: 'ø', Oacute: 'Ó', Ouml: 'Ö', uacute: 'ú', ugrave: 'ù', ucirc: 'û', uuml: 'ü', Uacute: 'Ú', Uuml: 'Ü', ccedil: 'ç', Ccedil: 'Ç', ntilde: 'ñ', Ntilde: 'Ñ', yacute: 'ý', yuml: 'ÿ', scaron: 'š', Scaron: 'Š', zcaron: 'ž', thorn: 'þ', eth: 'ð', iexcl: '¡', iquest: '¿', sup1: '¹', sup2: '²', sup3: '³', plusmn: '±', micro: 'µ', shy: '', ordm: 'º', ordf: 'ª', dagger: '†', Dagger: '‡', bull: '•', prime: '′', Prime: '″', larr: '←', rarr: '→', harr: '↔', infin: '∞', ne: '≠', le: '≤', ge: '≥', alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', theta: 'θ', lambda: 'λ', mu: 'μ', pi: 'π', sigma: 'σ', tau: 'τ', phi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω', Omega: 'Ω', Delta: 'Δ', Sigma: 'Σ', Pi: 'Π', Gamma: 'Γ', Theta: 'Θ', Phi: 'Φ', Psi: 'Ψ', Lambda: 'Λ', Xi: 'Ξ', eta: 'η', iota: 'ι', kappa: 'κ', nu: 'ν', xi: 'ξ', omicron: 'ο', rho: 'ρ', upsilon: 'υ', zeta: 'ζ' };
const WIN1252: Record<number, string> = { 128: '€', 130: '‚', 131: 'ƒ', 132: '„', 133: '…', 134: '†', 135: '‡', 136: 'ˆ', 137: '‰', 138: 'Š', 139: '‹', 140: 'Œ', 142: 'Ž', 145: '‘', 146: '’', 147: '“', 148: '”', 149: '•', 150: '–', 151: '—', 152: '˜', 153: '™', 154: 'š', 155: '›', 156: 'œ', 158: 'ž', 159: 'Ÿ' };
export const ent = (s: string) =>
  s.replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (_m, n) => WIN1252[+n] ?? String.fromCodePoint(+n))
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, n) => NAMED[n] ?? m);
const plain = (s: string) => ent(s.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/æ/g, 'ae').replace(/œ/g, 'oe');
/** Lower-case, accent-free, without "Saint"/"St." or parentheses: the key under which titles are compared ("Peter, Saint" = "St. Peter" = "peter"). */
export function key(title: string) {
  return fold(title).toLowerCase().replace(/[’]/g, "'").replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\bst\.?\s/g, 'saint ').replace(/[.]/g, '')
    .replace(/,?\s*\bsaints?\b,?/g, ' ').replace(/^(the|blessed)\s+/, '').replace(/\s+/g, ' ').replace(/^[\s,]+|[\s,]+$/g, '');
}
/** Keys under which a person/place may be named: "mount sinai" also as "sinai"; "moab, moabites" also as "moab". */
function variants(title: string): string[] {
  const k = key(title);
  const out = new Set([k, k.replace(/^mount\s+/, ''), k.replace(/^the\s+/, '')]);
  const m = /^([^,]+),\s*(king|queen|prophet|patriarch|[a-z]+(?:ites|ans|ians|ims))$/.exec(k);
  if (m) out.add(m[1]);
  return [...out].filter((x) => x.length > 1);
}

// ---------------------------------------------------------------------------------------------------------------- index + selection

export interface IndexEntry { id: string; title: string; desc: string }
export interface Selected { id: string; title: string; slug: string; kind: 'book' | 'person' | 'place' | 'topic'; why: string; books?: string[] }

export function readIndex(): IndexEntry[] {
  const seen = new Map<string, IndexEntry[]>();
  for (const l of LETTERS) {
    const f = join(IDX, `${l}.htm`);
    if (!existsSync(f)) continue;
    const html = readFileSync(f, 'utf8');
    for (const m of html.matchAll(/<a href="\.\.\/cathen\/(\d{5}[a-z])\.htm">([\s\S]*?)<\/a>\s*(?:-\s*([\s\S]*?))?<br>/g)) {
      const title = plain(m[2]);
      if (!title || /^[A-Z]$/.test(title)) continue;
      const list = seen.get(m[1]) ?? [];
      list.push({ id: m[1], title, desc: plain(m[3] ?? '') });
      seen.set(m[1], list);
    }
  }
  return [...seen.values()].flat();
}

interface NameSets { person: Set<string>; place: Set<string> }
function appNames(): NameSets {
  const person = new Set<string>();
  const place = new Set<string>();
  const add = (set: Set<string>, n: string) => { for (const v of variants(n)) set.add(v); };
  for (const p of readJson<any[]>(join(PUBLIC_DATA, 'maps/places.json'))) { add(place, p.n); if (p.r) add(place, p.r); }
  for (const e of readJson<any>(join(CURATED, 'entities.json')).entities as any[]) {
    for (const n of [e.name, ...(e.aliases ?? [])]) for (const part of String(n).split(/\s*\/\s*|\s*\(/)) if (part.replace(/\)/g, '').trim()) add(e.kind === 'place' ? place : person, part.replace(/\)/g, ''));
  }
  for (const p of readJson<any>(join(PUBLIC_DATA, 'reference/genealogies.json')).persons as any[]) add(person, p.n);
  for (const n of PERSONS) add(person, n);
  for (const n of PLACES) add(place, n);
  for (const n of EXACT_PERSONS) person.add(key(n));
  return { person, place };
}

/** Names that are also ordinary words or non-biblical places/people in the lists above: never matched as persons/places. */
const NOT_THESE = new Set(['sin', 'dan', 'ur', 'ai', 'nod', 'rama', 'rome', 'acre', 'dor', 'saba', 'seba', 'cush', 'lydia', 'alexander', 'clement', 'demetrius', 'gaius', 'claudia', 'linus', 'felix', 'hermas', 'darius', 'cyrus', 'asa', 'eli', 'core', 'ham', 'sem', 'sara', 'john', 'james', 'peter', 'mark', 'luke', 'matthew', 'paul', 'philip', 'thomas', 'simon', 'andrew', 'jude', 'joseph', 'mary', 'stephen', 'timothy', 'titus', 'silas', 'barnabas', 'zachary', 'zacharias', 'cornelius', 'martha', 'lazarus', 'nicodemus', 'gabriel', 'raphael', 'michael', 'david', 'anne', 'anna', 'elizabeth', 'india', 'italy', 'spain', 'greece', 'asia', 'malta', 'ethiopia', 'sidon', 'salem', 'sharon', 'media', 'libya', 'jordan', 'syracuse', 'alexandria', 'dalmatia', 'philadelphia', 'zela', 'daniel', 'gad']);
/** Titles that look like a biblical name but are about something else (a later saint, a council, an order ...). */
const NOT_BIBLICAL = /\b(council|feast|knights|order|society|congregation|devotion|church of|sisters|diocese|archdiocese|university|abbey|basilica|religious|pennsylvania|kingdom of|pope|blessed|cardinal|bishop of|brothers|institute|college|seminary|missions?|vicariate|prefecture|province|monastery|synod|liturgy|rite)\b/i;

export function selectCathen(write = false): Selected[] {
  const idx = readIndex();
  const names = appNames();
  const byKey = new Map<string, IndexEntry[]>();
  for (const e of idx) { const k = key(e.title); (byKey.get(k) ?? byKey.set(k, []).get(k)!).push(e); }
  const prevFile: any = existsSync(SELECT) ? readJson<any>(SELECT) : {};
  const manual: any[] = (prevFile.articles ?? []).filter((a: any) => a.manual);
  const drop = new Set<string>(prevFile.drop ?? []);
  const rejected = new Set<string>((prevFile.rejected ?? []).map((r: any) => r.id));
  const out = new Map<string, Selected>();
  const add = (e: { id: string; title: string }, kind: Selected['kind'], why: string, books?: string[]) => {
    if (drop.has(e.id)) return;
    const prev = out.get(e.id);
    if (prev) { if (prev.kind !== 'book' && kind === 'book') { prev.kind = 'book'; prev.books = books; prev.why = why; } return; }
    out.set(e.id, { id: e.id, title: e.title, slug: '', kind, why, ...(books ? { books } : {}) });
  };
  // (a) canon books
  const missingBooks: string[] = [];
  for (const b of BOOKS) {
    const hits = (BOOK_ARTICLES[b.id] ?? []).flatMap((t) => byKey.get(key(t)) ?? []);
    if (!hits.length) { missingBooks.push(b.id); continue; }
    for (const h of hits) {
      const books = Object.entries(BOOK_ARTICLES).filter(([, ts]) => ts.some((t) => key(t) === key(h.title))).map(([id]) => id);
      add(h, 'book', `Article on the canonical book ${b.name}`, books);
    }
  }
  for (const [t, books] of Object.entries(MULTI_BOOK)) for (const h of byKey.get(key(t)) ?? []) add(h, 'book', `Article covering ${books.join(', ')}`, books);
  // (c) topics
  const topicKeys = new Set(TOPICS.map(key));
  const isTopic = (title: string) => topicKeys.has(key(title)) || TOPIC_PREFIXES.some((p) => key(title).startsWith(p));
  // (b) persons and places named in the app's data / well-known biblical names
  const kindOf = (title: string, desc: string): Selected['kind'] | null => {
    if (NOT_BIBLICAL.test(title)) return null;
    const vs = variants(title);
    const exact = key(title);
    const ok = (set: Set<string>) => vs.some((v) => set.has(v) && (!NOT_THESE.has(v) || (v === exact && EXACT_PERSONS.map(key).includes(v))));
    const pl = ok(names.place), pe = ok(names.person);
    if (pl && pe) return /\b(city|town|village|mountain|river|region|province|country|district|lake|sea|valley|island|see of)\b/i.test(desc) ? 'place' : 'person';
    return pl ? 'place' : pe ? 'person' : null;
  };
  for (const e of idx) {
    if (out.has(e.id)) continue;
    const k = kindOf(e.title, e.desc);
    if (k) add(e, k, `Title matches a biblical ${k} name (this app's data or the list of well-known biblical names)`);
    else if (isTopic(e.title)) add(e, 'topic', 'Scripture-related topic');
  }
  for (const m of manual) add(m, m.kind, m.why, m.books);

  // (d) cross-links: names that link to other articles from inside the articles already fetched (Genesis, Ezechiel ... are not in the index)
  const bookKeys = new Map<string, string>();
  for (const b of BOOKS) for (const n of [b.name, b.douayName, ...b.aliases.filter((a) => a.length > 4)]) if (n) bookKeys.set(key(n), b.id);
  const isBookTitle = (title: string) => {
    const k = key(title).replace(/^(the )?books? of /, '').replace(/,? (the )?books? of( the)?$/, '').replace(/^(the )?(first|second|third|fourth) and (second|third|fourth) books? of /, '');
    return bookKeys.get(k);
  };
  const found = new Map<string, { text: string; from: string }>();
  const idxIds = new Set(idx.map((e) => e.id));
  if (existsSync(ART)) {
    for (const f of readdirSync(ART)) {
      const from = f.slice(0, 6);
      if (!f.endsWith('.htm') || !out.has(from)) continue;
      const html = readFileSync(join(ART, f), 'utf8');
      for (const m of html.matchAll(/<a href="(?:\.\.\/cathen\/)?(\d{5}[a-z])\.htm">([^<]{3,40})<\/a>/g)) {
        const id = m[1];
        if (out.has(id) || found.has(id) || rejected.has(id) || drop.has(id)) continue;
        const t = plain(m[2]);
        if (!/^[A-Z0-9]/.test(t)) continue;
        // an index article was already judged by its own title; only articles outside the index are judged by their link text
        if (idxIds.has(id)) continue;
        const vs = variants(t);
        const pl = vs.some((v) => names.place.has(v) && !NOT_THESE.has(v));
        const pe = vs.some((v) => names.person.has(v) && !NOT_THESE.has(v));
        if (pl || pe || isTopic(t) || isBookTitle(t) || EXACT_PERSONS.map(key).includes(key(t))) found.set(id, { text: t, from });
      }
    }
  }
  const newRejected: { id: string; why: string }[] = [...(prevFile.rejected ?? [])];
  for (const [id, l] of found) {
    const art = join(ART, `${id}.htm`);
    if (!existsSync(art)) { add({ id, title: l.text }, 'person', `Linked as “${l.text}” from article ${l.from}; kind and title confirmed after fetch`); continue; }
    const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(readFileSync(art, 'utf8'));
    const title = h1 ? plain(h1[1]) : '';
    // the real title decides (it must itself be a biblical name, a canon book or a Scripture topic)
    const bk = isBookTitle(title);
    const kind = bk ? 'book' : kindOf(title, '') ?? (isTopic(title) ? 'topic' : null);
    if (title && kind) {
      const books = bk ? [bk] : undefined;
      add({ id, title }, kind, `Linked as “${l.text}” from article ${l.from}; its title matches a ${bk ? 'canon book' : kind}`, books);
    } else { newRejected.push({ id, why: `linked as “${l.text}” from ${l.from} but its title “${title}” is not a biblical name/topic` }); rejected.add(id); }
  }
  // placeholders for linked-but-unfetched articles carry a provisional title: drop them from the list until fetched
  const list = [...out.values()].sort((a, b) => a.title.localeCompare(b.title));
  const slugs = new Set<string>();
  for (const s of list) {
    const base = fold(s.title).toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'article';
    let sl = base, n = 2;
    while (slugs.has(sl)) sl = `${base}-${n++}`;
    slugs.add(sl);
    s.slug = sl;
  }
  if (write) {
    writeJson(SELECT, {
      about: 'Catholic Encyclopedia (1913, as transcribed by New Advent) articles chosen for Bible study. Generated by scripts/ingest/cathen.ts (select / fetch); rows with "manual": true and ids listed in "drop" survive regeneration.',
      missingBookArticles: missingBooks, drop: [...drop], rejected: newRejected,
      articles: list.map((s) => ({ title: s.title, slug: s.slug, id: s.id, kind: s.kind, why: s.why, ...(s.books ? { books: s.books } : {}), ...(manual.find((m) => m.id === s.id) ? { manual: true } : {}) })),
    }, true);
  }
  return list;
}

if (process.argv[1]?.endsWith('cathen.ts')) {
  const cmd = process.argv[2];
  if (cmd === 'fetch') fetchCathen().then(() => console.log('cathen fetched'));
  else if (cmd === 'select') { const s = selectCathen(true); console.log(`cathen: ${s.length} selected`); }
  else if (cmd === 'dump') { for (const s of selectCathen()) console.log(`${s.kind}\t${s.id}\t${s.title}`); }
}
void parseRefs; void BOOK_BY_ID; void Report;
