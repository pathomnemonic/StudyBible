import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LibraryProgress, type ShelfStatus } from '../db/db';

export const STATUS_LABEL: Record<ShelfStatus | 'none', string> = {
  none: 'Not started', want: 'Want to read', reading: 'Reading', finished: 'Finished', dnf: 'Did not finish',
};
export const STATUSES: ShelfStatus[] = ['want', 'reading', 'finished', 'dnf'];

/** Every work the reader has touched, by id. */
export function useShelf(): Map<string, LibraryProgress> {
  const rows = useLiveQuery(() => db.libraryProgress.toArray(), []) ?? [];
  return new Map(rows.map((r) => [r.workId, r]));
}

/** Change the shelf details of a work without losing where the reader was. */
export async function setShelf(workId: string, patch: Partial<LibraryProgress> & { clear?: boolean }) {
  const old = await db.libraryProgress.get(workId);
  const now = Date.now();
  const next: LibraryProgress = { ...(old ?? { workId, section: '0' }), updatedAt: now };
  if (patch.clear) { delete next.status; delete next.startedAt; delete next.finishedAt; }
  const { clear: _c, ...rest } = patch;
  Object.assign(next, rest);
  if (rest.status === 'reading' && !next.startedAt) next.startedAt = now;
  if (rest.status === 'finished') { next.finishedAt = now; next.startedAt ??= now; }
  if (rest.status && rest.status !== 'finished') delete next.finishedAt;
  await db.libraryProgress.put(next);
}

/** Record where the reader is in a work; opening a work you had not started puts it on the Reading shelf. */
export async function noteVisit(workId: string, section: number, total: number) {
  const old = await db.libraryProgress.get(workId);
  const seen = new Set(old?.seen ?? []);
  seen.add(section);
  const next: LibraryProgress = { ...(old ?? { workId }), section: String(section), seen: [...seen].sort((a, b) => a - b), updatedAt: Date.now() };
  if (!next.status || next.status === 'want') { next.status = 'reading'; next.startedAt ??= Date.now(); }
  void total;
  await db.libraryProgress.put(next);
}

export const percentSeen = (p: LibraryProgress | undefined, total: number) => (p?.seen?.length && total ? Math.min(100, Math.round((p.seen.length / total) * 100)) : 0);
