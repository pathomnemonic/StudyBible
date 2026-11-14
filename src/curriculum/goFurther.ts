import { parseRefs, refId, type Ref } from '../lib/refs';
import { BOOK_BY_ID } from '../lib/canon';
import { convertRef } from '../lib/versification';
import { cccList } from './cccList';

/**
 * "Go further": where a lesson leads outward, derived only from data the lesson already carries
 * (its Scripture, its Catechism paragraphs, its `deeper` list) and from mappings that already name it
 * (the apologetics tracks and the curated extras). Nothing is guessed: a target that does not resolve
 * is dropped from `links` and reported in `broken`, and a test fails on any broken target.
 */
export type FurtherKind = 'scripture' | 'catechism' | 'apologetics' | 'library' | 'track' | 'chain';
export interface FurtherLink { kind: FurtherKind; id: string; label: string; to: string; /** scripture only: the passage as typed in the lesson */ ref?: Ref }

/** What exists in the app. The page and the report script each fill this from the same data files. */
export interface Known {
  /** edition id used for reader links when the caller does not supply its own paths */
  edition: string;
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
export interface FurtherResult { links: FurtherLink[]; broken: string[] }

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

export function buildGoFurther(lesson: LessonLike, known: Known, extras?: ExtrasLike | null, readerTo?: (ref: Ref) => string): FurtherResult {
  const links: FurtherLink[] = [];
  const broken: string[] = [];
  const seen = new Set<string>();
  const add = (l: FurtherLink) => { const k = l.kind + ':' + l.to; if (!seen.has(k)) { seen.add(k); links.push(l); } };

  const parts = lesson.scripture.split(';').map((x) => x.trim()).filter(Boolean);
  const refs = lessonRefs(lesson.scripture);
  if (refs.length < parts.length) broken.push(`scripture "${lesson.scripture}": a passage could not be read`);
  for (const { label, ref } of refs) {
    const bad = refProblem(label, ref);
    if (bad) { broken.push(bad); continue; }
    add({ kind: 'scripture', id: refId(ref), label: `Read ${label}`, ref, to: readerTo ? readerTo(ref) : `/read/${known.edition}/${ref.book}/${ref.c1}` });
  }

  const nums = cccList(lesson.ccc);
  if (!nums.length) broken.push(`catechism "${lesson.ccc}": no paragraph numbers`);
  nums.forEach((n, i) => {
    if (n < 1 || n > known.cccMax) { broken.push(`catechism §${n}: outside 1 to ${known.cccMax}`); return; }
    if (i < CCC_CAP) add({ kind: 'catechism', id: String(n), label: `Catechism §${n}`, to: `/study/catechism/${n}` });
  });

  for (const d of lesson.deeper ?? []) {
    const [k, id] = d.split(':');
    if (k === 'apol') {
      const t = known.apolTopics.get(id);
      if (t) add({ kind: 'apologetics', id, label: `Questions about the faith: ${t}`, to: `/study/apologetics/${id}` }); else broken.push(`deeper ${d}: no such apologetics topic`);
    } else if (k === 'room') {
      const t = known.works.get(id);
      if (t) add({ kind: 'library', id, label: `Read in the Reading room: ${t}`, to: `/room/work/${id}/0` }); else broken.push(`deeper ${d}: no such library work`);
    } else broken.push(`deeper ${d}: unknown kind`);
  }

  const trackIds = [...new Set([...(extras?.tracks ?? []).map((t) => t.id), ...(known.tracksOfLesson.get(lesson.id) ?? [])])];
  for (const id of trackIds) {
    const t = known.tracks.get(id);
    if (t) add({ kind: 'track', id, label: `Track: ${t}`, to: `${TRACKS_BASE}/${id}` }); else broken.push(`track ${id}: no such track`);
  }
  for (const d of extras?.debate ?? []) {
    const c = known.chains.get(`${d.type}:${d.id}`);
    if (c) add({ kind: 'chain', id: `${d.type}:${d.id}`, label: c.title, to: c.to }); else broken.push(`debate ${d.type}:${d.id}: no such chain`);
  }
  return { links, broken };
}

/** The verse a lesson asks the learner to keep, as a passage the memorize system can store. Null when the lesson's memory text names no single reference. */
export function keyVerseRef(lesson: { mem?: string }): { ref: Ref; label: string } | null {
  const cite = /\(([^()]+)\)\s*\.?\s*$/.exec((lesson.mem ?? '').trim())?.[1];
  if (!cite) return null;
  const p = parseRefs(cite);
  if (!p.ok || p.refs.length !== 1) return null;
  const r = p.refs[0].ref;
  if (refProblem(cite, r)) return null;
  return { ref: convertRef('kjv', 'vulgate', r).ref, label: cite };
}
