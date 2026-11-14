import type { HistoryEntry } from '../db/db';

/**
 * The verse a reader is looking at: the first verse whose bottom edge is below the top of the readable area
 * (under the sticky reader bar). Pure so it can be tested; the page passes measured rectangles.
 */
export function topVisibleVerse(rects: { n: number; top: number; bottom: number }[], headerBottom = 64): number | null {
  const sorted = [...rects].sort((a, b) => a.n - b.n);
  for (const r of sorted) if (r.bottom > headerBottom + 4) return r.n;
  return null;
}

/** Measure the verses on screen (single-column reading; parallel rows are anchor-numbered and handled apart). */
export function measureTopVerse(): number | null {
  if (typeof document === 'undefined') return null;
  const bar = document.querySelector('.reader-bar')?.getBoundingClientRect();
  const rects = [...document.querySelectorAll<HTMLElement>('.scripture [data-v]')].map((el) => {
    const r = el.getBoundingClientRect();
    return { n: +(el.dataset.v ?? 0), top: r.top, bottom: r.bottom };
  }).filter((r) => r.n > 0);
  if (!rects.length) return null;
  return topVisibleVerse(rects, bar ? bar.bottom : 64);
}

/** Whether a switch should carry a verse: only when the reader has scrolled past the start of the chapter. */
export const scrolledIntoChapter = (scrollY: number) => scrollY > 80;

export type AboutChapterPref = 'auto' | 'closed' | 'remember';

/**
 * Should "About this chapter" open by itself? 'auto' (the default) opens it once there is content, as it always has;
 * 'closed' never does; 'remember' follows the reader's last open/close choice (open until they close it).
 * Never while the reader is mid-chapter (it would push the text they are reading down), or after they chose.
 */
export function aboutShouldAutoOpen(o: { pref: AboutChapterPref; lastOpen: boolean; hasContent: boolean; touched: boolean; scrollY: number }): boolean {
  if (o.touched || !o.hasContent) return false;
  if (o.scrollY > 40) return false;
  if (o.pref === 'closed') return false;
  if (o.pref === 'remember') return o.lastOpen;
  return true;
}

export interface RecentPassage { ref: string; label: string; ts: number }
/** Distinct recently read chapters, newest first, from the reading history. */
export function recentPassages(rows: Pick<HistoryEntry, 'ts' | 'type' | 'ref' | 'label'>[], n = 8): RecentPassage[] {
  const seen = new Set<string>();
  const out: RecentPassage[] = [];
  for (const r of [...rows].sort((a, b) => b.ts - a.ts)) {
    if (r.type !== 'read' || !r.ref || seen.has(r.ref)) continue;
    seen.add(r.ref);
    out.push({ ref: r.ref, label: r.label, ts: r.ts });
    if (out.length >= n) break;
  }
  return out;
}

export interface SavedPair { left: string; right: string }
export const pairKey = (p: SavedPair) => `${p.left}|${p.right}`;
/** Add a pair once (newest first), keeping at most `max`. */
export function addPair(list: SavedPair[], p: SavedPair, max = 8): SavedPair[] {
  if (!p.left || !p.right || p.left === p.right) return list;
  return [p, ...list.filter((x) => pairKey(x) !== pairKey(p))].slice(0, max);
}
export const removePair = (list: SavedPair[], p: SavedPair) => list.filter((x) => pairKey(x) !== pairKey(p));
export const hasPair = (list: SavedPair[], p: SavedPair) => list.some((x) => pairKey(x) === pairKey(p));
