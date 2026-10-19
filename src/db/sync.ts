/**
 * Sync is deliberately NOT implemented in this build. The app is local-first: every note and highlight lives in
 * IndexedDB on the device and nothing leaves it.
 *
 * To add accounts and multi-device sync, implement `SyncAdapter` against a backend and register it with
 * `registerSync()`. Recommended design (documented in docs/ARCHITECTURE.md):
 *   - end-to-end encrypt records client-side before upload (so the server only stores ciphertext);
 *   - sync rows by (table, id, updatedAt) with last-writer-wins per record and tombstones for deletes;
 *   - keep scripture links as anchor ids so records are translation-independent;
 *   - offer account deletion that removes all server-side data and export-before-delete.
 */
export interface SyncRecord {
  table: string;
  id: string | number;
  updatedAt: number;
  deleted?: boolean;
  /** serialized (and, ideally, encrypted) payload */
  payload: string;
}

export interface SyncAdapter {
  name: string;
  /** Pull everything changed since the given timestamp. */
  pull(since: number): Promise<SyncRecord[]>;
  /** Push local changes. Returns the server's accepted timestamp. */
  push(records: SyncRecord[]): Promise<number>;
  /** Permanently delete the account and all remote data. */
  deleteAccount(): Promise<void>;
}

let adapter: SyncAdapter | null = null;
export const registerSync = (a: SyncAdapter | null) => {
  adapter = a;
};
export const getSync = () => adapter;
