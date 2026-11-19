import type { WireChange } from './api';

/**
 * Cross-device sync through the reader's own Google Drive, with no server of ours.
 *
 * It stands in for the sync server: the same engine (engine.ts) that talks to /api/sync talks to this, with the same call `sync(cursor, changes)`, so conflict
 * handling, tombstones and the "unsent" bookkeeping are all the existing, tested ones. What changes is only where the changes are kept: as small files in the
 * hidden app folder of the person's Drive (scope drive.appdata, invisible among their files, readable only by this app).
 *
 * The layout is an append-only log, so two devices never write the same file and there is nothing to lock:
 *   sbs-chg-<device>-<random>.json   one push from one device: { v, device, changes }
 *   sbs-snap-<upToMs>-<random>.json  the whole current state, written now and then to keep the log short: { v, upTo, records }
 * A device remembers which files it has already read (by Drive's file id), so it needs no clock. Applying a change twice is harmless (the engine only takes a
 * record newer than the one it holds), so any overlap or a snapshot that repeats something is safe. Nothing here touches the browser: the file access is passed in.
 */

export interface DriveFile { id: string; name: string; createdTime: number; size: number }
export interface DriveFiles {
  /** every sync file in the app folder (names starting "sbs-"), all pages */
  list(): Promise<DriveFile[]>;
  read(id: string): Promise<string>;
  create(name: string, body: string): Promise<DriveFile>;
  remove(id: string): Promise<void>;
}
export interface SeenStore { load(): Set<string>; save(ids: Set<string>): void }

const PREFIX = 'sbs-';
const CHG = /^sbs-chg-([a-z0-9]+)-[a-z0-9]+\.json$/;
const SNAP = /^sbs-snap-(\d+)-[a-z0-9]+\.json$/;
/** files read in one call; more are signalled with `more` so a long catch-up is paged like the server's */
export const FILES_PER_CALL = 30;
/** the log is compacted once it holds this many push files */
export const COMPACT_AT = 40;
const rand = () => Math.random().toString(36).slice(2, 10);
export const isSyncFileName = (n: string) => n.startsWith(PREFIX);

export function newDeviceId(): string { return rand() + rand().slice(0, 4); }

interface ChgBody { v: 1; device: string; changes: WireChange[] }
interface SnapBody { v: 1; upTo: number; records: WireChange[] }
const parse = <T>(text: string): T | null => { try { const j = JSON.parse(text); return j && j.v === 1 ? (j as T) : null; } catch { return null; } };

/** the newer of two versions of one record; on a tie a deletion wins, so a deleted record is not brought back by a copy of its older self */
const newer = (a: WireChange, b: WireChange) => (b.updatedAt > a.updatedAt || (b.updatedAt === a.updatedAt && !!b.deleted && !a.deleted) ? b : a);

export class DriveSyncBackend {
  constructor(private files: DriveFiles, private device: string, private seen: SeenStore, private now: () => number = Date.now) {}

  /** the engine's call: push these changes, then return what other devices have written since */
  async sync(cursor: number, changes: WireChange[]): Promise<{ cursor: number; more: boolean; rejected: number; changes: WireChange[] }> {
    const seen = this.seen.load();
    if (changes.length) {
      const f = await this.files.create(`${PREFIX}chg-${this.device}-${rand()}.json`, JSON.stringify({ v: 1, device: this.device, changes } satisfies ChgBody));
      seen.add(f.id); // our own push is already here
    }
    const all = await this.files.list();
    const ids = new Set(all.map((f) => f.id));
    for (const id of [...seen]) if (!ids.has(id)) seen.delete(id); // forget files that were deleted (by a compaction)
    const unseen = all.filter((f) => !seen.has(f.id)).sort((a, b) => a.createdTime - b.createdTime);
    // snapshots first: they carry the most; then pushes in the order Drive created them
    const ordered = [...unseen.filter((f) => SNAP.test(f.name)), ...unseen.filter((f) => CHG.test(f.name))];
    const take = ordered.slice(0, FILES_PER_CALL);
    const out: WireChange[] = [];
    for (const f of take) {
      const body = parse<ChgBody | SnapBody>(await this.files.read(f.id));
      seen.add(f.id); // an unreadable or newer-format file is skipped for good rather than retried for ever
      if (!body) continue;
      if ('records' in body) out.push(...body.records);
      else if (body.device !== this.device) out.push(...body.changes);
    }
    this.seen.save(seen);
    return { cursor: Math.max(cursor, this.now()), more: ordered.length > take.length, rejected: 0, changes: out };
  }

  /** How many push files the log holds (when it is long, a compaction is due). */
  async logLength(): Promise<number> { return (await this.files.list()).filter((f) => CHG.test(f.name)).length; }

  /**
   * Folds the log into one snapshot and removes the files it replaced. Safe with other devices at work: a device that has not read a removed file will read the
   * snapshot instead (it is a file it has not seen), and two devices compacting at once simply write two snapshots that both hold everything they read.
   */
  async compact(): Promise<{ removed: number } | null> {
    const all = await this.files.list();
    const chgs = all.filter((f) => CHG.test(f.name));
    if (chgs.length < COMPACT_AT) return null;
    const snaps = all.filter((f) => SNAP.test(f.name));
    const state = new Map<string, WireChange>();
    const fold = (c: WireChange) => { const k = `${c.table}\u0000${c.uid}`; const old = state.get(k); state.set(k, old ? newer(old, c) : c); };
    const used: DriveFile[] = [];
    for (const f of [...snaps, ...chgs].sort((a, b) => a.createdTime - b.createdTime)) {
      const body = parse<ChgBody | SnapBody>(await this.files.read(f.id));
      if (!body) continue; // not understood: left alone, never deleted
      (('records' in body) ? body.records : body.changes).forEach(fold);
      used.push(f);
    }
    const upTo = Math.max(0, ...used.map((f) => f.createdTime));
    const snap = await this.files.create(`${PREFIX}snap-${upTo}-${rand()}.json`, JSON.stringify({ v: 1, upTo, records: [...state.values()] } satisfies SnapBody));
    let removed = 0;
    for (const f of used) { try { await this.files.remove(f.id); removed++; } catch { /* a leftover is read again, harmlessly */ } }
    // the snapshot is deliberately NOT marked as read: it may hold what other devices wrote that this device has not applied yet, and the next sync reads it
    void snap;
    return { removed };
  }

  /** Removes every sync file from the person's Drive (the "stop syncing and delete it" action). */
  async deleteAll(): Promise<number> {
    let n = 0;
    for (const f of await this.files.list()) { try { await this.files.remove(f.id); n++; } catch { /* retry next time */ } }
    this.seen.save(new Set());
    return n;
  }
}
