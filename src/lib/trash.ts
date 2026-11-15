import { db, syncFlags, TRASH_TABLES, type Target } from '../db/db';

/** the table a collection item of this type is kept in */
export const TARGET_TABLE = { note: 'notes', highlight: 'highlights', bookmark: 'bookmarks' } as const;

/** Puts a deleted record back (the change hooks stamp it as edited now, so it also wins over the deletion on other devices). */
export async function restoreFromTrash(trashId: number): Promise<boolean> {
  const peek = await db.trash.get(trashId);
  if (!peek) return false;
  if (!(TRASH_TABLES as readonly string[]).includes(peek.tbl)) throw new Error('This item cannot be restored from Recently deleted.');
  const table = db.table(peek.tbl);
  let rowChanged = false;
  const restored = await db.transaction('rw', db.trash, db.tombs, table, async () => {
    // Re-read inside the transaction: simultaneous taps serialize, and only the first can consume the trash row.
    const it = await db.trash.get(trashId);
    if (!it) return false;
    const { id: _id, ...rest } = it.data as { id?: number; uid?: string; updatedAt?: number };
    if (!rest.uid) throw new Error('This deleted item has no stable identity and cannot be restored safely.');
    const tomb = await db.tombs.where('tbl').equals(it.tbl).and((t) => t.uid === rest.uid).first();
    const existing = await table.where('uid').equals(rest.uid).first();
    if (!existing) {
      const id = await table.add({ ...rest });
      rowChanged = true;
      // The normal creating hook stamps now. If a future-dated tombstone exists, move the
      // restored row past it so another device/server cannot immediately delete it again.
      if (tomb && tomb.updatedAt >= ((await table.get(id) as any)?.updatedAt ?? 0)) {
        if (tomb.updatedAt >= Number.MAX_SAFE_INTEGER) throw new Error('This deletion timestamp is too large to restore safely.');
        await table.update(id, { updatedAt: Math.max(Date.now(), tomb.updatedAt + 1) });
        rowChanged = true;
      }
    } else if (tomb && (existing.updatedAt ?? 0) <= tomb.updatedAt) {
      // Preserve the current local content, but make the intentional restore newer than the delete.
      if (tomb.updatedAt >= Number.MAX_SAFE_INTEGER) throw new Error('This deletion timestamp is too large to restore safely.');
      await table.update(existing.id, { updatedAt: Math.max(Date.now(), tomb.updatedAt + 1) });
      rowChanged = true;
    }
    // Remove deletion history and its Undo entry atomically with the live row.
    await db.tombs.filter((t) => t.tbl === it.tbl && t.uid === rest.uid).delete();
    await db.trash.delete(trashId);
    return true;
  });
  // Removing a tombstone itself must also wake sync, including when the live row was already present.
  if (restored && !rowChanged) syncFlags.onLocalChange();
  return restored;
}

/** the entry in Recently deleted that a collection item points at, if it is still there */
export async function trashedFor(t: Target): Promise<number | undefined> {
  if (t.type !== 'note' && t.type !== 'highlight' && t.type !== 'bookmark') return undefined;
  const tbl = TARGET_TABLE[t.type];
  const row = (await db.trash.where('tbl').equals(tbl).toArray()).find((r) => (r.data as { uid?: string }).uid === t.uid);
  return row?.id;
}
