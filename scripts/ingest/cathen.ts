import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CURATED, PUBLIC_DATA, RAW, Report, readJson, writeJson } from './lib/util';
import { parseRefs } from '../../src/lib/refs';
import { BOOKS, BOOK_BY_ID } from '../../src/lib/canon';
import { BOOK_ARTICLES, MULTI_BOOK, TOPICS, TOPIC_PREFIXES, EXACT_PERSONS, PERSONS, PLACES, MANUAL } from './cathen-lists';

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
  for (let round = 0; round < 4; round++) {
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

/** An article that cites Scripture often (at least 8 verse citations and 3 per thousand words) is about a biblical subject; returns a note, else null. */
function density(raw: string, id: string): { note: string; kind: Selected['kind'] } | null {
  const a = parseArticle(raw, id);
  if (!a || !a.cites) return null;
  const per = (a.cites.length / a.words) * 1000;
  if (a.cites.length < 8 || per < 3) return null;
  const first = a.blocks.find((b) => typeof b === 'string') as string | undefined;
  const lead = (first ?? '').slice(0, 300);
  const kind = /\b(king|queen|prophet|patriarch|son of|daughter of|disciple|apostle|judge of|high priest|wife of|brother of|father of|martyr)\b/i.test(lead) ? 'person' : /\b(city|town|village|mountain|river|region|province|valley|lake|sea|island|country|district|territory)\b/i.test(lead) ? 'place' : 'topic';
  return { note: `${a.cites.length} verse citations in ${a.words} words`, kind };
}

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
  for (const [id, kind] of MANUAL) { const e = idx.find((x) => x.id === id); if (e) add(e, kind, 'Hand-picked Scripture-related article (' + e.desc.slice(0, 80).replace(/\s+\S*$/, '') + ')'); }
  for (const m of manual) add(m, m.kind, m.why, m.books);

  // (d) cross-links: names that link to other articles from inside the articles already fetched (Genesis, Ezechiel ... are not in the index)
  const bookKeys = new Map<string, string>();
  for (const b of BOOKS) for (const n of [b.name, b.douayName, ...b.aliases.filter((a) => a.length > 4)]) if (n) bookKeys.set(key(n), b.id);
  const isBookTitle = (title: string) => {
    const k = key(title).replace(/^(the )?books? of /, '').replace(/,? (the )?books? of( the)?$/, '').replace(/^(the )?(first|second|third|fourth) and (second|third|fourth) books? of /, '');
    return bookKeys.get(k);
  };
  const found = new Map<string, { text: string; from: string }>();
  const linkCount = new Map<string, { n: number; text: string; from: string }>();
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
        const lc = linkCount.get(id);
        if (lc) lc.n++; else linkCount.set(id, { n: 1, text: t, from });
        // an index article was already judged by its own title; only articles outside the index are judged by their link text
        if (idxIds.has(id)) continue;
        const vs = variants(t);
        const pl = vs.some((v) => names.place.has(v) && !NOT_THESE.has(v));
        const pe = vs.some((v) => names.person.has(v) && !NOT_THESE.has(v));
        if (pl || pe || isTopic(t) || isBookTitle(t) || EXACT_PERSONS.map(key).includes(key(t))) found.set(id, { text: t, from });
      }
    }
  }
  // scripture-dense articles that several selected articles link to (tribes, kings, prophets, sects ... missing from the name lists)
  for (const [id, l] of linkCount) if (l.n >= 2 && !found.has(id) && !out.has(id) && !rejected.has(id) && !drop.has(id)) found.set(id, { text: l.text, from: l.from });
  const newRejected: { id: string; why: string }[] = [...(prevFile.rejected ?? [])];
  for (const [id, l] of found) {
    const art = join(ART, `${id}.htm`);
    if (!existsSync(art)) { add({ id, title: l.text }, 'person', `Linked as “${l.text}” from article ${l.from}; kind and title confirmed after fetch`); continue; }
    const raw = readFileSync(art, 'utf8');
    const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(raw);
    const title = h1 ? plain(h1[1]) : '';
    // the real title decides (it must itself be a biblical name, a canon book or a Scripture topic)
    const bk = isBookTitle(title);
    const kind = bk ? 'book' : kindOf(title, '') ?? (isTopic(title) ? 'topic' : null);
    const dense = !kind && title && !NOT_BIBLICAL.test(title) && title.length <= 40 ? density(raw, id) : null;
    if (dense) {
      add({ id, title }, dense.kind, `Linked as “${l.text}” from article ${l.from}; scripture-dense (${dense.note})`);
    } else if (title && kind) {
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

// ---------------------------------------------------------------------------------------------------------------- parsing

export type Block = string | { h: string } | { q: string };
export interface Article { slug: string; title: string; author?: string; url: string; blocks: Block[]; cites?: string[] }

/** New Advent's own Bible pages use file prefixes like gen, 1ki, joh; the encyclopedia links to them with #vrsN for single verses (Douay-Rheims = Vulgate numbering). */
const NA_BOOK: Record<string, string> = { gen: 'GEN', exo: 'EXO', lev: 'LEV', num: 'NUM', deu: 'DEU', jos: 'JOS', jdg: 'JDG', rut: 'RUT', '1sa': '1SA', '2sa': '2SA', '1ki': '1KI', '2ki': '2KI', '1ch': '1CH', '2ch': '2CH', ezr: 'EZR', neh: 'NEH', tob: 'TOB', jth: 'JDT', est: 'EST', '1ma': '1MA', '2ma': '2MA', job: 'JOB', psa: 'PSA', pro: 'PRO', ecc: 'ECC', can: 'SNG', sol: 'SNG', wis: 'WIS', sir: 'SIR', isa: 'ISA', jer: 'JER', lam: 'LAM', bar: 'BAR', eze: 'EZK', dan: 'DAN', hos: 'HOS', joe: 'JOL', amo: 'AMO', oba: 'OBA', abd: 'OBA', jon: 'JON', mic: 'MIC', nah: 'NAM', hab: 'HAB', zep: 'ZEP', hag: 'HAG', zec: 'ZEC', mal: 'MAL', mat: 'MAT', mar: 'MRK', luk: 'LUK', joh: 'JHN', act: 'ACT', rom: 'ROM', '1co': '1CO', '2co': '2CO', gal: 'GAL', eph: 'EPH', phi: 'PHP', col: 'COL', '1th': '1TH', '2th': '2TH', '1ti': '1TI', '2ti': '2TI', tit: 'TIT', phm: 'PHM', heb: 'HEB', jam: 'JAS', '1pe': '1PE', '2pe': '2PE', '1jo': '1JN', '2jo': '2JN', '3jo': '3JN', jud: 'JUD', rev: 'REV' };

/** Citation abbreviations as the 1913 text prints them (Douay names). Numbered books are handled in NUMBERED. */
const PLAIN: Record<string, string> = { gen: 'GEN', genesis: 'GEN', ex: 'EXO', exod: 'EXO', exodus: 'EXO', lev: 'LEV', leviticus: 'LEV', num: 'NUM', numbers: 'NUM', deut: 'DEU', deuteronomy: 'DEU', jos: 'JOS', josue: 'JOS', josh: 'JOS', judges: 'JDG', judg: 'JDG', ruth: 'RUT', tob: 'TOB', tobias: 'TOB', judith: 'JDT', esth: 'EST', esther: 'EST', job: 'JOB', ps: 'PSA', psalm: 'PSA', psalms: 'PSA', prov: 'PRO', proverbs: 'PRO', eccles: 'ECC', eccl: 'ECC', cant: 'SNG', wis: 'WIS', wisd: 'WIS', wisdom: 'WIS', ecclus: 'SIR', eccli: 'SIR', sir: 'SIR', is: 'ISA', isa: 'ISA', isaias: 'ISA', jer: 'JER', lam: 'LAM', bar: 'BAR', baruch: 'BAR', ezech: 'EZK', ezek: 'EZK', dan: 'DAN', osee: 'HOS', os: 'HOS', hos: 'HOS', joel: 'JOL', amos: 'AMO', abd: 'OBA', abdias: 'OBA', jon: 'JON', jonas: 'JON', mich: 'MIC', mic: 'MIC', nah: 'NAM', hab: 'HAB', habac: 'HAB', soph: 'ZEP', zeph: 'ZEP', agg: 'HAG', aggeus: 'HAG', zach: 'ZEC', mal: 'MAL', matt: 'MAT', mt: 'MAT', matthew: 'MAT', mark: 'MRK', mk: 'MRK', luke: 'LUK', lk: 'LUK', john: 'JHN', jn: 'JHN', acts: 'ACT', rom: 'ROM', romans: 'ROM', gal: 'GAL', eph: 'EPH', phil: 'PHP', col: 'COL', tit: 'TIT', titus: 'TIT', philem: 'PHM', heb: 'HEB', hebrews: 'HEB', jas: 'JAS', james: 'JAS', jude: 'JUD', apoc: 'REV', rev: 'REV' };
/** Numbered books. "I Kings" and "II Kings" are NOT read: the 1913 text sometimes means 1-2 Samuel (Douay) and sometimes 1-2 Kings, so only III and IV Kings are unambiguous. */
const NUMBERED: Record<string, Record<string, string>> = {
  kings: { '3': '1KI', '4': '2KI' }, sam: { '1': '1SA', '2': '2SA' }, samuel: { '1': '1SA', '2': '2SA' },
  par: { '1': '1CH', '2': '2CH' }, paral: { '1': '1CH', '2': '2CH' }, paralipomenon: { '1': '1CH', '2': '2CH' }, chron: { '1': '1CH', '2': '2CH' },
  cor: { '1': '1CO', '2': '2CO' }, thess: { '1': '1TH', '2': '2TH' }, tim: { '1': '1TI', '2': '2TI' }, pet: { '1': '1PE', '2': '2PE' }, peter: { '1': '1PE', '2': '2PE' },
  john: { '1': '1JN', '2': '2JN', '3': '3JN' }, jn: { '1': '1JN', '2': '2JN', '3': '3JN' }, mach: { '1': '1MA', '2': '2MA' }, mac: { '1': '1MA', '2': '2MA' }, esd: { '1': 'EZR', '2': 'NEH' },
};
const ROMAN_NUM: Record<string, string> = { i: '1', ii: '2', iii: '3', iv: '4', I: '1', II: '2', III: '3', IV: '4', '1': '1', '2': '2', '3': '3', '4': '4' };
const romanToInt = (r: string) => { const v: Record<string, number> = { i: 1, v: 5, x: 10, l: 50, c: 100 }; let n = 0; for (let i = 0; i < r.length; i++) { const a = v[r[i]], b = v[r[i + 1]]; n += b && b > a ? -a : a; } return n; };
const VERSES = String.raw`\d+[a-z]?(?:\s*[-–]\s*\d+)?(?:\s*,\s*\d+[a-z]?(?:\s*[-–]\s*\d+)?)*`;
const NAMES = [...new Set([...Object.keys(PLAIN), ...Object.keys(NUMBERED)])].sort((a, b) => b.length - a.length).join('|');
const CITE_RE = new RegExp(String.raw`(?<![A-Za-z])(?:(IV|III|II|I|[1-4])\.?\s*)?(${NAMES})\.?,?\s+((?:[ivxlc]+|\d+))\b(?:\s*([,:])\s*(${VERSES}))?`, 'gi');
const CONT_RE = new RegExp(String.raw`\s*;\s*([ivxlc]+)\s*,\s*(${VERSES})`, 'y');

/** Verse-level Scripture citations ("Gen., xii, 1-3; xv, 5", "Ps. xxi, 2", "Matt. 5:3") in the article text, as anchor ids BOOK.c.v in the Vulgate numbering the 1913 text uses. */
export function citationsIn(text: string): string[] {
  const out = new Set<string>();
  const push = (book: string, chap: number, verses: string) => {
    if (!BOOK_BY_ID[book] || !chap) return;
    for (const part of verses.split(',')) {
      const m = /^\s*(\d+)[a-z]?(?:\s*[-–]\s*(\d+))?\s*$/.exec(part);
      if (!m) continue;
      const v1 = +m[1], v2 = m[2] ? Math.min(+m[2], v1 + 60) : v1;
      if (v2 < v1) continue;
      const r = parseRefs(`${BOOK_BY_ID[book].name} ${chap}:${v1}${v2 > v1 ? '-' + v2 : ''}`);
      if (!r.ok) continue;
      for (let v = v1; v <= v2; v++) out.add(`${book}.${chap}.${v}`);
    }
  };
  for (const m of text.matchAll(CITE_RE)) {
    const num = m[1], name = m[2].toLowerCase();
    let book: string | undefined;
    if (num) book = NUMBERED[name]?.[ROMAN_NUM[num]];
    else if (!NUMBERED[name] || PLAIN[name]) book = PLAIN[name];
    if (!book) continue;
    const arabic = /^\d+$/.test(m[3]);
    if (!arabic && m[3] !== m[3].toLowerCase()) continue; // chapter numerals are printed in lower case
    if (!m[5]) continue; // whole chapters are not verse-level
    if (arabic && m[4] !== ':') continue;
    push(book, arabic ? +m[3] : romanToInt(m[3]), m[5]);
    if (!arabic) {
      CONT_RE.lastIndex = (m.index ?? 0) + m[0].length;
      let c: RegExpExecArray | null;
      while ((c = CONT_RE.exec(text))) { push(book, romanToInt(c[1]), c[2]); CONT_RE.lastIndex = c.index + c[0].length; }
    }
  }
  return [...out];
}

export function parseArticle(html: string, id: string): (Article & { words: number }) | null {
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html);
  if (!h1) return null;
  const title = plain(h1[1]);
  const start = html.indexOf('</h1>') + 5;
  let end = html.search(/<div[^>]*id=['"]cathen-728x90-bottom['"]|<div class="pub">/);
  if (end < 0) end = html.length;
  let body = html.slice(start, end)
    .replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<ins[\s\S]*?<\/ins>/gi, '')
    .replace(/<div[^>]*(?:CMtag|catholicadnet)[^>]*>\s*<\/div>/gi, '').replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, inner: string) => inner.replace(/<p(\s|>)/gi, '<p data-q="1"$1'));
  const blocks: Block[] = [];
  const links: string[] = [];
  for (const m of body.matchAll(/<(h[2-6]|p|li|tr)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const tag = m[1].toLowerCase();
    const inner = m[3];
    if (/gumroad\.com/.test(inner) && /support the mission of New Advent/i.test(inner)) continue;
    if (tag === 'p' && /<(?:p|li|tr)\b/i.test(inner) && /<li\b/i.test(inner)) continue;
    for (const l of inner.matchAll(/href="[^"]*\/bible\/([0-9a-z]+?)(\d{3})\.htm#vrs(\d+)"/gi)) links.push(`${l[1]}|${+l[2]}|${l[3]}`);
    const txt = plain(tag === 'tr' ? inner.replace(/<\/t[dh]>/gi, ' · ') : inner).replace(/( · )+$/, '');
    if (!txt) continue;
    if (tag.startsWith('h')) blocks.push({ h: txt });
    else if (/data-q=/.test(m[2])) blocks.push({ q: txt });
    else blocks.push(txt);
  }
  if (!blocks.length) return null;
  const mla = /<span id="mlaauthor">([\s\S]*?)<\/span>/.exec(html);
  let author: string | undefined;
  if (mla) {
    const a = plain(mla[1]).replace(/\s*&\s*/g, ' and ');
    const parts = a.split(/\s+and\s+/).map((x) => { const [last, ...rest] = x.split(/,\s*/); const first = rest.join(', ').replace(/\.$/, (d) => (/(^|[\s.])[A-Z]$/.test(rest.join(', ').slice(0, -1)) ? d : '')); return first ? `${first} ${last}` : last; });
    author = parts.join(' and ').replace(/\s+/g, ' ').trim() || undefined;
  }
  const text = blocks.map((b) => (typeof b === 'string' ? b : 'h' in b ? b.h : b.q)).join('\n');
  const cites = new Set(citationsIn(text));
  for (const l of links) { const [pre, c, v] = l.split('|'); const book = NA_BOOK[pre]; if (book) cites.add(`${book}.${c}.${v}`); }
  const order = (c: string) => { const [b, ch, v] = c.split('.'); return (BOOKS.findIndex((x) => x.id === b) * 1e6) + +ch * 1e3 + +v; };
  const sorted = [...cites].sort((a, b) => order(a) - order(b));
  return { slug: '', title, ...(author ? { author } : {}), url: `${BASE}${id}.htm`, blocks, ...(sorted.length ? { cites: sorted } : {}), words: text.split(/\s+/).filter(Boolean).length };
}

// ---------------------------------------------------------------------------------------------------------------- build

export function buildCathen(report: Report) {
  if (!existsSync(SELECT) || !existsSync(ART)) { report.warn('cathen: selection or raw pages missing (run: npx tsx scripts/ingest/cathen.ts fetch); the encyclopedia is skipped'); return; }
  const sel = readJson<any>(SELECT);
  const idx = readIndex();
  const aliases = new Map<string, string[]>();
  for (const e of idx) (aliases.get(e.id) ?? aliases.set(e.id, []).get(e.id)!).push(e.title);
  const outDir = join(PUBLIC_DATA, 'encyclopedia');
  const index: any[] = [];
  const names: Record<string, { slug: string; rank: number }> = {};
  const rankOf: Record<string, number> = { book: 3, person: 2, place: 2, topic: 1 };
  const nameKeys = (title: string, extra: string[]) => {
    const ks = new Set<string>();
    for (const t of [title, ...extra]) { for (const v of variants(t)) ks.add(v); ks.add(fold(t).toLowerCase().trim()); }
    return ks;
  };
  const per = new Map<string, Set<string>>(); // slug -> keys
  let skipped = 0;
  const kindCount: Record<string, number> = {};
  for (const s of sel.articles as any[]) {
    const f = join(ART, `${s.id}.htm`);
    if (!existsSync(f)) { skipped++; report.warn(`cathen: ${s.id} ${s.title}: not fetched`); continue; }
    const a = parseArticle(readFileSync(f, 'utf8'), s.id);
    if (!a) { skipped++; report.warn(`cathen: ${s.id} ${s.title}: could not be parsed`); continue; }
    a.slug = s.slug;
    const { words, ...art } = a;
    writeJson(join(outDir, 'a', `${s.slug}.json`), art);
    const books: string[] | undefined = s.kind === 'book' ? s.books : undefined;
    index.push({ slug: s.slug, title: a.title, kind: s.kind, words, refs: books ?? [], ...(books?.length === 1 ? { book: books[0] } : {}), ...(books?.length ? { books } : {}), ...(a.cites ? { cites: a.cites } : {}) });
    kindCount[s.kind] = (kindCount[s.kind] ?? 0) + 1;
    const keys = nameKeys(a.title, [...(aliases.get(s.id) ?? []), s.title]);
    if (books?.length === 1) { const b = BOOK_BY_ID[books[0]]; for (const n of [b.name, b.douayName].filter(Boolean) as string[]) keys.add(n.toLowerCase()); }
    per.set(s.slug, keys);
    for (const k of keys) if (!names[k] || names[k].rank < rankOf[s.kind]) names[k] = { slug: s.slug, rank: rankOf[s.kind] };
  }
  // the app's own spellings (Sinai / Mount Sinai, Abram / Abraham ...) point at the article whose title they resemble
  const allKeys = new Map<string, string>();
  for (const [slug, ks] of per) for (const k of ks) if (!allKeys.has(k)) allKeys.set(k, slug);
  const appList: string[] = [];
  for (const p of readJson<any[]>(join(PUBLIC_DATA, 'maps/places.json'))) { appList.push(p.n); if (p.r) appList.push(p.r); }
  for (const e of readJson<any>(join(CURATED, 'entities.json')).entities as any[]) for (const n of [e.name, ...(e.aliases ?? [])]) for (const part of String(n).split(/\s*\/\s*|\s*\(/)) appList.push(part.replace(/\)/g, ''));
  for (const p of readJson<any>(join(PUBLIC_DATA, 'reference/genealogies.json')).persons as any[]) appList.push(p.n);
  for (const n of appList) { const k = fold(n).toLowerCase().trim(); const hit = variants(n).map((v) => allKeys.get(v)).find(Boolean); if (hit && !names[k]) names[k] = { slug: hit, rank: 0 }; }
  const namesOut: Record<string, string> = {};
  for (const k of Object.keys(names).sort()) namesOut[k] = names[k].slug;
  index.sort((a, b) => a.title.localeCompare(b.title));
  writeJson(join(outDir, 'index.json'), {
    source: 'The Catholic Encyclopedia (New York: Robert Appleton Company, 1907–1914), as transcribed for New Advent (newadvent.org/cathen)',
    license: 'Public domain in the United States (published 1907–1914). The New Advent transcription is a convenience copy and sometimes modernizes spelling or wording; the text here is kept as transcribed. Please credit "The Catholic Encyclopedia, 1913, via New Advent" wherever it is shown.',
    scriptureNumbering: 'Citations in the 1913 text use Douay-Rheims (Vulgate) numbering, which is the app anchor numbering; "I/II Kings" citations are not read (ambiguous), III/IV Kings are.',
    articles: index,
  });
  writeJson(join(outDir, 'names.json'), namesOut);
  report.stats['cathen'] = { articles: index.length, skipped, byKind: kindCount, names: Object.keys(namesOut).length, withCites: index.filter((a) => a.cites).length, cites: index.reduce((n, a) => n + (a.cites?.length ?? 0), 0), words: index.reduce((n, a) => n + a.words, 0), missingBookArticles: sel.missingBookArticles };
}

if (process.argv[1]?.endsWith('cathen.ts')) {
  const cmd = process.argv[2];
  if (cmd === 'fetch') fetchCathen().then(() => console.log('cathen fetched'));
  else if (cmd === 'select') { const s = selectCathen(true); console.log(`cathen: ${s.length} selected`); }
  else if (cmd === 'build') { const r = new Report(); buildCathen(r); console.log(JSON.stringify(r.stats, null, 1)); r.warnings.forEach((w) => console.log(w)); }
  else if (cmd === 'dump') { for (const s of selectCathen()) console.log(`${s.kind}\t${s.id}\t${s.title}`); }
}
