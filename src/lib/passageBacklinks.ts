/**
 * What in the app points at one passage. Everything here is computed from records that already exist (the reader's notes and collections,
 * the reading plans, the library's Scripture index, the reviewed profiles) and is never stored, so there is nothing to sync or to go stale.
 */
import type { Target } from '../db/db';
import { parseRefId, refsOverlap, type Ref } from './refs';

const passageRef = (t: Target): Ref | null => (t.type === 'passage' ? parseRefId(t.ref) : null);
export const targetOnPassage = (t: Target, r: Ref): boolean => { const x = passageRef(t); return !!x && refsOverlap(x, r); };

/** notes that have a passage target overlapping `r` */
export function notesOnPassage<T extends { targets: Target[] }>(notes: T[], r: Ref): T[] {
  return notes.filter((n) => n.targets.some((t) => targetOnPassage(t, r)));
}

/** collections that hold a passage overlapping `r`, with how many of their items do */
export function collectionsOnPassage<T extends { items: Target[] }>(cols: T[], r: Ref): { collection: T; count: number }[] {
  return cols.map((c) => ({ collection: c, count: c.items.filter((t) => targetOnPassage(t, r)).length })).filter((x) => x.count > 0);
}

export interface PlanLike { id: string; name: string; days: { refs: string[] }[] }
/** plans with a day that reads part of `r`: the plan and its 1-based day numbers */
export function plansOnPassage(plans: PlanLike[], r: Ref): { id: string; name: string; days: number[] }[] {
  const out: { id: string; name: string; days: number[] }[] = [];
  for (const p of plans) {
    const days: number[] = [];
    p.days.forEach((d, i) => { if (d.refs.some((x) => { const q = parseRefId(x); return !!q && refsOverlap(q, r); })) days.push(i + 1); });
    if (days.length) out.push({ id: p.id, name: p.name, days });
  }
  return out;
}

/** [c1, v1, c2, v2, workId, sectionIdx, ...] as in public/data/library/scripture/<BOOK>.json */
export type LibCite = [number, number, number, number, string, number, ...unknown[]];
export interface WorkCites { workId: string; sections: number[]; }
/** the library works whose sections cite `r`, most sections first (a work cited in several sections is one row) */
export function libraryCitations(entries: LibCite[], r: Ref): WorkCites[] {
  const by = new Map<string, Set<number>>();
  for (const e of entries) {
    const x: Ref = { book: r.book, c1: e[0], v1: e[1] || undefined, c2: e[2], v2: e[3] || undefined };
    if (!refsOverlap(x, r)) continue;
    (by.get(e[4]) ?? by.set(e[4], new Set()).get(e[4])!).add(e[5]);
  }
  return [...by.entries()].map(([workId, s]) => ({ workId, sections: [...s].sort((a, b) => a - b) })).sort((a, b) => b.sections.length - a.sections.length || a.workId.localeCompare(b.workId));
}

/** reviewed profiles that list a passage overlapping `r` */
export function profilesOnPassage<T extends { passages?: string[] }>(profiles: T[], r: Ref): T[] {
  return profiles.filter((p) => p.passages?.some((x) => { const q = parseRefId(x); return !!q && refsOverlap(q, r); }));
}

/** glossary entries for words that appear in `text` (whole words only), each once, in order of first use */
export function glossaryIn<G extends { term: string }>(text: string, lookup: (w: string) => G | undefined, max = 12): G[] {
  const seen = new Set<string>();
  const out: G[] = [];
  for (const w of text.split(/[^A-Za-z]+/)) {
    if (w.length < 3) continue;
    const g = lookup(w);
    if (g && !seen.has(g.term)) { seen.add(g.term); out.push(g); if (out.length >= max) break; }
  }
  return out;
}
