import { looksLikeRef, lookupBook, parseRefs, refId, type Ref } from '../lib/refs';
import { BOOK_BY_ID } from '../lib/canon';
import { convertRef } from '../lib/versification';
import { checkRefIn, pooledCounts, readerUrl, resolveRef, type CountsEdition, type Resolution } from '../lib/refCheck';
import { cccParse } from './cccList';

/**
 * "Go further": where a lesson leads outward, derived only from data the lesson already carries
 * (its Scripture, its Catechism paragraphs, its `deeper` list) and from mappings that already name it
 * (the apologetics tracks and the curated extras). Nothing is guessed: a target that does not resolve
 * is dropped from `links` and reported in `broken`, and a test fails on any broken target.
 */
export type FurtherKind = 'scripture' | 'catechism' | 'apologetics' | 'library' | 'track' | 'chain';
export interface FurtherLink {
  kind: FurtherKind; id: string; label: string; to: string;
  /** scripture only: the passage as typed in the lesson (English numbering) */
  ref?: Ref;
  /** scripture only: set when the verse numbering of this passage is not verified to match the chosen edition. The link opens the chapter at the best-guess verses and the page says so. */
  note?: string;
}
/** A passage the lesson names that cannot be opened in the chosen edition, and why. Shown as text, never hidden. */
export interface FurtherUnavailable { label: string; reason: string }
/** The edition the lesson's own numbering is checked against, and the one the reader link opens in. */
export interface RefContext { source: CountsEdition; target: CountsEdition; /** an edition in the Vulgate (anchor) numbering, used to confirm a passage that only that tradition numbers */ anchor: CountsEdition }

/** What exists in the app. The page and the report script each fill this from the same data files. */
export interface Known {
  /** edition id used for reader links when the caller does not supply its own paths */
  edition: string;
  /** editions with their chapter and verse counts, when the caller has them (the report script and tests do). Used to check passages against real data. */
  editions?: CountsEdition[];
  /** data sources that could not be loaded. What depends on them is reported as unavailable, never as missing or broken. */
  failed?: ReadonlySet<string>;
  cccMax: number;
  apolTopics: Map<string, string>;
  works: Map<string, string>;
  /** track id -> title */
  tracks: Map<string, string>;
  /** lesson id -> track ids that name the lesson as a step */
  tracksOfLesson: Map<string, string[]>;
  /** "claim:id" etc -> title and route, for chains, claims and heresies */
  chains: Map<string, { title: string; to: string }>;
}
export interface LessonLike { id: string; scripture: string; ccc: string; deeper?: string[]; mem?: string }
export interface ExtrasLike { tracks?: { id: string }[]; debate?: { type: string; id: string }[] }
export interface FurtherResult { links: FurtherLink[]; broken: string[]; unavailable: FurtherUnavailable[] }

export const TRACKS_BASE = '/study/apologetics-tracks';
/** Catechism paragraphs listed as links: the first few; the lesson page already shows the rest */
export const CCC_CAP = 3;

/** The passages a lesson cites, in the lesson's own (English) numbering. */
export function lessonRefs(scripture: string): { label: string; ref: Ref }[] {
  return scripture.split(';').map((x) => x.trim()).filter(Boolean).flatMap((label) => {
    const p = parseRefs(label);
    return p.ok ? p.refs.map((r) => ({ label, ref: r.ref })) : [];
  });
}

/** A reason the passage cannot be linked: a book not in the canon, or a chapter past its end. */
function refProblem(label: string, ref: Ref): string | null {
  const b = BOOK_BY_ID[ref.book];
  if (!b) return `scripture "${label}": unknown book ${ref.book}`;
  if (ref.c1 < 1 || ref.c1 > b.chapters || ref.c2 > b.chapters) return `scripture "${label}": ${b.name} has ${b.chapters} chapters`;
  return null;
}

/** Source (English numbering) and target edition from the data a caller has, or null when it has no verse counts. */
export function refContext(editions: CountsEdition[] | undefined, targetId: string): RefContext | null {
  if (!editions) return null;
  const source = pooledCounts(editions, 'english');
  const target = editions.find((e) => e.id === targetId);
  const anchor = editions.find((e) => e.id === 'vulgate');
  return source && target && anchor ? { source, target, anchor } : null;
}

export function buildGoFurther(lesson: LessonLike, known: Known, extras?: ExtrasLike | null, ctxIn?: RefContext | null): FurtherResult {
  const ctx = ctxIn ?? refContext(known.editions, known.edition);
  const links: FurtherLink[] = [];
  const broken: string[] = [];
  const unavailable: FurtherUnavailable[] = [];
  const seen = new Set<string>();
  const add = (l: FurtherLink) => { const k = l.kind + ':' + l.to; if (!seen.has(k)) { seen.add(k); links.push(l); } };

  const parts = lesson.scripture.split(';').map((x) => x.trim()).filter(Boolean);
  const refs = lessonRefs(lesson.scripture);
  if (refs.length < parts.length) broken.push(`scripture "${lesson.scripture}": a passage could not be read`);
  for (const { label, ref } of refs) {
    const bad = refProblem(label, ref);
    if (bad) { broken.push(bad); continue; }
    if (!ctx) { unavailable.push({ label, reason: known.failed?.has('editions') ? 'Bible edition reference counts could not be loaded' : 'reference counts are unavailable, so the verse numbering cannot be verified' }); continue; }
    const r = resolveRef(ctx.source, ctx.target, ref, 'kjv', ctx.anchor);
    if (r.status === 'invalid') { broken.push(`scripture "${label}": ${r.reason}`); continue; }
    if (r.status === 'absent') { unavailable.push({ label, reason: r.reason ?? 'not in this edition' }); continue; }
    const to = r.native && readerUrl(ctx.target, r.native);
    if (!to) { unavailable.push({ label, reason: `${ctx.target.id} has no matching chapter` }); continue; }
    add({ kind: 'scripture', id: refId(ref), label: `Read ${label}`, ref, to, note: r.status === 'approximate' ? `Source reference uses English/KJV numbering; the ${ctx.target.id} location is approximate. ${r.reason ?? 'Verify the passage before relying on it.'}` : undefined });
  }

  const cl = cccParse(lesson.ccc);
  for (const e of cl.errors) broken.push(`catechism "${lesson.ccc}": ${e}`);
  const nums = cl.numbers;
  if (!nums.length && !cl.errors.length) broken.push(`catechism "${lesson.ccc}": no paragraph numbers`);
  nums.forEach((n, i) => {
    if (n < 1 || (known.cccMax > 0 && n > known.cccMax)) { broken.push(`catechism §${n}: outside 1 to ${known.cccMax}`); return; }
    if (i < CCC_CAP) add({ kind: 'catechism', id: String(n), label: `Catechism §${n}`, to: `/study/catechism/${n}` });
  });

  for (const d of lesson.deeper ?? []) {
    const [k, id] = d.split(':');
    if (k === 'apol') {
      const t = known.apolTopics.get(id);
      if (known.failed?.has('apologetics')) unavailable.push({ label: d, reason: 'the apologetics index could not be loaded' });
      else if (t) add({ kind: 'apologetics', id, label: `Questions about the faith: ${t}`, to: `/study/apologetics/${id}` }); else broken.push(`deeper ${d}: no such apologetics topic`);
    } else if (k === 'room') {
      const t = known.works.get(id);
      if (known.failed?.has('library')) unavailable.push({ label: d, reason: 'the library could not be checked' });
      else if (t) add({ kind: 'library', id, label: `Read in the Reading room: ${t}`, to: `/room/work/${id}/0` }); else broken.push(`deeper ${d}: no such library work`);
    } else broken.push(`deeper ${d}: unknown kind`);
  }

  const trackIds = [...new Set([...(extras?.tracks ?? []).map((t) => t.id), ...(known.tracksOfLesson.get(lesson.id) ?? [])])];
  for (const id of trackIds) {
    const t = known.tracks.get(id);
    if (known.failed?.has('tracks')) unavailable.push({ label: `track ${id}`, reason: 'the tracks could not be loaded' });
    else if (t) add({ kind: 'track', id, label: `Track: ${t}`, to: `${TRACKS_BASE}/${id}` }); else broken.push(`track ${id}: no such track`);
  }
  for (const d of extras?.debate ?? []) {
    const c = known.chains.get(`${d.type}:${d.id}`);
    if (known.failed?.has('chains')) unavailable.push({ label: `${d.type}:${d.id}`, reason: 'the debate chains could not be loaded' });
    else if (c) add({ kind: 'chain', id: `${d.type}:${d.id}`, label: c.title, to: c.to }); else broken.push(`debate ${d.type}:${d.id}: no such chain`);
  }
  return { links, broken, unavailable };
}

/**
 * The verse a lesson asks the learner to keep. `ref` is in the memorize system's anchor numbering; `original` and
 * `sourceScheme` keep the passage exactly as the lesson wrote it. `exact` is false when the mapping between the two
 * numberings is not verified: the caller must then not add the card on its own.
 */
export type KeyVerse =
  | { status: 'none' }
  | { status: 'invalid'; label: string; reason: string }
  | { status: 'exact' | 'approximate'; label: string; ref: Ref; original: Ref; sourceScheme: 'kjv'; exact: boolean; reason?: string };

export function keyVerse(lesson: { mem?: string }, ctx?: { source: CountsEdition; anchor?: CountsEdition | null } | null): KeyVerse {
  const cite = /\(([^()]+)\)\s*\.?\s*$/.exec((lesson.mem ?? '').trim())?.[1];
  if (!cite) return { status: 'none' };
  const p = parseRefs(cite);
  // a citation that reads as a Scripture reference but does not parse (a chapter that does not exist) is a problem to report, not a lesson without a verse
  if (!p.ok) return looksLikeRef(cite) && lookupBook(cite.replace(/\s*\d.*$/, '')) ? { status: 'invalid', label: cite, reason: p.error } : { status: 'none' };
  if (p.refs.length !== 1) return { status: 'none' };
  const r = p.refs[0].ref;
  const bad = refProblem(cite, r);
  if (bad) return { status: 'invalid', label: cite, reason: bad };
  const conv = convertRef('kjv', 'vulgate', r);
  if (!ctx) return { status: 'approximate', label: cite, ref: conv.ref, original: r, sourceScheme: 'kjv', exact: false, reason: 'Edition reference counts are unavailable, so this mapping has not been verified against the source and anchor editions.' };
  // checked against the numbering it was written in; its own anchor mapping is what the card stores
  const res = resolveRef(ctx.source, ctx.source, r, 'kjv', ctx.anchor);
  if (res.status === 'invalid' || res.status === 'absent') return { status: 'invalid', label: cite, reason: res.reason ?? 'not a passage in this numbering' };
  const exact = conv.exact && res.status === 'exact';
  return { status: exact ? 'exact' : 'approximate', label: cite, ref: conv.ref, original: r, sourceScheme: 'kjv', exact, reason: exact ? undefined : res.reason ?? 'The verse numbering of this passage differs between editions.' };
}

/** Compatibility wrapper: the exact key verse only, null for anything else. */
export function keyVerseRef(lesson: { mem?: string }, source?: { source: CountsEdition; anchor?: CountsEdition | null } | null): { ref: Ref; label: string } | null {
  const k = keyVerse(lesson, source);
  return k.status === 'exact' ? { ref: k.ref, label: k.label } : null;
}
