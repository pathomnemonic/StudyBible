import { db, TRASH_TABLES, type Target } from '../db/db';

/** the table a collection item of this type is kept in */
export const TARGET_TABLE = { note: 'notes', highlight: 'highlights', bookmark: 'bookmarks' } as const;

/** Puts a deleted record back (the change hooks stamp it as edited now, so it also wins over the deletion on other devices). */
export async function restoreFromTrash(trashId: number): Promise<boolean> {
  const peek = await db.trash.get(trashId);
  if (!peek) return false;
  if (!(TRASH_TABLES as readonly string[]).includes(peek.tbl)) throw new Error('This item cannot be restored from Recently deleted.');
  const table = db.table(peek.tbl);
  return db.transaction('rw', db.trash, db.tombs, table, async () => {
    // Re-read inside the transaction: simultaneous taps serialize, and only the first can consume the trash row.
    const it = await db.trash.get(trashId);
    if (!it) return false;
    const { id: _id, ...rest } = it.data as { id?: number; uid?: string };
    if (!rest.uid) throw new Error('This deleted item has no stable identity and cannot be restored safely.');
    const existing = await table.where('uid').equals(rest.uid).first();
    if (!existing) await table.add({ ...rest });
    // If the same uid is already present, do not duplicate it; clear the stale tombstone/trash entry atomically.
    await db.tombs.filter((t) => t.tbl === it.tbl && t.uid === rest.uid).delete();
    await db.trash.delete(trashId);
    return true;
  });
}

/** the entry in Recently deleted that a collection item points at, if it is still there */
export async function trashedFor(t: Target): Promise<number | undefined> {
  if (t.type !== 'note' && t.type !== 'highlight' && t.type !== 'bookmark') return undefined;
  const tbl = TARGET_TABLE[t.type];
  const row = (await db.trash.where('tbl').equals(tbl).toArray()).find((r) => (r.data as { uid?: string }).uid === t.uid);
  return row?.id;
}
