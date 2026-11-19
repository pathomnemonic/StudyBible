import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { describe, expect, it, vi } from 'vitest';
import type { DriveFile, DriveFiles, SeenStore } from '../src/sync/driveSyncBackend';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
vi.stubGlobal('navigator', { language: 'en-US', storage: undefined });

class FakeDrive implements DriveFiles {
  files = new Map<string, { f: DriveFile; body: string }>(); clock = 1000; n = 0;
  async list() { return [...this.files.values()].map((x) => x.f); }
  async read(id: string) { return this.files.get(id)!.body; }
  async create(name: string, body: string) { const f = { id: `f${++this.n}`, name, createdTime: (this.clock += 10), size: body.length }; this.files.set(f.id, { f, body }); return f; }
  async remove(id: string) { this.files.delete(id); }
}
const seen = (): SeenStore => { let s = new Set<string>(); return { load: () => new Set(s), save: (x) => { s = new Set(x); } }; };
const drive = new FakeDrive();

/** a device is a clean browser database plus its own memory of which Drive files it has read */
async function device(id: string, work: (api: { db: any; sync: () => Promise<{ pushed: number; pulled: number; rejected: number }> }) => Promise<void>, mem = seen()) {
  await Dexie.delete('studybible'); vi.resetModules(); for (const k of [...store.keys()]) if (k.startsWith('studybible.sync')) store.delete(k);
  const { db } = await import('../src/db/db');
  const { runSync } = await import('../src/sync/engine');
  const { DriveSyncBackend } = await import('../src/sync/driveSyncBackend');
  const backend = new DriveSyncBackend(drive, id, mem);
  await work({ db, sync: () => runSync('drive', backend) });
}

describe('the sync engine with Google Drive standing in for the server', () => {
  it('brings notes, highlights and a deletion from one device to the next, with nothing but files in a folder', async () => {
    await device('aaaa', async ({ db, sync }) => {
      await db.notes.add({ kind: 'note', title: 'From the phone ✝', body: 'Fiat', tags: ['t'], chapterKeys: [], targets: [], createdAt: 1, updatedAt: 10 } as any);
      await db.notes.add({ kind: 'note', title: 'Will be deleted', body: 'x', tags: [], chapterKeys: [], targets: [], createdAt: 1, updatedAt: 11 } as any);
      await db.highlights.add({ ref: 'JHN.1.1', color: 'yellow', createdAt: 1, updatedAt: 12 } as any);
      const r = await sync();
      expect(r.pushed).toBeGreaterThanOrEqual(3); expect(r.rejected).toBe(0);
    });
    expect(drive.files.size).toBe(1);
    await device('bbbb', async ({ db, sync }) => {
      const r = await sync();
      expect(r.pulled).toBeGreaterThanOrEqual(3);
      expect((await db.notes.toArray()).map((n: any) => n.title).sort()).toEqual(['From the phone ✝', 'Will be deleted']);
      expect(await db.highlights.count()).toBe(1);
      // it edits one note and deletes the other, then syncs
      const all = await db.notes.toArray(); const keep = all.find((n: any) => n.title === 'From the phone ✝'), drop = all.find((n: any) => n.title === 'Will be deleted');
      await db.notes.update(keep.id, { body: 'Fiat, edited on the laptop', updatedAt: Date.now() });
      await db.notes.delete(drop.id);
      await sync();
    });
    await device('cccc', async ({ db, sync }) => {
      await sync();
      const notes = await db.notes.toArray();
      expect(notes.map((n: any) => n.title)).toEqual(['From the phone ✝']); // the deletion travelled
      expect(notes[0].body).toBe('Fiat, edited on the laptop');            // and so did the edit
    });
    expect([...drive.files.values()].every((x) => x.f.name.startsWith('sbs-'))).toBe(true);
  });

  it('a device that syncs again with nothing new sends and receives nothing', async () => {
    const mem = seen();
    await device('dddd', async ({ db, sync }) => {
      await db.notes.add({ kind: 'note', body: 'once', tags: [], chapterKeys: [], targets: [], createdAt: 1, updatedAt: 20 } as any);
      await sync();
      const before = drive.files.size;
      const again = await sync();
      expect(again.pushed).toBe(0); expect(again.pulled).toBe(0); expect(drive.files.size).toBe(before);
    }, mem);
  });
});
