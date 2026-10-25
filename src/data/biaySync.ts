import { anchorChapterText } from '../lib/bibleText';
import { parseRefId } from '../lib/refs';
import type { EditionRecord } from '../data/loader';
import type { BiayEpisode } from './content';

/**
 * Where in a Bible in a Year episode a verse is read.
 *
 * The feed carries no timestamps, so this is an estimate and is labelled as one: the episode is Fr. Mike's greeting, then the day's
 * readings with his comments between them, then a closing prayer. Time is spread over the readings by how many words each verse has
 * (the greeting and prayer are taken off the ends). It lands within a minute or so; the player has back and forward buttons to settle it.
 */
export async function estimateStart(ep: BiayEpisode, edition: EditionRecord, target: { book: string; c: number; v: number }): Promise<number | null> {
  if (!ep.duration || !ep.passages.length) return null;
  let total = 0;
  let hit: number | null = null;
  for (const id of ep.passages) {
    const ref = parseRefId(id);
    if (!ref) continue;
    for (let c = ref.c1; c <= ref.c2; c++) {
      const at = await anchorChapterText(edition, ref.book, c).catch(() => null);
      if (!at) continue;
      const from = c === ref.c1 ? (ref.v1 ?? 1) : 1;
      const to = c === ref.c2 ? (ref.v2 ?? 999) : 999;
      for (const [v, e] of [...at.verses.entries()].sort((a, b) => a[0] - b[0])) {
        if (v < from || v > to) continue;
        if (hit === null && ref.book === target.book && c === target.c && v >= target.v) hit = total;
        total += e.text.split(/\s+/).length;
      }
    }
  }
  if (hit === null || total === 0) return null;
  const D = ep.duration;
  const lead = Math.min(75, D * 0.05);
  const tail = Math.min(90, D * 0.06);
  return Math.max(0, Math.round(lead + (D - lead - tail) * (hit / total)));
}
