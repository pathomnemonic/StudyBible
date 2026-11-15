import { db, type Collection, type Target } from '../db/db';
import { parseRefId, formatRef } from './refs';
import { passageText } from './bibleText';
import { readerPath } from './nav';
import { cccPara } from '../data/ccc';
import type { EditionRecord } from '../data/loader';
import { BRAND } from './brand';
import { isAppHashRoute, isHttpUrl } from './safeUrl';

/** One collection item read back to what it points at: its title, the text, and where the original lives. Nothing is copied into the collection. */
export interface Resolved {
  index: number;
  target: Target;
  kind: string;
  title: string;
  text?: string;
  /** an in-app route to the original */
  to?: string;
  /** an outside address to the original */
  url?: string;
  /** the record or source no longer exists */
  missing?: boolean;
}

/** Everything a collection can point at, in one table. `Record<Target['type'], …>` makes the compiler refuse a new Target type that has no entry here. */
export interface TargetInfo {
  /** the plain-words kind shown on a chip or a heading */
  label: string;
  /** where the original lives: an in-app route or an outside address (a passage needs the edition to find the reader page) */
  link: (t: any, ed?: EditionRecord) => { to?: string; url?: string };
  /** true when the target can be seen to be broken without reading the database: an address the app cannot read, a number out of range, or (given the sets of records that exist) a record that is gone */
  missing: (t: any, have?: HaveUids) => boolean;
}
export interface HaveUids { note: Set<string>; highlight: Set<string>; bookmark: Set<string> }
const uidGone = (kind: keyof HaveUids) => (t: { uid: string }, have?: HaveUids) => !!have && !have[kind].has(t.uid);
export const TARGET_KINDS: Record<Target['type'], TargetInfo> = {
  passage: { label: 'Passage', link: (t, ed) => { const r = parseRefId(t.ref); return r && ed ? { to: readerPath(ed, r) } : r ? { to: '/read' } : {}; }, missing: (t) => !parseRefId(t.ref) },
  commentary: { label: 'Commentary', link: (t) => (isHttpUrl(t.url) ? { url: t.url } : {}), missing: (t) => t.url !== undefined && !isHttpUrl(t.url) },
  catechism: { label: 'Catechism', link: (t) => ({ to: `/study/catechism/${t.para}` }), missing: (t) => !Number.isInteger(t.para) || t.para < 1 || t.para > 2865 },
  work: { label: 'Church writing', link: (t) => ({ to: `/study/works/${t.workId}/${t.section ?? ''}` }), missing: () => false },
  episode: { label: 'Listening', link: (t) => ({ to: `/listen/episode/${t.episodeId}` }), missing: () => false },
  reading: { label: 'Reading', link: (t) => ({ to: `/pray/readings/${t.date}` }), missing: () => false },
  topic: { label: 'Topic', link: (t) => ({ to: `/study/topics/${t.topicId}` }), missing: () => false },
  note: { label: 'Note', link: () => ({ to: '/library' }), missing: uidGone('note') },
  highlight: { label: 'Highlight', link: () => ({ to: '/library?tab=highlights' }), missing: uidGone('highlight') },
  bookmark: { label: 'Bookmark', link: () => ({ to: '/library?tab=bookmarks' }), missing: uidGone('bookmark') },
  link: {
    label: 'Link',
    link: (t) => isAppHashRoute(t.url) ? { to: t.url.slice(1) } : isHttpUrl(t.url) ? { url: t.url } : {},
    missing: (t) => !isAppHashRoute(t.url) && !isHttpUrl(t.url),
  },
};
export const targetKind = (t: Target) => TARGET_KINDS[t.type].label;
export const targetLink = (t: Target, ed?: EditionRecord) => TARGET_KINDS[t.type].link(t, ed);
export const targetMissing = (t: Target, have?: HaveUids) => TARGET_KINDS[t.type].missing(t, have);

const firstLine = (s: string) => (s.split('\n').find((l) => l.trim()) ?? '').replace(/^#+\s*/, '').slice(0, 80);

export async function resolveItem(t: Target, index: number, ed: EditionRecord): Promise<Resolved> {
  const base = { index, target: t };
  switch (t.type) {
    case 'passage': {
      const r = parseRefId(t.ref);
      if (!r) return { ...base, kind: 'Passage', title: t.label ?? t.ref, missing: true };
      const vs = await passageText(ed, r, 14).catch(() => []);
      return { ...base, kind: 'Passage', title: formatRef(r), text: vs.map((v) => `${v.v}. ${v.text}`).join(' '), to: readerPath(ed, r) };
    }
    case 'note': {
      const n = await db.notes.where('uid').equals(t.uid).first();
      if (!n) return { ...base, kind: 'Note', title: t.label ?? 'A note that is no longer here', missing: true };
      const p = n.targets.find((x) => x.type === 'passage');
      const r = p && p.type === 'passage' ? parseRefId(p.ref) : null;
      return { ...base, kind: n.kind === 'question' ? 'Question' : n.kind === 'prayer' ? 'Prayer' : 'Note', title: n.title || firstLine(n.body) || 'Note', text: n.body, to: r ? readerPath(ed, r) : '/library' };
    }
    case 'highlight': {
      const h = await db.highlights.where('uid').equals(t.uid).first();
      const r = h ? parseRefId(h.ref) : null;
      if (!h || !r) return { ...base, kind: 'Highlight', title: t.label ?? 'A highlight that is no longer here', missing: true };
      const vs = await passageText(ed, r, 14).catch(() => []);
      return { ...base, kind: 'Highlight', title: formatRef(r), text: vs.map((v) => v.text).join(' '), to: readerPath(ed, r) };
    }
    case 'bookmark': {
      const b = await db.bookmarks.where('uid').equals(t.uid).first();
      const r = b ? parseRefId(b.ref) : null;
      if (!b || !r) return { ...base, kind: 'Bookmark', title: t.label ?? 'A bookmark that is no longer here', missing: true };
      return { ...base, kind: 'Bookmark', title: b.label || formatRef(r), to: readerPath(ed, r) };
    }
    case 'catechism': {
      const p = await cccPara(t.para).catch(() => null);
      return { ...base, kind: 'Catechism', title: t.label ?? `Catechism §${t.para}`, text: p?.t, to: `/study/catechism/${t.para}` };
    }
    case 'work': return { ...base, kind: targetKind(t), title: t.label, ...targetLink(t) };
    case 'commentary': return { ...base, kind: targetKind(t), title: t.label, ...targetLink(t) };
    case 'episode': return { ...base, kind: targetKind(t), title: t.label, ...targetLink(t) };
    case 'reading': return { ...base, kind: targetKind(t), title: t.label, ...targetLink(t) };
    case 'topic': return { ...base, kind: targetKind(t), title: t.label, ...targetLink(t) };
    case 'link': return { ...base, kind: targetKind(t), title: t.label, ...targetLink(t) };
  }
}

export const resolveAll = (c: Collection, ed: EditionRecord) => Promise.all(c.items.map((t, i) => resolveItem(t, i, ed)));

const absolute = (to: string) => `${location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/#${to}`;
const where = (r: Resolved) => (r.to ? absolute(r.to) : r.url ?? '');

/** The collection as Markdown, each item with its text and a link back to the original. */
export function collectionMarkdown(c: Collection, items: Resolved[]): string {
  const out = [`# ${c.name}`, ''];
  if (c.description) out.push(c.description, '');
  out.push(`*${items.length} ${items.length === 1 ? 'item' : 'items'} · from ${BRAND.name}, ${new Date().toLocaleDateString()}*`, '');
  for (const r of items) {
    out.push(`## ${r.title}`, '', `*${r.kind}*${r.missing ? ' (the original is no longer here)' : ''}`, '');
    if (r.text) out.push(...r.text.split('\n').map((l) => (r.kind === 'Passage' || r.kind === 'Highlight' || r.kind === 'Catechism' ? `> ${l}` : l)), '');
    const w = where(r);
    if (w) out.push(`[Open the original](${w})`, '');
  }
  return out.join('\n');
}

const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);

/** A printable page (use Save as PDF in the print dialog). */
export function collectionHtml(c: Collection, items: Resolved[]): string {
  const body = items.map((r) => `<section><h2>${esc(r.title)}</h2><p class="k">${esc(r.kind)}${r.missing ? ' (the original is no longer here)' : ''}</p>${r.text ? `<${r.kind === 'Note' || r.kind === 'Question' || r.kind === 'Prayer' ? 'div' : 'blockquote'} style="white-space:pre-wrap">${esc(r.text)}</${r.kind === 'Note' || r.kind === 'Question' || r.kind === 'Prayer' ? 'div' : 'blockquote'}>` : ''}${where(r) ? `<p class="w">${esc(where(r))}</p>` : ''}</section>`).join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(c.name)}</title><style>body{font:12pt/1.55 Georgia,serif;max-width:40em;margin:2em auto;padding:0 1em}h1{margin-bottom:.2em}h2{font-size:1.1em;margin:1.4em 0 .1em}.k{color:#666;font-size:.85em;margin:0 0 .4em}.w{color:#666;font-size:.8em;word-break:break-all}blockquote{margin:.4em 0;padding-left:1em;border-left:3px solid #bbb}section{break-inside:avoid}</style></head><body><h1>${esc(c.name)}</h1>${c.description ? `<p>${esc(c.description)}</p>` : ''}${body}</body></html>`;
}

/** Moves an item and returns the new list. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const a = [...list];
  const [x] = a.splice(from, 1);
  a.splice(to, 0, x);
  return a;
}

/** a stored "done" mark is the item written as JSON; it matches the item whatever order its keys were written in (older marks and imported ones differ) */
export { doneKeyMatches } from './collectionDone';
