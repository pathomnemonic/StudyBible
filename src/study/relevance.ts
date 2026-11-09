/**
 * Relevance-first ordering for the study panel. Pure: no data fetching, no React, no storage.
 *
 * Every item gets a score from several plain parts, so the order can be explained and tested:
 *   specificity  how tightly the item is tied to the verse that is open (this verse > a run of verses holding it > the chapter)
 *   directness   a note written ON the verse beats a work that only mentions or cites it
 *   tier         whose voice it is (Catechism and Church documents, Catena Aurea and the Fathers, Haydock and the Glossa,
 *                dictionaries, then lists of cross-references)
 *   readability  short focused passages beat long dumps; text centred on the verse beats text that merely contains it
 *   reader       kids, beginners, interests, and what the reader has already read or put away
 * The reader's own notes, highlights and bookmarks are not scored against anything: they always lead.
 */
import { parseRefId, type Ref } from '../lib/refs';
import type { StudyItem, SectionKey } from './providers';

/** Kinds of material, in the order the panel lists them. */
export type GroupKey = 'mine' | 'commentary' | 'teaching' | 'fathers' | 'connections' | 'kids' | 'world' | 'media';

export const GROUPS: { key: GroupKey; label: string }[] = [
  { key: 'mine', label: 'Yours' },
  { key: 'commentary', label: 'Commentary' },
  { key: 'teaching', label: 'Church teaching' },
  { key: 'fathers', label: 'Church Fathers and saints' },
  { key: 'connections', label: 'Connections' },
  { key: 'kids', label: 'For children' },
  { key: 'world', label: 'Background' },
  { key: 'media', label: 'Watch and listen' },
];

const GROUP_OF: Partial<Record<SectionKey, GroupKey>> = {
  mine: 'mine', links: 'mine',
  commentary: 'commentary',
  catechism: 'teaching', magisterium: 'teaching', apologetics: 'teaching', doctrine: 'teaching', liturgy: 'teaching', echoes: 'teaching', reception: 'teaching',
  fathers: 'fathers', saints: 'fathers',
  xref: 'connections', quotes: 'connections', typology: 'connections', parallels: 'connections', dependency: 'connections', topics: 'connections',
  kids: 'kids',
  art: 'media', videos: 'media', recorded: 'media', 'catholic-answers': 'media', creators: 'media', 'word-on-fire': 'media', ascension: 'media', biay: 'media', resources: 'media',
};
export const groupOf = (i: Pick<StudyItem, 'section'>): GroupKey => GROUP_OF[i.section] ?? 'world';

export interface RelevanceContext {
  /** the passage open in the panel (one verse, a run of verses, or a whole chapter) */
  sel: Ref[];
  kidMode?: boolean;
  /** '' | 'adult' | 'youth' | 'parent' | 'teacher' (see settings) */
  audience?: string;
  /** hide dense scholarly material by default */
  beginner?: boolean;
  /** ids from the welcome step: bible, pray, study, listen, teach, family */
  interests?: readonly string[];
  /** item ids the reader has already opened or read */
  seen?: ReadonlySet<string>;
  /** item ids the reader put away */
  dismissed?: ReadonlySet<string>;
}

export interface Scored {
  item: StudyItem;
  score: number;
  group: GroupKey;
  /** "Commentary on this verse", "The Catechism teaches": plain words for why the item is shown */
  label: string;
  /** reached only the chapter or the book, not the verse */
  wide: boolean;
  /** scholarly or long; kept out of "Start here" for beginners and for children */
  dense: boolean;
  /** the reader's own */
  own: boolean;
}

const verseOf = (sel: Ref[]): Ref | null => (sel.length === 1 && sel[0].v1 !== undefined && sel[0].c1 === sel[0].c2 ? sel[0] : null);
const textOf = (i: StudyItem) => i.fullExcerpt ?? i.excerpt ?? '';

/** How tightly the item is tied to the open verse: 0 (nothing) to 40. */
export function specificity(i: StudyItem, sel: Ref[]): { n: number; wide: boolean; exact: boolean } {
  const s = verseOf(sel);
  const r = i.ref ? parseRefId(i.ref) : null;
  if (s && r && r.book === s.book) {
    if (r.v1 !== undefined && r.c1 === r.c2 && r.c1 === s.c1) {
      const a = r.v1;
      const b = r.v2 ?? r.v1;
      const sa = s.v1!;
      const sb = s.v2 ?? s.v1!;
      if (a === sa && b === sb) return { n: 40, wide: false, exact: true };
      if (a >= sa && b <= sb) return { n: 38, wide: false, exact: false };
      if (a <= sa && sb <= b) return { n: Math.max(20, 34 - 1.5 * (b - a)), wide: false, exact: false };
      return { n: 14, wide: false, exact: false };
    }
    // a whole chapter, several chapters, or a whole book
    const chapters = r.c2 - r.c1;
    if (chapters >= 2) return { n: 0, wide: true, exact: false };
    if (r.v1 === undefined || r.c1 !== r.c2) return { n: 5, wide: true, exact: false };
    return { n: 8, wide: true, exact: false };
  }
  const byMatch = { 'direct-citation': 34, 'verse-by-verse': 34, 'explicit-reference': 24, passage: 12, topic: 5, editorial: 5 }[i.match];
  return { n: byMatch, wide: false, exact: false };
}

/** Whose voice it is. 0 to 22. */
export function tier(i: StudyItem): number {
  const k = i.kind ?? '';
  if (k === 'CCC' || i.section === 'catechism') return 22;
  if (i.section === 'magisterium' || i.authority === 'doctrine' || i.authority === 'magisterial') return 21;
  if (k === 'Catena Aurea') return i.authority === 'father' ? 20 : 17;
  if (i.section === 'fathers' || i.section === 'saints') return i.authority === 'father' ? 17 : 15;
  if (k === 'Haydock' || k === 'Challoner' || k === 'à Lapide' || k === 'Glossa (Latin)') return 13;
  if (i.section === 'apologetics') return 13;
  if (i.section === 'commentary') return 12;
  if (['encyclopedia', 'dictionary', 'people', 'background', 'customs', 'witnesses'].includes(i.section)) return 6;
  if (i.section === 'xref' || i.section === 'topics') return 2;
  if (i.section === 'kids') return 12;
  if (i.section === 'mine') return 22;
  return 5;
}

/** Scholarly, long, or in a language most readers cannot use. */
export function isDense(i: StudyItem): boolean {
  const k = i.kind ?? '';
  const len = textOf(i).length;
  if (i.lang && i.lang !== 'en' && !i.translation) return true;
  if (['encyclopedia', 'dictionary', 'witnesses', 'versions', 'structure', 'background'].includes(i.section)) return true;
  if (k === 'à Lapide' || k === 'Summa' || k === 'Jewish background') return true;
  return len > 1800;
}

/** Short focused passages beat long dumps; text centred on the verse beats text that merely holds it. -10 to 12. */
export function readability(i: StudyItem): number {
  const t = textOf(i);
  const len = t.length;
  let n = 0;
  if (len < 30) n -= 6;
  else if (len < 90) n += 1;
  else if (len <= 700) n += 8;
  else if (len <= 1500) n += 3;
  else n -= Math.min(10, Math.floor((len - 1500) / 600));
  if (t.includes('⟦')) n += 4; // the excerpt is centred on the place the verse is cited
  if (len < 30 && i.url && !i.internal) n -= 4; // you would have to leave the app to find anything
  if (i.audio || i.episodeId) n += 2; // plays here
  if (i.kind === 'Search') n -= 40;
  if (i.kind && ['Read with notes', 'Chapter summary', 'Book introduction'].includes(i.kind)) n -= 8;
  return n;
}

const directness = (i: StudyItem): number => ({ 'verse-by-verse': 20, 'direct-citation': 18, 'explicit-reference': 8, passage: 2, topic: 0, editorial: 0 })[i.match];

const INTEREST_GROUPS: Record<string, GroupKey[]> = { bible: ['commentary'], study: ['teaching', 'fathers'], listen: ['media'], family: ['kids'], pray: ['teaching'], teach: ['kids', 'teaching'] };

/** Plain words for why the item is on screen. */
export function labelFor(i: StudyItem, wide: boolean, exact: boolean): string {
  const k = i.kind ?? '';
  const here = wide ? 'this passage' : 'this verse';
  if (i.section === 'mine') return k === 'Highlight' ? 'Your highlight' : k === 'Bookmark' ? 'Your bookmark' : 'Your note';
  if (i.section === 'links') return 'A link you added';
  if (k === 'CCC' || i.section === 'catechism') return i.match === 'direct-citation' ? 'The Catechism teaches (quotes this verse)' : 'The Catechism teaches';
  if (i.section === 'magisterium') return 'Church documents cite this verse';
  if (k === 'Catena Aurea') return i.authority === 'father' ? `A Church Father on ${here}` : `A medieval teacher on ${here}`;
  if (k === 'Haydock' || k === 'Challoner' || k === 'à Lapide') return wide ? 'Commentary on this passage' : 'Commentary on this verse';
  if (k === 'Glossa (Latin)') return `The medieval Glossa on ${here}`;
  if (k === 'Summa') return 'Aquinas cites this verse';
  if (i.section === 'fathers') return i.match === 'verse-by-verse' ? `A Church Father on ${here}` : 'A Church Father who cites this verse';
  if (i.section === 'saints') return i.match === 'verse-by-verse' ? `A saint on ${here}` : 'A saint who cites this verse';
  if (i.section === 'apologetics') return 'A common question about this passage';
  if (i.section === 'xref') return 'A related verse';
  if (i.section === 'typology' || i.section === 'quotes') return 'How Scripture takes this up';
  if (i.section === 'kids') return 'A children’s story for this passage';
  if (i.section === 'videos' || i.section === 'creators' || i.section === 'word-on-fire' || i.section === 'ascension') return 'A teacher on this passage';
  if (i.section === 'biay') return 'Bible in a Year, today’s reading';
  if (i.section === 'doctrine') return 'A doctrine this verse supports';
  if (exact) return 'Written on this verse';
  return wide ? 'Related to this passage' : 'Related to this verse';
}

export function scoreItem(i: StudyItem, ctx: RelevanceContext): Scored {
  const group = groupOf(i);
  const own = i.section === 'mine';
  const sp = specificity(i, ctx.sel);
  const dense = isDense(i);
  const young = !!ctx.kidMode || ctx.audience === 'youth';
  const label = labelFor(i, sp.wide, sp.exact);
  let score = sp.n + directness(i) + tier(i) + readability(i);
  if (ctx.interests?.some((x) => INTEREST_GROUPS[x]?.includes(group))) score += 3;
  if (ctx.kidMode) {
    if (group === 'kids') score += 50;
    const len = textOf(i).length;
    if (len > 0 && len <= 450) score += 5;
    if (dense || i.authority === 'scholarship' || i.authority === 'historical') score -= 15;
  } else if (ctx.audience === 'youth' && group === 'kids') score += 6;
  if ((ctx.beginner || young) && dense) score -= 14;
  if (ctx.seen?.has(i.id)) score -= 8;
  if (ctx.dismissed?.has(i.id)) score -= 200;
  if (own) score += 1000; // the reader's own always lead
  return { item: i, score, group, label, wide: sp.wide, dense, own };
}

// ---- near-duplicates

const words = (s: string) => s.toLowerCase().replace(/[⟦⟧]/g, '').match(/[a-z0-9]+/g) ?? [];

/** Two items that say (nearly) the same thing: one text holds the other's opening, or they share most of their five-word runs. */
export function nearDuplicate(a: string, b: string): boolean {
  const wa = words(a).slice(0, 80);
  const wb = words(b).slice(0, 80);
  if (wa.length < 8 || wb.length < 8) return false;
  const shingles = (w: string[]) => {
    const s = new Set<string>();
    for (let i = 0; i + 5 <= w.length; i++) s.add(w.slice(i, i + 5).join(' '));
    return s;
  };
  const sa = shingles(wa);
  const sb = shingles(wb);
  let hit = 0;
  for (const x of sa) if (sb.has(x)) hit++;
  return hit / Math.min(sa.size, sb.size) >= 0.7;
}

/**
 * Score everything, order it, and drop an item that repeats one already ranked higher. The reader's own items are never dropped.
 * `dropped` maps a dropped id to the id it duplicates, so a caller can say so.
 */
export function rankItems(items: StudyItem[], ctx: RelevanceContext): { ranked: Scored[]; dropped: Map<string, string> } {
  const scored = items.map((i) => scoreItem(i, ctx));
  scored.sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
  const kept: Scored[] = [];
  const dropped = new Map<string, string>();
  const seenText = new Map<string, Scored[]>();
  for (const s of scored) {
    const t = textOf(s.item);
    if (!s.own && t.length >= 60) {
      const bucket = seenText.get(s.group) ?? [];
      const twin = bucket.find((k) => nearDuplicate(textOf(k.item), t));
      if (twin) {
        dropped.set(s.item.id, twin.item.id);
        continue;
      }
      bucket.push(s);
      seenText.set(s.group, bucket);
    }
    kept.push(s);
  }
  return { ranked: kept, dropped };
}

export interface StartHere {
  own: Scored[];
  top: Scored[];
}

/**
 * The few best items across kinds. The reader's own items come first and are shown apart from the count; then up to `max`
 * (default 5) others: at least `min` when that many are good enough, never two from a thin kind, never a wide, dense or put-away item.
 */
export function startHere(ranked: Scored[], ctx: RelevanceContext, opts: { max?: number; min?: number } = {}): StartHere {
  const max = opts.max ?? 5;
  const min = opts.min ?? 3;
  const own = ranked.filter((s) => s.own && !ctx.dismissed?.has(s.item.id)).slice(0, 3);
  const young = !!ctx.kidMode || ctx.audience === 'youth';
  const okay = (s: Scored) => !s.own && !s.wide && s.item.kind !== 'Search' && !ctx.dismissed?.has(s.item.id) && !((ctx.beginner || young) && s.dense) && s.score >= FLOOR;
  const cap = (g: GroupKey) => (g === 'commentary' || g === 'teaching' || g === 'fathers' || g === 'kids' ? 2 : 1);
  const used = new Map<GroupKey, number>();
  const top: Scored[] = [];
  for (const s of ranked) {
    if (top.length >= max) break;
    if (!okay(s)) continue;
    if ((used.get(s.group) ?? 0) >= cap(s.group)) continue;
    // a second item from the same kind has to be nearly as good as the first
    if (used.get(s.group) && top.length >= min && s.score < top[0].score - 25) continue;
    used.set(s.group, (used.get(s.group) ?? 0) + 1);
    top.push(s);
  }
  return { own, top: top.length >= 1 ? top : [] };
}

/** Group scored items by kind, in the panel's order. */
export function groupScored(ranked: Scored[]): { key: GroupKey; label: string; items: Scored[] }[] {
  return GROUPS.map((g) => ({ ...g, items: ranked.filter((s) => s.group === g.key) })).filter((g) => g.items.length > 0);
}

/** An item score below this is not worth a place in "Start here". */
export const FLOOR = 62;

// ---- remembered choices (small, per browser)

const read = (key: string): string[] => {
  try { const v = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; } catch { return []; }
};
const write = (key: string, ids: string[]) => { try { localStorage.setItem(key, JSON.stringify(ids.slice(-600))); } catch { /* private mode */ } };
export const loadIdSet = (key: 'sb:panelSeen' | 'sb:panelDismissed') => new Set(read(key));
export const saveIdSet = (key: 'sb:panelSeen' | 'sb:panelDismissed', set: ReadonlySet<string>) => write(key, [...set]);
export const loadShowEverything = (): boolean => { try { return localStorage.getItem('sb:panelAll') === '1'; } catch { return false; } };
export const saveShowEverything = (on: boolean) => { try { localStorage.setItem('sb:panelAll', on ? '1' : '0'); } catch { /* private mode */ } };
