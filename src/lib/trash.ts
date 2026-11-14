import { db, type Target } from '../db/db';

/** the table a collection item of this type is kept in */
export const TARGET_TABLE = { note: 'notes', highlight: 'highlights', bookmark: 'bookmarks' } as const;

/** Puts a deleted record back (the change hooks stamp it as edited now, so it also wins over the deletion on other devices). */
export async function restoreFromTrash(trashId: number): Promise<boolean> {
  const it = await db.trash.get(trashId);
  if (!it) return false;
  const { id: _id, ...rest } = it.data as { id?: number; uid?: string };
  await db.table(it.tbl).add({ ...rest });
  await db.tombs.filter((t) => t.tbl === it.tbl && t.uid === rest.uid).delete();
  await db.trash.delete(trashId);
  return true;
}

/** the entry in Recently deleted that a collection item points at, if it is still there */
export async function trashedFor(t: Target): Promise<number | undefined> {
  if (t.type !== 'note' && t.type !== 'highlight' && t.type !== 'bookmark') return undefined;
  const tbl = TARGET_TABLE[t.type];
  const row = (await db.trash.where('tbl').equals(tbl).toArray()).find((r) => (r.data as { uid?: string }).uid === t.uid);
  return row?.id;
}
